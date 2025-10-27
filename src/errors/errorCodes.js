/**
 * Application Error Codes
 * Format: CATEGORY_SPECIFIC_ERROR
 * 
 * These are custom error codes for the application
 * Separate from HTTP status codes
 */

module.exports = {
  // Authentication Errors (1000-1999)
  AUTH: {
    INVALID_CREDENTIALS: { code: 'AUTH_1001', message: 'Invalid email or password' },
    TOKEN_MISSING: { code: 'AUTH_1002', message: 'Authentication token is missing' },
    TOKEN_INVALID: { code: 'AUTH_1003', message: 'Invalid or expired token' },
    TOKEN_EXPIRED: { code: 'AUTH_1004', message: 'Token has expired' },
    UNAUTHORIZED: { code: 'AUTH_1005', message: 'Not authorized to access this resource' },
    ACCOUNT_DEACTIVATED: { code: 'AUTH_1006', message: 'Your account has been deactivated' },
    ACCOUNT_LOCKED: { code: 'AUTH_1007', message: 'Account is locked due to multiple failed login attempts' }
  },

  // User Errors (2000-2999)
  USER: {
    NOT_FOUND: { code: 'USER_2001', message: 'User not found' },
    ALREADY_EXISTS: { code: 'USER_2002', message: 'User with this email already exists' },
    INVALID_ID: { code: 'USER_2003', message: 'Invalid user ID format' },
    UPDATE_FAILED: { code: 'USER_2004', message: 'Failed to update user' },
    DELETE_FAILED: { code: 'USER_2005', message: 'Failed to delete user' },
    CREATION_FAILED: { code: 'USER_2006', message: 'Failed to create user' }
  },

  // Authorization Errors (3000-3999)
  PERMISSION: {
    FORBIDDEN: { code: 'PERM_3001', message: 'You do not have permission to perform this action' },
    INSUFFICIENT_ROLE: { code: 'PERM_3002', message: 'Your role does not have sufficient permissions' },
    ADMIN_ONLY: { code: 'PERM_3003', message: 'This action is only available to administrators' }
  },

  // Validation Errors (4000-4999)
  VALIDATION: {
    GENERAL: { code: 'VAL_4001', message: 'Validation failed' },
    REQUIRED_FIELD: { code: 'VAL_4002', message: 'Required field is missing' },
    INVALID_FORMAT: { code: 'VAL_4003', message: 'Invalid format' },
    INVALID_EMAIL: { code: 'VAL_4004', message: 'Invalid email format' },
    PASSWORD_TOO_SHORT: { code: 'VAL_4005', message: 'Password must be at least 6 characters' },
    INVALID_ROLE: { code: 'VAL_4006', message: 'Invalid role specified' }
  },

  // Database Errors (5000-5999)
  DATABASE: {
    CONNECTION_FAILED: { code: 'DB_5001', message: 'Database connection failed' },
    QUERY_FAILED: { code: 'DB_5002', message: 'Database query failed' },
    DUPLICATE_KEY: { code: 'DB_5003', message: 'Duplicate entry found' },
    CAST_ERROR: { code: 'DB_5004', message: 'Invalid data format for database operation' },
    VALIDATION_ERROR: { code: 'DB_5005', message: 'Database validation failed' }
  },

  // Server Errors (9000-9999)
  SERVER: {
    INTERNAL_ERROR: { code: 'SRV_9001', message: 'Internal server error' },
    NOT_FOUND: { code: 'SRV_9002', message: 'Requested resource not found' },
    METHOD_NOT_ALLOWED: { code: 'SRV_9003', message: 'HTTP method not allowed' },
    SERVICE_UNAVAILABLE: { code: 'SRV_9004', message: 'Service temporarily unavailable' }
  }
};





