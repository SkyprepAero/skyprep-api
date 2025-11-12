const { asyncHandler } = require('../utils/errorHandler');
const { successResponse } = require('../utils/response');
const { HTTP_STATUS, SUCCESS_MESSAGES } = require('../utils/constants');
const authService = require('../services/authService');

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, roles, primaryRole } = req.body;
  const result = await authService.registerUser({ name, email, password, roles, primaryRole });
  successResponse(res, HTTP_STATUS.CREATED, SUCCESS_MESSAGES.USER_REGISTERED, result);
});

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  const result = await authService.loginWithPassword({ email, password });
  successResponse(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.LOGIN_SUCCESS, result);
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
  const result = await authService.loginWithGoogle({ idToken });
  successResponse(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.LOGIN_SUCCESS, result);
});

