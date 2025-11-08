const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Subject name is required'],
    trim: true,
    unique: true
  },
  description: {
    type: String,
    trim: true
  },
  defaultMarks: {
    type: Number,
    default: 0,
    min: [0, 'Default marks cannot be negative']
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
subjectSchema.pre(/^find/, function() {
  // Only show non-deleted records by default
  this.where({ deletedAt: null });
});

// Static method to find deleted records (bypasses middleware)
subjectSchema.statics.findDeleted = function(filter = {}) {
  return this.find({ ...filter, deletedAt: { $ne: null } }).where({ deletedAt: { $ne: null } });
};

// Static method to count deleted records (bypasses middleware)
subjectSchema.statics.countDeleted = function(filter = {}) {
  return this.countDocuments({ ...filter, deletedAt: { $ne: null } });
};

// Soft delete method
subjectSchema.methods.softDelete = function() {
  this.deletedAt = new Date();
  return this.save();
};

// Restore method
subjectSchema.methods.restore = function() {
  this.deletedAt = null;
  return this.save();
};

module.exports = mongoose.model('Subject', subjectSchema);
