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
    ACCOUNT_LOCKED: { code: 'AUTH_1007', message: 'Account is locked due to multiple failed login attempts' },
    GOOGLE_AUTH_FAILED: { code: 'AUTH_1008', message: 'Failed to authenticate with Google' },
    GOOGLE_EMAIL_NOT_VERIFIED: { code: 'AUTH_1009', message: 'Google account email is not verified' },
    GOOGLE_CONFIG_MISSING: { code: 'AUTH_1010', message: 'Google OAuth configuration is missing' },
    SESSION_REVOKED: { code: 'AUTH_1011', message: 'Session has been revoked. Please log in again.' }
  },

  // User Errors (2000-2999)
  USER: {
    NOT_FOUND: { code: 'USER_2001', message: 'User not found' },
    ALREADY_EXISTS: { code: 'USER_2002', message: 'User with this email already exists' },
    INVALID_ID: { code: 'USER_2003', message: 'Invalid user ID format' },
    UPDATE_FAILED: { code: 'USER_2004', message: 'Failed to update user' },
    DELETE_FAILED: { code: 'USER_2005', message: 'Failed to delete user' },
    CREATION_FAILED: { code: 'USER_2006', message: 'Failed to create user' },
    ALREADY_ENROLLED: { code: 'USER_2007', message: 'User is already enrolled' }
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

  // Subject Errors (6000-6999)
  SUBJECT: {
    NOT_FOUND: { code: 'SUB_6001', message: 'Subject not found' },
    ALREADY_EXISTS: { code: 'SUB_6002', message: 'Subject with this name already exists' },
    HAS_CHAPTERS: { code: 'SUB_6003', message: 'Cannot delete subject with existing chapters' }
  },

  // Chapter Errors (7000-7999)
  CHAPTER: {
    NOT_FOUND: { code: 'CHP_7001', message: 'Chapter not found' },
    ALREADY_EXISTS: { code: 'CHP_7002', message: 'Chapter with this name already exists in the subject' },
    HAS_QUESTIONS: { code: 'CHP_7003', message: 'Cannot delete chapter with existing questions' }
  },

  // Question Errors (8000-8999)
  QUESTION: {
    NOT_FOUND: { code: 'QST_8001', message: 'Question not found' },
    INVALID_OPTIONS: { code: 'QST_8002', message: 'Question must have between 2 and 4 options' },
    NO_CORRECT_OPTION: { code: 'QST_8003', message: 'At least one option must be marked as correct' }
  },

  // Focus One Errors (8500-8599)
  FOCUS_ONE: {
    NOT_FOUND: { code: 'FOC_8501', message: 'Focus One not found' },
    ALREADY_EXISTS: { code: 'FOC_8502', message: 'Focus One with this slug already exists' }
  },

  // Test Series Errors (8600-8699)
  TEST_SERIES: {
    NOT_FOUND: { code: 'TST_8601', message: 'Test Series not found' },
    ALREADY_EXISTS: { code: 'TST_8602', message: 'Test Series with this slug already exists' },
    ENROLLMENT_EXISTS: { code: 'TST_8603', message: 'User is already enrolled in this test series' }
  },

  // Session Errors (8700-8799)
  SESSION: {
    NOT_FOUND: { code: 'SES_8701', message: 'Session not found' },
    INVALID_TIME: { code: 'SES_8702', message: 'Session end time must be after start time' },
    ASSOCIATION_REQUIRED: { code: 'SES_8703', message: 'Session must be associated with either a Focus One or Cohort' },
    INVALID_ASSOCIATION: { code: 'SES_8704', message: 'Session cannot be associated with both Focus One and Cohort' }
  },

  // Server Errors (9000-9999)
  SERVER: {
    INTERNAL_ERROR: { code: 'SRV_9001', message: 'Internal server error' },
    NOT_FOUND: { code: 'SRV_9002', message: 'Requested resource not found' },
    METHOD_NOT_ALLOWED: { code: 'SRV_9003', message: 'HTTP method not allowed' },
    SERVICE_UNAVAILABLE: { code: 'SRV_9004', message: 'Service temporarily unavailable' }
  },

  // Passcode Errors (10000-10999)
  PASSCODE: {
    REQUIRED: { code: 'PASC_10001', message: 'Email passcode verification is required' },
    INVALID: { code: 'PASC_10002', message: 'Invalid email passcode' },
    EXPIRED: { code: 'PASC_10003', message: 'Email passcode has expired' },
    ATTEMPTS_EXCEEDED: { code: 'PASC_10004', message: 'Maximum verification attempts exceeded' },
    NOT_FOUND: { code: 'PASC_10005', message: 'No active email passcode found. Please request a new code.' },
    TOO_SOON: { code: 'PASC_10006', message: 'Please wait before requesting another verification code' },
    ALREADY_VERIFIED: { code: 'PASC_10007', message: 'Email address is already verified' }
  }
};





