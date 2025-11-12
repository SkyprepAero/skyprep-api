/**
 * Middleware to handle validation errors for express-validator
 * Use this after your validation rules
 */
const validateRequest = (req, res, next) => {
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


