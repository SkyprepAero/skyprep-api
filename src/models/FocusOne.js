const mongoose = require('mongoose');

const focusOneSchema = new mongoose.Schema({
  description: {
    type: String,
    trim: true
  },
  // Teacher-Subject mapping: which teacher teaches which subject
  teacherSubjectMappings: {
    type: [{
      teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true
      }
    }],
    default: [],
    _id: false
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true // The student enrolled in this Focus One
  },
  enrolledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // Admin who enrolled the student
  },
  enrolledAt: {
    type: Date,
    default: () => new Date()
  },
  startedAt: {
    type: Date,
    default: null // Start date for the enrollment
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'cancelled'],
    default: 'active'
  },
  pausedAt: {
    type: Date,
    default: null
  },
  pausedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  resumedAt: {
    type: Date,
    default: null
  },
  pauseHistory: {
    type: [{
      pausedAt: {
        type: Date,
        required: true
      },
      pausedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      resumedAt: {
        type: Date,
        default: null
      },
      resumedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
      },
      reason: {
        type: String,
        trim: true,
        default: null
      },
      notes: {
        type: String,
        trim: true,
        default: null
      }
    }],
    default: [],
    _id: false
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

focusOneSchema.index({ isActive: 1 });
focusOneSchema.index({ status: 1, isActive: 1 });
focusOneSchema.index({ student: 1 });
focusOneSchema.index({ enrolledBy: 1 });
focusOneSchema.index({ enrolledAt: -1 });
focusOneSchema.index({ 'teacherSubjectMappings.teacher': 1 });
focusOneSchema.index({ 'teacherSubjectMappings.subject': 1 });

// Soft delete middleware
focusOneSchema.pre(/^find/, function focusOneSoftDeleteFilter() {
  // Skip filter if includeDeleted option is set
  if (this.getOptions().includeDeleted) {
    return;
  }
  this.where({ deletedAt: null });
});

// Static method to find deleted records (bypasses soft delete pre-hook)
focusOneSchema.statics.findDeleted = function findDeletedFocusOnes(filter = {}) {
  // Use setOptions to bypass the pre-hook filter
  return this.find({ ...filter, deletedAt: { $ne: null } })
    .setOptions({ includeDeleted: true });
};

// Static method to count deleted records
focusOneSchema.statics.countDeleted = function countDeletedFocusOnes(filter = {}) {
  return this.countDocuments({ ...filter, deletedAt: { $ne: null } });
};

// Soft delete method - uses deletedAt for cancelled status
// Also maintains status field for consistency
focusOneSchema.methods.softDelete = function softDeleteFocusOne(performedBy = null) {
  const wasActive = this.isActive;
  
  this.deletedAt = new Date();
  this.status = 'cancelled';
  this.isActive = false;
  
  // Add to pause history if it was active (paused items already have history)
  if (wasActive && !this.pauseHistory) {
    this.pauseHistory = [];
  }
  if (wasActive) {
    this.pauseHistory.push({
      pausedAt: new Date(),
      pausedBy: performedBy || this.pausedBy || null,
      resumedAt: null,
      resumedBy: null,
      reason: 'Enrollment cancelled',
      notes: 'Focus One program cancelled (soft-deleted).'
    });
  }
  
  return this.save();
};

// Restore method - restores from cancelled (soft delete)
// Also maintains status field for consistency
focusOneSchema.methods.restore = function restoreFocusOne(performedBy = null) {
  this.deletedAt = null;
  this.status = 'active'; // Restore to active status
  this.isActive = true; // Restore to active
  
  // Add a resume entry to the last pause entry if it exists
  const lastPauseEntry = this.pauseHistory.slice().reverse().find(entry => entry.resumedAt === null);
  if (lastPauseEntry) {
    lastPauseEntry.resumedAt = new Date();
    lastPauseEntry.resumedBy = performedBy || null;
  } else {
    // If no previous pause entry, create a new one indicating restoration
    if (!this.pauseHistory) {
      this.pauseHistory = [];
    }
    this.pauseHistory.push({
      pausedAt: new Date(),
      pausedBy: performedBy || null,
      resumedAt: new Date(),
      resumedBy: performedBy || null,
      reason: 'Restored from cancellation',
      notes: 'Focus One program restored and set to active.'
    });
  }
  
  this.pausedAt = null;
  this.pausedBy = null;
  this.resumedAt = new Date();
  
  return this.save();
};

module.exports = mongoose.model('FocusOne', focusOneSchema);

