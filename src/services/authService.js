const { randomBytes, createHash } = require('crypto');
const mongoose = require('mongoose');
const { OAuth2Client } = require('google-auth-library');
const { User, Role, EmailPasscode } = require('../models');
const { generateToken, verifyToken } = require('../config/jwt');
const { AppError, ERROR_CODES } = require('../errors');
const { HTTP_STATUS, EMAIL_PASSCODE } = require('../utils/constants');
const emailService = require('./emailService');
const emailConfig = require('../config/email');

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

const normalizeEmail = (value = '') => String(value).trim().toLowerCase();

const generateNumericPasscode = (length = EMAIL_PASSCODE.LENGTH) => {
  const digits = [];
  const buffer = randomBytes(length);
  for (let index = 0; index < length; index += 1) {
    digits.push((buffer[index] % 10).toString());
  }
  return digits.join('');
};

const hashPasscode = (passcode) => createHash('sha256').update(String(passcode)).digest('hex');

const buildMetadataMap = (metadata = {}) => {
  const map = {};
  Object.entries(metadata).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }
    map[key] = typeof value === 'string' ? value : String(value);
  });
  return map;
};

const isProductionEnvironment = () =>
  (process.env.NODE_ENV || '').trim().toLowerCase() === 'production';

const createAndDispatchEmailPasscode = async ({
  email,
  user,
  purpose = EMAIL_PASSCODE.PURPOSES.GENERIC,
  metadata,
  skipCooldown = false,
  mailTemplate = 'verification/passcode',
  mailSubject = 'Your verification code',
  mailContext = {}
}) => {
  const normalizedEmail = normalizeEmail(email || user?.email);

  if (!normalizedEmail) {
    throw new AppError(ERROR_CODES.VALIDATION.INVALID_EMAIL, HTTP_STATUS.BAD_REQUEST);
  }

  const now = new Date();
  const cooldownMs = (EMAIL_PASSCODE.RESEND_COOLDOWN_SECONDS || 0) * 1000;

  const activePasscode = await EmailPasscode.findOne({
    email: normalizedEmail,
    purpose,
    consumedAt: null
  }).sort({ createdAt: -1 });

  if (
    !skipCooldown &&
    cooldownMs > 0 &&
    activePasscode &&
    now.getTime() - activePasscode.createdAt.getTime() < cooldownMs
  ) {
    const resendAvailableAt = new Date(activePasscode.createdAt.getTime() + cooldownMs);
    throw new AppError(
      ERROR_CODES.PASSCODE.TOO_SOON,
      HTTP_STATUS.TOO_MANY_REQUESTS,
      { resendAvailableAt }
    );
  }

  await EmailPasscode.deleteMany({ email: normalizedEmail, purpose });

  const rawPasscode = generateNumericPasscode(EMAIL_PASSCODE.LENGTH);
  const expiresAt = new Date(
    now.getTime() + (EMAIL_PASSCODE.EXPIRY_MINUTES || 10) * 60 * 1000
  );

  const passcodeDoc = await EmailPasscode.create({
    email: normalizedEmail,
    codeHash: hashPasscode(rawPasscode),
    purpose,
    expiresAt,
    attemptCount: 0,
    maxAttempts: EMAIL_PASSCODE.MAX_ATTEMPTS || 5,
    metadata: buildMetadataMap({
      ...metadata,
      userId: user?._id ? user._id.toString() : metadata?.userId
    })
  });

  try {
    await emailService.sendEmail({
      to: normalizedEmail,
      subject: mailSubject,
      template: mailTemplate,
      context: {
        name: user?.name || normalizedEmail,
        code: rawPasscode,
        expiresInMinutes: EMAIL_PASSCODE.EXPIRY_MINUTES || 10,
        ...mailContext
      }
    });
  } catch (error) {
    await EmailPasscode.deleteOne({ _id: passcodeDoc._id });
    throw error;
  }

  const response = {
    email: normalizedEmail,
    expiresAt,
    resendAvailableAt:
      cooldownMs > 0 ? new Date(passcodeDoc.createdAt.getTime() + cooldownMs) : null
  };

  if (!isProductionEnvironment() || !emailConfig.enabled) {
    response.previewCode = rawPasscode;
  }

  return response;
};

