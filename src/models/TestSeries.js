const mongoose = require('mongoose');

const testSeriesSubjectSchema = new mongoose.Schema({
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    min: [0, 'Order cannot be negative'],
    default: 0
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { _id: false });

const testSeriesSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Test series name is required'],
    trim: true
  },
  slug: {
    type: String,
    required: [true, 'Test series slug is required'],
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
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  availabilityWindow: {
    opensAt: {
      type: Date,
      default: null
    },
    closesAt: {
      type: Date,
      default: null
    }
  },
  subjects: {
    type: [testSeriesSubjectSchema],
    default: []
  },
  settings: {
    maxAttemptsPerTest: {
      type: Number,
      min: [0, 'Max attempts cannot be negative'],
      default: 1
    },
    totalDurationMinutes: {
      type: Number,
      min: [0, 'Duration cannot be negative'],
      default: null
    },
    gradingPolicy: {
      type: String,
      trim: true,
      default: null
    }
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

testSeriesSchema.index({ course: 1, status: 1 });
testSeriesSchema.index({ isActive: 1 });

testSeriesSchema.pre('save', async function validateCourseType(next) {
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
      return next(new Error('Test series must reference a course with type "test_series"'));
    }

    return next();
  } catch (error) {
    return next(error);
  }
});

testSeriesSchema.pre(/^find/, function testSeriesSoftDeleteFilter() {
  this.where({ deletedAt: null });
});

testSeriesSchema.statics.findDeleted = function findDeletedTestSeries(filter = {}) {
  return this.find({ ...filter, deletedAt: { $ne: null } }).where({ deletedAt: { $ne: null } });
};

testSeriesSchema.statics.countDeleted = function countDeletedTestSeries(filter = {}) {
  return this.countDocuments({ ...filter, deletedAt: { $ne: null } });
};

testSeriesSchema.methods.softDelete = function softDeleteTestSeries() {
  this.deletedAt = new Date();
  return this.save();
};

testSeriesSchema.methods.restore = function restoreTestSeries() {
  this.deletedAt = null;
  return this.save();
};

module.exports = mongoose.model('TestSeries', testSeriesSchema);

