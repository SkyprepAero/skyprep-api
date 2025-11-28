const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true,
    default: null
  },
  topic: {
    type: String,
    trim: true,
    default: 'General'
  },
  message: {
    type: String
  },
  source: {
    type: String,
    trim: true,
    lowercase: true,
    default: 'unknown'
  },
  status: {
    type: String,
    default: 'new'
  },
  notes: {
    type: String,
    default: null
  },
  submittedAt: {
    type: Date,
    default: () => new Date()
  },
  clientTimestamp: {
    type: Date,
    default: null
  },
  metadata: {
    referrer: {
      type: String,
      default: null
    },
    userAgent: {
      type: String,
      default: null
    },
    ipAddress: {
      type: String,
      default: null
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Lead', leadSchema);


