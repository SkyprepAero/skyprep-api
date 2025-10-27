const { User } = require('../models');
const { asyncHandler } = require('../utils/errorHandler');
const { successResponse } = require('../utils/response');
const { HTTP_STATUS, USER_ROLES, ROLE_HIERARCHY, ROLE_PERMISSIONS } = require('../utils/constants');
const { AppError, ERROR_CODES } = require('../errors');

// @desc    Get all available roles
// @route   GET /api/v1/roles
// @access  Public
exports.getAllRoles = asyncHandler(async (req, res, next) => {
  const roles = Object.values(USER_ROLES).map(role => ({
    name: role,
    level: ROLE_HIERARCHY[role],
    permissions: ROLE_PERMISSIONS[role]
  }));

  successResponse(res, HTTP_STATUS.OK, 'Roles retrieved successfully', {
    roles,
    total: roles.length
  });
});

// @desc    Get user roles
// @route   GET /api/v1/roles/user/:userId
// @access  Private (Admin or Self)
exports.getUserRoles = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  
  // Check if user can access this (admin or self)
  if (req.user.id !== userId && !req.user.hasRole('admin') && !req.user.hasRole('super-admin')) {
    throw new AppError(
      ERROR_CODES.PERMISSION.FORBIDDEN,
      HTTP_STATUS.FORBIDDEN
    );
  }
  
  const user = await User.findById(userId).select('name email roles primaryRole');
  
  if (!user) {
    throw new AppError(ERROR_CODES.USER.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }
  
  successResponse(res, HTTP_STATUS.OK, 'User roles retrieved successfully', {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      roles: user.roles,
      primaryRole: user.primaryRole,
      highestRole: user.getHighestRole()
    }
  });
});

// @desc    Assign role to user
// @route   POST /api/v1/roles/assign
// @access  Private (Admin only)
exports.assignRole = asyncHandler(async (req, res, next) => {
  const { userId, role } = req.body;
  
  // Validate role
  if (!Object.values(USER_ROLES).includes(role)) {
    throw new AppError(
      { code: 'ROLE_4001', message: 'Invalid role specified' },
      HTTP_STATUS.BAD_REQUEST
    );
  }
  
  const user = await User.findById(userId);
  
  if (!user) {
    throw new AppError(ERROR_CODES.USER.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }
  
  // Prevent assigning super-admin unless requester is super-admin
  if (role === 'super-admin' && !req.user.hasRole('super-admin')) {
    throw new AppError(
      ERROR_CODES.PERMISSION.FORBIDDEN,
      HTTP_STATUS.FORBIDDEN,
      { message: 'Only super-admin can assign super-admin role' }
    );
  }
  
  await user.addRole(role);
  
  successResponse(res, HTTP_STATUS.OK, `Role '${role}' assigned successfully`, {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      roles: user.roles,
      primaryRole: user.primaryRole
    }
  });
});

// @desc    Remove role from user
// @route   DELETE /api/v1/roles/remove
// @access  Private (Admin only)
exports.removeRole = asyncHandler(async (req, res, next) => {
  const { userId, role } = req.body;
  
  const user = await User.findById(userId);
  
  if (!user) {
    throw new AppError(ERROR_CODES.USER.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }
  
  // Prevent removing super-admin unless requester is super-admin
  if (role === 'super-admin' && !req.user.hasRole('super-admin')) {
    throw new AppError(
      ERROR_CODES.PERMISSION.FORBIDDEN,
      HTTP_STATUS.FORBIDDEN,
      { message: 'Only super-admin can remove super-admin role' }
    );
  }
  
  // Prevent removing last role
  if (user.roles.length === 1) {
    throw new AppError(
      { code: 'ROLE_4002', message: 'Cannot remove last role. User must have at least one role.' },
      HTTP_STATUS.BAD_REQUEST
    );
  }
  
  await user.removeRole(role);
  
  successResponse(res, HTTP_STATUS.OK, `Role '${role}' removed successfully`, {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      roles: user.roles,
      primaryRole: user.primaryRole
    }
  });
});

// @desc    Set primary role for user
// @route   PUT /api/v1/roles/primary
// @access  Private (Admin or Self)
exports.setPrimaryRole = asyncHandler(async (req, res, next) => {
  const { userId, role } = req.body;
  
  // Check if user can access this (admin or self)
  if (req.user.id !== userId && !req.user.hasRole('admin') && !req.user.hasRole('super-admin')) {
    throw new AppError(
      ERROR_CODES.PERMISSION.FORBIDDEN,
      HTTP_STATUS.FORBIDDEN
    );
  }
  
  const user = await User.findById(userId);
  
  if (!user) {
    throw new AppError(ERROR_CODES.USER.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }
  
  // Check if user has this role
  if (!user.hasRole(role)) {
    throw new AppError(
      { code: 'ROLE_4003', message: 'User does not have this role' },
      HTTP_STATUS.BAD_REQUEST
    );
  }
  
  user.primaryRole = role;
  await user.save();
  
  successResponse(res, HTTP_STATUS.OK, `Primary role set to '${role}'`, {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      roles: user.roles,
      primaryRole: user.primaryRole
    }
  });
});

// @desc    Get users by role
// @route   GET /api/v1/roles/:role/users
// @access  Private (Admin only)
exports.getUsersByRole = asyncHandler(async (req, res, next) => {
  const { role } = req.params;
  const { limit = 50, page = 1 } = req.query;
  
  // Validate role
  if (!Object.values(USER_ROLES).includes(role)) {
    throw new AppError(
      { code: 'ROLE_4001', message: 'Invalid role specified' },
      HTTP_STATUS.BAD_REQUEST
    );
  }
  
  const skip = (page - 1) * limit;
  
  const users = await User.find({ roles: role })
    .select('-password')
    .limit(parseInt(limit))
    .skip(skip)
    .sort({ createdAt: -1 });
  
  const total = await User.countDocuments({ roles: role });
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: `Users with role '${role}' retrieved successfully`,
    count: users.length,
    total,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      hasMore: skip + users.length < total
    },
    data: users
  });
});

