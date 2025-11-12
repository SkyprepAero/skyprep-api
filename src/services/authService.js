const { randomBytes } = require('crypto');
const mongoose = require('mongoose');
const { OAuth2Client } = require('google-auth-library');
const { User, Role } = require('../models');
const { generateToken } = require('../config/jwt');
const { AppError, ERROR_CODES } = require('../errors');
const { HTTP_STATUS } = require('../utils/constants');

const googleClientId = process.env.GOOGLE_CLIENT_ID;
let googleClient = googleClientId ? new OAuth2Client(googleClientId) : null;
const defaultJwtExpire = process.env.JWT_EXPIRE ;

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
  const ttlMs = parseExpiryToMs(expiresInOverride || defaultJwtExpire);
  if (!ttlMs) {
    return null;
  }
  return new Date(Date.now() + ttlMs).toISOString();
};

const getGoogleClient = () => {
  if (!googleClientId) {
    throw new AppError(ERROR_CODES.AUTH.GOOGLE_CONFIG_MISSING, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }

  if (!googleClient) {
    googleClient = new OAuth2Client(googleClientId);
  }

  return googleClient;
};

const ensureDefaultUserRole = async () => {
  const defaultRole = await Role.findOne({ name: 'user', isActive: true });
  return defaultRole || null;
};

const ensureRoleByName = async (roleName, { required = false } = {}) => {
  const role = await Role.findOne({ name: roleName, isActive: true });

  if (!role && required) {
    throw new AppError(
      ERROR_CODES.VALIDATION.INVALID_ROLE,
      HTTP_STATUS.BAD_REQUEST,
      { message: `Required role '${roleName}' is not configured or inactive` }
    );
  }

  return role || null;
};
const resolveRoles = async (roleInputs = []) => {
  const normalizedInputs = roleInputs
    .filter(Boolean)
    .map(input => (typeof input === 'string' ? input.trim() : input))
    .filter(input => input !== '' && input !== null && input !== undefined);

  if (normalizedInputs.length === 0) {
    return { roles: [], missing: [] };
  }

  const filters = normalizedInputs.map(input => {
    if (mongoose.Types.ObjectId.isValid(input)) {
      return { _id: input };
    }
    return { name: String(input).toLowerCase() };
  });

  const foundRoles = await Role.find({
    isActive: true,
    $or: filters
  });

  const matchesInput = (role, input) => {
    if (mongoose.Types.ObjectId.isValid(input)) {
      return role._id.equals(input);
    }
    return role.name === String(input).toLowerCase();
  };

  const missing = normalizedInputs.filter(input => !foundRoles.some(role => matchesInput(role, input)));

  // Deduplicate roles by id
  const uniqueRoles = [];
  const seen = new Set();
  for (const role of foundRoles) {
    const key = role._id.toString();
    if (!seen.has(key)) {
      seen.add(key);
      uniqueRoles.push(role);
    }
  }

  return {
    roles: uniqueRoles,
    missing
  };
};

const resolvePrimaryRole = ({ primaryRoleInput, roleDocs }) => {
  if (!primaryRoleInput) {
    return roleDocs[0] || null;
  }

  const findMatch = (input) => {
    if (!input) return null;
    return roleDocs.find(role => {
      if (mongoose.Types.ObjectId.isValid(input)) {
        return role._id.equals(input);
      }
      return role.name === String(input).toLowerCase();
    });
  };

  const match = findMatch(primaryRoleInput);
  if (match) {
    return match;
  }

  return null;
};

const populateUserForAuth = async (user) => {
  await user.populate({
    path: 'roles',
    populate: { path: 'permissions' }
  });
  await user.populate('primaryRole');
  return user;
};

const mapRole = (role, includeLevel = false) => {
  const mappedRole = {
    id: role._id,
    name: role.name,
    displayName: role.displayName
  };

  if (includeLevel && typeof role.level !== 'undefined') {
    mappedRole.level = role.level;
  }

  return mappedRole;
};

const buildUserProfile = (user, options = {}) => {
  const {
    includeRoleLevel = false,
    includePermissions = false,
    permissions = [],
    includeFlags = false,
    isSuperAdmin = false
  } = options;

  const profile = {
    id: user._id,
    name: user.name,
    email: user.email,
    roles: (user.roles || []).map(role => mapRole(role, includeRoleLevel)),
    primaryRole: user.primaryRole
      ? {
          id: user.primaryRole._id,
          name: user.primaryRole.name,
          displayName: user.primaryRole.displayName
        }
      : null
  };

  if (includePermissions) {
    profile.permissions = permissions;
  }

  if (includeFlags) {
    profile.isSuperAdmin = isSuperAdmin;
    profile.isActive = user.isActive;
    profile.createdAt = user.createdAt;
    profile.updatedAt = user.updatedAt;
  }

  return profile;
};

const registerUser = async ({ name, email, password, roles: requestedRoles, primaryRole }) => {
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new AppError(ERROR_CODES.USER.ALREADY_EXISTS, HTTP_STATUS.BAD_REQUEST);
  }

  const roleInputsArray = Array.isArray(requestedRoles)
    ? requestedRoles
    : requestedRoles
      ? [requestedRoles]
      : [];

  let finalRoles = [];
  let primaryRoleDoc = null;

  if (roleInputsArray.length > 0) {
    const { roles: resolvedRoles, missing } = await resolveRoles(roleInputsArray);

    if (missing.length > 0) {
      throw new AppError(
        ERROR_CODES.VALIDATION.INVALID_ROLE,
        HTTP_STATUS.BAD_REQUEST,
        { missingRoles: missing }
      );
    }

    if (resolvedRoles.length === 0) {
      throw new AppError(
        ERROR_CODES.VALIDATION.INVALID_ROLE,
        HTTP_STATUS.BAD_REQUEST,
        { message: 'Provided roles are invalid or inactive' }
      );
    }

    primaryRoleDoc = resolvePrimaryRole({ primaryRoleInput: primaryRole, roleDocs: resolvedRoles });

    if (!primaryRoleDoc && primaryRole) {
      throw new AppError(
        ERROR_CODES.VALIDATION.INVALID_ROLE,
        HTTP_STATUS.BAD_REQUEST,
        { message: 'Primary role must be one of the assigned roles' }
      );
    }

    finalRoles = resolvedRoles;
  } else {
    const defaultRole = await ensureDefaultUserRole();
    if (defaultRole) {
      finalRoles = [defaultRole];
      primaryRoleDoc = defaultRole;
    }
  }

  if (!primaryRoleDoc && finalRoles.length > 0) {
    primaryRoleDoc = finalRoles[0];
  }

  const userPayload = {
    name,
    email,
    password,
    roles: finalRoles.map(role => role._id)
  };

  if (primaryRoleDoc) {
    userPayload.primaryRole = primaryRoleDoc._id;
  }

  const user = await User.create(userPayload);

  await populateUserForAuth(user);

  const token = generateToken({
    id: user._id,
    roles: user.roles.map(r => r.name),
    primaryRole: user.primaryRole?.name
  });

  return {
    user: buildUserProfile(user),
    token,
    tokenExpiresAt: calculateTokenExpiry()
  };
};