const validateAndConsumeEmailPasscode = async ({
  email,
  code,
  purpose = EMAIL_PASSCODE.PURPOSES.LOGIN
}) => {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    throw new AppError(ERROR_CODES.VALIDATION.INVALID_EMAIL, HTTP_STATUS.BAD_REQUEST);
  }

  const passcodeDoc = await EmailPasscode.findOne({
    email: normalizedEmail,
    purpose,
    consumedAt: null
  }).sort({ createdAt: -1 });

  if (!passcodeDoc) {
    throw new AppError(ERROR_CODES.PASSCODE.NOT_FOUND, HTTP_STATUS.BAD_REQUEST);
  }

  const now = new Date();

  if (passcodeDoc.expiresAt.getTime() <= now.getTime()) {
    passcodeDoc.consumedAt = now;
    await passcodeDoc.save();
    throw new AppError(ERROR_CODES.PASSCODE.EXPIRED, HTTP_STATUS.BAD_REQUEST);
  }

  if (passcodeDoc.attemptCount >= passcodeDoc.maxAttempts) {
    throw new AppError(ERROR_CODES.PASSCODE.ATTEMPTS_EXCEEDED, HTTP_STATUS.UNAUTHORIZED);
  }

  const attemptsRemainingBefore = passcodeDoc.maxAttempts - passcodeDoc.attemptCount;
  passcodeDoc.attemptCount += 1;

  const isMatch = passcodeDoc.codeHash === hashPasscode(code);

  if (!isMatch) {
    const attemptsRemaining = Math.max(passcodeDoc.maxAttempts - passcodeDoc.attemptCount, 0);
    await passcodeDoc.save();
    throw new AppError(
      ERROR_CODES.PASSCODE.INVALID,
      HTTP_STATUS.UNAUTHORIZED,
      { attemptsRemaining, attemptsRemainingBefore }
    );
  }

  passcodeDoc.consumedAt = now;
  await passcodeDoc.save();

  await EmailPasscode.deleteMany({
    email: normalizedEmail,
    purpose,
    consumedAt: null,
    _id: { $ne: passcodeDoc._id }
  });

  return passcodeDoc;
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

