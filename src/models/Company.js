const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Company email is required'],
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  phone: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  logo: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  industry: {
    type: String,
    enum: ['education', 'technology', 'healthcare', 'finance', 'retail', 'manufacturing', 'other'],
    default: 'education'
  },
  size: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'],
    default: '1-10'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'trial'],
    default: 'trial'
  },
  plan: {
    type: String,
    enum: ['free', 'basic', 'premium', 'enterprise'],
    default: 'free'
  },
  settings: {
    allowSelfRegistration: {
      type: Boolean,
      default: false
    },
    requireEmailVerification: {
      type: Boolean,
      default: true
    },
    maxUsers: {
      type: Number,
      default: 10
    },
    features: {
      type: [String],
      default: []
    }
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  subscription: {
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: Date,
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly'
    },
    autoRenew: {
      type: Boolean,
      default: true
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster searches
companySchema.index({ name: 1 });
companySchema.index({ status: 1 });
companySchema.index({ owner: 1 });

// Generate slug before saving
companySchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
  next();
});

// Method to check if company is active
companySchema.methods.isCompanyActive = function() {
  return this.isActive && this.status === 'active';
};

// Method to check if user limit reached
companySchema.methods.canAddUser = async function() {
  const User = mongoose.model('User');
  const userCount = await User.countDocuments({ company: this._id, isActive: true });
  return userCount < this.settings.maxUsers;
};

// Method to get user count
companySchema.methods.getUserCount = async function() {
  const User = mongoose.model('User');
  return await User.countDocuments({ company: this._id, isActive: true });
};

// Method to add admin
companySchema.methods.addAdmin = async function(userId) {
  if (!this.admins.includes(userId)) {
    this.admins.push(userId);
    await this.save();
  }
  return this;
};

// Method to remove admin
companySchema.methods.removeAdmin = async function(userId) {
  this.admins = this.admins.filter(id => id.toString() !== userId.toString());
  await this.save();
  return this;
};

// Static method to get company with users count
companySchema.statics.getCompaniesWithStats = async function() {
  return await this.aggregate([
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: 'company',
        as: 'users'
      }
    },
    {
      $project: {
        name: 1,
        slug: 1,
        email: 1,
        status: 1,
        plan: 1,
        userCount: { $size: '$users' },
        createdAt: 1
      }
    },
    { $sort: { createdAt: -1 } }
  ]);
};

module.exports = mongoose.model('Company', companySchema);

