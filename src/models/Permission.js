const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Permission name is required'],
    unique: true,
    trim: true,
    lowercase: true,
    index: true
  },
  displayName: {
    type: String,
    required: [true, 'Display name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['user', 'role', 'permission', 'course', 'student', 'teacher', 'newsletter', 'system'],
    default: 'system'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster lookups
permissionSchema.index({ category: 1 });
permissionSchema.index({ isActive: 1 });

// Static method to check if permission exists
permissionSchema.statics.exists = async function(permissionName) {
  const count = await this.countDocuments({ name: permissionName, isActive: true });
  return count > 0;
};

// Static method to get permissions by category
permissionSchema.statics.getByCategory = function(category) {
  return this.find({ category, isActive: true }).sort({ name: 1 });
};

module.exports = mongoose.model('Permission', permissionSchema);

