const { Cohort, User } = require('../models');
const { successResponse } = require('../utils/response');
const { AppError, ERROR_CODES } = require('../errors');
const { HTTP_STATUS } = require('../utils/constants');

/**
 * Get Cohort by ID for Teacher (Teacher endpoint)
 * Note: Currently allows access to any active cohort since Cohorts don't have teacher associations yet
 */
const getTeacherCohortById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const teacherId = req.user._id;

    // Verify user has teacher role
    const teacher = await User.findById(teacherId).populate('roles');
    const hasTeacherRole = teacher.roles.some(role => role.name === 'teacher');
    if (!hasTeacherRole) {
      throw new AppError(
        ERROR_CODES.VALIDATION.INVALID_ROLE,
        HTTP_STATUS.BAD_REQUEST,
        { message: 'User does not have teacher role' }
      );
    }

    const cohort = await Cohort.findOne({
      _id: id,
      deletedAt: null,
      status: { $in: ['planned', 'active'] }
    })
      .populate('subjects.subject', 'name description');

    if (!cohort) {
      throw new AppError(
        ERROR_CODES.VALIDATION.GENERAL,
        HTTP_STATUS.NOT_FOUND,
        { message: 'Cohort not found' }
      );
    }

    successResponse(res, cohort, 'Cohort retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get Cohorts for Teacher (Teacher endpoint)
 * Note: Currently returns all active cohorts since Cohorts don't have teacher associations yet
 */
const getTeacherCohorts = async (req, res, next) => {
  try {
    const teacherId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    // Verify user has teacher role
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

    // Find active cohorts (since Cohorts don't have teacher associations yet)
    // TODO: Add teacher associations to Cohort model and filter by teacher
    const filter = {
      deletedAt: null,
      status: { $in: ['planned', 'active'] }
    };

    const cohorts = await Cohort.find(filter)
      .populate('subjects.subject', 'name description')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Cohort.countDocuments(filter);

    successResponse(res, {
      cohorts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    }, 'Cohorts retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTeacherCohorts,
  getTeacherCohortById
};

