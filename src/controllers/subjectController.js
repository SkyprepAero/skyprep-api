const { Subject } = require('../models');
const { successResponse, errorResponse } = require('../utils/response');
const { AppError } = require('../errors');

/**
 * Create a new subject
 */
const createSubject = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    // Check if subject already exists
    const existingSubject = await Subject.findOne({ name });
    if (existingSubject) {
      throw new AppError('Subject with this name already exists', 400);
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
      throw new AppError('Subject not found', 404);
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
      throw new AppError('Subject not found', 404);
    }

    // Check if name is being changed and if it already exists
    if (name && name !== subject.name) {
      const existingSubject = await Subject.findOne({ name, _id: { $ne: id } });
      if (existingSubject) {
        throw new AppError('Subject with this name already exists', 400);
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
      throw new AppError('Subject not found', 404);
    }

    // Check if subject has chapters
    const Chapter = require('../models/Chapter');
    const chapterCount = await Chapter.countDocuments({ subject: id });
    if (chapterCount > 0) {
      throw new AppError('Cannot delete subject with existing chapters', 400);
    }

    await Subject.findByIdAndDelete(id);

    successResponse(res, null, 'Subject deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSubject,
  getAllSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject
};