const generatePasswordResetToken = async (user) => {
  const resetNonce = randomBytes(32).toString('hex');
  const issuedAt = new Date();

  user.passwordResetNonce = resetNonce;
  user.passwordResetIssuedAt = issuedAt;
  await user.save({ validateBeforeSave: false });

  const expiresMinutes = EMAIL_PASSCODE.EXPIRY_MINUTES || 10;
  const expiresIn = `${expiresMinutes}m`;

  const token = generateToken(
    {
      type: 'password_reset',
      userId: user._id,
      email: user.email,
      resetNonce
    },
    expiresIn
  );

  return {
    token,
    expiresAt: new Date(issuedAt.getTime() + expiresMinutes * 60 * 1000),
    resetNonce
  };
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
  
  // Populate enrollment data if present (only populate if enrollment exists)
  // Note: We check if the enrollment object exists, not just the reference
  if (user.focusOneEnrollment) {
    await user.populate('focusOneEnrollment.focusOne');
  }
  if (user.cohortEnrollment) {
    await user.populate('cohortEnrollment.cohort');
  }
  
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

  // Determine enrollment type
  let enrollmentType = null;
  if (user.focusOneEnrollment && user.focusOneEnrollment.focusOne) {
    enrollmentType = 'focusOne';
  } else if (user.cohortEnrollment && user.cohortEnrollment.cohort) {
    enrollmentType = 'cohort';
  }

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
      : null,
    enrollmentType // 'focusOne' | 'cohort' | null
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

const registerUser = async ({ name, email, password, phoneNumber, city, roles: requestedRoles, primaryRole }) => {
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
    phoneNumber,
    city,
    email,
    password,
    roles: finalRoles.map(role => role._id)
  };

  if (primaryRoleDoc) {
    userPayload.primaryRole = primaryRoleDoc._id;
  }

  const user = await User.create(userPayload);

  await populateUserForAuth(user);
  const allPermissions = await user.getAllPermissions();
  const session = await issueNewSession({ user, allPermissions });

  return {
    user: buildUserProfile(user),
    token: session.token,
    tokenExpiresAt: session.tokenExpiresAt
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

  // Check if user has admin or super-admin role - skip passcode for admins
  const userRoleNames = user.roles.map(r => r.name);
  const isAdmin = userRoleNames.includes('admin') || userRoleNames.includes('super-admin');

  // If admin, issue session directly without passcode
  if (isAdmin) {
    const session = await issueNewSession({ user, allPermissions });
    
    return {
      user: buildUserProfile(user, {
        includeRoleLevel: true,
        includePermissions: true,
        permissions: allPermissions
      }),
      token: session.token,
      tokenExpiresAt: session.tokenExpiresAt,
      requiresPasscode: false
    };
  }

  // For non-admin users, require passcode verification
  const passcodeInfo = await createAndDispatchEmailPasscode({
    user,
    purpose: EMAIL_PASSCODE.PURPOSES.LOGIN,
    metadata: { trigger: EMAIL_PASSCODE.PURPOSES.LOGIN },
    skipCooldown: true
  });

  return {
    user: buildUserProfile(user, {
      includeRoleLevel: true,
      includePermissions: true,
      permissions: allPermissions
    }),
    token: null,
    tokenExpiresAt: null,
    requiresPasscode: true,
    verification: {
      purpose: EMAIL_PASSCODE.PURPOSES.LOGIN,
      expiresAt: passcodeInfo.expiresAt,
      resendAvailableAt: passcodeInfo.resendAvailableAt,
      email: passcodeInfo.email,
      ...(passcodeInfo.previewCode && { previewCode: passcodeInfo.previewCode })
    }
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

const loginWithGoogle = async ({ idToken, ipAddress = null, userAgent = null }) => {
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

  const session = await issueNewSession({ user, allPermissions, ipAddress, userAgent });

  return {
    user: buildUserProfile(user, {
      includeRoleLevel: true,
      includePermissions: true,
      permissions: allPermissions
    }),
    token: session.token,
    tokenExpiresAt: session.tokenExpiresAt
  };
};

const verifyLoginWithPasscode = async ({ email, passcode, ipAddress = null, userAgent = null }) => {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    throw new AppError(ERROR_CODES.VALIDATION.INVALID_EMAIL, HTTP_STATUS.BAD_REQUEST);
  }

  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    throw new AppError(ERROR_CODES.AUTH.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);
  }

  if (!user.isActive) {
    throw new AppError(ERROR_CODES.AUTH.ACCOUNT_DEACTIVATED, HTTP_STATUS.UNAUTHORIZED);
  }

  const passcodeDoc = await validateAndConsumeEmailPasscode({
    email: normalizedEmail,
    code: passcode,
    purpose: EMAIL_PASSCODE.PURPOSES.LOGIN
  });

  const metadataUserId = passcodeDoc.metadata?.get
    ? passcodeDoc.metadata.get('userId')
    : passcodeDoc.metadata?.userId;

  if (metadataUserId && user._id.toString() !== metadataUserId) {
    throw new AppError(ERROR_CODES.PASSCODE.INVALID, HTTP_STATUS.UNAUTHORIZED);
  }

  await populateUserForAuth(user);
  const allPermissions = await user.getAllPermissions();
  const session = await issueNewSession({ user, allPermissions, ipAddress, userAgent });

  return {
    user: buildUserProfile(user, {
      includeRoleLevel: true,
      includePermissions: true,
      permissions: allPermissions
    }),
    token: session.token,
    tokenExpiresAt: session.tokenExpiresAt,
    requiresPasscode: false,
    verification: {
      verifiedAt: new Date().toISOString()
    }
  };
};

const requestPasswordResetPasscode = async ({ email }) => {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    throw new AppError(ERROR_CODES.VALIDATION.INVALID_EMAIL, HTTP_STATUS.BAD_REQUEST);
  }

  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    return {
      requiresPasscode: true,
      verification: {
        purpose: EMAIL_PASSCODE.PURPOSES.PASSWORD_RESET,
        email: normalizedEmail,
        expiresAt: null,
        resendAvailableAt: null
      }
    };
  }

  const passcodeInfo = await createAndDispatchEmailPasscode({
    user,
    purpose: EMAIL_PASSCODE.PURPOSES.PASSWORD_RESET,
    metadata: {
      trigger: EMAIL_PASSCODE.PURPOSES.PASSWORD_RESET,
      userId: user._id.toString()
    },
    mailTemplate: 'password-reset/passcode',
    mailSubject: 'Reset your password',
    mailContext: {
      actionLabel: 'reset your password'
    }
  });

  return {
    requiresPasscode: true,
    verification: {
      purpose: EMAIL_PASSCODE.PURPOSES.PASSWORD_RESET,
      email: passcodeInfo.email,
      expiresAt: passcodeInfo.expiresAt,
      resendAvailableAt: passcodeInfo.resendAvailableAt,
      ...(passcodeInfo.previewCode && { previewCode: passcodeInfo.previewCode })
    }
  };
};

