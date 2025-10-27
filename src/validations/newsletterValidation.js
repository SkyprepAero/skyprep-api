const { body, param } = require('express-validator');

// Subscribe Validation Rules
exports.subscribeValidation = [
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
  
  body('interests')
    .optional()
    .isArray()
    .withMessage('Interests must be an array'),
  
  body('source')
    .optional()
    .isIn(['website', 'landing-page', 'api', 'manual'])
    .withMessage('Invalid source value')
];

// Unsubscribe Validation Rules
exports.unsubscribeValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail()
];

// Email Parameter Validation
exports.emailParamValidation = [
  param('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
];





