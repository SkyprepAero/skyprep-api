const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true
  },
  explanation: {
    type: String,
    trim: true
  },
  chapter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter',
    required: [true, 'Chapter is required']
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  marks: {
    type: Number,
    default: 1
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

// Virtual to populate options
questionSchema.virtual('options', {
  ref: 'Option',
  localField: '_id',
  foreignField: 'question',
  justOne: false
});

// Virtual to get the number of correct options
questionSchema.virtual('correctOptionsCount', {
  ref: 'Option',
  localField: '_id',
  foreignField: 'question',
  count: true,
  match: { isCorrect: true }
});

// Ensure virtual fields are serialized
questionSchema.set('toJSON', { virtuals: true });
questionSchema.set('toObject', { virtuals: true });

// Soft delete middleware
questionSchema.pre(/^find/, function() {
  // Only show non-deleted records
  this.where({ deletedAt: null });
});

// Soft delete method
questionSchema.methods.softDelete = function() {
  this.deletedAt = new Date();
  return this.save();
};

// Restore method
questionSchema.methods.restore = function() {
  this.deletedAt = null;
  return this.save();
};

module.exports = mongoose.model('Question', questionSchema);
