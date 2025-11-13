const mongoose = require('mongoose');

const cohortSubjectSchema = new mongoose.Schema({
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { _id: false });

const cohortSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Cohort name is required'],
    trim: true
  },
  slug: {
    type: String,
    required: [true, 'Cohort slug is required'],
    trim: true,
    lowercase: true,
    unique: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Base course reference is required']
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['planned', 'active', 'completed', 'cancelled'],
    default: 'planned'
  },
  startDate: {
    type: Date,
    default: null
  },
  endDate: {
    type: Date,
    default: null
  },
  enrollmentWindow: {
    opensAt: {
      type: Date,
      default: null
    },
    closesAt: {
      type: Date,
      default: null
    }
  },
  capacity: {
    type: Number,
    min: [0, 'Capacity cannot be negative'],
    default: null
  },
  waitlistEnabled: {
    type: Boolean,
    default: false
  },
  subjects: {
    type: [cohortSubjectSchema],
    default: []
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
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

cohortSchema.index({ course: 1, status: 1 });
cohortSchema.index({ isActive: 1 });

cohortSchema.pre('save', async function validateCourseType(next) {
  if (!this.isModified('course')) {
    return next();
  }

  try {
    const Course = mongoose.model('Course');
    const course = await Course.findById(this.course);

    if (!course) {
      return next(new Error('Referenced course does not exist'));
    }

    if (course.type !== 'cohort') {
      return next(new Error('Cohort must reference a course with type "cohort"'));
    }

    return next();
  } catch (error) {
    return next(error);
  }
});

cohortSchema.pre(/^find/, function cohortSoftDeleteFilter() {
  this.where({ deletedAt: null });
});

cohortSchema.statics.findDeleted = function findDeletedCohorts(filter = {}) {
  return this.find({ ...filter, deletedAt: { $ne: null } }).where({ deletedAt: { $ne: null } });
};

cohortSchema.statics.countDeleted = function countDeletedCohorts(filter = {}) {
  return this.countDocuments({ ...filter, deletedAt: { $ne: null } });
};

cohortSchema.methods.softDelete = function softDeleteCohort() {
  this.deletedAt = new Date();
  return this.save();
};

cohortSchema.methods.restore = function restoreCohort() {
  this.deletedAt = null;
  return this.save();
};

module.exports = mongoose.model('Cohort', cohortSchema);

