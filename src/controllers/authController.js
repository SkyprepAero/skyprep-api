const { asyncHandler } = require('../utils/errorHandler');
const { successResponse } = require('../utils/response');
const { HTTP_STATUS, SUCCESS_MESSAGES } = require('../utils/constants');
const authService = require('../services/authService');

const extractClientContext = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  let ipAddress = null;

  if (typeof forwarded === 'string' && forwarded.length > 0) {
    ipAddress = forwarded.split(',')[0].trim();
  } else if (Array.isArray(forwarded) && forwarded.length > 0) {
    ipAddress = String(forwarded[0]).trim();
  }

  if (!ipAddress || ipAddress === '::1') {
    ipAddress = req.ip;
  }

  return {
    ipAddress,
    userAgent: req.get('user-agent') || null
  };
};

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, roles, primaryRole, phoneNumber, city } = req.body;
  const result = await authService.registerUser({ name, email, password, roles, primaryRole, phoneNumber, city });
  successResponse(res, HTTP_STATUS.CREATED, SUCCESS_MESSAGES.USER_REGISTERED, result);
});

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  const result = await authService.loginWithPassword({ email, password });
  successResponse(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.EMAIL_PASSCODE_SENT, result);
});

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const profile = await authService.getCurrentUserProfile(req.user, { isSuperAdmin: req.isSuperAdmin });
  successResponse(res, HTTP_STATUS.OK, 'User retrieved successfully', profile);
});

// @desc    Login or register user with Google OAuth
// @route   POST /api/v1/auth/google
// @access  Public
exports.googleLogin = asyncHandler(async (req, res, next) => {
  const { idToken } = req.body;
  const client = extractClientContext(req);
  const result = await authService.loginWithGoogle({
    idToken,
    ipAddress: client.ipAddress,
    userAgent: client.userAgent
  });
  successResponse(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.LOGIN_SUCCESS, result);
});

// @desc    Verify login passcode
// @route   POST /api/v1/auth/login/passcode
// @access  Public
exports.verifyLoginPasscode = asyncHandler(async (req, res, next) => {
  const { email, passcode } = req.body;
  const client = extractClientContext(req);
  const result = await authService.verifyLoginWithPasscode({
    email,
    passcode,
    ipAddress: client.ipAddress,
    userAgent: client.userAgent
  });
  successResponse(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.LOGIN_SUCCESS, result);
});

// @desc    Request password reset passcode
// @route   POST /api/v1/auth/forgot-password
// @access  Public
exports.requestPasswordResetPasscode = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const result = await authService.requestPasswordResetPasscode({ email });
  successResponse(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.PASSWORD_RESET_CODE_SENT, result);
});

// @desc    Verify password reset passcode
// @route   POST /api/v1/auth/forgot-password/verify
// @access  Public
exports.verifyPasswordResetPasscode = asyncHandler(async (req, res, next) => {
  const { email, passcode } = req.body;
  const result = await authService.verifyPasswordResetPasscode({
    email,
    passcode
  });
  successResponse(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.PASSWORD_RESET_CODE_VERIFIED, result);
});

// @desc    Reset password with token
// @route   POST /api/v1/auth/forgot-password/reset
// @access  Public
exports.resetPasswordWithToken = asyncHandler(async (req, res, next) => {
  const { resetToken, newPassword } = req.body;
  const client = extractClientContext(req);
  const result = await authService.resetPasswordWithToken({
    resetToken,
    newPassword,
    ipAddress: client.ipAddress,
    userAgent: client.userAgent
  });
  successResponse(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.PASSWORD_RESET_SUCCESS, result);
});

// @desc    Setup password with token (for new enrollments)
// @route   POST /api/v1/auth/setup-password
// @access  Public
exports.setupPasswordWithToken = asyncHandler(async (req, res, next) => {
  const { setupToken, newPassword, name, phoneNumber, city } = req.body;
  const client = extractClientContext(req);
  const result = await authService.setupPasswordWithToken({
    setupToken,
    newPassword,
    name,
    phoneNumber,
    city,
    ipAddress: client.ipAddress,
    userAgent: client.userAgent
  });
  successResponse(res, HTTP_STATUS.OK, 'Password set successfully. You are now logged in.', result);
});

// @desc    Get current user's enrollment details
// @route   GET /api/v1/auth/me/enrollment
// @access  Private
exports.getMyEnrollment = asyncHandler(async (req, res, next) => {
  const enrollment = await authService.getCurrentUserEnrollment(req.user);
  if (!enrollment) {
    return successResponse(res, HTTP_STATUS.OK, 'No enrollment found', null);
  }
  successResponse(res, HTTP_STATUS.OK, 'Enrollment retrieved successfully', enrollment);
});

