const { Newsletter } = require('../models');
const { asyncHandler } = require('../utils/errorHandler');
const { successResponse } = require('../utils/response');
const { HTTP_STATUS, SUCCESS_MESSAGES } = require('../utils/constants');
const { AppError, ERROR_CODES } = require('../errors');

// @desc    Subscribe to newsletter
// @route   POST /api/v1/newsletter/subscribe
// @access  Public
exports.subscribe = asyncHandler(async (req, res, next) => {
  const { email, name, interests, source } = req.body;
  
  // Get metadata
  const metadata = {
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    referrer: req.get('referer') || req.get('referrer')
  };
  
  // Check if email already exists
  let subscriber = await Newsletter.findOne({ email });
  
  if (subscriber) {
    // If unsubscribed, resubscribe
    if (subscriber.status === 'unsubscribed') {
      await subscriber.resubscribe();
      return successResponse(res, HTTP_STATUS.OK, 'Successfully resubscribed to newsletter!', {
        email: subscriber.email,
        name: subscriber.name,
        status: subscriber.status
      });
    }
    
    // Already subscribed
    return successResponse(res, HTTP_STATUS.OK, 'You are already subscribed to our newsletter!', {
      email: subscriber.email,
      name: subscriber.name,
      status: subscriber.status
    });
  }
  
  // Create new subscriber
  subscriber = await Newsletter.create({
    email,
    name,
    interests,
    source: source || 'website',
    metadata
  });
  
  successResponse(res, HTTP_STATUS.CREATED, 'Successfully subscribed to newsletter! 🎉', {
    email: subscriber.email,
    name: subscriber.name,
    status: subscriber.status,
    subscribedAt: subscriber.subscribedAt
  });
});

// @desc    Unsubscribe from newsletter
// @route   POST /api/v1/newsletter/unsubscribe
// @access  Public
exports.unsubscribe = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  
  const subscriber = await Newsletter.findOne({ email });
  
  if (!subscriber) {
    throw new AppError(
      { code: 'NEWS_2001', message: 'Email not found in our newsletter list' },
      HTTP_STATUS.NOT_FOUND
    );
  }
  
  if (subscriber.status === 'unsubscribed') {
    return successResponse(res, HTTP_STATUS.OK, 'You have already unsubscribed from our newsletter', {
      email: subscriber.email,
      status: subscriber.status
    });
  }
  
  await subscriber.unsubscribe();
  
  successResponse(res, HTTP_STATUS.OK, 'Successfully unsubscribed from newsletter. We\'re sorry to see you go! 😢', {
    email: subscriber.email,
    status: subscriber.status,
    unsubscribedAt: subscriber.unsubscribedAt
  });
});

// @desc    Get subscriber by email
// @route   GET /api/v1/newsletter/:email
// @access  Public (or protect with admin auth)
exports.getSubscriber = asyncHandler(async (req, res, next) => {
  const { email } = req.params;
  
  const subscriber = await Newsletter.findOne({ email });
  
  if (!subscriber) {
    throw new AppError(
      { code: 'NEWS_2001', message: 'Subscriber not found' },
      HTTP_STATUS.NOT_FOUND
    );
  }
  
  successResponse(res, HTTP_STATUS.OK, 'Subscriber retrieved successfully', subscriber);
});

// @desc    Get all subscribers
// @route   GET /api/v1/newsletter
// @access  Private (Admin only)
exports.getAllSubscribers = asyncHandler(async (req, res, next) => {
  const { status, limit = 50, page = 1 } = req.query;
  
  // Build query
  const query = {};
  if (status) {
    query.status = status;
  }
  
  // Calculate pagination
  const skip = (page - 1) * limit;
  
  // Get subscribers
  const subscribers = await Newsletter.find(query)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(skip)
    .select('-verificationToken');
  
  // Get total count
  const total = await Newsletter.countDocuments(query);
  const subscribedCount = await Newsletter.getSubscriberCount();
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    count: subscribers.length,
    total,
    stats: {
      totalSubscribed: subscribedCount,
      totalUnsubscribed: total - subscribedCount
    },
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      hasMore: skip + subscribers.length < total
    },
    data: subscribers
  });
});

// @desc    Get newsletter statistics
// @route   GET /api/v1/newsletter/stats
// @access  Private (Admin only)
exports.getStats = asyncHandler(async (req, res, next) => {
  const totalSubscribers = await Newsletter.countDocuments();
  const activeSubscribers = await Newsletter.getSubscriberCount();
  const unsubscribed = await Newsletter.countDocuments({ status: 'unsubscribed' });
  const recentSubscribers = await Newsletter.getRecentSubscribers(5);
  
  // Get subscribers by source
  const bySource = await Newsletter.aggregate([
    { $match: { status: 'subscribed' } },
    { $group: { _id: '$source', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  
  // Get growth data (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentGrowth = await Newsletter.countDocuments({
    status: 'subscribed',
    subscribedAt: { $gte: sevenDaysAgo }
  });
  
  successResponse(res, HTTP_STATUS.OK, 'Newsletter statistics retrieved successfully', {
    overview: {
      total: totalSubscribers,
      active: activeSubscribers,
      unsubscribed,
      growth7Days: recentGrowth
    },
    bySource,
    recentSubscribers
  });
});

// @desc    Delete subscriber (Admin only)
// @route   DELETE /api/v1/newsletter/:email
// @access  Private (Admin only)
exports.deleteSubscriber = asyncHandler(async (req, res, next) => {
  const { email } = req.params;
  
  const subscriber = await Newsletter.findOneAndDelete({ email });
  
  if (!subscriber) {
    throw new AppError(
      { code: 'NEWS_2001', message: 'Subscriber not found' },
      HTTP_STATUS.NOT_FOUND
    );
  }
  
  successResponse(res, HTTP_STATUS.OK, 'Subscriber deleted successfully', {});
});





