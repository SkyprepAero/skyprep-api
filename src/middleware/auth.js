const { User } = require('../models');
const { verifyToken } = require('../config/jwt');
const { asyncHandler } = require('../utils/errorHandler');
const { HTTP_STATUS } = require('../utils/constants');
const { AppError, ERROR_CODES } = require('../errors');

// Protect routes
exports.protect = asyncHandler(async (req, res, next) => {
  let token;
  
  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  // Make sure token exists
  if (!token) {
    throw new AppError(ERROR_CODES.AUTH.TOKEN_MISSING, HTTP_STATUS.UNAUTHORIZED);
  }
  
  try {
    // Verify token
    const decoded = verifyToken(token);
    
    // Get user from token with roles and permissions
    req.user = await User.findById(decoded.id)
      .select('-password')
      .populate({
        path: 'roles',
        populate: { path: 'permissions' }
      })
      .populate('primaryRole');
    
    if (!req.user) {
      throw new AppError(ERROR_CODES.USER.NOT_FOUND, HTTP_STATUS.UNAUTHORIZED);
    }
    
    // Check if account is active
    if (!req.user.isActive) {
      throw new AppError(ERROR_CODES.AUTH.ACCOUNT_DEACTIVATED, HTTP_STATUS.UNAUTHORIZED);
    }
    
    // Enforce single active session
    if (!decoded.sessionNonce || !req.user.sessionNonce || decoded.sessionNonce !== req.user.sessionNonce) {
      throw new AppError(ERROR_CODES.AUTH.SESSION_REVOKED, HTTP_STATUS.UNAUTHORIZED);
    }
    
    // Attach decoded token data for quick access
    req.tokenData = decoded;
    
    // Check if user is super-admin (for bypass logic)
    req.isSuperAdmin = req.user.roles.some(role => role.name === 'super-admin');
    
    next();
  } catch (error) {
    // If it's already an AppError, re-throw it
    if (error.isOperational) {
      throw error;
    }
    // Otherwise, it's a JWT error
    throw new AppError(ERROR_CODES.AUTH.TOKEN_INVALID, HTTP_STATUS.UNAUTHORIZED);
  }
});

// Grant access to specific roles (user must have at least ONE of the roles)
exports.authorize = (...roleNames) => {
  return asyncHandler(async (req, res, next) => {
    // Super admin bypasses all role checks
    if (req.isSuperAdmin) {
      return next();
    }
    
    const userRoleNames = req.user.roles.map(r => r.name);
    const hasRole = roleNames.some(roleName => userRoleNames.includes(roleName));
    
    if (!hasRole) {
      throw new AppError(
        ERROR_CODES.PERMISSION.INSUFFICIENT_ROLE,
        HTTP_STATUS.FORBIDDEN,
        { requiredRoles: roleNames, userRoles: userRoleNames }
      );
    }
    next();
  });
};

// Grant access only if user has ALL specified roles
exports.authorizeAll = (...roleNames) => {
  return asyncHandler(async (req, res, next) => {
    // Super admin bypasses all role checks
    if (req.isSuperAdmin) {
      return next();
    }
    
    const userRoleNames = req.user.roles.map(r => r.name);
    const hasAllRoles = roleNames.every(roleName => userRoleNames.includes(roleName));
    
    if (!hasAllRoles) {
      throw new AppError(
        ERROR_CODES.PERMISSION.INSUFFICIENT_ROLE,
        HTTP_STATUS.FORBIDDEN,
        { requiredRoles: roleNames, userRoles: userRoleNames, requireAll: true }
      );
    }
    next();
  });
};

// Check if user has specific permission
exports.can = (permissionName) => {
  return asyncHandler(async (req, res, next) => {
    // Super admin bypasses all permission checks
    if (req.isSuperAdmin) {
      return next();
    }
    
    // Check if any role has the permission or system:* permission
    const hasPermission = req.user.roles.some(role =>
      role.permissions && role.permissions.some(p => 
        p.name === permissionName || p.name === 'system:*'
      )
    );
    
    if (!hasPermission) {
      const userRoleNames = req.user.roles.map(r => r.name);
      throw new AppError(
        ERROR_CODES.PERMISSION.FORBIDDEN,
        HTTP_STATUS.FORBIDDEN,
        { 
          requiredPermission: permissionName,
          userRoles: userRoleNames,
          hint: 'User does not have required permission'
        }
      );
    }
    next();
  });
};

