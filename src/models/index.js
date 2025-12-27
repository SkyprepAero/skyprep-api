/**
 * Centralized Model Exports
 * Import all models from one place for consistency
 */

const User = require('./User');
const Newsletter = require('./Newsletter');
const Role = require('./Role');
const Permission = require('./Permission');
const Subject = require('./Subject');
const Chapter = require('./Chapter');
const Question = require('./Question');
const Option = require('./Option');
const FocusOne = require('./FocusOne');
const Cohort = require('./Cohort');
const TestSeries = require('./TestSeries');
const UserTestSeries = require('./UserTestSeries');
const Book = require('./Book');
const EmailPasscode = require('./EmailPasscode');
const Lead = require('./Lead');
const Session = require('./Session');
const PublicHoliday = require('./PublicHoliday');

// Export all models
module.exports = {
  User,
  Newsletter,
  Role,
  Permission,
  Subject,
  Chapter,
  Question,
  Option,
  FocusOne,
  Cohort,
  TestSeries,
  UserTestSeries,
  Book,
  EmailPasscode,
  Lead,
  Session,
  PublicHoliday
};

// Alternative: You can also use individual exports
// This allows: const { User, Newsletter, Role, Permission } = require('../models');

