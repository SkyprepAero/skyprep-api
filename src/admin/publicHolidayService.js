const { PublicHoliday } = require('../models');
const { AppError, ERROR_CODES } = require('../errors');
const { HTTP_STATUS } = require('../utils/constants');

/**
 * Create a new public holiday
 */
const createPublicHoliday = async ({ name, date, description, isActive, createdBy }) => {
  // Normalize date to remove time component
  const holidayDate = new Date(date);
  holidayDate.setHours(0, 0, 0, 0);
  
  // Check if a holiday already exists for this date
  const existingHoliday = await PublicHoliday.findOne({ date: holidayDate });
  
  if (existingHoliday) {
    throw new AppError(
      ERROR_CODES.VALIDATION.GENERAL,
      HTTP_STATUS.BAD_REQUEST,
      { message: `A public holiday already exists for ${holidayDate.toLocaleDateString()}` }
    );
  }
  
  const holiday = await PublicHoliday.create({
    name,
    date: holidayDate,
    description: description || null,
    isActive: isActive !== undefined ? isActive : true,
    createdBy
  });
  
  return holiday;
};

/**
 * Get all public holidays
 */
const getAllPublicHolidays = async ({ page = 1, limit = 50, isActive, startDate, endDate }) => {
  const skip = (page - 1) * limit;
  const filter = {};
  
  if (isActive !== undefined) {
    filter.isActive = isActive === 'true' || isActive === true;
  }
  
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      filter.date.$gte = start;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.date.$lte = end;
    }
  }
  
  const holidays = await PublicHoliday.find(filter)
    .populate('createdBy', 'name email')
    .sort({ date: 1 })
    .skip(skip)
    .limit(parseInt(limit));
  
  const total = await PublicHoliday.countDocuments(filter);
  
  return {
    holidays,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: parseInt(limit)
    }
  };
};

/**
 * Get a public holiday by ID
 */
const getPublicHolidayById = async (id) => {
  const holiday = await PublicHoliday.findById(id).populate('createdBy', 'name email');
  
  if (!holiday) {
    throw new AppError(
      { code: 'PUBLIC_HOLIDAY_404', message: 'Public holiday not found' },
      HTTP_STATUS.NOT_FOUND,
      { message: 'Public holiday not found' }
    );
  }
  
  return holiday;
};

/**
 * Update a public holiday
 */
const updatePublicHoliday = async (id, { name, date, description, isActive }) => {
  const holiday = await PublicHoliday.findById(id);
  
  if (!holiday) {
    throw new AppError(
      { code: 'PUBLIC_HOLIDAY_404', message: 'Public holiday not found' },
      HTTP_STATUS.NOT_FOUND,
      { message: 'Public holiday not found' }
    );
  }
  
  // If date is being updated, check for conflicts
  if (date) {
    const holidayDate = new Date(date);
    holidayDate.setHours(0, 0, 0, 0);
    
    const existingHoliday = await PublicHoliday.findOne({
      date: holidayDate,
      _id: { $ne: id }
    });
    
    if (existingHoliday) {
      throw new AppError(
        ERROR_CODES.VALIDATION.GENERAL,
        HTTP_STATUS.BAD_REQUEST,
        { message: `A public holiday already exists for ${holidayDate.toLocaleDateString()}` }
      );
    }
    
    holiday.date = holidayDate;
  }
  
  if (name !== undefined) holiday.name = name;
  if (description !== undefined) holiday.description = description;
  if (isActive !== undefined) holiday.isActive = isActive;
  
  await holiday.save();
  
  return holiday.populate('createdBy', 'name email');
};

/**
 * Delete a public holiday
 */
const deletePublicHoliday = async (id) => {
  const holiday = await PublicHoliday.findById(id);
  
  if (!holiday) {
    throw new AppError(
      { code: 'PUBLIC_HOLIDAY_404', message: 'Public holiday not found' },
      HTTP_STATUS.NOT_FOUND,
      { message: 'Public holiday not found' }
    );
  }
  
  await holiday.deleteOne();
  
  return { message: 'Public holiday deleted successfully' };
};

module.exports = {
  createPublicHoliday,
  getAllPublicHolidays,
  getPublicHolidayById,
  updatePublicHoliday,
  deletePublicHoliday
};

