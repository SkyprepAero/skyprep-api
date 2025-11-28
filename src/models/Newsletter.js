const mongoose = require('mongoose');

const newsletterSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ],
    index: true
  },
  name: {
    type: String,
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  status: {
    type: String,
    enum: ['subscribed', 'unsubscribed'],
    default: 'subscribed'
  },
  source: {
    type: String,
    trim: true,
    lowercase: true,
    default: 'website'
  },
  interests: [{
    type: String,
    trim: true
  }],
  topic: {
    type: String,
    trim: true,
    default: 'General'
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    referrer: String
  },
  subscribedAt: {
    type: Date,
    default: Date.now
  },
  unsubscribedAt: {
    type: Date
  },
  lastEmailSent: {
    type: Date
  },
  emailsSent: {
    type: Number,
    default: 0
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String,
    select: false
  }
}, {
  timestamps: true
});

// Index for faster queries
newsletterSchema.index({ status: 1 });
newsletterSchema.index({ createdAt: -1 });

// Method to unsubscribe
newsletterSchema.methods.unsubscribe = function() {
  this.status = 'unsubscribed';
  this.unsubscribedAt = Date.now();
  return this.save();
};

// Method to resubscribe
newsletterSchema.methods.resubscribe = function() {
  this.status = 'subscribed';
  this.unsubscribedAt = null;
  return this.save();
};

// Static method to get subscriber count
newsletterSchema.statics.getSubscriberCount = function() {
  return this.countDocuments({ status: 'subscribed' });
};

// Static method to get recent subscribers
newsletterSchema.statics.getRecentSubscribers = function(limit = 10) {
  return this.find({ status: 'subscribed' })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('email name subscribedAt');
};

module.exports = mongoose.model('Newsletter', newsletterSchema);

