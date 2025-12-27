const { asyncHandler } = require('../utils/errorHandler');
const { successResponse } = require('../utils/response');
const { HTTP_STATUS } = require('../utils/constants');
const publicHolidayService = require('./publicHolidayService');

/**
 * @desc    Create a new public holiday
 * @route   POST /api/v1/admin/public-holidays
 * @access  Private (Admin only)
 */
const createPublicHoliday = asyncHandler(async (req, res, next) => {
  const { name, date, description, isActive } = req.body;
  const createdBy = req.user._id;
  
  const holiday = await publicHolidayService.createPublicHoliday({
    name,
    date,
    description,
    isActive,
    createdBy
  });
  
  await holiday.populate('createdBy', 'name email');
  
  successResponse(
    res,
    HTTP_STATUS.CREATED,
    'Public holiday created successfully',
    holiday
  );
});

/**
 * @desc    Get all public holidays
 * @route   GET /api/v1/admin/public-holidays
 * @access  Private (Admin only)
 */
const getAllPublicHolidays = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 50, isActive, startDate, endDate } = req.query;
  
  const result = await publicHolidayService.getAllPublicHolidays({
    page,
    limit,
    isActive,
    startDate,
    endDate
  });
  
  successResponse(
    res,
    HTTP_STATUS.OK,
    'Public holidays retrieved successfully',
    result
  );
});

/**
 * @desc    Get a public holiday by ID
 * @route   GET /api/v1/admin/public-holidays/:id
 * @access  Private (Admin only)
 */
const getPublicHolidayById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const holiday = await publicHolidayService.getPublicHolidayById(id);
  
  successResponse(
    res,
    HTTP_STATUS.OK,
    'Public holiday retrieved successfully',
    holiday
  );
});

/**
 * @desc    Update a public holiday
 * @route   PUT /api/v1/admin/public-holidays/:id
 * @access  Private (Admin only)
 */
const updatePublicHoliday = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { name, date, description, isActive } = req.body;
  
  const holiday = await publicHolidayService.updatePublicHoliday(id, {
    name,
    date,
    description,
    isActive
  });
  
  successResponse(
    res,
    HTTP_STATUS.OK,
    'Public holiday updated successfully',
    holiday
  );
});

/**
 * @desc    Delete a public holiday
 * @route   DELETE /api/v1/admin/public-holidays/:id
 * @access  Private (Admin only)
 */
const deletePublicHoliday = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  await publicHolidayService.deletePublicHoliday(id);
  
  successResponse(
    res,
    HTTP_STATUS.OK,
    'Public holiday deleted successfully',
    null
  );
});

module.exports = {
  createPublicHoliday,
  getAllPublicHolidays,
  getPublicHolidayById,
  updatePublicHoliday,
  deletePublicHoliday
};

