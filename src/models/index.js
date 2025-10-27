/**
 * Centralized Model Exports
 * Import all models from one place for consistency
 */

const User = require('./User');
const Newsletter = require('./Newsletter');
const Role = require('./Role');
const Permission = require('./Permission');
const Company = require('./Company');
const Subject = require('./Subject');
const Chapter = require('./Chapter');
const Question = require('./Question');
const Option = require('./Option');

// Export all models
module.exports = {
  User,
  Newsletter,
  Role,
  Permission,
  Company,
  Subject,
  Chapter,
  Question,
  Option
};

// Alternative: You can also use individual exports
// This allows: const { User, Newsletter, Role, Permission, Company } = require('../models');

