const mongoose = require('mongoose');
const FocusOne = require('../models/FocusOne');
const { successResponse } = require('../utils/response');
const { AppError, ERROR_CODES } = require('../errors');
const { HTTP_STATUS } = require('../utils/constants');

/**
 * Create a new Focus One
 */
const createFocusOne = async (req, res, next) => {
  try {
    const { description, tags, metadata } = req.body;

    const focusOne = new FocusOne({
      description: description || '',
      tags: tags || [],
      metadata: metadata || {}
    });

    await focusOne.save();

    successResponse(res, focusOne, 'Focus One created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all Focus Ones
 */
const getAllFocusOnes = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, isActive, status } = req.query;
    const skip = (page - 1) * limit;

    // Build filter object
    // Only filter out cancelled (soft-deleted) items by default
    const filter = { deletedAt: null };
    
    // Only filter by isActive if explicitly provided
    // By default, show both active (isActive: true) and paused (isActive: false) items
    if (isActive !== undefined) {
      const isActiveBool = isActive === 'true' || isActive === true;
      filter.isActive = isActiveBool;
    }
    
    // Status filtering - only filter by status if explicitly provided
    // This allows filtering by 'completed' status if needed
    if (status !== undefined) {
      filter.status = status;
    }

    const focusOnes = await FocusOne.find(filter)
      .populate('teacherSubjectMappings.teacher', 'name email')
      .populate('teacherSubjectMappings.subject', 'name description')
      .populate('student', 'name email')
      .populate('enrolledBy', 'name email')
      .populate('pausedBy', 'name email')
      .populate('pauseHistory.pausedBy', 'name email')
      .populate('pauseHistory.resumedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await FocusOne.countDocuments(filter);

    successResponse(res, {
      focusOnes,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    }, 'Focus Ones retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get Focus One by ID
 */
const getFocusOneById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const focusOne = await FocusOne.findById(id)
      .populate('teacherSubjectMappings.teacher', 'name email')
      .populate('teacherSubjectMappings.subject', 'name description')
      .populate('student', 'name email')
      .populate('enrolledBy', 'name email')
      .populate('pausedBy', 'name email')
      .populate('pauseHistory.pausedBy', 'name email')
      .populate('pauseHistory.resumedBy', 'name email');
    if (!focusOne) {
      throw new AppError(ERROR_CODES.FOCUS_ONE.NOT_FOUND, 404);
    }

    successResponse(res, focusOne, 'Focus One retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update Focus One
 */
const updateFocusOne = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { description, teacherSubjectMappings, startedAt, status, metadata, isActive } = req.body;

    const focusOne = await FocusOne.findById(id);
    if (!focusOne) {
      throw new AppError(ERROR_CODES.FOCUS_ONE.NOT_FOUND, 404);
    }

    const updateData = {};
    if (description !== undefined) updateData.description = description;
    if (teacherSubjectMappings !== undefined) updateData.teacherSubjectMappings = teacherSubjectMappings;
    if (startedAt !== undefined) updateData.startedAt = startedAt;
    if (status !== undefined) updateData.status = status;
    if (metadata !== undefined) updateData.metadata = metadata;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedFocusOne = await FocusOne.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('teacherSubjectMappings.teacher', 'name email')
      .populate('teacherSubjectMappings.subject', 'name description')
      .populate('student', 'name email')
      .populate('enrolledBy', 'name email')
      .populate('pausedBy', 'name email')
      .populate('pauseHistory.pausedBy', 'name email')
      .populate('pauseHistory.resumedBy', 'name email');

    successResponse(res, updatedFocusOne, 'Focus One updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Pause a Focus One program
 */
const pauseFocusOne = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason, notes } = req.body;
    const pausedBy = req.user._id;

    const focusOne = await FocusOne.findById(id);
    if (!focusOne) {
      throw new AppError(ERROR_CODES.FOCUS_ONE.NOT_FOUND, 404);
    }

    if (focusOne.status === 'paused' || !focusOne.isActive) {
      throw new AppError(ERROR_CODES.VALIDATION.GENERAL, 400, { message: 'Focus One is already paused' });
    }

    if (focusOne.status === 'cancelled' || focusOne.deletedAt) {
      throw new AppError(ERROR_CODES.VALIDATION.GENERAL, 400, { message: 'Cannot pause a cancelled Focus One program' });
    }

    const pauseEntry = {
      pausedAt: new Date(),
      pausedBy: pausedBy,
      resumedAt: null,
      resumedBy: null,
      reason: reason || null,
      notes: notes || null
    };

    // Update pause history first
    if (!focusOne.pauseHistory) {
      focusOne.pauseHistory = [];
    }
    focusOne.pauseHistory.push(pauseEntry);
    
    // Use isActive flag for pause/active - set to false when paused
    // Also maintain status field for consistency
    focusOne.status = 'paused';
    focusOne.isActive = false;
    focusOne.pausedAt = new Date();
    focusOne.pausedBy = pausedBy;
    focusOne.resumedAt = null; // Clear resumedAt when pausing
    
    await focusOne.save({ validateBeforeSave: true });

    // Verify the save worked
    if (focusOne.isActive !== false || focusOne.status !== 'paused') {
      throw new AppError(ERROR_CODES.VALIDATION.GENERAL, 500, { message: 'Failed to pause Focus One' });
    }

    // Populate the saved document directly
    await focusOne.populate('teacherSubjectMappings.teacher', 'name email');
    await focusOne.populate('teacherSubjectMappings.subject', 'name description');
    await focusOne.populate('student', 'name email');
    await focusOne.populate('enrolledBy', 'name email');
    await focusOne.populate('pausedBy', 'name email');
    await focusOne.populate('pauseHistory.pausedBy', 'name email');
    await focusOne.populate('pauseHistory.resumedBy', 'name email');

    successResponse(res, focusOne, 'Focus One paused successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Resume a paused Focus One program
 */
const resumeFocusOne = async (req, res, next) => {
  try {
    const { id } = req.params;
    const resumedBy = req.user._id;

    const focusOne = await FocusOne.findById(id);
    if (!focusOne) {
      throw new AppError(ERROR_CODES.FOCUS_ONE.NOT_FOUND, 404);
    }

    if (focusOne.status !== 'paused' || focusOne.isActive) {
      throw new AppError(ERROR_CODES.VALIDATION.GENERAL, 400, { message: 'Focus One is not paused' });
    }

    if (focusOne.status === 'cancelled' || focusOne.deletedAt) {
      throw new AppError(ERROR_CODES.VALIDATION.GENERAL, 400, { message: 'Cannot resume a cancelled Focus One program' });
    }

    // Find the most recent pause entry that hasn't been resumed
    const activePauseEntry = focusOne.pauseHistory
      .slice()
      .reverse()
      .find(entry => entry.resumedAt === null);

    if (activePauseEntry) {
      activePauseEntry.resumedAt = new Date();
      activePauseEntry.resumedBy = resumedBy;
    }

    // Use isActive flag for pause/active - set to true when resumed
    // Also maintain status field for consistency
    focusOne.status = 'active';
    focusOne.isActive = true;
    focusOne.resumedAt = new Date();
    focusOne.pausedAt = null;
    focusOne.pausedBy = null;
    await focusOne.save();

    // Populate the saved document directly
    await focusOne.populate('teacherSubjectMappings.teacher', 'name email');
    await focusOne.populate('teacherSubjectMappings.subject', 'name description');
    await focusOne.populate('student', 'name email');
    await focusOne.populate('enrolledBy', 'name email');
    await focusOne.populate('pausedBy', 'name email');
    await focusOne.populate('pauseHistory.pausedBy', 'name email');
    await focusOne.populate('pauseHistory.resumedBy', 'name email');

    successResponse(res, focusOne, 'Focus One resumed successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Focus One (soft delete)
 */
const deleteFocusOne = async (req, res, next) => {
  try {
    const { id } = req.params;
    const performedBy = req.user._id;

    const focusOne = await FocusOne.findById(id);
    if (!focusOne) {
      throw new AppError(ERROR_CODES.FOCUS_ONE.NOT_FOUND, 404);
    }

    // Soft delete uses deletedAt for cancelled status
    await focusOne.softDelete(performedBy);

    successResponse(res, null, 'Focus One cancelled successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Restore soft deleted Focus One
 */
const restoreFocusOne = async (req, res, next) => {
  try {
    const { id } = req.params;
    const performedBy = req.user._id;

    // Use findDeleted static method to find soft-deleted records
    // This bypasses the pre-hook filter that excludes deleted records
    const deletedFocusOnes = await FocusOne.findDeleted({ _id: id }).exec();
    
    if (!deletedFocusOnes || deletedFocusOnes.length === 0) {
      throw new AppError(ERROR_CODES.FOCUS_ONE.NOT_FOUND, 404);
    }

    const focusOneDoc = deletedFocusOnes[0];

    // Restore will handle status update and pause history
    await focusOneDoc.restore(performedBy);

    const restoredFocusOne = await FocusOne.findById(id)
      .populate('teacherSubjectMappings.teacher', 'name email')
      .populate('teacherSubjectMappings.subject', 'name description')
      .populate('student', 'name email')
      .populate('enrolledBy', 'name email')
      .populate('pausedBy', 'name email')
      .populate('pauseHistory.pausedBy', 'name email')
      .populate('pauseHistory.resumedBy', 'name email');

    successResponse(res, restoredFocusOne, 'Focus One restored successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get soft deleted Focus Ones
 */
const getDeletedFocusOnes = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const focusOnes = await FocusOne.aggregate([
      { $match: { deletedAt: { $ne: null } } },
      { $sort: { deletedAt: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) }
    ]);

    const total = await FocusOne.aggregate([
      { $match: { deletedAt: { $ne: null } } },
      { $count: "total" }
    ]);

    const totalCount = total.length > 0 ? total[0].total : 0;

    successResponse(res, {
      focusOnes,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        itemsPerPage: parseInt(limit)
      }
    }, 'Deleted Focus Ones retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get Focus One by ID for Teacher (Teacher endpoint)
 */
const getTeacherFocusOneById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const teacherId = req.user._id;

    // Verify user has teacher role
    const User = require('../models').User;
    const teacher = await User.findById(teacherId).populate('roles');
    const hasTeacherRole = teacher.roles.some(role => role.name === 'teacher');
    if (!hasTeacherRole) {
      throw new AppError(
        ERROR_CODES.VALIDATION.INVALID_ROLE,
        HTTP_STATUS.BAD_REQUEST,
        { message: 'User does not have teacher role' }
      );
    }

    const focusOne = await FocusOne.findOne({
      _id: id,
      deletedAt: null,
      'teacherSubjectMappings.teacher': teacherId
    })
      .populate('teacherSubjectMappings.teacher', 'name email')
      .populate('teacherSubjectMappings.subject', 'name description')
      .populate('student', 'name email phoneNumber city')
      .populate('enrolledBy', 'name email')
      .populate('pausedBy', 'name email')
      .populate('pauseHistory.pausedBy', 'name email')
      .populate('pauseHistory.resumedBy', 'name email');

    if (!focusOne) {
      throw new AppError(
        ERROR_CODES.FOCUS_ONE.NOT_FOUND,
        HTTP_STATUS.NOT_FOUND,
        { message: 'Focus One not found or you are not assigned to this program' }
      );
    }

    successResponse(res, focusOne, 'Focus One retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get Focus Ones for Teacher (Teacher endpoint)
 */
const getTeacherFocusOnes = async (req, res, next) => {
  try {
    const teacherId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    // Verify user has teacher role
    const User = require('../models').User;
    const teacher = await User.findById(teacherId).populate('roles');
    const hasTeacherRole = teacher.roles.some(role => role.name === 'teacher');
    if (!hasTeacherRole) {
      throw new AppError(
        ERROR_CODES.VALIDATION.INVALID_ROLE,
        HTTP_STATUS.BAD_REQUEST,
        { message: 'User does not have teacher role' }
      );
    }

    const skip = (page - 1) * limit;

    // Find FocusOnes where this teacher is assigned
    const filter = {
      deletedAt: null,
      'teacherSubjectMappings.teacher': teacherId
    };

    const focusOnes = await FocusOne.find(filter)
      .populate('teacherSubjectMappings.teacher', 'name email')
      .populate('teacherSubjectMappings.subject', 'name description')
      .populate('student', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await FocusOne.countDocuments(filter);

    successResponse(res, {
      focusOnes,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    }, 'Focus Ones retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createFocusOne,
  getAllFocusOnes,
  getFocusOneById,
  updateFocusOne,
  deleteFocusOne,
  restoreFocusOne,
  getDeletedFocusOnes,
  pauseFocusOne,
  resumeFocusOne,
  getTeacherFocusOnes,
  getTeacherFocusOneById
};

