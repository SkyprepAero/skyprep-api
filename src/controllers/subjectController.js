const Subject = require('../models/Subject');
const { successResponse, errorResponse } = require('../utils/response');
const { AppError } = require('../errors');
const { ERROR_CODES } = require('../errors');

/**
 * Create a new subject
 */
const createSubject = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    // Check if subject already exists
    const existingSubject = await Subject.findOne({ name });
    if (existingSubject) {
      throw new AppError(ERROR_CODES.SUBJECT.ALREADY_EXISTS, 400, { field: 'name', value: name });
    }

    const subject = new Subject({
      name,
      description
    });

    await subject.save();

    successResponse(res, subject, 'Subject created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all subjects
 */
const getAllSubjects = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, isActive } = req.query;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const subjects = await Subject.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Subject.countDocuments(filter);

    successResponse(res, {
      subjects,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    }, 'Subjects retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get subject by ID
 */
const getSubjectById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const subject = await Subject.findById(id);
    if (!subject) {
      throw new AppError(ERROR_CODES.SUBJECT.NOT_FOUND, 404);
    }

    successResponse(res, subject, 'Subject retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update subject
 */
const updateSubject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;

    const subject = await Subject.findById(id);
    if (!subject) {
      throw new AppError(ERROR_CODES.SUBJECT.NOT_FOUND, 404);
    }

    // Check if name is being changed and if it already exists
    if (name && name !== subject.name) {
      const existingSubject = await Subject.findOne({ name, _id: { $ne: id } });
      if (existingSubject) {
        throw new AppError(ERROR_CODES.SUBJECT.ALREADY_EXISTS, 400, { field: 'name', value: name });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedSubject = await Subject.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    successResponse(res, updatedSubject, 'Subject updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete subject
 */
const deleteSubject = async (req, res, next) => {
  try {
    const { id } = req.params;

    const subject = await Subject.findById(id);
    if (!subject) {
      throw new AppError(ERROR_CODES.SUBJECT.NOT_FOUND, 404);
    }

    // Check if subject has chapters
    const Chapter = require('../models/Chapter');
    const chapterCount = await Chapter.countDocuments({ subject: id });
    if (chapterCount > 0) {
      throw new AppError(ERROR_CODES.SUBJECT.HAS_CHAPTERS, 400, { chapterCount });
    }

    await subject.softDelete();

    successResponse(res, null, 'Subject deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Restore soft deleted subject
 */
const restoreSubject = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find subject including soft deleted ones
    const subject = await Subject.findById(id).where({ deletedAt: { $ne: null } });
    if (!subject) {
      throw new AppError(ERROR_CODES.SUBJECT.NOT_FOUND, 404);
    }

    await subject.restore();

    successResponse(res, subject, 'Subject restored successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get soft deleted subjects
 */
const getDeletedSubjects = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const subjects = await Subject.find({ deletedAt: { $ne: null } })
      .sort({ deletedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Subject.countDocuments({ deletedAt: { $ne: null } });

    successResponse(res, {
      subjects,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    }, 'Deleted subjects retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSubject,
  getAllSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
  restoreSubject,
  getDeletedSubjects
};
