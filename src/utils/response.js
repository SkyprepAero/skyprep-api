// Success Response
const successResponse = (res, arg1, arg2, arg3) => {
  let statusCode = 200;
  let message = arg2;
  let data = arg1;

  if (typeof arg1 === 'number') {
    statusCode = arg1;
    message = arg2;
    data = arg3;
  } else if (typeof arg3 === 'number') {
    statusCode = arg3;
  }

  const response = {
    success: true
  };

  if (message !== undefined && message !== null) {
    response.message = message;
  }

  if (data !== undefined && data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

// Error Response
const errorResponse = (res, statusCode, message, errors = null) => {
  const response = {
    success: false,
    message
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

// Paginated Response
const paginatedResponse = (res, statusCode, message, data, pagination) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    pagination
  });
};

module.exports = {
  successResponse,
  errorResponse,
  paginatedResponse
};

