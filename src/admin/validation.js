const { body } = require('express-validator');
const { VALIDATION } = require('../utils/constants');

// Admin Registration Validation Rules
exports.registerAdminValidation = [
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
    .withMessage('Password cannot be more than 128 characters'),
  
  body('phoneNumber')
    .optional()
    .trim()
    .isLength({ max: 15 })
    .withMessage('Phone number cannot be more than 15 characters'),
  
  body('city')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('City cannot be more than 100 characters')
];

