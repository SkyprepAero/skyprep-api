const { asyncHandler } = require('../utils/errorHandler');
const { AppError, ERROR_CODES } = require('../errors');
const { HTTP_STATUS } = require('../utils/constants');

/**
 * Middleware to ensure user is a super-admin
 * This should be used for critical operations that only super-admin can perform
 */
exports.requireSuperAdmin = asyncHandler(async (req, res, next) => {
  if (!req.isSuperAdmin) {
    throw new AppError(
      ERROR_CODES.PERMISSION.ADMIN_ONLY,
      HTTP_STATUS.FORBIDDEN,
      { 
        message: 'This action requires super-admin privileges',
        userRoles: req.user.roles.map(r => r.name)
      }
    );
  }
  next();
});

/**
 * Middleware to log super-admin actions for audit trail
 */
exports.logSuperAdminAction = asyncHandler(async (req, res, next) => {
  if (req.isSuperAdmin) {
    console.log('[SUPER-ADMIN ACTION]', {
      user: req.user.email,
      action: `${req.method} ${req.originalUrl}`,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
  }
  next();
});

