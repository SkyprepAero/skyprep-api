const { body } = require('express-validator');

/**
 * Validation rules for enrolling a student in Focus One
 */
exports.enrollStudentValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),

  body('teacherSubjectMappings')
    .notEmpty()
    .withMessage('At least one teacher-subject mapping is required')
    .isArray()
    .withMessage('Teacher-subject mappings must be an array')
    .custom((value) => {
      if (!Array.isArray(value) || value.length === 0) {
        throw new Error('At least one teacher-subject mapping must be provided');
      }
      return true;
    }),

  body('teacherSubjectMappings.*.teacher')
    .notEmpty()
    .withMessage('Teacher ID is required for each mapping')
    .isMongoId()
    .withMessage('Invalid teacher ID format'),

  body('teacherSubjectMappings.*.subject')
    .notEmpty()
    .withMessage('Subject ID is required for each mapping')
    .isMongoId()
    .withMessage('Invalid subject ID format'),

  body('startedAt')
    .optional()
    .custom((value) => {
      if (value && value !== '') {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          throw new Error('Start date must be a valid date');
        }
      }
      return true;
    }),

  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object')
];

