const mongoose = require('mongoose');

const COURSE_TYPES = ['focus_one', 'cohort', 'test_series'];

const subjectAssignmentSchema = new mongoose.Schema({
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  cost: {
    type: Number,
    min: [0, 'Subject cost cannot be negative'],
    required: true
  },
  isPrimary: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { _id: false });

const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Course name is required'],
    trim: true
  },
  slug: {
    type: String,
    required: [true, 'Course slug is required'],
    trim: true,
    lowercase: true,
    unique: true
  },
  type: {
    type: String,
    enum: COURSE_TYPES,
    required: [true, 'Course type is required'],
    index: true
  },
  description: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  subjects: {
    type: [subjectAssignmentSchema],
    default: []
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  enrollmentConfig: {
    maxSeats: {
      type: Number,
      min: [0, 'Maximum seats cannot be negative'],
      default: null
    },
    allowWaitlist: {
      type: Boolean,
      default: false
    },
    autoApproveEnrollments: {
      type: Boolean,
      default: true
    }
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

courseSchema.index({ type: 1, isActive: 1 });

courseSchema.pre(/^find/, function courseSoftDeleteFilter() {
  this.where({ deletedAt: null });
});

courseSchema.statics.findDeleted = function findDeletedCourses(filter = {}) {
  return this.find({ ...filter, deletedAt: { $ne: null } }).where({ deletedAt: { $ne: null } });
};

courseSchema.statics.countDeleted = function countDeletedCourses(filter = {}) {
  return this.countDocuments({ ...filter, deletedAt: { $ne: null } });
};

courseSchema.methods.softDelete = function softDeleteCourse() {
  this.deletedAt = new Date();
  return this.save();
};

courseSchema.methods.restore = function restoreCourse() {
  this.deletedAt = null;
  return this.save();
};

module.exports = mongoose.model('Course', courseSchema);

