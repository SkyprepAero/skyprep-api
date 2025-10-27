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
  // Only show non-deleted records
  this.where({ deletedAt: null });
});

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
