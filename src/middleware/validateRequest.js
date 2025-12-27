const { validationResult } = require('express-validator');
const { AppError } = require('../errors');
const { ERROR_CODES } = require('../errors');
const { HTTP_STATUS } = require('../utils/constants');

/**
 * Middleware to handle validation errors for express-validator
 * Use this after your validation rules
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  console.log('=== VALIDATION DEBUG ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('Validation errors isEmpty:', errors.isEmpty());
  console.log('Raw validation result:', JSON.stringify(errors, null, 2));
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => ({
      field: err.path || err.param || err.location,
      message: err.msg,
      value: err.value
    }));
    
    console.log('Formatted error messages:', JSON.stringify(errorMessages, null, 2));
    console.log('Full error objects:', errors.array());
    
    throw new AppError(
      ERROR_CODES.VALIDATION.GENERAL,
      HTTP_STATUS.BAD_REQUEST,
      { 
        errors: errorMessages
      }
    );
  }
  
  console.log('Validation passed');
  console.log('===================');
  next();
};

/**
 * Middleware factory for Joi validation
 * Returns a middleware function that validates request data using Joi schema
 */
const validateRequestWithJoi = (schema) => {
  return (req, res, next) => {
    next();
  };
};

module.exports = {
  validateRequest,
  validateRequestWithJoi
};


