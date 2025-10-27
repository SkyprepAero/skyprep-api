const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Role name is required'],
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
  level: {
    type: Number,
    required: [true, 'Role level is required'],
    min: 1,
    max: 10,
    default: 1
  },
  permissions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Permission'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isSystem: {
    type: Boolean,
    default: false // System roles cannot be deleted
  }
}, {
  timestamps: true
});

// Index for faster lookups
roleSchema.index({ level: -1 });
roleSchema.index({ isActive: 1 });

// Method to add permission
roleSchema.methods.addPermission = async function(permissionId) {
  if (!this.permissions.includes(permissionId)) {
    this.permissions.push(permissionId);
    await this.save();
  }
  return this;
};

// Method to remove permission
roleSchema.methods.removePermission = async function(permissionId) {
  this.permissions = this.permissions.filter(
    p => p.toString() !== permissionId.toString()
  );
  await this.save();
  return this;
};

// Method to check if role has permission
roleSchema.methods.hasPermission = function(permissionId) {
  return this.permissions.some(p => p.toString() === permissionId.toString());
};

// Static method to get role with permissions
roleSchema.statics.findByNameWithPermissions = function(name) {
  return this.findOne({ name, isActive: true }).populate('permissions');
};

// Static method to get all active roles with permissions
roleSchema.statics.getAllWithPermissions = function() {
  return this.find({ isActive: true })
    .populate('permissions')
    .sort({ level: -1 });
};

module.exports = mongoose.model('Role', roleSchema);

