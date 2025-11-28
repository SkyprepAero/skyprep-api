const { asyncHandler } = require('../utils/errorHandler');
const { successResponse } = require('../utils/response');
const { HTTP_STATUS } = require('../utils/constants');
const leadService = require('../services/leadService');

const extractClientContext = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  let ipAddress = null;

  if (typeof forwarded === 'string' && forwarded.length > 0) {
    ipAddress = forwarded.split(',')[0].trim();
  } else if (Array.isArray(forwarded) && forwarded.length > 0) {
    ipAddress = String(forwarded[0]).trim();
  }

  if (!ipAddress || ipAddress === '::1') {
    ipAddress = req.ip;
  }

  return {
    ipAddress,
    userAgent: req.get('user-agent') || null,
    referrer: req.get('referer') || req.get('referrer') || null
  };
};

// @desc    Submit lead
// @route   POST /api/v1/leads
// @access  Public
exports.createLead = asyncHandler(async (req, res) => {
  const client = extractClientContext(req);
  const lead = await leadService.createLead({
    ...req.body,
    ipAddress: client.ipAddress,
    userAgent: client.userAgent,
    referrer: req.body.referrer || client.referrer
  });

  successResponse(res, HTTP_STATUS.OK, 'Lead submitted successfully', {
    submissionId: lead._id,
    timestamp: lead.createdAt
  });
});


