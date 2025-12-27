const { asyncHandler } = require('../utils/errorHandler');
const { successResponse } = require('../utils/response');
const { HTTP_STATUS } = require('../utils/constants');
const { enrollStudentInFocusOne } = require('./enrollmentService');
const { User, Subject, FocusOne } = require('../models');
const { AppError, ERROR_CODES } = require('../errors');

/**
 * @desc    Enroll a student in Focus One
 * @route   POST /api/v1/admin/focus-one/enroll
 * @access  Private (Admin only)
 */
const enrollStudent = asyncHandler(async (req, res, next) => {
  const {
    email,
    teacherSubjectMappings = [], // Array of { teacher: ObjectId, subject: ObjectId } mappings
    startedAt, // Start date for the enrollment
    metadata
  } = req.body;

  // Get the admin user ID from the authenticated request
  const enrolledBy = req.user?._id || req.user?.id || null;

  const result = await enrollStudentInFocusOne({
    email,
    teacherSubjectMappings: Array.isArray(teacherSubjectMappings) ? teacherSubjectMappings : [],
    startedAt: startedAt || null,
    metadata: metadata || {},
    enrolledBy
  });

  successResponse(
    res,
    HTTP_STATUS.CREATED,
    'Student enrolled successfully. Password setup email has been sent.',
    result
  );
});

/**
 * @desc    Get all enrolled students in Focus One programs
 * @route   GET /api/v1/admin/focus-one/enrollments
 * @access  Private (Admin only)
 */
const getAllEnrollments = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 20, focusOneId, status, search } = req.query;
  const skip = (page - 1) * limit;

  // Build filter
  const filter = {
    focusOneEnrollment: { $ne: null }
  };

  if (focusOneId) {
    filter['focusOneEnrollment.focusOne'] = focusOneId;
  }

  if (status) {
    filter['focusOneEnrollment.status'] = status;
  }

  if (search && search.trim().length > 0) {
    const searchRegex = { $regex: search.trim(), $options: 'i' };
    filter.$or = [
      { name: searchRegex },
      { email: searchRegex },
      { phoneNumber: searchRegex }
    ];
  }

  const users = await User.find(filter)
    .populate('focusOneEnrollment.focusOne', 'name slug description status isActive pausedAt resumedAt')
    .populate('focusOneEnrollment.focusOne.teacherSubjectMappings.teacher', 'name email')
    .populate('focusOneEnrollment.focusOne.teacherSubjectMappings.subject', 'name description')
    .populate('focusOneEnrollment.teacherSubjectMappings.teacher', 'name email')
    .populate('focusOneEnrollment.teacherSubjectMappings.subject', 'name description')
    .populate('roles', 'name displayName')
    .select('name email phoneNumber city roles primaryRole focusOneEnrollment createdAt')
    .sort({ 'focusOneEnrollment.enrolledAt': -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await User.countDocuments(filter);

  successResponse(
    res,
    HTTP_STATUS.OK,
    'Enrollments retrieved successfully',
    {
      enrollments: users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    }
  );
});

/**
 * @desc    Get enrollments for a specific Focus One
 * @route   GET /api/v1/admin/focus-one/:focusOneId/enrollments
 * @access  Private (Admin only)
 */
