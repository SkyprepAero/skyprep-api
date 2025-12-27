const { body } = require('express-validator');

/**
 * Validation rules for creating a public holiday
 */
exports.createPublicHolidayValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Holiday name is required')
    .isLength({ min: 1, max: 200 })
    .withMessage('Holiday name must be between 1 and 200 characters'),

  body('date')
    .notEmpty()
    .withMessage('Holiday date is required')
    .isISO8601()
    .withMessage('Date must be a valid ISO 8601 date')
    .custom((value) => {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error('Date must be a valid date');
      }
      // Ensure date is not in the past (optional business rule - can be removed if needed)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const holidayDate = new Date(date);
      holidayDate.setHours(0, 0, 0, 0);
      // Allow past dates for historical records
      return true;
    }),

  body('description')
    .optional()
    .trim()
    .isString()
    .withMessage('Description must be a string')
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

/**
 * Validation rules for updating a public holiday
 */
exports.updatePublicHolidayValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Holiday name cannot be empty')
    .isLength({ min: 1, max: 200 })
    .withMessage('Holiday name must be between 1 and 200 characters'),

  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid ISO 8601 date')
    .custom((value) => {
      if (value) {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          throw new Error('Date must be a valid date');
        }
      }
      return true;
    }),

  body('description')
    .optional()
    .trim()
    .isString()
    .withMessage('Description must be a string')
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

