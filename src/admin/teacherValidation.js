const { body } = require('express-validator');

// Register Teacher Validation Rules
exports.registerTeacherValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),

  body('name')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Name cannot be more than 50 characters'),

  body('phoneNumber')
    .optional()
    .trim()
    .isLength({ max: 15 })
    .withMessage('Phone number cannot be more than 15 characters')
    .matches(/^[\d\s\-\+\(\)]+$/)
    .withMessage('Please provide a valid phone number'),

  body('city')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('City cannot be more than 50 characters'),

  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object')
];



