const { User } = require('../models');
const { generateToken } = require('../config/jwt');
const { asyncHandler } = require('../utils/errorHandler');
const { successResponse } = require('../utils/response');
const { HTTP_STATUS, SUCCESS_MESSAGES } = require('../utils/constants');
const { AppError, ERROR_CODES } = require('../errors');

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;
  
  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError(ERROR_CODES.USER.ALREADY_EXISTS, HTTP_STATUS.BAD_REQUEST);
  }
  
  // Get default user role from database
  const { Role } = require('../models');
  const defaultRole = await Role.findOne({ name: 'user', isActive: true });
  
  if (!defaultRole) {
    throw new AppError(
      { code: 'ROLE_5001', message: 'Default role not found. Please run database seeder.' },
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
  
  // Create user
  const user = await User.create({
    name,
    email,
    password,
    roles: [defaultRole._id],
    primaryRole: defaultRole._id
  });
  
  // Populate roles and permissions for token
  await user.populate({
    path: 'roles',
    populate: { path: 'permissions' }
  });
  await user.populate('primaryRole');
  
  // Generate token with role info
  const token = generateToken({
    id: user._id,
    roles: user.roles.map(r => r.name),
    primaryRole: user.primaryRole.name
  });
  
  successResponse(res, HTTP_STATUS.CREATED, SUCCESS_MESSAGES.USER_REGISTERED, {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      roles: user.roles.map(r => ({ id: r._id, name: r.name, displayName: r.displayName })),
      primaryRole: {
        id: user.primaryRole._id,
        name: user.primaryRole.name,
        displayName: user.primaryRole.displayName
      }
    },
    token
  });
});

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  
  // Check for user
  const user = await User.findOne({ email }).select('+password');
  
  if (!user) {
    throw new AppError(ERROR_CODES.AUTH.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);
  }
  
  // Check if password matches
  const isMatch = await user.comparePassword(password);
  
  if (!isMatch) {
    throw new AppError(ERROR_CODES.AUTH.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);
  }
  
  // Check if user is active
  if (!user.isActive) {
    throw new AppError(ERROR_CODES.AUTH.ACCOUNT_DEACTIVATED, HTTP_STATUS.UNAUTHORIZED);
  }
  
  // Populate roles and permissions for token
  await user.populate({
    path: 'roles',
    populate: { path: 'permissions' }
  });
  await user.populate('primaryRole');
  
  // Get all permissions
  const allPermissions = await user.getAllPermissions();
  
  // Generate token with role and permission info
  const token = generateToken({
    id: user._id,
    roles: user.roles.map(r => r.name),
    primaryRole: user.primaryRole.name,
    permissions: allPermissions
  });
  
  successResponse(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.LOGIN_SUCCESS, {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      roles: user.roles.map(r => ({
        id: r._id,
        name: r.name,
        displayName: r.displayName,
        level: r.level
      })),
      primaryRole: {
        id: user.primaryRole._id,
        name: user.primaryRole.name,
        displayName: user.primaryRole.displayName
      },
      permissions: allPermissions
    },
    token
  });
});

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  // User is already populated with roles and permissions from protect middleware
  const allPermissions = await req.user.getAllPermissions();
  
  successResponse(res, HTTP_STATUS.OK, 'User retrieved successfully', {
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    roles: req.user.roles.map(r => ({
      id: r._id,
      name: r.name,
      displayName: r.displayName,
      level: r.level
    })),
    primaryRole: {
      id: req.user.primaryRole._id,
      name: req.user.primaryRole.name,
      displayName: req.user.primaryRole.displayName
    },
    permissions: allPermissions,
    isSuperAdmin: req.isSuperAdmin,
    isActive: req.user.isActive,
    createdAt: req.user.createdAt,
    updatedAt: req.user.updatedAt
  });
});

