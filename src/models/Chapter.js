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
  }
}, {
  timestamps: true
});

// Index for better query performance
chapterSchema.index({ subject: 1 });
chapterSchema.index({ name: 1 });
chapterSchema.index({ isActive: 1 });

// Ensure unique chapter name within a subject
chapterSchema.index({ subject: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Chapter', chapterSchema);