const verifyPasswordResetPasscode = async ({ email, passcode }) => {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    throw new AppError(ERROR_CODES.VALIDATION.INVALID_EMAIL, HTTP_STATUS.BAD_REQUEST);
  }

  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    throw new AppError(ERROR_CODES.PASSCODE.INVALID, HTTP_STATUS.UNAUTHORIZED);
  }

  const passcodeDoc = await validateAndConsumeEmailPasscode({
    email: normalizedEmail,
    code: passcode,
    purpose: EMAIL_PASSCODE.PURPOSES.PASSWORD_RESET
  });

  const metadataUserId = passcodeDoc.metadata?.get
    ? passcodeDoc.metadata.get('userId')
    : passcodeDoc.metadata?.userId;

  if (metadataUserId && user._id.toString() !== metadataUserId) {
    throw new AppError(ERROR_CODES.PASSCODE.INVALID, HTTP_STATUS.UNAUTHORIZED);
  }

  const tokenInfo = await generatePasswordResetToken(user);

  return {
    email: normalizedEmail,
    resetToken: tokenInfo.token,
    resetTokenExpiresAt: tokenInfo.expiresAt
  };
};

const resetPasswordWithToken = async ({
  resetToken,
  newPassword,
  ipAddress = null,
  userAgent = null
}) => {
  let decoded;
  try {
    decoded = verifyToken(resetToken);
  } catch (error) {
    throw new AppError(ERROR_CODES.AUTH.TOKEN_INVALID, HTTP_STATUS.UNAUTHORIZED);
  }

  if (!decoded || decoded.type !== 'password_reset' || !decoded.userId || !decoded.resetNonce) {
    throw new AppError(ERROR_CODES.AUTH.TOKEN_INVALID, HTTP_STATUS.UNAUTHORIZED);
  }

  const user = await User.findById(decoded.userId).select('+password');

  if (!user) {
    throw new AppError(ERROR_CODES.AUTH.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);
  }

  if (!user.passwordResetNonce || user.passwordResetNonce !== decoded.resetNonce) {
    throw new AppError(ERROR_CODES.PASSCODE.INVALID, HTTP_STATUS.UNAUTHORIZED);
  }

  user.password = newPassword;
  user.passwordResetNonce = null;
  user.passwordResetIssuedAt = null;
  await user.save({ validateBeforeSave: false });

  await populateUserForAuth(user);
  const allPermissions = await user.getAllPermissions();
  const session = await issueNewSession({ user, allPermissions, ipAddress, userAgent });

  return {
    user: buildUserProfile(user, {
      includeRoleLevel: true,
      includePermissions: true,
      permissions: allPermissions
    }),
    token: session.token,
    tokenExpiresAt: session.tokenExpiresAt
  };
};

const setupPasswordWithToken = async ({
  setupToken,
  newPassword,
  name = null,
  phoneNumber = null,
  city = null,
  ipAddress = null,
  userAgent = null
}) => {
  let decoded;
  try {
    decoded = verifyToken(setupToken);
  } catch (error) {
    throw new AppError(ERROR_CODES.AUTH.TOKEN_INVALID, HTTP_STATUS.UNAUTHORIZED);
  }

  if (!decoded || decoded.type !== 'password_setup' || !decoded.userId || !decoded.resetNonce) {
    throw new AppError(ERROR_CODES.AUTH.TOKEN_INVALID, HTTP_STATUS.UNAUTHORIZED);
  }

  const user = await User.findById(decoded.userId).select('+password');

  if (!user) {
    throw new AppError(ERROR_CODES.AUTH.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);
  }

  if (!user.passwordResetNonce || user.passwordResetNonce !== decoded.resetNonce) {
    throw new AppError(ERROR_CODES.AUTH.TOKEN_INVALID, HTTP_STATUS.UNAUTHORIZED);
  }

  // Set the new password
  user.password = newPassword;
  user.passwordResetNonce = null;
  user.passwordResetIssuedAt = null;

  // Update user details if provided
  if (name && name.trim()) {
    user.name = name.trim();
  }
  if (phoneNumber && phoneNumber.trim()) {
    user.phoneNumber = phoneNumber.trim();
  }
  if (city && city.trim()) {
    user.city = city.trim();
  }

  await user.save({ validateBeforeSave: false });

  await populateUserForAuth(user);
  const allPermissions = await user.getAllPermissions();
  const session = await issueNewSession({ user, allPermissions, ipAddress, userAgent });

  return {
    user: buildUserProfile(user, {
      includeRoleLevel: true,
      includePermissions: true,
      permissions: allPermissions
    }),
    token: session.token,
    tokenExpiresAt: session.tokenExpiresAt
  };
};

