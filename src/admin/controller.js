const { asyncHandler } = require('../utils/errorHandler');
const { successResponse } = require('../utils/response');
const { HTTP_STATUS, SUCCESS_MESSAGES } = require('../utils/constants');
const adminService = require('./service');

// @desc    Register admin user
// @route   POST /api/v1/auth/admin/register
// @access  Public
exports.registerAdmin = asyncHandler(async (req, res, next) => {
  const { name, email, password, phoneNumber, city } = req.body;
  const result = await adminService.registerAdmin({ name, email, password, phoneNumber, city });
  successResponse(res, HTTP_STATUS.CREATED, SUCCESS_MESSAGES.USER_REGISTERED, result);
});

