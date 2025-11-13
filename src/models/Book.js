const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject reference is required'],
    index: true
  },
  name: {
    type: String,
    required: [true, 'Book name is required'],
    trim: true
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

bookSchema.pre(/^find/, function bookSoftDeleteFilter() {
  this.where({ deletedAt: null });
});

bookSchema.statics.findDeleted = function findDeletedBooks(filter = {}) {
  return this.find({ ...filter, deletedAt: { $ne: null } }).where({ deletedAt: { $ne: null } });
};

bookSchema.statics.countDeleted = function countDeletedBooks(filter = {}) {
  return this.countDocuments({ ...filter, deletedAt: { $ne: null } });
};

bookSchema.methods.softDelete = function softDeleteBook() {
  this.deletedAt = new Date();
  return this.save();
};

bookSchema.methods.restore = function restoreBook() {
  this.deletedAt = null;
  return this.save();
};

module.exports = mongoose.model('Book', bookSchema);

