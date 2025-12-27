const { User, Role } = require('../models');
const { generateToken } = require('../config/jwt');
const { AppError, ERROR_CODES } = require('../errors');
const { HTTP_STATUS } = require('../utils/constants');
const { randomBytes } = require('crypto');

const parseExpiryToMs = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value * 1000;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (trimmed === '') {
    return null;
  }

  // pure numeric string -> seconds
  if (/^\d+$/.test(trimmed)) {
    return parseInt(trimmed, 10) * 1000;
  }

  const match = /^(\d+(?:\.\d+)?)([smhdw])$/i.exec(trimmed);
  if (!match) {
    return null;
  }

  const amount = parseFloat(match[1]);
  const unit = match[2].toLowerCase();

  const unitToMs = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000
  };

  return amount * unitToMs[unit];
};

const calculateTokenExpiry = (expiresInOverride = null) => {
  const defaultJwtExpire = process.env.JWT_EXPIRE;
  const ttlMs = parseExpiryToMs(expiresInOverride || defaultJwtExpire);
  if (!ttlMs) {
    return null;
  }
  return new Date(Date.now() + ttlMs).toISOString();
};

const populateUserForAuth = async (user) => {
  await user.populate({
    path: 'roles',
    populate: { path: 'permissions' }
  });
  await user.populate('primaryRole');
  return user;
};

const mapRole = (role) => {
  return {
    id: role._id,
    name: role.name,
    displayName: role.displayName
  };
};

const buildUserProfile = (user) => {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    roles: (user.roles || []).map(role => mapRole(role)),
    primaryRole: user.primaryRole
      ? {
          id: user.primaryRole._id,
          name: user.primaryRole.name,
          displayName: user.primaryRole.displayName
        }
      : null
  };
};

const issueNewSession = async ({
  user,
  allPermissions = [],
  ipAddress = null,
  userAgent = null
}) => {
  const sessionNonce = randomBytes(32).toString('hex');
  const issuedAt = new Date();

  user.sessionNonce = sessionNonce;
  user.sessionIssuedAt = issuedAt;
  user.lastLoginAt = issuedAt;

  if (ipAddress) {
    user.lastLoginIp = ipAddress;
  }

  if (userAgent) {
    user.lastLoginUserAgent = userAgent;
  }

  await user.save({ validateBeforeSave: false });

  const tokenPayload = {
    id: user._id,
    sessionNonce,
    roles: user.roles.map(r => r.name),
    primaryRole: user.primaryRole?.name
  };

  if (Array.isArray(allPermissions) && allPermissions.length > 0) {
    tokenPayload.permissions = allPermissions;
  }

  const token = generateToken(tokenPayload);

  return {
    token,
    tokenExpiresAt: calculateTokenExpiry(),
    sessionNonce,
    issuedAt
  };
};

const registerAdmin = async ({ name, email, password, phoneNumber, city }) => {
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new AppError(ERROR_CODES.USER.ALREADY_EXISTS, HTTP_STATUS.BAD_REQUEST);
  }

  // Find admin role
  const adminRole = await Role.findOne({ name: 'admin', isActive: true });

  if (!adminRole) {
    throw new AppError(
      ERROR_CODES.VALIDATION.INVALID_ROLE,
      HTTP_STATUS.BAD_REQUEST,
      { message: 'Admin role is not configured or inactive' }
    );
  }

  // Build user payload - phoneNumber is optional
  const userPayload = {
    name,
    email,
    password,
    roles: [adminRole._id],
    primaryRole: adminRole._id
  };

  // Only add phoneNumber if provided
  if (phoneNumber) {
    userPayload.phoneNumber = phoneNumber;
  }

  // Add city if provided
  if (city) {
    userPayload.city = city;
  }

  // Create the user
  const user = await User.create(userPayload);

  // Populate user with roles and permissions before calling getAllPermissions
  await user.populate({
    path: 'roles',
    populate: { path: 'permissions' }
  });
  await user.populate('primaryRole');
  
  // Get all permissions for the user
  const allPermissions = await user.getAllPermissions();
  
  // Issue new session
  const session = await issueNewSession({ user, allPermissions });

  return {
    user: buildUserProfile(user),
    token: session.token,
    tokenExpiresAt: session.tokenExpiresAt
  };
};

module.exports = {
  registerAdmin
};

