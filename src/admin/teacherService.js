const { User, Role } = require('../models');
const { AppError, ERROR_CODES } = require('../errors');
const { HTTP_STATUS } = require('../utils/constants');
const { randomBytes } = require('crypto');
const { sendEmail } = require('../services/emailService');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../config/jwt');

/**
 * Generate password setup token for new user
 */
const generatePasswordSetupToken = async (user) => {
  const setupNonce = randomBytes(32).toString('hex');
  const issuedAt = new Date();

  user.passwordResetNonce = setupNonce;
  user.passwordResetIssuedAt = issuedAt;
  await user.save({ validateBeforeSave: false });

  // Password setup token expires in 7 days
  const expiresIn = '7d';

  const token = generateToken(
    {
      type: 'password_setup',
      userId: user._id,
      email: user.email,
      resetNonce: setupNonce
    },
    expiresIn
  );

  const expiresAt = new Date(issuedAt.getTime() + 7 * 24 * 60 * 60 * 1000);

  return {
    token,
    expiresAt,
    setupNonce
  };
};

/**
 * Register a teacher
 * Creates user account with teacher role and sends password setup email
 */
const registerTeacher = async ({
  email,
  name = null, // Optional, can be set later
  phoneNumber = null, // Optional
  city = null, // Optional
  metadata = {},
  registeredBy = null // Admin user ID who registered the teacher (null if self-registration)
}) => {
  // Check if user already exists
  let user = await User.findOne({ email: email.toLowerCase().trim() });

  if (user) {
    // Check if user already has teacher role
    await user.populate('roles');
    const hasTeacherRole = user.roles.some(role => role.name === 'teacher');
    
    if (hasTeacherRole) {
      throw new AppError(
        ERROR_CODES.USER.ALREADY_EXISTS,
        HTTP_STATUS.BAD_REQUEST,
        { message: 'User with this email already has teacher role' }
      );
    }

    // User exists but doesn't have teacher role - add teacher role
    const teacherRole = await Role.findOne({ name: 'teacher', isActive: true });

    if (!teacherRole) {
      throw new AppError(
        ERROR_CODES.VALIDATION.INVALID_ROLE,
        HTTP_STATUS.BAD_REQUEST,
        { message: 'Teacher role is not configured or inactive' }
      );
    }

    // Add teacher role to existing user
    if (!user.roles.some(roleId => roleId.toString() === teacherRole._id.toString())) {
      user.roles.push(teacherRole._id);
      
      // Set as primary role if user doesn't have one
      if (!user.primaryRole) {
        user.primaryRole = teacherRole._id;
      }
      
      await user.save({ validateBeforeSave: false });
    }
  } else {
    // Create new user with teacher role
    const teacherRole = await Role.findOne({ name: 'teacher', isActive: true });

    if (!teacherRole) {
      throw new AppError(
        ERROR_CODES.VALIDATION.INVALID_ROLE,
        HTTP_STATUS.BAD_REQUEST,
        { message: 'Teacher role is not configured or inactive' }
      );
    }

    // Generate temporary password (will be replaced when user sets their password)
    const tempPassword = randomBytes(16).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Create user with temporary password
    user = await User.create({
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      name: name || null,
      phoneNumber: phoneNumber || null,
      city: city || null,
      roles: [teacherRole._id],
      primaryRole: teacherRole._id,
      isActive: true
    });
  }

  // Send password setup email
  const tokenInfo = await generatePasswordSetupToken(user);

  // Get frontend URL from environment (prefer classroom URL, fallback to admin)
  const frontendUrl = process.env.CLASSROOM_FRONTEND_URL || process.env.ADMIN_FRONTEND_URL || 'http://localhost:5173';
  const setupUrl = `${frontendUrl}/auth/setup-password?token=${tokenInfo.token}`;

  // Send password setup email
  await sendEmail({
    to: user.email,
    subject: 'Welcome to SkyPrep - Set Your Teacher Password',
    template: 'teacher/password-setup',
    context: {
      name: user.name || 'Teacher',
      setupUrl,
      expiresAt: tokenInfo.expiresAt.toISOString(),
      expiresInDays: 7
    }
  });

  // Populate user for response
  await user.populate({
    path: 'roles',
    populate: { path: 'permissions' }
  });
  await user.populate('primaryRole');

  return {
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      phoneNumber: user.phoneNumber,
      city: user.city,
      roles: user.roles.map(role => ({
        id: role._id,
        name: role.name,
        displayName: role.displayName
      })),
      primaryRole: user.primaryRole ? {
        id: user.primaryRole._id,
        name: user.primaryRole.name,
        displayName: user.primaryRole.displayName
      } : null,
      isActive: user.isActive
    },
    registeredBy,
    passwordSetupEmailSent: true
  };
};

module.exports = {
  registerTeacher
};