const getFocusOneEnrollments = asyncHandler(async (req, res, next) => {
  const { focusOneId } = req.params;
  const { page = 1, limit = 20, status, search } = req.query;
  const skip = (page - 1) * limit;

  const filter = {
    'focusOneEnrollment.focusOne': focusOneId
  };

  if (status) {
    filter['focusOneEnrollment.status'] = status;
  }

  if (search && search.trim().length > 0) {
    const searchRegex = { $regex: search.trim(), $options: 'i' };
    filter.$or = [
      { name: searchRegex },
      { email: searchRegex },
      { phoneNumber: searchRegex }
    ];
  }

  const users = await User.find(filter)
    .populate('focusOneEnrollment.focusOne', 'name slug description status isActive pausedAt resumedAt')
    .populate('focusOneEnrollment.focusOne.teacherSubjectMappings.teacher', 'name email')
    .populate('focusOneEnrollment.focusOne.teacherSubjectMappings.subject', 'name description')
    .populate('focusOneEnrollment.teacherSubjectMappings.teacher', 'name email')
    .populate('focusOneEnrollment.teacherSubjectMappings.subject', 'name description')
    .populate('roles', 'name displayName')
    .select('name email phoneNumber city roles primaryRole focusOneEnrollment createdAt')
    .sort({ 'focusOneEnrollment.enrolledAt': -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await User.countDocuments(filter);

  successResponse(
    res,
    HTTP_STATUS.OK,
    'Focus One enrollments retrieved successfully',
    {
      enrollments: users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    }
  );
});

/**
 * @desc    Get a specific enrollment
 * @route   GET /api/v1/admin/focus-one/enrollments/:userId
 * @access  Private (Admin only)
 */
const getEnrollmentById = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;

  const user = await User.findById(userId)
    .populate('focusOneEnrollment.focusOne')
    .populate('focusOneEnrollment.focusOne.teacherSubjectMappings.teacher', 'name email')
    .populate('focusOneEnrollment.focusOne.teacherSubjectMappings.subject', 'name description')
    .populate('focusOneEnrollment.focusOne.student', 'name email')
    .populate('focusOneEnrollment.focusOne.enrolledBy', 'name email')
    .populate('focusOneEnrollment.focusOne.pausedBy', 'name email')
    .populate('focusOneEnrollment.focusOne.pauseHistory.pausedBy', 'name email')
    .populate('focusOneEnrollment.focusOne.pauseHistory.resumedBy', 'name email')
    .populate('focusOneEnrollment.teacherSubjectMappings.teacher', 'name email')
    .populate('focusOneEnrollment.teacherSubjectMappings.subject', 'name description')
    .populate('roles', 'name displayName')
    .populate('primaryRole', 'name displayName');

  if (!user || !user.focusOneEnrollment) {
    throw new AppError(ERROR_CODES.USER.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  successResponse(
    res,
    HTTP_STATUS.OK,
    'Enrollment retrieved successfully',
    user
  );
});

/**
 * @desc    Update an enrollment
 * @route   PUT /api/v1/admin/focus-one/enrollments/:userId
 * @access  Private (Admin only)
 */
const updateEnrollment = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  const { status, teacherSubjectMappings, teacherIds, subjectIds, metadata, startedAt, endedAt } = req.body;

  const user = await User.findById(userId);

  if (!user || !user.focusOneEnrollment) {
    throw new AppError(ERROR_CODES.USER.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  // Update enrollment fields
  if (status !== undefined) {
    user.focusOneEnrollment.status = status;
  }

  // Update teacher-subject mappings
  if (teacherSubjectMappings !== undefined) {
    if (Array.isArray(teacherSubjectMappings) && teacherSubjectMappings.length > 0) {
      // Extract unique teacher and subject IDs for validation
      const uniqueTeacherIds = [...new Set(teacherSubjectMappings.map(m => m.teacher.toString()))];
      const uniqueSubjectIds = [...new Set(teacherSubjectMappings.map(m => m.subject.toString()))];

      // Validate teachers
      const teachers = await User.find({ _id: { $in: uniqueTeacherIds } }).populate('roles');
      if (teachers.length !== uniqueTeacherIds.length) {
        throw new AppError(ERROR_CODES.USER.NOT_FOUND, HTTP_STATUS.BAD_REQUEST, { message: 'One or more teachers not found' });
      }
      for (const teacher of teachers) {
        const hasTeacherRole = teacher.roles.some(role => role.name === 'teacher');
        if (!hasTeacherRole) {
          throw new AppError(ERROR_CODES.VALIDATION.INVALID_ROLE, HTTP_STATUS.BAD_REQUEST, { message: `User ${teacher.name} does not have teacher role` });
        }
      }

      // Validate subjects
      const subjects = await Subject.find({ _id: { $in: uniqueSubjectIds } });
      if (subjects.length !== uniqueSubjectIds.length) {
        throw new AppError(ERROR_CODES.SUBJECT.NOT_FOUND, HTTP_STATUS.BAD_REQUEST, { message: 'One or more subjects not found' });
      }

      user.focusOneEnrollment.teacherSubjectMappings = teacherSubjectMappings.map(m => ({
        teacher: m.teacher,
        subject: m.subject
      }));

      // Update FocusOne model
      if (user.focusOneEnrollment.focusOne) {
        await FocusOne.findByIdAndUpdate(user.focusOneEnrollment.focusOne, {
          teacherSubjectMappings: teacherSubjectMappings.map(m => ({
            teacher: m.teacher,
            subject: m.subject
          }))
        });
      }
    } else {
      user.focusOneEnrollment.teacherSubjectMappings = [];
      // Update FocusOne model
      if (user.focusOneEnrollment.focusOne) {
        await FocusOne.findByIdAndUpdate(user.focusOneEnrollment.focusOne, {
          teacherSubjectMappings: []
        });
      }
    }
  }

  if (startedAt !== undefined) {
    user.focusOneEnrollment.startedAt = startedAt ? new Date(startedAt) : null;
  }

  if (endedAt !== undefined) {
    user.focusOneEnrollment.endedAt = endedAt ? new Date(endedAt) : null;
  }

  if (metadata !== undefined) {
    // Merge metadata instead of replacing
    user.focusOneEnrollment.metadata = {
      ...user.focusOneEnrollment.metadata,
      ...metadata
    };
  }

  await user.save();

  // Populate before returning
  await user.populate('focusOneEnrollment.focusOne');
  await user.populate('focusOneEnrollment.focusOne.teacherSubjectMappings.teacher', 'name email');
  await user.populate('focusOneEnrollment.focusOne.teacherSubjectMappings.subject', 'name description');
  await user.populate('focusOneEnrollment.focusOne.student', 'name email');
  await user.populate('focusOneEnrollment.focusOne.enrolledBy', 'name email');
  await user.populate('focusOneEnrollment.focusOne.pausedBy', 'name email');
  await user.populate('focusOneEnrollment.focusOne.pauseHistory.pausedBy', 'name email');
  await user.populate('focusOneEnrollment.focusOne.pauseHistory.resumedBy', 'name email');
  await user.populate('focusOneEnrollment.teacherSubjectMappings.teacher', 'name email');
  await user.populate('focusOneEnrollment.teacherSubjectMappings.subject', 'name description');
  await user.populate('roles', 'name displayName');
  await user.populate('primaryRole', 'name displayName');

  successResponse(
    res,
    HTTP_STATUS.OK,
    'Enrollment updated successfully',
    user
  );
});

/**
 * @desc    Cancel/Withdraw an enrollment
 * @route   DELETE /api/v1/admin/focus-one/enrollments/:userId
 * @access  Private (Admin only)
 */
const cancelEnrollment = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  const performedBy = req.user._id;

  const user = await User.findById(userId);

  if (!user || !user.focusOneEnrollment) {
    throw new AppError(ERROR_CODES.USER.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  // Store the FocusOne ID before we modify anything
  const focusOneId = user.focusOneEnrollment.focusOne;

  // Verify FocusOne exists before soft deleting
  const focusOne = await FocusOne.findById(focusOneId);
  if (!focusOne) {
    throw new AppError(ERROR_CODES.FOCUS_ONE.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  // Soft delete the FocusOne first (this sets deletedAt and status to cancelled)
  await focusOne.softDelete(performedBy);

  // Now update user enrollment status
  user.focusOneEnrollment.status = 'cancelled';
  user.focusOneEnrollment.endedAt = new Date();

  // Save user with validateBeforeSave: false to skip the FocusOne reference validation
  // since we've already verified it exists and intentionally soft-deleted it
  await user.save({ validateBeforeSave: false });

  successResponse(
    res,
    HTTP_STATUS.OK,
    'Enrollment cancelled successfully',
    null
  );
});

module.exports = {
  enrollStudent,
  getAllEnrollments,
  getFocusOneEnrollments,
  getEnrollmentById,
  updateEnrollment,
  cancelEnrollment
};
