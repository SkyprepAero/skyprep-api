const mongoose = require('mongoose');
const UserTestSeries = require('../models/UserTestSeries');
const User = require('../models/User');
const TestSeries = require('../models/TestSeries');
const { successResponse } = require('../utils/response');
const { AppError } = require('../errors');
const { ERROR_CODES } = require('../errors');

/**
 * Enroll user in a Test Series
 */
const enrollUser = async (req, res, next) => {
  try {
    const { userId, testSeriesId, subjects, billing } = req.body;

    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError(ERROR_CODES.USER.NOT_FOUND, 404);
    }

    // Validate test series exists
    const testSeries = await TestSeries.findById(testSeriesId);
    if (!testSeries) {
      throw new AppError(ERROR_CODES.TEST_SERIES.NOT_FOUND, 404);
    }

    // Check if user is already enrolled in this test series
    const existingEnrollment = await UserTestSeries.findOne({
      user: userId,
      testSeries: testSeriesId,
      isActive: true
    });

    if (existingEnrollment) {
      throw new AppError(ERROR_CODES.TEST_SERIES.ENROLLMENT_EXISTS, 400);
    }

    // Create enrollment
    const userTestSeries = new UserTestSeries({
      user: userId,
      testSeries: testSeriesId,
      subjects: subjects || [],
      billing: billing || {},
      status: 'active',
      activatedAt: new Date()
    });

    await userTestSeries.save();

    // Add to user's testSeriesEnrollments array
    user.testSeriesEnrollments.push(userTestSeries._id);
    await user.save();

    const populated = await UserTestSeries.findById(userTestSeries._id)
      .populate('user', 'name email')
      .populate('testSeries', 'name slug');

    successResponse(res, populated, 'User enrolled in test series successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all user test series enrollments
 */
const getUserEnrollments = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { status, isActive } = req.query;

    const filter = { user: userId };
    
    if (status) {
      filter.status = status;
    }
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true' || isActive === true;
    }

    const enrollments = await UserTestSeries.find(filter)
      .populate('testSeries', 'name slug description status')
      .populate('subjects.subject', 'name description')
      .sort({ enrolledAt: -1 });

    successResponse(res, { enrollments }, 'User test series enrollments retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get test series enrollments for a specific test series
 */
const getTestSeriesEnrollments = async (req, res, next) => {
  try {
    const { testSeriesId } = req.params;
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    const filter = { testSeries: testSeriesId, isActive: true };
    
    if (status) {
      filter.status = status;
    }

    const enrollments = await UserTestSeries.find(filter)
      .populate('user', 'name email')
      .populate('subjects.subject', 'name description')
      .sort({ enrolledAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await UserTestSeries.countDocuments(filter);

    successResponse(res, {
      enrollments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    }, 'Test series enrollments retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update user test series enrollment
 */
const updateEnrollment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, subjects, billing, expiresAt } = req.body;

    const enrollment = await UserTestSeries.findById(id);
    if (!enrollment) {
      throw new AppError(ERROR_CODES.TEST_SERIES.NOT_FOUND, 404);
    }

    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (subjects !== undefined) updateData.subjects = subjects;
    if (billing !== undefined) updateData.billing = billing;
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt;

    if (status === 'active' && !enrollment.activatedAt) {
      updateData.activatedAt = new Date();
    }

    if (status === 'completed' && !enrollment.completedAt) {
      updateData.completedAt = new Date();
    }

    const updated = await UserTestSeries.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('user', 'name email')
     .populate('testSeries', 'name slug');

    successResponse(res, updated, 'Enrollment updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel/Delete user test series enrollment
 */
const cancelEnrollment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const enrollment = await UserTestSeries.findById(id);
    if (!enrollment) {
      throw new AppError(ERROR_CODES.TEST_SERIES.NOT_FOUND, 404);
    }

    // Soft delete
    await enrollment.softDelete();

    // Remove from user's testSeriesEnrollments array
    await User.updateOne(
      { _id: enrollment.user },
      { $pull: { testSeriesEnrollments: enrollment._id } }
    );

    successResponse(res, null, 'Enrollment cancelled successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  enrollUser,
  getUserEnrollments,
  getTestSeriesEnrollments,
  updateEnrollment,
  cancelEnrollment
};

