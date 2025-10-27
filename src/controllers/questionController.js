const Question = require('../models/Question');
const Chapter = require('../models/Chapter');
const Subject = require('../models/Subject');
const Option = require('../models/Option');
const { successResponse, errorResponse } = require('../utils/response');
const { AppError } = require('../errors');

/**
 * Create a new question
 */
const createQuestion = async (req, res, next) => {
  try {
    const { questionText, options, explanation, chapter, difficulty, marks } = req.body;

    // Check if chapter exists
    const chapterExists = await Chapter.findById(chapter);
    if (!chapterExists) {
      throw new AppError('Chapter not found', 404);
    }

    // Validate options
    if (!options || options.length < 2 || options.length > 4) {
      throw new AppError('Question must have between 2 and 4 options', 400);
    }

    // Check if at least one option is marked as correct
    const correctOptions = options.filter(option => option.isCorrect);
    if (correctOptions.length === 0) {
      throw new AppError('At least one option must be marked as correct', 400);
    }

    // Create question first
    const question = new Question({
      questionText,
      explanation,
      chapter,
      difficulty: difficulty || 'medium',
      marks: marks || 1
    });

    await question.save();

    // Create options
    const optionsWithQuestion = options.map((option, index) => ({
      text: option.text,
      isCorrect: option.isCorrect,
      question: question._id,
      order: index
    }));

    const createdOptions = await Option.insertMany(optionsWithQuestion);

    // Populate question with options and chapter info
    await question.populate({
      path: 'chapter',
      populate: {
        path: 'subject',
        select: 'name description'
      }
    });

    // Add options to the response
    const questionWithOptions = {
      ...question.toObject(),
      options: createdOptions
    };

    successResponse(res, questionWithOptions, 'Question created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all questions
 */
const getAllQuestions = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      chapter, 
      subject, 
      difficulty, 
      isActive 
    } = req.query;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    if (search) {
      filter.questionText = { $regex: search, $options: 'i' };
    }
    if (chapter) {
      filter.chapter = chapter;
    }
    if (subject) {
      // Find chapters belonging to the subject
      const chapters = await Chapter.find({ subject }).select('_id');
      const chapterIds = chapters.map(ch => ch._id);
      filter.chapter = { $in: chapterIds };
    }
    if (difficulty) {
      filter.difficulty = difficulty;
    }
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const questions = await Question.find(filter)
      .populate({
        path: 'chapter',
        populate: {
          path: 'subject',
          select: 'name description'
        }
      })
      .populate('options')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Question.countDocuments(filter);

    successResponse(res, {
      questions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    }, 'Questions retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get question by ID
 */
const getQuestionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const question = await Question.findById(id).populate({
      path: 'chapter',
      populate: {
        path: 'subject',
        select: 'name description'
      }
    });
    if (!question) {
      throw new AppError('Question not found', 404);
    }

    successResponse(res, question, 'Question retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get questions by chapter
 */
const getQuestionsByChapter = async (req, res, next) => {
  try {
    const { chapterId } = req.params;
    const { page = 1, limit = 10, difficulty, isActive } = req.query;
    const skip = (page - 1) * limit;

    // Check if chapter exists
    const chapter = await Chapter.findById(chapterId).populate('subject', 'name description');
    if (!chapter) {
      throw new AppError('Chapter not found', 404);
    }

    const filter = { chapter: chapterId };
    if (difficulty) {
      filter.difficulty = difficulty;
    }
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const questions = await Question.find(filter)
      .populate({
        path: 'chapter',
        populate: {
          path: 'subject',
          select: 'name description'
        }
      })
      .populate('options')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Question.countDocuments(filter);

    successResponse(res, {
      questions,
      chapter,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    }, 'Questions retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get questions by subject
 */
const getQuestionsBySubject = async (req, res, next) => {
  try {
    const { subjectId } = req.params;
    const { page = 1, limit = 10, difficulty, isActive } = req.query;
    const skip = (page - 1) * limit;

    // Check if subject exists
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      throw new AppError('Subject not found', 404);
    }

    // Find chapters belonging to the subject
    const chapters = await Chapter.find({ subject: subjectId }).select('_id');
    const chapterIds = chapters.map(ch => ch._id);

    const filter = { chapter: { $in: chapterIds } };
    if (difficulty) {
      filter.difficulty = difficulty;
    }
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const questions = await Question.find(filter)
      .populate({
        path: 'chapter',
        populate: {
          path: 'subject',
          select: 'name description'
        }
      })
      .populate('options')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Question.countDocuments(filter);

    successResponse(res, {
      questions,
      subject,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    }, 'Questions retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update question
 */
const updateQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { questionText, options, explanation, chapter, difficulty, marks, isActive } = req.body;

    const question = await Question.findById(id);
    if (!question) {
      throw new AppError('Question not found', 404);
    }

    // Check if chapter is being changed and if it exists
    if (chapter && chapter !== question.chapter.toString()) {
      const chapterExists = await Chapter.findById(chapter);
      if (!chapterExists) {
        throw new AppError('Chapter not found', 404);
      }
    }

    // Validate options if provided
    if (options) {
      if (options.length < 2 || options.length > 4) {
        throw new AppError('Question must have between 2 and 4 options', 400);
      }

      const correctOptions = options.filter(option => option.isCorrect);
      if (correctOptions.length === 0) {
        throw new AppError('At least one option must be marked as correct', 400);
      }
    }

    const updateData = {};
    if (questionText !== undefined) updateData.questionText = questionText;
    if (options !== undefined) updateData.options = options;
    if (explanation !== undefined) updateData.explanation = explanation;
    if (chapter !== undefined) updateData.chapter = chapter;
    if (difficulty !== undefined) updateData.difficulty = difficulty;
    if (marks !== undefined) updateData.marks = marks;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedQuestion = await Question.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate({
      path: 'chapter',
      populate: {
        path: 'subject',
        select: 'name description'
      }
    });

    successResponse(res, updatedQuestion, 'Question updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete question
 */
const deleteQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;

    const question = await Question.findById(id);
    if (!question) {
      throw new AppError('Question not found', 404);
    }

    await question.softDelete();

    successResponse(res, null, 'Question deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get question statistics
 */
const getQuestionStats = async (req, res, next) => {
  try {
    const { chapter, subject } = req.query;

    let filter = {};
    if (chapter) {
      filter.chapter = chapter;
    } else if (subject) {
      const chapters = await Chapter.find({ subject }).select('_id');
      const chapterIds = chapters.map(ch => ch._id);
      filter.chapter = { $in: chapterIds };
    }

    const stats = await Question.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalQuestions: { $sum: 1 },
          easyQuestions: {
            $sum: { $cond: [{ $eq: ['$difficulty', 'easy'] }, 1, 0] }
          },
          mediumQuestions: {
            $sum: { $cond: [{ $eq: ['$difficulty', 'medium'] }, 1, 0] }
          },
          hardQuestions: {
            $sum: { $cond: [{ $eq: ['$difficulty', 'hard'] }, 1, 0] }
          },
          activeQuestions: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          },
          totalMarks: { $sum: '$marks' }
        }
      }
    ]);

    const result = stats.length > 0 ? stats[0] : {
      totalQuestions: 0,
      easyQuestions: 0,
      mediumQuestions: 0,
      hardQuestions: 0,
      activeQuestions: 0,
      totalMarks: 0
    };

    successResponse(res, result, 'Question statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createQuestion,
  getAllQuestions,
  getQuestionById,
  getQuestionsByChapter,
  getQuestionsBySubject,
  updateQuestion,
  deleteQuestion,
  getQuestionStats
};
