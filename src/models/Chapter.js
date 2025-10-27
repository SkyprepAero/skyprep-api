const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Chapter name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject is required']
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes removed for now

// Soft delete middleware
chapterSchema.pre(/^find/, function() {
  // Only show non-deleted records
  this.where({ deletedAt: null });
});

// Soft delete method
chapterSchema.methods.softDelete = function() {
  this.deletedAt = new Date();
  return this.save();
};

// Restore method
chapterSchema.methods.restore = function() {
  this.deletedAt = null;
  return this.save();
};

module.exports = mongoose.model('Chapter', chapterSchema);
