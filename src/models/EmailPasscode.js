const mongoose = require('mongoose');

const PURPOSES = ['registration', 'login', 'password_reset', 'email_update', 'generic'];

const emailPasscodeSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  codeHash: {
    type: String,
    required: true
  },
  purpose: {
    type: String,
    enum: PURPOSES,
    default: 'generic',
    required: true,
    index: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  consumedAt: {
    type: Date,
    default: null
  },
  attemptCount: {
    type: Number,
    default: 0
  },
  maxAttempts: {
    type: Number,
    default: 5
  },
  metadata: {
    type: Map,
    of: String,
    default: {}
  }
}, {
  timestamps: true
});

emailPasscodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
emailPasscodeSchema.index({ email: 1, purpose: 1, consumedAt: 1 });

module.exports = mongoose.model('EmailPasscode', emailPasscodeSchema);


