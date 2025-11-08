const mongoose = require('mongoose');
const Subject = require('../models/Subject');
const { successResponse, errorResponse } = require('../utils/response');
const { AppError } = require('../errors');
const { ERROR_CODES } = require('../errors');

/**
 * Create a new subject
 */
const createSubject = async (req, res, next) => {
  try {
    const { name, description, defaultMarks } = req.body;

    // Check if subject already exists
    const existingSubject = await Subject.findOne({ name });
    if (existingSubject) {
      throw new AppError(ERROR_CODES.SUBJECT.ALREADY_EXISTS, 400, { field: 'name', value: name });
    }

    const subject = new Subject({
      name,
      description,
      defaultMarks
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
    const filter = { deletedAt: null }; // Explicitly add soft delete filter
    
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }
    if (isActive !== undefined) {
      // Convert string to boolean properly
      const isActiveBool = isActive === 'true' || isActive === true;
      filter.isActive = isActiveBool;
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
    const { name, description, isActive, defaultMarks } = req.body;

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
    if (defaultMarks !== undefined) updateData.defaultMarks = defaultMarks;

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
 * Delete subject (with cascade soft delete)
 */
const deleteSubject = async (req, res, next) => {
  try {
    const { id } = req.params;

    const subject = await Subject.findById(id);
    if (!subject) {
      throw new AppError(ERROR_CODES.SUBJECT.NOT_FOUND, 404);
    }

    // Get all chapters for this subject
    const Chapter = require('../models/Chapter');
    const Question = require('../models/Question');
    const Option = require('../models/Option');

    const chapters = await Chapter.find({ subject: id });
    const chapterIds = chapters.map(chapter => chapter._id);

    // Get all questions for these chapters
    const questions = await Question.find({ chapter: { $in: chapterIds } });
    const questionIds = questions.map(question => question._id);

    // Soft delete all options for these questions
    if (questionIds.length > 0) {
      await Option.updateMany(
        { question: { $in: questionIds } },
        { deletedAt: new Date() }
      );
    }

    // Soft delete all questions for these chapters
    if (chapterIds.length > 0) {
      await Question.updateMany(
        { chapter: { $in: chapterIds } },
        { deletedAt: new Date() }
      );
    }

    // Soft delete all chapters for this subject
    if (chapters.length > 0) {
      await Chapter.updateMany(
        { subject: id },
        { deletedAt: new Date() }
      );
    }

    // Finally, soft delete the subject
    await subject.softDelete();

    const deletedCounts = {
      chapters: chapters.length,
      questions: questions.length,
      options: questionIds.length > 0 ? await Option.countDocuments({ question: { $in: questionIds } }) : 0
    };

    successResponse(res, { deletedCounts }, 'Subject and all related data deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Restore soft deleted subject (with cascade restore)
 */
const restoreSubject = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find subject including soft deleted ones using aggregate
    const subjects = await Subject.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id), deletedAt: { $ne: null } } }
    ]);
    
    if (subjects.length === 0) {
      throw new AppError(ERROR_CODES.SUBJECT.NOT_FOUND, 404);
    }
    
    const subject = subjects[0];

    const Chapter = require('../models/Chapter');
    const Question = require('../models/Question');
    const Option = require('../models/Option');

    // Get all soft deleted chapters for this subject using aggregate
    const chapters = await Chapter.aggregate([
      { $match: { subject: new mongoose.Types.ObjectId(id), deletedAt: { $ne: null } } }
    ]);
    const chapterIds = chapters.map(chapter => chapter._id);

    // Get all soft deleted questions for these chapters using aggregate
    const questions = await Question.aggregate([
      { $match: { chapter: { $in: chapterIds.map(id => new mongoose.Types.ObjectId(id)) }, deletedAt: { $ne: null } } }
    ]);
    const questionIds = questions.map(question => question._id);

    // Restore all options for these questions
    if (questionIds.length > 0) {
      await Option.updateMany(
        { question: { $in: questionIds.map(id => new mongoose.Types.ObjectId(id)) }, deletedAt: { $ne: null } },
        { deletedAt: null }
      );
    }

    // Restore all questions for these chapters
    if (chapterIds.length > 0) {
      await Question.updateMany(
        { chapter: { $in: chapterIds.map(id => new mongoose.Types.ObjectId(id)) }, deletedAt: { $ne: null } },
        { deletedAt: null }
      );
    }

    // Restore all chapters for this subject
    if (chapters.length > 0) {
      await Chapter.updateMany(
        { subject: new mongoose.Types.ObjectId(id), deletedAt: { $ne: null } },
        { deletedAt: null }
      );
    }

    // Finally, restore the subject using direct update
    await Subject.updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { deletedAt: null }
    );

    const restoredCounts = {
      chapters: chapters.length,
      questions: questions.length,
      options: questionIds.length > 0 ? await Option.countDocuments({ question: { $in: questionIds.map(id => new mongoose.Types.ObjectId(id)) }, deletedAt: null }) : 0
    };

    // Get the restored subject
    const restoredSubject = await Subject.findById(id);

    successResponse(res, { subject: restoredSubject, restoredCounts }, 'Subject and all related data restored successfully');
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

    // Use aggregate to bypass the pre-find hook
    const subjects = await Subject.aggregate([
      { $match: { deletedAt: { $ne: null } } },
      { $sort: { deletedAt: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) }
    ]);

    const total = await Subject.aggregate([
      { $match: { deletedAt: { $ne: null } } },
      { $count: "total" }
    ]);

    const totalCount = total.length > 0 ? total[0].total : 0;

    successResponse(res, {
      subjects,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
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