const loginWithPassword = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    throw new AppError(ERROR_CODES.AUTH.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);
  }

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    throw new AppError(ERROR_CODES.AUTH.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);
  }

  if (!user.isActive) {
    throw new AppError(ERROR_CODES.AUTH.ACCOUNT_DEACTIVATED, HTTP_STATUS.UNAUTHORIZED);
  }

  await populateUserForAuth(user);

  const allPermissions = await user.getAllPermissions();

  const token = generateToken({
    id: user._id,
    roles: user.roles.map(r => r.name),
    primaryRole: user.primaryRole?.name,
    permissions: allPermissions
  });

  return {
    user: buildUserProfile(user, {
      includeRoleLevel: true,
      includePermissions: true,
      permissions: allPermissions
    }),
    token,
    tokenExpiresAt: calculateTokenExpiry()
  };
};

const getCurrentUserProfile = async (user, { isSuperAdmin = false } = {}) => {
  await populateUserForAuth(user);
  const allPermissions = await user.getAllPermissions();

  return buildUserProfile(user, {
    includeRoleLevel: true,
    includePermissions: true,
    permissions: allPermissions,
    includeFlags: true,
    isSuperAdmin
  });
};

const loginWithGoogle = async ({ idToken }) => {
  const client = getGoogleClient();

  let payload;
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: googleClientId
    });
    payload = ticket.getPayload();
  } catch (error) {
    throw new AppError(ERROR_CODES.AUTH.GOOGLE_AUTH_FAILED, HTTP_STATUS.UNAUTHORIZED);
  }

  if (!payload || !payload.email) {
    throw new AppError(ERROR_CODES.AUTH.GOOGLE_AUTH_FAILED, HTTP_STATUS.UNAUTHORIZED);
  }

  if (!payload.email_verified) {
    throw new AppError(ERROR_CODES.AUTH.GOOGLE_EMAIL_NOT_VERIFIED, HTTP_STATUS.UNAUTHORIZED);
  }

  const email = payload.email.toLowerCase();
  const nameFromPayload = payload.name || `${payload.given_name || ''} ${payload.family_name || ''}`.trim();
  const name = nameFromPayload && nameFromPayload.length > 0 ? nameFromPayload : email.split('@')[0];

  let user = await User.findOne({ email });

  if (!user) {
    const studentRole = await ensureRoleByName('student', { required: true });
    const generatedPassword = `${payload.sub || randomBytes(8).toString('hex')}.${randomBytes(16).toString('hex')}`;

    const newUserPayload = {
      name,
      email,
      password: generatedPassword
    };

    newUserPayload.roles = [studentRole._id];
    newUserPayload.primaryRole = studentRole._id;

    user = await User.create(newUserPayload);
  }

  if (!user.isActive) {
    throw new AppError(ERROR_CODES.AUTH.ACCOUNT_DEACTIVATED, HTTP_STATUS.UNAUTHORIZED);
  }

  await populateUserForAuth(user);
  const allPermissions = await user.getAllPermissions();

  const token = generateToken({
    id: user._id,
    roles: user.roles.map(r => r.name),
    primaryRole: user.primaryRole?.name,
    permissions: allPermissions
  });

  return {
    user: buildUserProfile(user, {
      includeRoleLevel: true,
      includePermissions: true,
      permissions: allPermissions
    }),
    token,
    tokenExpiresAt: calculateTokenExpiry()
  };
};

module.exports = {
  registerUser,
  loginWithPassword,
  getCurrentUserProfile,
  loginWithGoogle
};


