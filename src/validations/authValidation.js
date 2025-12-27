const { body } = require('express-validator');
const { EMAIL_PASSCODE, VALIDATION } = require('../utils/constants');

// Register Validation Rules
exports.registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 50 })
    .withMessage('Name cannot be more than 50 characters'),
  
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .isLength({ max: 128 })
    .withMessage('Password cannot be more than 128 characters')
];

// Login Validation Rules
exports.loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Login Passcode Validation Rules
exports.loginPasscodeValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),

  body('passcode')
    .trim()
    .notEmpty()
    .withMessage('Passcode is required')
    .isLength({ min: EMAIL_PASSCODE.LENGTH, max: EMAIL_PASSCODE.LENGTH })
    .withMessage(`Passcode must be ${EMAIL_PASSCODE.LENGTH} digits long`)
    .matches(/^\d+$/)
    .withMessage('Passcode must contain digits only')
];

// Google Login Validation Rules
exports.googleLoginValidation = [
  body('idToken')
    .trim()
    .notEmpty()
    .withMessage('Google ID token is required')
];

// Forgot Password Request Validation Rules
exports.forgotPasswordRequestValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail()
];

// Forgot Password Verify Validation Rules
exports.forgotPasswordVerifyValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),

  body('passcode')
    .trim()
    .notEmpty()
    .withMessage('Passcode is required')
    .isLength({ min: EMAIL_PASSCODE.LENGTH, max: EMAIL_PASSCODE.LENGTH })
    .withMessage(`Passcode must be ${EMAIL_PASSCODE.LENGTH} digits long`)
    .matches(/^\d+$/)
    .withMessage('Passcode must contain digits only'),
];

// Forgot Password Reset Validation Rules
exports.forgotPasswordResetValidation = [
  body('resetToken')
    .notEmpty()
    .withMessage('Reset token is required'),

  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: VALIDATION.PASSWORD_MIN_LENGTH })
    .withMessage(`Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters long`)
    .isLength({ max: VALIDATION.PASSWORD_MAX_LENGTH })
    .withMessage(`Password cannot be more than ${VALIDATION.PASSWORD_MAX_LENGTH} characters`)
];

// Password Setup Validation Rules (for new enrollments)
exports.setupPasswordValidation = [
  body('setupToken')
    .notEmpty()
    .withMessage('Setup token is required'),

  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: VALIDATION.PASSWORD_MIN_LENGTH })
    .withMessage(`Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters long`)
    .isLength({ max: VALIDATION.PASSWORD_MAX_LENGTH })
    .withMessage(`Password cannot be more than ${VALIDATION.PASSWORD_MAX_LENGTH} characters`),

  body('name')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Name cannot be more than 50 characters'),

  body('phoneNumber')
    .optional()
    .trim()
    .isLength({ max: 15 })
    .withMessage('Phone number cannot be more than 15 characters'),

  body('city')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('City cannot be more than 50 characters')
];


