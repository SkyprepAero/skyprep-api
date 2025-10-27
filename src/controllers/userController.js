const { User } = require('../models');
const { asyncHandler } = require('../utils/errorHandler');
const { successResponse } = require('../utils/response');
const { HTTP_STATUS, SUCCESS_MESSAGES } = require('../utils/constants');
const { AppError, ERROR_CODES } = require('../errors');

// @desc    Get all users
// @route   GET /api/v1/users
// @access  Public
exports.getUsers = asyncHandler(async (req, res, next) => {
  const users = await User.find().select('-password');
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    count: users.length,
    data: users
  });
});

// @desc    Get single user
// @route   GET /api/v1/users/:id
// @access  Public
exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-password');
  
  if (!user) {
    throw new AppError(ERROR_CODES.USER.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }
  
  successResponse(res, HTTP_STATUS.OK, 'User retrieved successfully', user);
});

// @desc    Create new user
// @route   POST /api/v1/users
// @access  Public
exports.createUser = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;
  
  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError(ERROR_CODES.USER.ALREADY_EXISTS, HTTP_STATUS.BAD_REQUEST);
  }
  
  const user = await User.create({
    name,
    email,
    password,
    role
  });
  
  // Remove password from response
  user.password = undefined;
  
  successResponse(res, HTTP_STATUS.CREATED, SUCCESS_MESSAGES.USER_CREATED, user);
});

// @desc    Update user
// @route   PUT /api/v1/users/:id
// @access  Public
exports.updateUser = asyncHandler(async (req, res, next) => {
  const { name, email, role, isActive } = req.body;
  
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { name, email, role, isActive },
    {
      new: true,
      runValidators: true
    }
  ).select('-password');
  
  if (!user) {
    throw new AppError(ERROR_CODES.USER.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }
  
  successResponse(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.USER_UPDATED, user);
});

// @desc    Delete user
// @route   DELETE /api/v1/users/:id
// @access  Public
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);
  
  if (!user) {
    throw new AppError(ERROR_CODES.USER.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }
  
  successResponse(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.USER_DELETED, {});
});

