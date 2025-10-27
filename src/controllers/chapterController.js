const Chapter = require('../models/Chapter');
const Subject = require('../models/Subject');
const { successResponse, errorResponse } = require('../utils/response');
const { AppError } = require('../errors');

/**
 * Create a new chapter
 */
const createChapter = async (req, res, next) => {
  try {
    const { name, description, subject, order } = req.body;

    // Check if subject exists
    const subjectExists = await Subject.findById(subject);
    if (!subjectExists) {
      throw new AppError('Subject not found', 404);
    }

    // Check if chapter already exists in this subject
    const existingChapter = await Chapter.findOne({ name, subject });
    if (existingChapter) {
      throw new AppError('Chapter with this name already exists in the subject', 400);
    }

    const chapter = new Chapter({
      name,
      description,
      subject,
      order: order || 0
    });

    await chapter.save();
    await chapter.populate('subject', 'name description');

    successResponse(res, chapter, 'Chapter created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all chapters
 */
const getAllChapters = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, subject, isActive } = req.query;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }
    if (subject) {
      filter.subject = subject;
    }
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const chapters = await Chapter.find(filter)
      .populate('subject', 'name description')
      .sort({ order: 1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Chapter.countDocuments(filter);

    successResponse(res, {
      chapters,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    }, 'Chapters retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get chapter by ID
 */
const getChapterById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const chapter = await Chapter.findById(id).populate('subject', 'name description');
    if (!chapter) {
      throw new AppError('Chapter not found', 404);
    }

    successResponse(res, chapter, 'Chapter retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get chapters by subject
 */
const getChaptersBySubject = async (req, res, next) => {
  try {
    const { subjectId } = req.params;
    const { page = 1, limit = 10, isActive } = req.query;
    const skip = (page - 1) * limit;

    // Check if subject exists
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      throw new AppError('Subject not found', 404);
    }

    const filter = { subject: subjectId };
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const chapters = await Chapter.find(filter)
      .populate('subject', 'name description')
      .sort({ order: 1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Chapter.countDocuments(filter);

    successResponse(res, {
      chapters,
      subject,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    }, 'Chapters retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update chapter
 */
const updateChapter = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, subject, order, isActive } = req.body;

    const chapter = await Chapter.findById(id);
    if (!chapter) {
      throw new AppError('Chapter not found', 404);
    }

    // Check if subject is being changed and if it exists
    if (subject && subject !== chapter.subject.toString()) {
      const subjectExists = await Subject.findById(subject);
      if (!subjectExists) {
        throw new AppError('Subject not found', 404);
      }
    }

    // Check if name is being changed and if it already exists in the subject
    if (name && name !== chapter.name) {
      const existingChapter = await Chapter.findOne({ 
        name, 
        subject: subject || chapter.subject,
        _id: { $ne: id }
      });
      if (existingChapter) {
        throw new AppError('Chapter with this name already exists in the subject', 400);
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (subject !== undefined) updateData.subject = subject;
    if (order !== undefined) updateData.order = order;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedChapter = await Chapter.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('subject', 'name description');

    successResponse(res, updatedChapter, 'Chapter updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete chapter
 */
const deleteChapter = async (req, res, next) => {
  try {
    const { id } = req.params;

    const chapter = await Chapter.findById(id);
    if (!chapter) {
      throw new AppError('Chapter not found', 404);
    }

    // Check if chapter has questions
    const Question = require('../models/Question');
    const questionCount = await Question.countDocuments({ chapter: id });
    if (questionCount > 0) {
      throw new AppError('Cannot delete chapter with existing questions', 400);
    }

    await chapter.softDelete();

    successResponse(res, null, 'Chapter deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createChapter,
  getAllChapters,
  getChapterById,
  getChaptersBySubject,
  updateChapter,
  deleteChapter
};