const getCurrentUserEnrollment = async (user) => {
  // Populate enrollment data
  if (user.focusOneEnrollment) {
    await user.populate('focusOneEnrollment.focusOne');
    await user.populate('focusOneEnrollment.focusOne.teacherSubjectMappings.teacher', 'name email');
    await user.populate('focusOneEnrollment.focusOne.teacherSubjectMappings.subject', 'name description');
    await user.populate('focusOneEnrollment.focusOne.student', 'name email');
    await user.populate('focusOneEnrollment.teacherSubjectMappings.teacher', 'name email');
    await user.populate('focusOneEnrollment.teacherSubjectMappings.subject', 'name description');
  }
  if (user.cohortEnrollment) {
    await user.populate('cohortEnrollment.cohort');
    await user.populate('cohortEnrollment.cohort.subjects.subject', 'name description');
  }

  if (user.focusOneEnrollment && user.focusOneEnrollment.focusOne) {
    const focusOne = user.focusOneEnrollment.focusOne;
    return {
      type: 'focusOne',
      enrollment: {
        id: focusOne._id,
        description: focusOne.description,
        status: focusOne.status, // FocusOne entity status (active, completed) - use isActive for pause, deletedAt for cancelled
        isActive: focusOne.isActive, // true = active, false = paused
        isCancelled: !!focusOne.deletedAt, // true if cancelled (soft deleted)
        pausedAt: focusOne.pausedAt,
        resumedAt: focusOne.resumedAt,
        teacherSubjectMappings: (focusOne.teacherSubjectMappings || []).map(mapping => ({
          teacher: {
            id: mapping.teacher._id || mapping.teacher,
            name: mapping.teacher.name,
            email: mapping.teacher.email
          },
          subject: {
            id: mapping.subject._id || mapping.subject,
            name: mapping.subject.name,
            description: mapping.subject.description
          }
        })),
        student: focusOne.student ? {
          id: focusOne.student._id,
          name: focusOne.student.name,
          email: focusOne.student.email
        } : null,
        enrolledAt: focusOne.enrolledAt,
        startedAt: focusOne.startedAt
      },
      teacherSubjectMappings: (user.focusOneEnrollment.teacherSubjectMappings || []).map(mapping => ({
        teacher: {
          id: mapping.teacher._id || mapping.teacher,
          name: mapping.teacher.name,
          email: mapping.teacher.email
        },
        subject: {
          id: mapping.subject._id || mapping.subject,
          name: mapping.subject.name,
          description: mapping.subject.description
        }
      })),
      status: focusOne.status, // Use status field directly (maintained alongside isActive and deletedAt)
      enrollmentStatus: user.focusOneEnrollment.status, // User enrollment status (active, completed, withdrawn, cancelled) - kept for reference
      enrolledAt: user.focusOneEnrollment.enrolledAt,
      startedAt: user.focusOneEnrollment.startedAt
    };
  } else if (user.cohortEnrollment && user.cohortEnrollment.cohort) {
    const cohort = user.cohortEnrollment.cohort;
    return {
      type: 'cohort',
      enrollment: {
        id: cohort._id,
        name: cohort.name,
        slug: cohort.slug,
        description: cohort.description,
        status: cohort.status,
        startDate: cohort.startDate,
        endDate: cohort.endDate,
        subjects: (cohort.subjects || []).map(cohortSubject => ({
          id: cohortSubject.subject._id,
          name: cohortSubject.subject.name,
          description: cohortSubject.subject.description,
          isActive: cohortSubject.isActive
        }))
      },
      status: user.cohortEnrollment.status,
      enrolledAt: user.cohortEnrollment.enrolledAt,
      startedAt: user.cohortEnrollment.startedAt,
      joinedViaWaitlist: user.cohortEnrollment.joinedViaWaitlist
    };
  }

  return null;
};

module.exports = {
  registerUser,
  loginWithPassword,
  getCurrentUserProfile,
  getCurrentUserEnrollment,
  loginWithGoogle,
  verifyLoginWithPasscode,
  requestPasswordResetPasscode,
  verifyPasswordResetPasscode,
  resetPasswordWithToken,
  setupPasswordWithToken
};


