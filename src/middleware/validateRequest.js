const { validationResult } = require('express-validator');
const { HTTP_STATUS } = require('../utils/constants');

/**
 * Middleware to handle validation errors for express-validator
 * Use this after your validation rules
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  
  next();
};

/**
 * Middleware factory for Joi validation
 * Returns a middleware function that validates request data using Joi schema
 */
const validateRequestWithJoi = (schema) => {
  return (req, res, next) => {
    // Determine what to validate based on request method
    const dataToValidate = req.method === 'GET' ? req.query : req.body;
    
    const { error, value } = schema.validate(dataToValidate, { 
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/"/g, ''),
        value: detail.context?.value
      }));

      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Validation failed',
        errors: errorDetails
      });
    }

    // Replace the appropriate data with validated and sanitized data
    if (req.method === 'GET') {
      req.query = value;
    } else {
      req.body = value;
    }
    next();
  };
};

module.exports = {
  validateRequest,
  validateRequestWithJoi
};


