const mongoose = require('mongoose');

const publicHolidaySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Holiday name is required'],
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'Holiday date is required'],
    unique: true
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for date lookups
publicHolidaySchema.index({ date: 1 });
publicHolidaySchema.index({ isActive: 1, date: 1 });

// Ensure date is stored as date only (no time component)
publicHolidaySchema.pre('save', function(next) {
  if (this.date) {
    const dateOnly = new Date(this.date);
    dateOnly.setHours(0, 0, 0, 0);
    this.date = dateOnly;
  }
  next();
});

// Static method to check if a date is a public holiday
publicHolidaySchema.statics.isPublicHoliday = async function(date) {
  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(dateOnly);
  endOfDay.setHours(23, 59, 59, 999);
  
  const holiday = await this.findOne({
    date: { $gte: dateOnly, $lte: endOfDay },
    isActive: true
  });
  
  return !!holiday;
};

// Static method to get all active public holidays in a date range
publicHolidaySchema.statics.getPublicHolidaysInRange = async function(startDate, endDate) {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  
  return this.find({
    date: { $gte: start, $lte: end },
    isActive: true
  }).sort({ date: 1 });
};

module.exports = mongoose.model('PublicHoliday', publicHolidaySchema);

