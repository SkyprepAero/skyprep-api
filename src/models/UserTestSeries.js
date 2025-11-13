const mongoose = require('mongoose');

const testSeriesSubjectSchema = new mongoose.Schema({
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
  attemptsAllowed: {
    type: Number,
    min: [0, 'Attempts allowed cannot be negative'],
    default: null
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { _id: false });

const userTestSeriesSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'paused', 'cancelled'],
    default: 'active'
  },
  enrolledAt: {
    type: Date,
    default: () => new Date()
  },
  activatedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  expiresAt: {
    type: Date,
    default: null
  },
  subjects: {
    type: [testSeriesSubjectSchema],
    default: []
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  billing: {
    totalCost: {
      type: Number,
      min: [0, 'Total cost cannot be negative'],
      default: null
    },
    currency: {
      type: String,
      trim: true,
      uppercase: true,
      default: 'INR'
    },
    paymentReference: {
      type: String,
      trim: true,
      default: null
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

userTestSeriesSchema.index({ user: 1, course: 1, isActive: 1 });

userTestSeriesSchema.pre('save', async function validateCourseType(next) {
  if (!this.isModified('course')) {
    return next();
  }

  try {
    const Course = mongoose.model('Course');
    const course = await Course.findById(this.course);

    if (!course) {
      return next(new Error('Referenced course does not exist'));
    }

    if (course.type !== 'test_series') {
      return next(new Error('User test series must reference a course with type "test_series"'));
    }

    return next();
  } catch (error) {
    return next(error);
  }
});

userTestSeriesSchema.pre(/^find/, function userTestSeriesSoftDeleteFilter() {
  this.where({ deletedAt: null });
});

userTestSeriesSchema.statics.findDeleted = function findDeletedUserTestSeries(filter = {}) {
  return this.find({ ...filter, deletedAt: { $ne: null } }).where({ deletedAt: { $ne: null } });
};

userTestSeriesSchema.statics.countDeleted = function countDeletedUserTestSeries(filter = {}) {
  return this.countDocuments({ ...filter, deletedAt: { $ne: null } });
};

userTestSeriesSchema.methods.softDelete = function softDeleteUserTestSeries() {
  this.deletedAt = new Date();
  return this.save();
};

userTestSeriesSchema.methods.restore = function restoreUserTestSeries() {
  this.deletedAt = null;
  return this.save();
};

module.exports = mongoose.model('UserTestSeries', userTestSeriesSchema);

