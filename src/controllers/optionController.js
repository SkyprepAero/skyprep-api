const { Option, Question } = require('../models');
const { successResponse, errorResponse } = require('../utils/response');
const { AppError } = require('../errors');

/**
 * Create options for a question
 */
const createOptions = async (req, res, next) => {
  try {
    const { questionId } = req.params;
    const { options } = req.body;

    // Check if question exists
    const question = await Question.findById(questionId);
    if (!question) {
      throw new AppError('Question not found', 404);
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

    // Delete existing options for this question
    await Option.deleteMany({ question: questionId });

    // Create new options
    const optionsWithQuestion = options.map((option, index) => ({
      ...option,
      question: questionId,
      order: index
    }));

    const createdOptions = await Option.insertMany(optionsWithQuestion);

    successResponse(res, createdOptions, 'Options created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Get options for a question
 */
const getOptionsByQuestion = async (req, res, next) => {
  try {
    const { questionId } = req.params;

    // Check if question exists
    const question = await Question.findById(questionId);
    if (!question) {
      throw new AppError('Question not found', 404);
    }

    const options = await Option.find({ question: questionId })
      .sort({ order: 1 });

    successResponse(res, options, 'Options retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update an option
 */
const updateOption = async (req, res, next) => {
  try {
    const { optionId } = req.params;
    const { text, isCorrect, order, isActive } = req.body;

    const option = await Option.findById(optionId);
    if (!option) {
      throw new AppError('Option not found', 404);
    }

    // If changing isCorrect, ensure at least one option remains correct
    if (isCorrect === false) {
      const correctOptionsCount = await Option.countDocuments({
        question: option.question,
        isCorrect: true,
        _id: { $ne: optionId }
      });
      
      if (correctOptionsCount === 0) {
        throw new AppError('At least one option must be marked as correct', 400);
      }
    }

    const updateData = {};
    if (text !== undefined) updateData.text = text;
    if (isCorrect !== undefined) updateData.isCorrect = isCorrect;
    if (order !== undefined) updateData.order = order;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedOption = await Option.findByIdAndUpdate(
      optionId,
      updateData,
      { new: true, runValidators: true }
    );

    successResponse(res, updatedOption, 'Option updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete an option
 */
const deleteOption = async (req, res, next) => {
  try {
    const { optionId } = req.params;

    const option = await Option.findById(optionId);
    if (!option) {
      throw new AppError('Option not found', 404);
    }

    // Check if this is the only correct option
    if (option.isCorrect) {
      const correctOptionsCount = await Option.countDocuments({
        question: option.question,
        isCorrect: true,
        _id: { $ne: optionId }
      });
      
      if (correctOptionsCount === 0) {
        throw new AppError('Cannot delete the only correct option', 400);
      }
    }

    await Option.findByIdAndDelete(optionId);

    successResponse(res, null, 'Option deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Reorder options for a question
 */
const reorderOptions = async (req, res, next) => {
  try {
    const { questionId } = req.params;
    const { optionOrders } = req.body; // Array of { optionId, order }

    // Check if question exists
    const question = await Question.findById(questionId);
    if (!question) {
      throw new AppError('Question not found', 404);
    }

    // Update option orders
    const updatePromises = optionOrders.map(({ optionId, order }) =>
      Option.findByIdAndUpdate(optionId, { order }, { new: true })
    );

    await Promise.all(updatePromises);

    // Get updated options
    const options = await Option.find({ question: questionId })
      .sort({ order: 1 });

    successResponse(res, options, 'Options reordered successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOptions,
  getOptionsByQuestion,
  updateOption,
  deleteOption,
  reorderOptions
};
