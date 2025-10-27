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
  }
}, {
  timestamps: true
});

// Index for better query performance
questionSchema.index({ chapter: 1 });
questionSchema.index({ difficulty: 1 });
questionSchema.index({ isActive: 1 });

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

module.exports = mongoose.model('Question', questionSchema);
