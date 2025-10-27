const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Option text is required'],
    trim: true,
    maxlength: [500, 'Option text cannot exceed 500 characters']
  },
  isCorrect: {
    type: Boolean,
    required: [true, 'Option correctness indicator is required'],
    default: false
  },
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: [true, 'Question reference is required']
  },
  order: {
    type: Number,
    default: 0,
    min: 0
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
optionSchema.pre(/^find/, function() {
  // Only show non-deleted records
  this.where({ deletedAt: null });
});

// Soft delete method
optionSchema.methods.softDelete = function() {
  this.deletedAt = new Date();
  return this.save();
};

// Restore method
optionSchema.methods.restore = function() {
  this.deletedAt = null;
  return this.save();
};

module.exports = mongoose.model('Option', optionSchema);
