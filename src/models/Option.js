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
  }
}, {
  timestamps: true
});

// Index for better query performance
optionSchema.index({ question: 1 });
optionSchema.index({ isCorrect: 1 });
optionSchema.index({ isActive: 1 });

// Ensure unique order within a question
optionSchema.index({ question: 1, order: 1 }, { unique: true });

module.exports = mongoose.model('Option', optionSchema);
