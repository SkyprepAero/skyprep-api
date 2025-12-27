const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const enrollmentStatusEnum = ['pending', 'active', 'completed', 'withdrawn', 'cancelled'];

const focusOneEnrollmentSchema = new mongoose.Schema({
  focusOne: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FocusOne',
    required: true
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
  status: {
    type: String,
    enum: enrollmentStatusEnum,
    default: 'active'
  },
  enrolledAt: {
    type: Date,
    default: () => new Date()
  },
  startedAt: {
    type: Date,
    default: null
  },
  endedAt: {
    type: Date,
    default: null
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { _id: false });

const cohortEnrollmentSchema = new mongoose.Schema({
  cohort: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cohort',
    required: true
  },
  status: {
    type: String,
    enum: enrollmentStatusEnum,
    default: 'active'
  },
  enrolledAt: {
    type: Date,
    default: () => new Date()
  },
  startedAt: {
    type: Date,
    default: null
  },
  endedAt: {
    type: Date,
    default: null
  },
  joinedViaWaitlist: {
    type: Boolean,
    default: false
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false,
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  phoneNumber: {
    type: String,
    required: false,
    trim: true,
    maxlength: [15, 'Phone number cannot be more than 15 characters']
  },
  city: {
    type: String,
    trim: true,
    maxlength: [50, 'City cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  roles: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role'
    }],
    default: []
  },
  primaryRole: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  focusOneEnrollment: {
    type: focusOneEnrollmentSchema,
    default: null
  },
  cohortEnrollment: {
    type: cohortEnrollmentSchema,
    default: null
  },
  testSeriesEnrollments: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserTestSeries'
    }],
    default: []
  },
  lastLoginAt: {
    type: Date,
    default: null
  },
  lastLoginIp: {
    type: String,
    default: null
  },
  lastLoginUserAgent: {
    type: String,
    default: null
  },
  sessionNonce: {
    type: String,
    default: null
  },
  sessionIssuedAt: {
    type: Date,
    default: null
  },
  passwordResetNonce: {
    type: String,
    default: null
  },
  passwordResetIssuedAt: {
    type: Date,
    default: null
  },
  // Google OAuth tokens for Calendar/Meet access
  googleRefreshToken: {
    type: String,
    default: null,
    select: false // Don't include in queries by default for security
  },
  googleAccessToken: {
    type: String,
    default: null,
    select: false
  },
  googleTokenExpiry: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // User can have EITHER Focus One OR Cohort (mutually exclusive)
  if (this.focusOneEnrollment && this.cohortEnrollment) {
    return next(new Error('User cannot have both focus one and cohort enrollments simultaneously'));
  }
  
  // Test Series enrollments can coexist with Focus One or Cohort
  // No validation needed for testSeriesEnrollments as they are independent

  if (this.isModified('focusOneEnrollment') && this.focusOneEnrollment) {
    try {
      const FocusOne = mongoose.model('FocusOne');
      const focusOne = await FocusOne.findById(this.focusOneEnrollment.focusOne);

      if (!focusOne) {
        return next(new Error('Invalid focus one reference'));
      }
    } catch (error) {
      return next(error);
    }
  }

  if (this.isModified('cohortEnrollment') && this.cohortEnrollment) {
    try {
      const Cohort = mongoose.model('Cohort');
      const cohort = await Cohort.findById(this.cohortEnrollment.cohort);

      if (!cohort) {
        return next(new Error('Invalid cohort reference'));
      }
    } catch (error) {
      return next(error);
    }
  }

  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Update updatedAt on save
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to check if user has a specific role (by name or ID)
userSchema.methods.hasRole = async function(roleIdentifier) {
  await this.populate('roles');
  return this.roles.some(role => 
    role.name === roleIdentifier || role._id.toString() === roleIdentifier.toString()
  );
};

// Method to check if user has any of the specified roles
userSchema.methods.hasAnyRole = async function(...roleIdentifiers) {
  await this.populate('roles');
  return this.roles.some(role =>
    roleIdentifiers.includes(role.name) || 
    roleIdentifiers.some(id => role._id.toString() === id.toString())
  );
};

// Method to check if user has all specified roles
userSchema.methods.hasAllRoles = async function(...roleIdentifiers) {
  await this.populate('roles');
  return roleIdentifiers.every(identifier =>
    this.roles.some(role => 
      role.name === identifier || role._id.toString() === identifier.toString()
    )
  );
};

// Method to check if user has a specific permission
userSchema.methods.hasPermission = async function(permissionName) {
  await this.populate({
    path: 'roles',
    populate: { path: 'permissions' }
  });
  
  return this.roles.some(role =>
    role.permissions && role.permissions.some(p => p.name === permissionName)
  );
};

// Method to get all user permissions
userSchema.methods.getAllPermissions = async function() {
  await this.populate({
    path: 'roles',
    populate: { path: 'permissions' }
  });
  
  const permissionsSet = new Set();
  this.roles.forEach(role => {
    if (role.permissions) {
      role.permissions.forEach(p => permissionsSet.add(p.name));
    }
  });
  
  return Array.from(permissionsSet);
};

// Method to add a role
userSchema.methods.addRole = async function(roleId) {
  const roleIdStr = roleId.toString();
  if (!this.roles.some(r => r.toString() === roleIdStr)) {
    this.roles.push(roleId);
    await this.save();
  }
  return this;
};

// Method to remove a role
userSchema.methods.removeRole = async function(roleId) {
  const roleIdStr = roleId.toString();
  this.roles = this.roles.filter(r => r.toString() !== roleIdStr);
  
  // Ensure at least one role remains
  if (this.roles.length === 0) {
    const Role = mongoose.model('Role');
    const defaultRole = await Role.findOne({ name: 'user' });
    if (defaultRole) {
      this.roles.push(defaultRole._id);
    }
  }
  
  // Update primary role if removed
  if (this.primaryRole && this.primaryRole.toString() === roleIdStr) {
    this.primaryRole = this.roles[0];
  }
  
  await this.save();
  return this;
};

// Method to get highest role
userSchema.methods.getHighestRole = async function() {
  await this.populate('roles');
  
  let highest = null;
  let highestLevel = 0;
  
  this.roles.forEach(role => {
    if (role.level > highestLevel) {
      highestLevel = role.level;
      highest = role;
    }
  });
  
  return highest;
};

// Method to check if user can access another user
userSchema.methods.canAccessUser = async function(targetUserId) {
  // Super admins can access anyone
  if (await this.hasRole('super-admin')) return true;
  
  // Users can access themselves
  if (this._id.toString() === targetUserId.toString()) return true;
  
  return false;
};

module.exports = mongoose.model('User', userSchema);

