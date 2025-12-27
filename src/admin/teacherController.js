const { asyncHandler } = require('../utils/errorHandler');
const { successResponse } = require('../utils/response');
const { HTTP_STATUS } = require('../utils/constants');
const { registerTeacher } = require('./teacherService');

/**
 * @desc    Register a teacher (Admin endpoint)
 * @route   POST /api/v1/admin/teachers/register
 * @access  Private (Admin only)
 */
const registerTeacherByAdmin = asyncHandler(async (req, res, next) => {
  const {
    email,
    name,
    phoneNumber,
    city,
    metadata
  } = req.body;

  // Get the admin user ID from the authenticated request
  const registeredBy = req.user?._id || req.user?.id || null;

  const result = await registerTeacher({
    email,
    name: name || null,
    phoneNumber: phoneNumber || null,
    city: city || null,
    metadata: metadata || {},
    registeredBy
  });

  successResponse(
    res,
    HTTP_STATUS.CREATED,
    'Teacher registered successfully. Password setup email has been sent.',
    result
  );
});

/**
 * @desc    Register a teacher (Public endpoint for self-registration from classroom)
 * @route   POST /api/v1/auth/teachers/register
 * @access  Public
 */
const registerTeacherPublic = asyncHandler(async (req, res, next) => {
  const {
    email,
    name,
    phoneNumber,
    city,
    metadata
  } = req.body;

  const result = await registerTeacher({
    email,
    name: name || null,
    phoneNumber: phoneNumber || null,
    city: city || null,
    metadata: metadata || {},
    registeredBy: null // Self-registration
  });

  successResponse(
    res,
    HTTP_STATUS.CREATED,
    'Teacher registration request received. Password setup email has been sent.',
    result
  );
});

module.exports = {
  registerTeacherByAdmin,
  registerTeacherPublic
};

