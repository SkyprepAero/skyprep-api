const { HTTP_STATUS } = require('../utils/constants');

/**
 * Custom Application Error Class
 * Extends the native Error class with additional properties
 */
class AppError extends Error {
  /**
   * Create an application error
   * @param {Object} errorCode - Error code object from errorCodes.js
   * @param {number} statusCode - HTTP status code
   * @param {Object} details - Additional error details (optional)
   */
  constructor(errorCode, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, details = null) {
    super(errorCode.message);
    
    this.name = this.constructor.name;
    this.errorCode = errorCode.code;
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert error to JSON response
   */
  toJSON() {
    return {
      success: false,
      error: {
        code: this.errorCode,
        message: this.message,
        ...(this.details && { details: this.details }),
        timestamp: this.timestamp
      },
      ...(process.env.NODE_ENV === 'development' && { stack: this.stack })
    };
  }
}

module.exports = AppError;





