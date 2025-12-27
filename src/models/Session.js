const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Session title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  description: {
    type: String,
    trim: true
  },
  startTime: {
    type: Date,
    required: [true, 'Session start time is required']
  },
  endTime: {
    type: Date,
    required: [true, 'Session end time is required']
  },
  // Session can be associated with either FocusOne or Cohort (mutually exclusive)
  focusOne: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FocusOne',
    default: null
  },
  cohort: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cohort',
    default: null
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    default: null
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // Teacher is assigned when request is accepted (or set directly for admin-created sessions)
  },
  meetingLink: {
    type: String,
    trim: true,
    default: null
  },
  meetingPlatform: {
    type: String,
    enum: ['jitsi-meet', null],
    default: 'jitsi-meet'
  },
  status: {
    type: String,
    enum: ['requested', 'accepted', 'rejected', 'scheduled', 'ongoing', 'completed', 'cancelled'],
    default: 'requested'
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // Student who requested this session
  },
  requestedAt: {
    type: Date,
    default: () => new Date()
  },
  acceptedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // Teacher who accepted the request
  },
  acceptedAt: {
    type: Date,
    default: null
  },
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // Teacher who rejected the request
  },
  rejectedAt: {
    type: Date,
    default: null
  },
  rejectionReason: {
    type: String,
    trim: true,
    default: null // Reason provided by teacher when rejecting
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // User who cancelled the session
  },
  cancelledAt: {
    type: Date,
    default: null
  },
  cancellationReason: {
    type: String,
    trim: true,
    default: null // Reason provided when cancelling the session
  },
  history: {
    type: [{
      action: {
        type: String,
        enum: ['requested', 'accepted', 'rejected', 'scheduled', 'cancelled', 'started', 'completed', 'updated'],
        required: true
      },
      performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      performedAt: {
        type: Date,
        default: Date.now
      },
      previousStatus: {
        type: String,
        default: null
      },
      newStatus: {
        type: String,
        default: null
      },
      notes: {
        type: String,
        default: null
      },
      changes: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: {}
      }
    }],
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

// Indexes
sessionSchema.index({ focusOne: 1, isActive: 1 });
sessionSchema.index({ cohort: 1, isActive: 1 });
sessionSchema.index({ teacher: 1 });
sessionSchema.index({ requestedBy: 1 });
sessionSchema.index({ acceptedBy: 1 });
sessionSchema.index({ rejectedBy: 1 });
sessionSchema.index({ cancelledBy: 1 });
sessionSchema.index({ startTime: 1, endTime: 1 });
sessionSchema.index({ status: 1, isActive: 1 });
sessionSchema.index({ isActive: 1 });

// Validation: Must have either focusOne OR cohort, but not both
sessionSchema.pre('validate', function(next) {
  const hasFocusOne = this.focusOne !== null && this.focusOne !== undefined;
  const hasCohort = this.cohort !== null && this.cohort !== undefined;

  if (!hasFocusOne && !hasCohort) {
    return next(new Error('Session must be associated with either a Focus One or Cohort'));
  }

  if (hasFocusOne && hasCohort) {
    return next(new Error('Session cannot be associated with both Focus One and Cohort'));
  }

  // Validate endTime is after startTime
  if (this.endTime && this.startTime && this.endTime <= this.startTime) {
    return next(new Error('Session end time must be after start time'));
  }

  // Validate that requested sessions are at least one day in advance (excluding Sundays) and within 9 AM - 9 PM
  if ((this.status === 'requested' || this.isNew) && this.startTime) {
    const startDate = new Date(this.startTime);
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    const sessionDay = new Date(startDate);
    sessionDay.setHours(0, 0, 0, 0);
    
    // Check if session is on the same day (not allowed - must be at least one day in advance)
    if (sessionDay.getTime() === today.getTime()) {
      return next(new Error('Sessions must be scheduled at least one day in advance'));
    }
    
    // Check if session is in the past
    if (sessionDay < today) {
      return next(new Error('Cannot schedule sessions in the past'));
    }
    
    // Check if session is on Sunday
    if (startDate.getDay() === 0) {
      return next(new Error('Sessions cannot be scheduled on Sundays'));
    }
    
    // Check if start time is between 9 AM and 7:45 PM (75 minutes before 9 PM)
    const startHour = startDate.getHours();
    const startMinute = startDate.getMinutes();
    if (startHour < 9 || (startHour > 19) || (startHour === 19 && startMinute > 45)) {
      return next(new Error('Session start time must be between 9 AM and 7:45 PM'));
    }
    
    // Validate end time if provided
    if (this.endTime) {
      const endDate = new Date(this.endTime);
      const endHour = endDate.getHours();
      
      // Check if end time is within 9 AM to 9 PM
      if (endHour < 9 || endHour > 21) {
        return next(new Error('Session end time must be between 9 AM and 9 PM'));
      }
      
      // If end time is 9 PM, ensure it's exactly 9 PM (not later)
      if (endHour === 21 && endDate.getMinutes() > 0) {
        return next(new Error('Session cannot extend beyond 9 PM'));
      }
    }
  }

  // If status is accepted or scheduled, teacher must be assigned
  if ((this.status === 'accepted' || this.status === 'scheduled') && !this.teacher) {
    return next(new Error('Teacher must be assigned for accepted or scheduled sessions'));
  }

  next();
});

// Soft delete middleware
sessionSchema.pre(/^find/, function sessionSoftDeleteFilter() {
  this.where({ deletedAt: null });
});

// Static method to find deleted records
sessionSchema.statics.findDeleted = function findDeletedSessions(filter = {}) {
  return this.find({ ...filter, deletedAt: { $ne: null } }).where({ deletedAt: { $ne: null } });
};

// Static method to count deleted records
sessionSchema.statics.countDeleted = function countDeletedSessions(filter = {}) {
  return this.countDocuments({ ...filter, deletedAt: { $ne: null } });
};

// Soft delete method
sessionSchema.methods.softDelete = function softDeleteSession() {
  this.deletedAt = new Date();
  return this.save();
};

// Restore method
sessionSchema.methods.restore = function restoreSession() {
  this.deletedAt = null;
  return this.save();
};

module.exports = mongoose.model('Session', sessionSchema);

