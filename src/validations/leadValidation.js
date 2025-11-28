const { body } = require('express-validator');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

exports.leadSubmissionValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .matches(emailRegex)
    .withMessage('Please provide a valid email')
    .normalizeEmail(),

  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 10, max: 5000 })
    .withMessage('Message must be between 10 and 5000 characters'),

  body('source')
    .optional()
    .isIn(['contact-page', 'enquiry-page'])
    .withMessage('Source must be contact-page or enquiry-page'),

  body('phone')
    .optional()
    .trim()
    .isLength({ max: 25 })
    .withMessage('Phone cannot exceed 25 characters'),

  body('topic')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Topic cannot exceed 100 characters'),

  body('timestamp')
    .optional()
    .isISO8601()
    .withMessage('Timestamp must be a valid ISO 8601 date string'),

  body('referrer')
    .optional()
    .isString()
    .isLength({ max: 2048 })
    .withMessage('Referrer cannot exceed 2048 characters'),

  body('userAgent')
    .optional()
    .isString()
    .isLength({ max: 512 })
    .withMessage('User agent cannot exceed 512 characters')
];


