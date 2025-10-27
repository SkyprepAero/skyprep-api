const { HTTP_STATUS } = require('./constants');
const { AppError, ERROR_CODES } = require('../errors');

// Async Error Handler Wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Handle Mongoose Validation Error
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  return new AppError(
    ERROR_CODES.DATABASE.VALIDATION_ERROR,
    HTTP_STATUS.BAD_REQUEST,
    { validationErrors: errors }
  );
};

// Handle Mongoose Duplicate Key Error
const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  return new AppError(
    ERROR_CODES.DATABASE.DUPLICATE_KEY,
    HTTP_STATUS.CONFLICT,
    { field, value: err.keyValue[field] }
  );
};

// Handle Mongoose Cast Error
const handleCastError = (err) => {
  return new AppError(
    ERROR_CODES.DATABASE.CAST_ERROR,
    HTTP_STATUS.BAD_REQUEST,
    { path: err.path, value: err.value }
  );
};

// Handle JWT Error
const handleJWTError = () => {
  return new AppError(ERROR_CODES.AUTH.TOKEN_INVALID, HTTP_STATUS.UNAUTHORIZED);
};

// Handle JWT Expired Error
const handleJWTExpiredError = () => {
  return new AppError(ERROR_CODES.AUTH.TOKEN_EXPIRED, HTTP_STATUS.UNAUTHORIZED);
};

// Send Error Response
const sendError = (err, req, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    // Use toJSON method if available (AppError instances)
    if (typeof err.toJSON === 'function') {
      return res.status(err.statusCode).json(err.toJSON());
    }
    
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.errorCode || 'UNKNOWN_ERROR',
        message: err.message
      },
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }

  // Programming or unknown error: don't leak error details
  console.error('ERROR 💥:', err);
  return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    success: false,
    error: {
      code: ERROR_CODES.SERVER.INTERNAL_ERROR.code,
      message: ERROR_CODES.SERVER.INTERNAL_ERROR.message
    },
    ...(process.env.NODE_ENV === 'development' && {
      details: err.message,
      stack: err.stack
    })
  });
};

// Global Error Handler Middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    error = handleValidationError(err);
  }

  // Mongoose Duplicate Key Error
  if (err.code === 11000) {
    error = handleDuplicateKeyError(err);
  }

  // Mongoose Cast Error
  if (err.name === 'CastError') {
    error = handleCastError(err);
  }

  // JWT Error
  if (err.name === 'JsonWebTokenError') {
    error = handleJWTError();
  }

  // JWT Expired Error
  if (err.name === 'TokenExpiredError') {
    error = handleJWTExpiredError();
  }

  sendError(error, req, res);
};

module.exports = {
  asyncHandler,
  errorHandler
};

