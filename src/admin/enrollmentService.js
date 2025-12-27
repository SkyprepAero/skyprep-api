const { User, Role, FocusOne, Subject } = require('../models');
const { generateToken } = require('../config/jwt');
const { AppError, ERROR_CODES } = require('../errors');
const { HTTP_STATUS } = require('../utils/constants');
const { randomBytes } = require('crypto');
const { sendEmail } = require('../services/emailService');
const bcrypt = require('bcryptjs');

/**
 * Generate password setup token for new user
 */
const generatePasswordSetupToken = async (user) => {
  const setupNonce = randomBytes(32).toString('hex');
  const issuedAt = new Date();

  user.passwordResetNonce = setupNonce;
  user.passwordResetIssuedAt = issuedAt;
  await user.save({ validateBeforeSave: false });

  // Password setup token expires in 7 days (longer than reset token)
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
 * Enroll a student in Focus One (One-to-One Teaching Program)
 * Creates user account, sends password setup email, then creates Focus One entry and enrolls student
 */
const enrollStudentInFocusOne = async ({
  email,
  teacherSubjectMappings = [], // Array of { teacher: ObjectId, subject: ObjectId } mappings
  startedAt = null, // Start date for the enrollment
  metadata = {},
  enrolledBy = null // Admin user ID who enrolled the student
}) => {
  // Validate mappings
  if (!teacherSubjectMappings || teacherSubjectMappings.length === 0) {
    throw new AppError(ERROR_CODES.VALIDATION.GENERAL, HTTP_STATUS.BAD_REQUEST, { message: 'At least one teacher-subject mapping is required' });
  }

  // Extract unique teacher and subject IDs from mappings
  const uniqueTeacherIds = [...new Set(teacherSubjectMappings.map(m => m.teacher.toString()))];
  const uniqueSubjectIds = [...new Set(teacherSubjectMappings.map(m => m.subject.toString()))];

  // Validate teachers
  if (uniqueTeacherIds.length > 0) {
    const teachers = await User.find({ _id: { $in: uniqueTeacherIds } }).populate('roles');
    if (teachers.length !== uniqueTeacherIds.length) {
      throw new AppError(ERROR_CODES.USER.NOT_FOUND, HTTP_STATUS.BAD_REQUEST, { message: 'One or more teachers not found' });
    }
    // Check if all users have teacher role
    for (const teacher of teachers) {
      const hasTeacherRole = teacher.roles.some(role => role.name === 'teacher');
      if (!hasTeacherRole) {
        throw new AppError(ERROR_CODES.VALIDATION.INVALID_ROLE, HTTP_STATUS.BAD_REQUEST, { message: `User ${teacher.name} does not have teacher role` });
      }
    }
  }

  // Validate subjects
  if (uniqueSubjectIds.length > 0) {
    const subjects = await Subject.find({ _id: { $in: uniqueSubjectIds } });
    if (subjects.length !== uniqueSubjectIds.length) {
      throw new AppError(ERROR_CODES.SUBJECT.NOT_FOUND, HTTP_STATUS.BAD_REQUEST, { message: 'One or more subjects not found' });
    }
  }

  // Check if user already exists
  let user = await User.findOne({ email: email.toLowerCase().trim() });

  if (user) {
    // User exists - check if already enrolled in Focus One
    if (user.focusOneEnrollment) {
      throw new AppError(
        ERROR_CODES.USER.ALREADY_ENROLLED,
        HTTP_STATUS.BAD_REQUEST,
        { message: 'User is already enrolled in a Focus One program' }
      );
    }

    // Check if user has cohort enrollment (mutually exclusive)
    if (user.cohortEnrollment) {
      throw new AppError(
        ERROR_CODES.USER.ALREADY_ENROLLED,
        HTTP_STATUS.BAD_REQUEST,
        { message: 'User is already enrolled in a Cohort. Cannot enroll in Focus One simultaneously.' }
      );
    }

    // User exists - no need to update details, just enroll
  } else {
    // Create new user
    // Find student role
    const studentRole = await Role.findOne({ name: 'student', isActive: true });

    if (!studentRole) {
      throw new AppError(
        ERROR_CODES.VALIDATION.INVALID_ROLE,
        HTTP_STATUS.BAD_REQUEST,
        { message: 'Student role is not configured or inactive' }
      );
    }

    // Generate temporary password (will be replaced when user sets their password)
    const tempPassword = randomBytes(16).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Create user with temporary password (name will be set when user completes profile)
    user = await User.create({
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      roles: [studentRole._id],
      primaryRole: studentRole._id,
      isActive: true
    });
  }

  // Step 1: User is created, now send password setup email
  const tokenInfo = await generatePasswordSetupToken(user);

  // Get classroom frontend URL from environment
  const classroomUrl = process.env.CLASSROOM_FRONTEND_URL || 'http://localhost:5173';
  const setupUrl = `${classroomUrl}/auth/setup-password?token=${tokenInfo.token}`;

  // Send password setup email
  await sendEmail({
    to: user.email,
    subject: 'Welcome to SkyPrep - Set Your Password',
    template: 'enrollment/password-setup',
    context: {
      name: user.name || 'Student',
      setupUrl,
      expiresAt: tokenInfo.expiresAt.toISOString(),
      expiresInDays: 7
    }
  });

  // Step 2: Email sent, now create Focus One entry with enrollment data
  const enrollmentDate = new Date();
  const focusOne = new FocusOne({
    description: `Focus One enrollment for ${user.email}`,
    teacherSubjectMappings: teacherSubjectMappings.map(m => ({
      teacher: m.teacher,
      subject: m.subject
    })),
    status: 'active',
    student: user._id,
    enrolledBy: enrolledBy || null,
    enrolledAt: enrollmentDate,
    startedAt: startedAt ? new Date(startedAt) : enrollmentDate,
    isActive: true,
    metadata: {
      enrollmentSource: 'admin',
      enrollmentMethod: 'manual'
    }
  });
  await focusOne.save();

  // Step 3: Create enrollment entry linking user to Focus One
  user.focusOneEnrollment = {
    focusOne: focusOne._id,
    teacherSubjectMappings: teacherSubjectMappings.map(m => ({
      teacher: m.teacher,
      subject: m.subject
    })),
    status: 'active',
    enrolledAt: enrollmentDate,
    startedAt: startedAt ? new Date(startedAt) : enrollmentDate, // Use provided start date or default to enrollment date
    metadata: {
      ...(metadata || {}),
      enrolledBy: enrolledBy || null, // Admin who enrolled the student
      enrollmentSource: 'admin', // Source of enrollment
      enrollmentMethod: 'manual', // Method: manual, bulk, api, etc.
      enrollmentDate: enrollmentDate.toISOString() // ISO string for easy querying
    }
  };

  await user.save();

  // Populate user for response
  await user.populate('focusOneEnrollment.focusOne');
  await user.populate('focusOneEnrollment.focusOne.teacherSubjectMappings.teacher', 'name email');
  await user.populate('focusOneEnrollment.focusOne.teacherSubjectMappings.subject', 'name description');
  await user.populate('focusOneEnrollment.focusOne.student', 'name email');
  await user.populate('focusOneEnrollment.focusOne.enrolledBy', 'name email');
  await user.populate('focusOneEnrollment.focusOne.pausedBy', 'name email');
  await user.populate('focusOneEnrollment.focusOne.pauseHistory.pausedBy', 'name email');
  await user.populate('focusOneEnrollment.focusOne.pauseHistory.resumedBy', 'name email');
  await user.populate('focusOneEnrollment.teacherSubjectMappings.teacher', 'name email');
  await user.populate('focusOneEnrollment.teacherSubjectMappings.subject', 'name description');
  await user.populate('roles');
  await user.populate('primaryRole');

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      city: user.city,
      roles: user.roles.map(r => ({
        id: r._id,
        name: r.name,
        displayName: r.displayName
      })),
      primaryRole: user.primaryRole ? {
        id: user.primaryRole._id,
        name: user.primaryRole.name,
        displayName: user.primaryRole.displayName
      } : null,
      focusOneEnrollment: {
        focusOne: {
          id: user.focusOneEnrollment.focusOne._id,
          description: user.focusOneEnrollment.focusOne.description,
          teacherSubjectMappings: (user.focusOneEnrollment.focusOne.teacherSubjectMappings || []).map(mapping => ({
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
          student: user.focusOneEnrollment.focusOne.student ? {
            id: user.focusOneEnrollment.focusOne.student._id,
            name: user.focusOneEnrollment.focusOne.student.name,
            email: user.focusOneEnrollment.focusOne.student.email
          } : null,
          enrolledBy: user.focusOneEnrollment.focusOne.enrolledBy ? {
            id: user.focusOneEnrollment.focusOne.enrolledBy._id,
            name: user.focusOneEnrollment.focusOne.enrolledBy.name,
            email: user.focusOneEnrollment.focusOne.enrolledBy.email
          } : null,
          enrolledAt: user.focusOneEnrollment.focusOne.enrolledAt,
          startedAt: user.focusOneEnrollment.focusOne.startedAt
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
        status: user.focusOneEnrollment.status,
        enrolledAt: user.focusOneEnrollment.enrolledAt,
        startedAt: user.focusOneEnrollment.startedAt,
        metadata: {
          enrolledBy: user.focusOneEnrollment.metadata?.enrolledBy || null,
          enrollmentSource: user.focusOneEnrollment.metadata?.enrollmentSource || 'admin',
          enrollmentMethod: user.focusOneEnrollment.metadata?.enrollmentMethod || 'manual',
          enrollmentDate: user.focusOneEnrollment.metadata?.enrollmentDate || user.focusOneEnrollment.enrolledAt.toISOString()
        }
      }
    },
    emailSent: true,
    setupUrl: process.env.NODE_ENV === 'development' ? setupUrl : undefined // Only return in dev
  };
};

module.exports = {
  enrollStudentInFocusOne,
  generatePasswordSetupToken
};

