// HTTP Status Codes
exports.HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500
};

// User Roles
exports.USER_ROLES = {
  SUPER_ADMIN: 'super-admin',
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
  USER: 'user'
};

// Role Hierarchy (higher number = more permissions)
exports.ROLE_HIERARCHY = {
  'super-admin': 5,
  'admin': 4,
  'teacher': 3,
  'student': 2,
  'user': 1
};

// Role Permissions
exports.ROLE_PERMISSIONS = {
  'super-admin': ['*'], // All permissions
  'admin': [
    'user:create',
    'user:read',
    'user:update',
    'user:delete',
    'newsletter:read',
    'newsletter:delete',
    'role:assign'
  ],
  'teacher': [
    'user:read',
    'student:read',
    'student:update',
    'course:create',
    'course:update'
  ],
  'student': [
    'user:read',
    'course:read',
    'course:enroll'
  ],
  'user': [
    'user:read'
  ]
};

// JWT
exports.JWT_COOKIE_EXPIRE = 7; // days

// Validation
exports.VALIDATION = {
  PASSWORD_MIN_LENGTH: 6,
  PASSWORD_MAX_LENGTH: 128,
  NAME_MAX_LENGTH: 50,
  EMAIL_REGEX: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/
};

const parseIntegerSetting = (value, fallback) => {
  if (value === null || value === undefined) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
};

// Email Passcode Configuration
exports.EMAIL_PASSCODE = {
  LENGTH: parseIntegerSetting(process.env.EMAIL_PASSCODE_LENGTH, 6),
  EXPIRY_MINUTES: parseIntegerSetting(process.env.EMAIL_PASSCODE_EXPIRY_MINUTES, 10),
  RESEND_COOLDOWN_SECONDS: parseIntegerSetting(process.env.EMAIL_PASSCODE_RESEND_COOLDOWN_SECONDS, 60),
  MAX_ATTEMPTS: parseIntegerSetting(process.env.EMAIL_PASSCODE_MAX_ATTEMPTS, 5),
  PURPOSES: {
    REGISTRATION: 'registration',
    LOGIN: 'login',
    PASSWORD_RESET: 'password_reset',
    EMAIL_UPDATE: 'email_update',
    GENERIC: 'generic'
  }
};

// Error Messages
exports.ERROR_MESSAGES = {
  USER_NOT_FOUND: 'User not found',
  USER_ALREADY_EXISTS: 'User with this email already exists',
  INVALID_CREDENTIALS: 'Invalid credentials',
  UNAUTHORIZED_ACCESS: 'Not authorized to access this route',
  FORBIDDEN_ACCESS: 'User role is not authorized to access this route',
  ACCOUNT_DEACTIVATED: 'Account is deactivated',
  VALIDATION_ERROR: 'Validation error',
  SERVER_ERROR: 'Internal server error',
  ROUTE_NOT_FOUND: 'Route not found',
  PROVIDE_EMAIL_PASSWORD: 'Please provide email and password',
  INVALID_TOKEN: 'Invalid or expired token'
};

// Success Messages
exports.SUCCESS_MESSAGES = {
  USER_REGISTERED: 'User registered successfully',
  LOGIN_SUCCESS: 'Login successful',
  USER_CREATED: 'User created successfully',
  USER_UPDATED: 'User updated successfully',
  USER_DELETED: 'User deleted successfully',
  EMAIL_PASSCODE_SENT: 'Verification code sent successfully',
  EMAIL_VERIFIED: 'Email verified successfully',
  PASSWORD_RESET_CODE_SENT: 'Password reset instructions sent if the email exists',
  PASSWORD_RESET_CODE_VERIFIED: 'Verification successful. You can now reset your password.',
  PASSWORD_RESET_SUCCESS: 'Password reset successful'
};

