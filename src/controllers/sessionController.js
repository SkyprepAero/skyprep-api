const { Session, FocusOne, Cohort, User } = require('../models');
const { successResponse } = require('../utils/response');
const { AppError, ERROR_CODES } = require('../errors');
const { HTTP_STATUS } = require('../utils/constants');
const { sendEmail } = require('../services/emailService');
const { createMeetingLink } = require('../utils/meetingLinkService');
const { checkMultipleTeachersAvailability, generateAvailableSlots, checkTeacherAvailability } = require('../utils/sessionSlots');

/**
 * Create a new Session
 */
const createSession = async (req, res, next) => {
  try {
    const { title, description, startTime, endTime, focusOne, cohort, subject, teacher, meetingLink, meetingPlatform, metadata } = req.body;

    // Validate that either focusOne or cohort is provided (not both, not neither)
    if (!focusOne && !cohort) {
      throw new AppError(
        ERROR_CODES.SESSION.ASSOCIATION_REQUIRED,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    if (focusOne && cohort) {
      throw new AppError(
        ERROR_CODES.SESSION.INVALID_ASSOCIATION,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Validate focusOne exists if provided
    if (focusOne) {
      const focusOneDoc = await FocusOne.findById(focusOne);
      if (!focusOneDoc) {
        throw new AppError(
          ERROR_CODES.FOCUS_ONE.NOT_FOUND,
          HTTP_STATUS.NOT_FOUND
        );
      }
    }

    // Validate cohort exists if provided
    if (cohort) {
      const cohortDoc = await Cohort.findById(cohort);
      if (!cohortDoc) {
        throw new AppError(
          { code: 'COHORT_4001', message: 'Cohort not found' },
          HTTP_STATUS.NOT_FOUND
        );
      }
    }

    // Validate teacher exists and has teacher role (required for admin-created sessions)
    if (!teacher) {
      throw new AppError(
        ERROR_CODES.VALIDATION.GENERAL,
        HTTP_STATUS.BAD_REQUEST,
        { message: 'Teacher is required for admin-created sessions' }
      );
    }

    const teacherDoc = await User.findById(teacher).populate('roles');
    if (!teacherDoc) {
      throw new AppError(
        ERROR_CODES.USER.NOT_FOUND,
        HTTP_STATUS.NOT_FOUND,
        { message: 'Teacher not found' }
      );
    }

    const hasTeacherRole = teacherDoc.roles.some(role => role.name === 'teacher');
    if (!hasTeacherRole) {
      throw new AppError(
        ERROR_CODES.VALIDATION.INVALID_ROLE,
        HTTP_STATUS.BAD_REQUEST,
        { message: 'User does not have teacher role' }
      );
    }

    // Validate endTime is after startTime
    if (endTime <= startTime) {
      throw new AppError(
        ERROR_CODES.SESSION.INVALID_TIME,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    const session = new Session({
      title,
      description,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      focusOne: focusOne || null,
      cohort: cohort || null,
      subject: subject || null,
      teacher,
      meetingLink: meetingLink || null,
      meetingPlatform: meetingPlatform || null,
      metadata: metadata || {},
      status: 'scheduled', // Admin-created sessions are directly scheduled
      history: [{
        action: 'scheduled',
        performedBy: req.user._id,
        performedAt: new Date(),
        newStatus: 'scheduled',
        notes: 'Session created directly by admin'
      }]
    });

    await session.save();

    // Populate references
    await session.populate('focusOne', 'description student');
    await session.populate('cohort', 'name slug');
    await session.populate('subject', 'name description');
    await session.populate('teacher', 'name email');
    await session.populate('history.performedBy', 'name email');

    successResponse(res, session, 'Session created successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all Sessions
 */
const getAllSessions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, focusOne, cohort, teacher, status, subject, isActive, date, search } = req.query;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = { deletedAt: null };

    if (focusOne) {
      filter.focusOne = focusOne;
    }

    if (cohort) {
      filter.cohort = cohort;
    }

    if (teacher) {
      filter.teacher = teacher;
    }

    if (status) {
      filter.status = status;
    }

    if (subject) {
      filter.subject = subject;
    }

    if (isActive !== undefined) {
      const isActiveBool = isActive === 'true' || isActive === true;
      filter.isActive = isActiveBool;
    }

    // Single date filter - filter sessions for a specific date
    if (date) {
      const filterDate = new Date(date);
      const startOfDay = new Date(filterDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(filterDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      filter.startTime = {
        $gte: startOfDay,
        $lte: endOfDay
      };
    }

    // Search filter - search in session title (case-insensitive)
    if (search && search.trim()) {
      filter.title = { $regex: search.trim(), $options: 'i' };
    }

    const sessions = await Session.find(filter)
      .populate('focusOne', 'description student')
      .populate('cohort', 'name slug')
      .populate('subject', 'name description')
      .populate('teacher', 'name email')
      .populate('requestedBy', 'name email')
      .populate('acceptedBy', 'name email')
      .populate('rejectedBy', 'name email')
      .sort({ startTime: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Session.countDocuments(filter);

    successResponse(res, {
      sessions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage: skip + sessions.length < total,
        hasPreviousPage: parseInt(page) > 1
      }
    }, 'Sessions retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get Session by ID
 */
const getSessionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const session = await Session.findById(id)
      .populate('focusOne', 'description student')
      .populate('focusOne.teacherSubjectMappings.teacher', 'name email')
      .populate('focusOne.teacherSubjectMappings.subject', 'name description')
      .populate('focusOne.student', 'name email')
      .populate('cohort', 'name slug description status')
      .populate('subject', 'name description')
      .populate('teacher', 'name email phoneNumber')
      .populate('requestedBy', 'name email')
      .populate('acceptedBy', 'name email')
      .populate('rejectedBy', 'name email')
      .populate('cancelledBy', 'name email')
      .populate('history.performedBy', 'name email');

    if (!session) {
      throw new AppError(
        ERROR_CODES.SESSION.NOT_FOUND,
        HTTP_STATUS.NOT_FOUND
      );
    }

    successResponse(res, session, 'Session retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update Session
 */
const updateSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, startTime, endTime, subject, teacher, meetingLink, meetingPlatform, status, metadata } = req.body;

    const session = await Session.findById(id);
    if (!session) {
      throw new AppError(
        ERROR_CODES.SESSION.NOT_FOUND,
        HTTP_STATUS.NOT_FOUND
      );
    }

    // Track changes for history
    const previousStatus = session.status;
    const changes = {};
    
    // Update fields and track changes
    if (title !== undefined && session.title !== title) {
      changes.title = { from: session.title, to: title };
      session.title = title;
    }
    if (description !== undefined && session.description !== description) {
      changes.description = { from: session.description, to: description };
      session.description = description;
    }
    if (startTime !== undefined && session.startTime?.getTime() !== new Date(startTime).getTime()) {
      changes.startTime = { from: session.startTime, to: new Date(startTime) };
      session.startTime = new Date(startTime);
    }
    if (endTime !== undefined && session.endTime?.getTime() !== new Date(endTime).getTime()) {
      changes.endTime = { from: session.endTime, to: new Date(endTime) };
      session.endTime = new Date(endTime);
    }
    if (subject !== undefined && session.subject?.toString() !== subject?.toString()) {
      changes.subject = { from: session.subject, to: subject };
      session.subject = subject;
    }
    if (teacher !== undefined && session.teacher?.toString() !== teacher?.toString()) {
      changes.teacher = { from: session.teacher, to: teacher };
      session.teacher = teacher;
    }
    if (meetingLink !== undefined && session.meetingLink !== meetingLink) {
      changes.meetingLink = { from: session.meetingLink, to: meetingLink };
      session.meetingLink = meetingLink;
    }
    if (meetingPlatform !== undefined && session.meetingPlatform !== meetingPlatform) {
      changes.meetingPlatform = { from: session.meetingPlatform, to: meetingPlatform };
      session.meetingPlatform = meetingPlatform;
    }
    if (status !== undefined && session.status !== status) {
      changes.status = { from: session.status, to: status };
      session.status = status;

      // Track status-specific fields
      if (status === 'cancelled') {
        session.cancelledBy = req.user._id;
        session.cancelledAt = new Date();
        // Note: cancellationReason should be set via cancelSession endpoint, not updateSession
      }
    }
    if (metadata !== undefined) {
      // Merge metadata if it's an object
      if (typeof metadata === 'object' && !Array.isArray(metadata)) {
        Object.keys(metadata).forEach(key => {
          session.metadata.set(key, metadata[key]);
        });
      }
    }

    // Validate endTime is after startTime
    if (session.endTime <= session.startTime) {
      throw new AppError(
        ERROR_CODES.SESSION.INVALID_TIME,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Validate teacher if updated
    if (teacher) {
      const teacherDoc = await User.findById(teacher).populate('roles');
      if (!teacherDoc) {
        throw new AppError(
          ERROR_CODES.USER.NOT_FOUND,
          HTTP_STATUS.NOT_FOUND,
          { message: 'Teacher not found' }
        );
      }

      const hasTeacherRole = teacherDoc.roles.some(role => role.name === 'teacher');
      if (!hasTeacherRole) {
        throw new AppError(
          ERROR_CODES.VALIDATION.INVALID_ROLE,
          HTTP_STATUS.BAD_REQUEST,
          { message: 'User does not have teacher role' }
        );
      }
    }

    // Add history entry if there were changes
    if (Object.keys(changes).length > 0) {
      session.history.push({
        action: 'updated',
        performedBy: req.user._id,
        performedAt: new Date(),
        previousStatus,
        newStatus: session.status,
        changes
      });
    }

    await session.save();

    // Populate references
    await session.populate('focusOne', 'description student');
    await session.populate('cohort', 'name slug');
    await session.populate('subject', 'name description');
    await session.populate('teacher', 'name email');
    await session.populate('history.performedBy', 'name email');

    successResponse(res, session, 'Session updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Session (soft delete)
 */
const deleteSession = async (req, res, next) => {
  try {
    const { id } = req.params;

    const session = await Session.findById(id);
    if (!session) {
      throw new AppError(
        ERROR_CODES.SESSION.NOT_FOUND,
        HTTP_STATUS.NOT_FOUND
      );
    }

    // Add history entry before deleting
    session.history.push({
      action: 'cancelled',
      performedBy: req.user._id,
      performedAt: new Date(),
      previousStatus: session.status,
      newStatus: 'cancelled',
      notes: 'Session soft deleted'
    });

    await session.softDelete();

    successResponse(res, null, 'Session deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Restore Session
 */
const restoreSession = async (req, res, next) => {
  try {
    const { id } = req.params;

    const sessions = await Session.findDeleted({ _id: id });
    const session = sessions[0];
    if (!session) {
      throw new AppError(
        ERROR_CODES.SESSION.NOT_FOUND,
        HTTP_STATUS.NOT_FOUND
      );
    }

    await session.restore();

    // Populate references
    await session.populate('focusOne', 'description student');
    await session.populate('cohort', 'name slug');
    await session.populate('subject', 'name description');
    await session.populate('teacher', 'name email');
    await session.populate('history.performedBy', 'name email');

    successResponse(res, session, 'Session restored successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get deleted Sessions
 */
const getDeletedSessions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const sessions = await Session.findDeleted()
      .populate('focusOne', 'description student')
      .populate('cohort', 'name slug')
      .populate('subject', 'name description')
      .populate('teacher', 'name email')
      .populate('requestedBy', 'name email')
      .populate('acceptedBy', 'name email')
      .populate('rejectedBy', 'name email')
      .populate('cancelledBy', 'name email')
      .sort({ deletedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Session.countDeleted();

    successResponse(res, {
      sessions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    }, 'Deleted sessions retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Request a new Session (Student endpoint)
 */
const requestSession = async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const { title, description, startTime, endTime, focusOne, subject } = req.body;

    // Validate subject is provided
    if (!subject) {
      throw new AppError(
        ERROR_CODES.VALIDATION.GENERAL,
        HTTP_STATUS.BAD_REQUEST,
        { message: 'Subject is required for session requests' }
      );
    }

    // Get subject details for auto-generating title if not provided
    const Subject = require('../models').Subject;
    const subjectDoc = await Subject.findById(subject);
    if (!subjectDoc) {
      throw new AppError(
        ERROR_CODES.SUBJECT.NOT_FOUND,
        HTTP_STATUS.NOT_FOUND
      );
    }

    // Validate that focusOne is provided (sessions requests are only for FocusOne)
    if (!focusOne) {
      throw new AppError(
        ERROR_CODES.SESSION.ASSOCIATION_REQUIRED,
        HTTP_STATUS.BAD_REQUEST,
        { message: 'Session request must be associated with a Focus One' }
      );
    }

    // Validate focusOne exists and belongs to the student
    const focusOneDoc = await FocusOne.findById(focusOne)
      .populate('teacherSubjectMappings.teacher', 'name email')
      .populate('teacherSubjectMappings.subject', 'name description')
      .populate('student', 'name email');
    
    if (!focusOneDoc) {
      throw new AppError(
        ERROR_CODES.FOCUS_ONE.NOT_FOUND,
        HTTP_STATUS.NOT_FOUND
      );
    }

    // Verify the student owns this FocusOne
    if (focusOneDoc.student._id.toString() !== studentId.toString()) {
      throw new AppError(
        ERROR_CODES.FOCUS_ONE.NOT_FOUND,
        HTTP_STATUS.FORBIDDEN,
        { message: 'You do not have access to this Focus One' }
      );
    }

    // Check if program is active (not paused or cancelled)
    if (focusOneDoc.status !== 'active') {
      throw new AppError(
        ERROR_CODES.SESSION.INVALID_TIME,
        HTTP_STATUS.BAD_REQUEST,
        { message: 'Cannot request sessions for a paused or cancelled program' }
      );
    }

    // Check if program is active (isActive flag)
    if (!focusOneDoc.isActive) {
      throw new AppError(
        ERROR_CODES.SESSION.INVALID_TIME,
        HTTP_STATUS.BAD_REQUEST,
        { message: 'Cannot request sessions for an inactive program' }
      );
    }

    // TODO: Re-enable in production - Check if program has started (if startedAt exists, session must be after it)
    // if (focusOneDoc.startedAt) {
    //   const sessionStartDate = new Date(startTime);
    //   const programStartDate = new Date(focusOneDoc.startedAt);
    //   programStartDate.setHours(0, 0, 0, 0);
    //   
    //   const sessionDate = new Date(sessionStartDate);
    //   sessionDate.setHours(0, 0, 0, 0);
    //   
    //   if (sessionDate < programStartDate) {
    //     throw new AppError(
    //       ERROR_CODES.SESSION.INVALID_TIME,
    //       HTTP_STATUS.BAD_REQUEST,
    //       { message: 'Cannot request sessions before the program start date' }
    //     );
    //   }
    // }

    // Check if there are teachers assigned
    if (!focusOneDoc.teacherSubjectMappings || focusOneDoc.teacherSubjectMappings.length === 0) {
      throw new AppError(
        ERROR_CODES.VALIDATION.GENERAL,
        HTTP_STATUS.BAD_REQUEST,
        { message: 'No teachers assigned to this Focus One program' }
      );
    }

    // Extract unique teachers from mappings
    const uniqueTeachers = [...new Map(
      focusOneDoc.teacherSubjectMappings.map(m => [
        m.teacher._id.toString(),
        m.teacher
      ])
    ).values()];

    // Validate endTime is after startTime
    if (endTime <= startTime) {
      throw new AppError(
        ERROR_CODES.SESSION.INVALID_TIME,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Validate session date (at least one day after program start date, and at least one day from today)
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    const sessionDay = new Date(startDate);
    sessionDay.setHours(0, 0, 0, 0);
    
    // Check if session is on the same day (not allowed - must be at least one day in advance)
    if (sessionDay.getTime() === today.getTime()) {
      throw new AppError(
        ERROR_CODES.SESSION.INVALID_TIME,
        HTTP_STATUS.BAD_REQUEST,
        { message: 'Sessions must be scheduled at least one day in advance' }
      );
    }
    
    // Check if session is in the past
    if (sessionDay < today) {
      throw new AppError(
        ERROR_CODES.SESSION.INVALID_TIME,
        HTTP_STATUS.BAD_REQUEST,
        { message: 'Cannot schedule sessions in the past' }
      );
    }
    
    // Check if session is at least one day after program start date (if start date exists)
    if (focusOneDoc.startedAt) {
      const programStartDate = new Date(focusOneDoc.startedAt);
      programStartDate.setHours(0, 0, 0, 0);
      
      // Calculate minimum allowed date (one day after program start)
      const minAllowedDate = new Date(programStartDate);
      minAllowedDate.setDate(programStartDate.getDate() + 1);
      
      // Skip Sundays for minimum date
      if (minAllowedDate.getDay() === 0) {
        minAllowedDate.setDate(minAllowedDate.getDate() + 1);
      }
      
      // Ensure minimum is at least tomorrow
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      if (tomorrow.getDay() === 0) {
        tomorrow.setDate(tomorrow.getDate() + 1);
      }
      
      const actualMinDate = minAllowedDate > tomorrow ? minAllowedDate : tomorrow;
      
      if (sessionDay < actualMinDate) {
        const minDateFormatted = actualMinDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        throw new AppError(
          ERROR_CODES.SESSION.INVALID_TIME,
          HTTP_STATUS.BAD_REQUEST,
          { message: `Sessions can only be scheduled from ${minDateFormatted} onwards (at least one day after program start date)` }
        );
      }
    }
    
    // Check if session is on Sunday
    if (startDate.getDay() === 0) {
      throw new AppError(
        ERROR_CODES.SESSION.INVALID_TIME,
        HTTP_STATUS.BAD_REQUEST,
        { message: 'Sessions cannot be scheduled on Sundays' }
      );
    }
    
    // Check if start and end times are on the same day
    if (startDate.toDateString() !== endDate.toDateString()) {
      throw new AppError(
        ERROR_CODES.SESSION.INVALID_TIME,
        HTTP_STATUS.BAD_REQUEST,
        { message: 'Session must start and end on the same day' }
      );
    }
    
    // Validate start time is between 9 AM and 7:45 PM (75 minutes before 9 PM)
    const startHour = startDate.getHours();
    const startMinute = startDate.getMinutes();
    if (startHour < 9 || (startHour > 19) || (startHour === 19 && startMinute > 45)) {
      throw new AppError(
        ERROR_CODES.SESSION.INVALID_TIME,
        HTTP_STATUS.BAD_REQUEST,
        { message: 'Session start time must be between 9 AM and 7:45 PM' }
      );
    }
    
    // Validate end time is between 9 AM and 9 PM
    const endHour = endDate.getHours();
    if (endHour < 9 || endHour > 21) {
      throw new AppError(
        ERROR_CODES.SESSION.INVALID_TIME,
        HTTP_STATUS.BAD_REQUEST,
        { message: 'Session end time must be between 9 AM and 9 PM' }
      );
    }
    
    // If end time is 9 PM, ensure it's exactly 9 PM (not later)
    if (endHour === 21 && endDate.getMinutes() > 0) {
      throw new AppError(
        ERROR_CODES.SESSION.INVALID_TIME,
        HTTP_STATUS.BAD_REQUEST,
        { message: 'Session cannot extend beyond 9 PM' }
      );
    }

    // Check teacher availability for the requested subject
    // Find teachers assigned to this subject in the focusOne
    const subjectTeachers = focusOneDoc.teacherSubjectMappings
      .filter(mapping => mapping.subject._id.toString() === subject.toString())
      .map(mapping => mapping.teacher._id.toString());

    if (subjectTeachers.length === 0) {
      throw new AppError(
        ERROR_CODES.VALIDATION.GENERAL,
        HTTP_STATUS.BAD_REQUEST,
        { message: 'No teachers assigned to this subject for your Focus One program' }
      );
    }

    // Check student session limits for the day (using sessionDay already calculated above)
    const sessionDayEnd = new Date(sessionDay);
    sessionDayEnd.setHours(23, 59, 59, 999);

    // Check if student already has a session for the same subject on the same day
    const existingSubjectSession = await Session.findOne({
      focusOne,
      subject,
      requestedBy: studentId,
      startTime: { $gte: sessionDay, $lte: sessionDayEnd },
      status: { $in: ['requested', 'accepted', 'scheduled', 'ongoing'] },
      deletedAt: null
    });

    if (existingSubjectSession) {
      throw new AppError(
        ERROR_CODES.SESSION.INVALID_TIME,
        HTTP_STATUS.BAD_REQUEST,
        { message: 'You have already scheduled a session for this subject on this day. Only one session per subject per day is allowed.' }
      );
    }

    // Check if student has reached the maximum of 3 sessions per day
    const studentSessionsCount = await Session.countDocuments({
      focusOne,
      startTime: { $gte: sessionDay, $lte: sessionDayEnd },
      status: { $in: ['requested', 'accepted', 'scheduled', 'ongoing'] },
      deletedAt: null
    });

    if (studentSessionsCount >= 3) {
      throw new AppError(
        ERROR_CODES.SESSION.INVALID_TIME,
        HTTP_STATUS.BAD_REQUEST,
        { message: 'You have reached the maximum limit of 3 sessions per day. Please choose a different date.' }
      );
    }

    // Check if at least one teacher has availability (also checks for conflicting requested sessions)
    const availabilityCheck = await checkMultipleTeachersAvailability(
      subjectTeachers,
      new Date(startTime),
      new Date(endTime),
      subject
    );

    if (!availabilityCheck.available) {
      throw new AppError(
        ERROR_CODES.SESSION.INVALID_TIME,
        HTTP_STATUS.BAD_REQUEST,
        { message: availabilityCheck.reason }
      );
    }

    // Auto-generate title if not provided
    let sessionTitle = title;
    if (!sessionTitle || !sessionTitle.trim()) {
      const subjectName = subjectDoc.name || 'Session';
      const sessionDate = new Date(startTime);
      const dateStr = sessionDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const timeStr = sessionDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      sessionTitle = `${subjectName} Session - ${dateStr} at ${timeStr}`;
    }

    // Create session request
    const session = new Session({
      title: sessionTitle.trim(),
      description: description || null,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      focusOne,
      subject: subject || null,
      teacher: null, // Will be assigned when a teacher accepts
      status: 'requested',
      requestedBy: studentId,
      requestedAt: new Date(),
      history: [{
        action: 'requested',
        performedBy: studentId,
        performedAt: new Date(),
        newStatus: 'requested',
        notes: `Session requested by student`
      }]
    });

    await session.save();

    // Get admin frontend URL for accept/reject links
    const adminFrontendUrl = process.env.ADMIN_FRONTEND_URL || process.env.CLASSROOM_FRONTEND_URL || 'http://localhost:5173';

    // Format session date/time
    const sessionDate = new Date(startTime).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const sessionStartTime = new Date(startTime).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    const sessionEndTime = new Date(endTime).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    const sessionDateTime = `${sessionDate} from ${sessionStartTime} to ${sessionEndTime}`;
    
    const durationMinutes = Math.round((new Date(endTime) - new Date(startTime)) / (1000 * 60));
    const sessionDuration = durationMinutes >= 60 
      ? `${Math.floor(durationMinutes / 60)} hour${Math.floor(durationMinutes / 60) > 1 ? 's' : ''} ${durationMinutes % 60 > 0 ? `${durationMinutes % 60} minute${durationMinutes % 60 > 1 ? 's' : ''}` : ''}`.trim()
      : `${durationMinutes} minute${durationMinutes > 1 ? 's' : ''}`;

    // Get student name/email
    const studentRef = focusOneDoc.student._id || focusOneDoc.student;
    const studentDoc = await User.findById(studentRef);
    const studentName = studentDoc?.name || studentDoc?.email || 'Student';

    // Get subject name if provided
    let subjectName = null;
    if (subject) {
      const subjectDoc = await require('../models').Subject.findById(subject);
      subjectName = subjectDoc?.name || null;
    }

    // Send email to all teachers
    const emailPromises = uniqueTeachers.map(async (teacher) => {
      const teacherRef = teacher._id || teacher;
      const teacherDoc = await User.findById(teacherRef);
      if (!teacherDoc || !teacherDoc.email) {
        return; // Skip if teacher not found or no email
      }

      const loginUrl = `${adminFrontendUrl}/login`;

      try {
        await sendEmail({
          to: teacherDoc.email,
          subject: `New Session Request from ${studentName}`,
          template: 'sessions/session-request',
          context: {
            teacherName: teacherDoc.name || 'Teacher',
            studentName,
            sessionTitle: title,
            sessionDescription: description || '',
            sessionDateTime,
            sessionDuration,
            subjectName: subjectName || 'Not specified',
            loginUrl,
            currentYear: new Date().getFullYear()
          }
        });
      } catch (emailError) {
        // Log error but don't fail the request
        console.error(`Failed to send email to teacher ${teacherDoc.email}:`, emailError);
      }
    });

    await Promise.allSettled(emailPromises);

    // Populate references for response
    await session.populate('focusOne', 'description student');
    await session.populate('requestedBy', 'name email');
    await session.populate('subject', 'name description');
    await session.populate('history.performedBy', 'name email');

    successResponse(res, session, 'Session request created and notifications sent to teachers', HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

/**
 * Get Session Requests for Teacher (Teacher endpoint)
 */
const getTeacherSessionRequests = async (req, res, next) => {
  try {
    const teacherId = req.user._id;
    const { page = 1, limit = 10, status, subject, date, search } = req.query;

    // Verify user has teacher role
    const teacher = await User.findById(teacherId).populate('roles');
    const hasTeacherRole = teacher.roles.some(role => role.name === 'teacher');
    if (!hasTeacherRole) {
      throw new AppError(
        ERROR_CODES.VALIDATION.INVALID_ROLE,
        HTTP_STATUS.BAD_REQUEST,
        { message: 'User does not have teacher role' }
      );
    }

    // Build query for sessions where teacher is assigned to the FocusOne
    const query = {
      focusOne: { $exists: true },
      deletedAt: null
    };

    // Status filter - default to 'requested' if not specified
    if (status) {
      query.status = status;
    } else {
      query.status = 'requested';
    }

    // Find all FocusOnes where this teacher is assigned
    const focusOnes = await FocusOne.find({
      'teacherSubjectMappings.teacher': teacherId,
      deletedAt: null
    }).select('_id');

    const focusOneIds = focusOnes.map(f => f._id);

    // Find sessions for these FocusOnes
    query.focusOne = { $in: focusOneIds };

    // Subject filter
    if (subject) {
      query.subject = subject;
    }

    // Date filter - filter sessions for a specific date
    if (date) {
      const filterDate = new Date(date);
      const startOfDay = new Date(filterDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(filterDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      query.startTime = {
        $gte: startOfDay,
        $lte: endOfDay
      };
    }

    // Search filter - search in session title and student name/email
    if (search && search.trim()) {
      const searchTerm = search.trim();
      
      // First, find users (students) whose name or email matches the search term
      const matchingUsers = await User.find({
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { email: { $regex: searchTerm, $options: 'i' } }
        ]
      }).select('_id');
      
      const matchingUserIds = matchingUsers.map(u => u._id);
      
      // Build search query using $or to search in title or requestedBy
      const searchConditions = [
        { title: { $regex: searchTerm, $options: 'i' } }
      ];
      
      // If we found matching users, also search by requestedBy
      if (matchingUserIds.length > 0) {
        searchConditions.push({ requestedBy: { $in: matchingUserIds } });
      }
      
      // If there are multiple conditions, use $or; otherwise use the single condition
      if (searchConditions.length > 1) {
        query.$or = searchConditions;
      } else {
        Object.assign(query, searchConditions[0]);
      }
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get sessions
    const sessions = await Session.find(query)
      .populate('focusOne', 'description student')
      .populate('focusOne.student', 'name email')
      .populate('subject', 'name description')
      .populate('requestedBy', 'name email')
      .sort({ requestedAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Get total count
    const total = await Session.countDocuments(query);

    successResponse(res, {
      sessions,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum
      }
    }, 'Session requests retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Accept Session Request (Teacher endpoint)
 */
const acceptSessionRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const teacherId = req.user._id;
    const { title, description } = req.body;

    const session = await Session.findById(id)
      .populate({
        path: 'focusOne',
        select: 'student teacherSubjectMappings',
        populate: [
          {
            path: 'teacherSubjectMappings.teacher',
            select: 'name email'
          },
          {
            path: 'teacherSubjectMappings.subject',
            select: 'name description'
          }
        ]
      })
      .populate('requestedBy', 'name email')
      .populate('subject', 'name description');

    if (!session) {
      throw new AppError(
        ERROR_CODES.SESSION.NOT_FOUND,
        HTTP_STATUS.NOT_FOUND
      );
    }

    if (session.status !== 'requested') {
      throw new AppError(
        ERROR_CODES.VALIDATION.GENERAL,
        HTTP_STATUS.BAD_REQUEST,
        { message: 'Session request is not in requested status' }
      );
    }

    // Verify teacher is assigned to this FocusOne
    if (!session.focusOne) {
      throw new AppError(
        ERROR_CODES.SESSION.ASSOCIATION_REQUIRED,
        HTTP_STATUS.BAD_REQUEST,
        { message: 'Session must be associated with a Focus One' }
      );
    }

    // Verify teacher is assigned to this FocusOne
    // Use the same approach as getTeacherSessionRequests - query FocusOne directly
    const FocusOne = require('../models').FocusOne;
    const focusOneId = session.focusOne._id || session.focusOne;
    
    // Check if this FocusOne has the teacher in teacherSubjectMappings
    const focusOneDoc = await FocusOne.findOne({
      _id: focusOneId,
      'teacherSubjectMappings.teacher': teacherId,
      deletedAt: null
    });
    
    if (!focusOneDoc) {
      throw new AppError(
        ERROR_CODES.PERMISSION.FORBIDDEN,
        HTTP_STATUS.FORBIDDEN,
        { message: 'You are not assigned to this Focus One program' }
      );
    }
    
    // If session has a subject, verify teacher is assigned to that specific subject
    if (session.subject) {
      const sessionSubjectId = (session.subject._id || session.subject).toString();
      const teacherSubjectMapping = focusOneDoc.teacherSubjectMappings.find(
        m => {
          const mappingTeacherId = m.teacher.toString();
          const mappingSubjectId = m.subject.toString();
          return mappingTeacherId === teacherId.toString() && mappingSubjectId === sessionSubjectId;
        }
      );
      
      if (!teacherSubjectMapping) {
        throw new AppError(
          ERROR_CODES.PERMISSION.FORBIDDEN,
          HTTP_STATUS.FORBIDDEN,
          { message: 'You are not assigned to teach this subject for this Focus One program' }
        );
      }
    }

    // Verify user has teacher role
    const teacher = await User.findById(teacherId).populate('roles');
    const hasTeacherRole = teacher.roles.some(role => role.name === 'teacher');
    if (!hasTeacherRole) {
      throw new AppError(
        ERROR_CODES.VALIDATION.INVALID_ROLE,
        HTTP_STATUS.BAD_REQUEST,
        { message: 'User does not have teacher role' }
      );
    }

    // Check if teacher has availability for this session time slot
    const availabilityCheck = await checkTeacherAvailability(
      teacherId,
      session.startTime,
      session.endTime
    );

    if (!availabilityCheck.available) {
      throw new AppError(
        ERROR_CODES.SESSION.INVALID_TIME,
        HTTP_STATUS.BAD_REQUEST,
        { message: availabilityCheck.reason }
      );
    }

    // Accept the session
    session.teacher = teacherId;
    session.status = 'scheduled';
    session.acceptedBy = teacherId;
    session.acceptedAt = new Date();
    
    // Update title and description if provided by teacher
    if (title !== undefined && title !== null && title.trim() !== '') {
      session.title = title.trim();
    }
    if (description !== undefined && description !== null) {
      session.description = description.trim() || undefined;
    }
    
    // Automatically create Jitsi Meet link
    // No authentication needed - always works
    const studentEmail = session.requestedBy?.email;
    const teacherEmail = teacher.email;
    
    console.log('=== Accept Session - Meet Link Creation ===');
    console.log('Student email:', studentEmail);
    console.log('Teacher email:', teacherEmail);
    
    // Create Jitsi Meet link - no authentication needed, always works
    let meetResult;
    try {
      meetResult = await createMeetingLink({
        title: session.title,
        description: session.description || '',
        startTime: session.startTime,
        endTime: session.endTime,
        teacherEmail: teacherEmail,
        studentEmail: studentEmail
      });
      console.log(`Jitsi Meet link created successfully:`, meetResult.meetingLink);
    } catch (meetError) {
      console.error('=== Error creating meeting link ===');
      console.error('Error message:', meetError.message);
      console.error('Error stack:', meetError.stack);
      
      // Re-throw as AppError with proper status code
      throw new AppError(
        ERROR_CODES.VALIDATION.GENERAL,
        HTTP_STATUS.BAD_REQUEST,
        { 
          message: `Failed to create meeting link: ${meetError.message}`,
          originalError: meetError.message
        }
      );
    }
    
    session.meetingLink = meetResult.meetingLink;
    session.meetingPlatform = 'jitsi-meet';

    // Ensure startTime and endTime are Date objects before saving
    // This prevents validation errors that can occur when dates are stored as strings or have timezone issues
    if (session.startTime && !(session.startTime instanceof Date)) {
      session.startTime = new Date(session.startTime);
    }
    if (session.endTime && !(session.endTime instanceof Date)) {
      session.endTime = new Date(session.endTime);
    }

    // Validate dates are valid and endTime is after startTime
    if (!session.startTime || !session.endTime || isNaN(session.startTime.getTime()) || isNaN(session.endTime.getTime())) {
      throw new AppError(
        ERROR_CODES.SESSION.INVALID_TIME,
        HTTP_STATUS.BAD_REQUEST,
        { message: 'Session start time and end time must be valid dates' }
      );
    }

    if (session.endTime <= session.startTime) {
      throw new AppError(
        ERROR_CODES.SESSION.INVALID_TIME,
        HTTP_STATUS.BAD_REQUEST,
        { message: 'Session end time must be after start time' }
      );
    }

    // Add history entry
    const previousStatus = 'requested';
    session.history.push({
      action: 'accepted',
      performedBy: teacherId,
      performedAt: new Date(),
      previousStatus,
      newStatus: 'scheduled',
      notes: `Session request accepted by teacher with Jitsi Meet link`
    });

    await session.save();

    // Check if teacher has now reached 4 sessions for this day
    // If so, auto-reject all other pending requests for this teacher on this day
    const sessionDayStart = new Date(session.startTime);
    sessionDayStart.setHours(0, 0, 0, 0);
    const sessionDayEnd = new Date(sessionDayStart);
    sessionDayEnd.setHours(23, 59, 59, 999);

    // Get count of accepted/scheduled sessions for this teacher on this day
    const teacherSessionsCount = await Session.countDocuments({
      teacher: teacherId,
      startTime: { $gte: sessionDayStart, $lte: sessionDayEnd },
      status: { $in: ['accepted', 'scheduled', 'ongoing'] },
      deletedAt: null
    });

    // If teacher now has 4 sessions, auto-reject all pending requests for this teacher on this day
    if (teacherSessionsCount >= 4) {
      // Find all FocusOnes where this teacher is assigned (not just the one from the accepted session)
      const allFocusOnes = await FocusOne.find({
        'teacherSubjectMappings.teacher': teacherId,
        deletedAt: null
      }).select('_id');

      const allFocusOneIds = allFocusOnes.map(f => f._id);

      // Get all pending requests for these FocusOnes on this day
      const pendingRequests = await Session.find({
        teacher: null, // Not yet assigned
        startTime: { $gte: sessionDayStart, $lte: sessionDayEnd },
        status: 'requested',
        deletedAt: null,
        focusOne: { $in: allFocusOneIds }
      }).populate({
        path: 'focusOne',
        select: 'teacherSubjectMappings',
        populate: [
          {
            path: 'teacherSubjectMappings.teacher',
            select: '_id'
          },
          {
            path: 'teacherSubjectMappings.subject',
            select: '_id'
          }
        ]
      });

      // Filter to only requests where this teacher could potentially accept them
      const requestsForThisTeacher = pendingRequests.filter(pendingSession => {
        if (!pendingSession.focusOne || !pendingSession.focusOne.teacherSubjectMappings) {
          return false;
        }
        
        const teacherSubjectMapping = pendingSession.focusOne.teacherSubjectMappings.find(
          m => {
            const mappingTeacherId = (m.teacher._id || m.teacher).toString();
            const mappingSubjectId = (m.subject._id || m.subject).toString();
            const pendingSubjectId = pendingSession.subject 
              ? (pendingSession.subject._id || pendingSession.subject).toString() 
              : null;
            return mappingTeacherId === teacherId.toString() && 
                   (pendingSubjectId === null || mappingSubjectId === pendingSubjectId);
          }
        );
        
        return !!teacherSubjectMapping;
      });

      // Auto-reject these pending requests
      const rejectionPromises = requestsForThisTeacher.map(async (pendingSession) => {
        pendingSession.status = 'rejected';
        pendingSession.rejectedBy = teacherId;
        pendingSession.rejectedAt = new Date();
        pendingSession.rejectionReason = 'Number of classes exceeded for this teacher on this day. Maximum of 4 sessions per day allowed.';
        
        pendingSession.history.push({
          action: 'rejected',
          performedBy: teacherId,
          performedAt: new Date(),
          previousStatus: 'requested',
          newStatus: 'rejected',
          notes: 'Automatically rejected: Number of classes exceeded for this teacher on this day. Maximum of 4 sessions per day allowed.'
        });
        
        return pendingSession.save();
      });

      await Promise.allSettled(rejectionPromises);

      // Send rejection emails to students (if needed)
      // Note: We'll do this in the background to not delay the response
      if (requestsForThisTeacher.length > 0) {
        const User = require('../models').User;
        const teacherDoc = await User.findById(teacherId);
        
        requestsForThisTeacher.forEach(async (rejectedSession) => {
          try {
            await rejectedSession.populate('requestedBy', 'name email');
            await rejectedSession.populate('subject', 'name description');
            
            if (rejectedSession.requestedBy && rejectedSession.requestedBy.email) {
              const studentName = rejectedSession.requestedBy.name || rejectedSession.requestedBy.email || 'Student';
              const teacherName = teacherDoc?.name || teacherDoc?.email || 'Teacher';
              const sessionDate = new Date(rejectedSession.startTime).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              });
              const sessionTime = new Date(rejectedSession.startTime).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              });
              const subjectName = rejectedSession.subject?.name || 'Not specified';

              const classroomFrontendUrl = process.env.CLASSROOM_FRONTEND_URL || 'http://localhost:5173';
              const sessionsUrl = `${classroomFrontendUrl}/app/live-sessions`;

              await sendEmail({
                to: rejectedSession.requestedBy.email,
                subject: `Session Request Rejected - ${rejectedSession.title}`,
                template: 'sessions/session-rejected',
                context: {
                  studentName,
                  teacherName,
                  sessionTitle: rejectedSession.title,
                  sessionDescription: rejectedSession.description || '',
                  sessionDate,
                  sessionTime,
                  subjectName,
                  rejectionReason: rejectedSession.rejectionReason,
                  sessionsUrl,
                  currentYear: new Date().getFullYear()
                }
              });
            }
          } catch (emailError) {
            console.error(`Failed to send rejection email for session ${rejectedSession._id}:`, emailError);
          }
        });
      }
    }

    // Populate references for response
    await session.populate('focusOne', 'description student');
    await session.populate('teacher', 'name email');
    await session.populate('subject', 'name description');
    await session.populate('requestedBy', 'name email');
    await session.populate('acceptedBy', 'name email');
    await session.populate('history.performedBy', 'name email');

    // Send emails to both student and teacher
    const classroomFrontendUrl = process.env.CLASSROOM_FRONTEND_URL || 'http://localhost:5173';
    const sessionsUrl = `${classroomFrontendUrl}/app/live-sessions`;

    // Format session date/time
    const sessionDate = new Date(session.startTime).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const sessionStartTime = new Date(session.startTime).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    const sessionEndTime = new Date(session.endTime).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    const sessionDateTime = `${sessionDate} from ${sessionStartTime} to ${sessionEndTime}`;

    // Send email to student
    if (session.requestedBy && session.requestedBy.email) {
      try {
        const studentName = session.requestedBy.name || session.requestedBy.email || 'Student';
        const teacherName = teacher.name || teacher.email || 'Teacher';
        const subjectName = session.subject?.name || 'Not specified';

        await sendEmail({
          to: session.requestedBy.email,
          subject: `Session Accepted - ${session.title}`,
          template: 'sessions/session-accepted',
          context: {
            studentName,
            teacherName,
            sessionTitle: session.title,
            sessionDescription: session.description || '',
            sessionDate,
            sessionStartTime,
            sessionEndTime,
            sessionDateTime,
            subjectName,
            meetingLink: session.meetingLink,
            meetingPlatform: session.meetingPlatform || 'jitsi-meet',
            sessionsUrl,
            currentYear: new Date().getFullYear()
          }
        });
      } catch (emailError) {
        console.error(`Failed to send acceptance email to student ${session.requestedBy.email}:`, emailError);
      }
    }

    // Send email to teacher
    if (teacher && teacher.email) {
      try {
        const teacherName = teacher.name || teacher.email || 'Teacher';
        const studentName = session.requestedBy?.name || session.requestedBy?.email || 'Student';
        const subjectName = session.subject?.name || 'Not specified';

        await sendEmail({
          to: teacher.email,
          subject: `Session Scheduled - ${session.title}`,
          template: 'sessions/session-accepted-teacher',
          context: {
            teacherName,
            studentName,
            sessionTitle: session.title,
            sessionDescription: session.description || '',
            sessionDate,
            sessionStartTime,
            sessionEndTime,
            sessionDateTime,
            subjectName,
            meetingLink: session.meetingLink,
            meetingPlatform: session.meetingPlatform || 'jitsi-meet',
            currentYear: new Date().getFullYear()
          }
        });
      } catch (emailError) {
        console.error(`Failed to send acceptance email to teacher ${teacher.email}:`, emailError);
      }
    }

    successResponse(res, session, 'Session request accepted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Reject Session Request (Teacher endpoint)
 */
const rejectSessionRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const teacherId = req.user._id;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      throw new AppError(
        ERROR_CODES.VALIDATION.GENERAL,
        HTTP_STATUS.BAD_REQUEST,
        { message: 'Rejection reason is required' }
      );
    }

    const session = await Session.findById(id)
      .populate('focusOne', 'student')
      .populate('requestedBy', 'name email')
      .populate('subject', 'name description');

    if (!session) {
      throw new AppError(
        ERROR_CODES.SESSION.NOT_FOUND,
        HTTP_STATUS.NOT_FOUND
      );
    }

    if (session.status !== 'requested') {
      throw new AppError(
        ERROR_CODES.VALIDATION.GENERAL,
        HTTP_STATUS.BAD_REQUEST,
        { message: 'Session request is not in requested status' }
      );
    }

    // Verify teacher is assigned to this FocusOne
    if (!session.focusOne) {
      throw new AppError(
        ERROR_CODES.SESSION.ASSOCIATION_REQUIRED,
        HTTP_STATUS.BAD_REQUEST,
        { message: 'Session must be associated with a Focus One' }
      );
    }

    // Verify teacher is assigned to this FocusOne
    // Use the same approach as acceptSessionRequest - query FocusOne directly
    const FocusOne = require('../models').FocusOne;
    const focusOneId = session.focusOne._id || session.focusOne;
    
    // Check if this FocusOne has the teacher in teacherSubjectMappings
    const focusOneDoc = await FocusOne.findOne({
      _id: focusOneId,
      'teacherSubjectMappings.teacher': teacherId,
      deletedAt: null
    });
    
    if (!focusOneDoc) {
      throw new AppError(
        ERROR_CODES.PERMISSION.FORBIDDEN,
        HTTP_STATUS.FORBIDDEN,
        { message: 'You are not assigned to this Focus One program' }
      );
    }
    
    // If session has a subject, verify teacher is assigned to that specific subject
    if (session.subject) {
      const sessionSubjectId = (session.subject._id || session.subject).toString();
      const teacherSubjectMapping = focusOneDoc.teacherSubjectMappings.find(
        m => {
          const mappingTeacherId = m.teacher.toString();
          const mappingSubjectId = m.subject.toString();
          return mappingTeacherId === teacherId.toString() && mappingSubjectId === sessionSubjectId;
        }
      );
      
      if (!teacherSubjectMapping) {
        throw new AppError(
          ERROR_CODES.PERMISSION.FORBIDDEN,
          HTTP_STATUS.FORBIDDEN,
          { message: 'You are not assigned to teach this subject for this Focus One program' }
        );
      }
    }

    // Verify user has teacher role
    const teacher = await User.findById(teacherId).populate('roles');
    const hasTeacherRole = teacher.roles.some(role => role.name === 'teacher');
    if (!hasTeacherRole) {
      throw new AppError(
        ERROR_CODES.VALIDATION.INVALID_ROLE,
        HTTP_STATUS.BAD_REQUEST,
        { message: 'User does not have teacher role' }
      );
    }

    // Reject the session
    const previousStatus = session.status;
    session.status = 'rejected';
    session.rejectedBy = teacherId;
    session.rejectedAt = new Date();
    session.rejectionReason = reason.trim();

    // Add history entry
    session.history.push({
      action: 'rejected',
      performedBy: teacherId,
      performedAt: new Date(),
      previousStatus,
      newStatus: 'rejected',
      notes: `Session request rejected by teacher. Reason: ${reason.trim()}`
    });

    await session.save();

    // Send email to student about rejection
    if (session.requestedBy && session.requestedBy.email) {
      try {
        const studentName = session.requestedBy.name || session.requestedBy.email || 'Student';
        const teacherName = teacher.name || teacher.email || 'Teacher';
        const sessionDate = new Date(session.startTime).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        const sessionTime = new Date(session.startTime).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
        const subjectName = session.subject?.name || 'Not specified';

        // Get classroom frontend URL for student dashboard link
        const classroomFrontendUrl = process.env.CLASSROOM_FRONTEND_URL || 'http://localhost:5173';
        const sessionsUrl = `${classroomFrontendUrl}/app/live-sessions`;

        await sendEmail({
          to: session.requestedBy.email,
          subject: `Session Request Rejected - ${session.title}`,
          template: 'sessions/session-rejected',
          context: {
            studentName,
            teacherName,
            sessionTitle: session.title,
            sessionDate,
            sessionTime,
            subjectName,
            rejectionReason: reason.trim(),
            sessionsUrl,
            currentYear: new Date().getFullYear()
          }
        });
      } catch (emailError) {
        // Log error but don't fail the request
        console.error(`Failed to send rejection email to student ${session.requestedBy.email}:`, emailError);
      }
    }

    // Populate references for response
    await session.populate('focusOne', 'description student');
    await session.populate('requestedBy', 'name email');
    await session.populate('rejectedBy', 'name email');
    await session.populate('subject', 'name description');
    await session.populate('history.performedBy', 'name email');

    successResponse(res, session, 'Session request rejected');
  } catch (error) {
    next(error);
  }
};

/**
 * Get available time slots for a teacher/subject on a specific date
 */
const getAvailableSlots = async (req, res, next) => {
  try {
    const { focusOne, subject, date, duration = 75 } = req.query;
    const studentId = req.user._id;

    // Validate required parameters
    if (!focusOne || !subject || !date) {
      throw new AppError(
        ERROR_CODES.VALIDATION.GENERAL,
        HTTP_STATUS.BAD_REQUEST,
        { message: 'focusOne, subject, and date are required' }
      );
    }

    // Validate date format
    const sessionDate = new Date(date);
    if (isNaN(sessionDate.getTime())) {
      throw new AppError(
        ERROR_CODES.VALIDATION.GENERAL,
        HTTP_STATUS.BAD_REQUEST,
        { message: 'Invalid date format' }
      );
    }

    // Validate date is at least one day in advance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const requestedDate = new Date(sessionDate);
    requestedDate.setHours(0, 0, 0, 0);

    if (requestedDate.getTime() === today.getTime()) {
      throw new AppError(
        ERROR_CODES.SESSION.INVALID_TIME,
        HTTP_STATUS.BAD_REQUEST,
        { message: 'Sessions must be scheduled at least one day in advance' }
      );
    }

    if (requestedDate < today) {
      throw new AppError(
        ERROR_CODES.SESSION.INVALID_TIME,
        HTTP_STATUS.BAD_REQUEST,
        { message: 'Cannot get slots for past dates' }
      );
    }

    // Check if date is Sunday
    if (sessionDate.getDay() === 0) {
      throw new AppError(
        ERROR_CODES.SESSION.INVALID_TIME,
        HTTP_STATUS.BAD_REQUEST,
        { message: 'Sessions cannot be scheduled on Sundays' }
      );
    }

    // Validate focusOne exists and belongs to the student
    const focusOneDoc = await FocusOne.findById(focusOne)
      .populate('teacherSubjectMappings.teacher', 'name email')
      .populate('teacherSubjectMappings.subject', 'name description');

    if (!focusOneDoc) {
      throw new AppError(
        ERROR_CODES.FOCUS_ONE.NOT_FOUND,
        HTTP_STATUS.NOT_FOUND
      );
    }

    // Verify the student owns this FocusOne
    if (focusOneDoc.student.toString() !== studentId.toString()) {
      throw new AppError(
        ERROR_CODES.FOCUS_ONE.NOT_FOUND,
        HTTP_STATUS.FORBIDDEN,
        { message: 'You do not have access to this Focus One' }
      );
    }

    // Find teachers assigned to this subject
    const subjectTeachers = focusOneDoc.teacherSubjectMappings
      .filter(mapping => mapping.subject._id.toString() === subject.toString())
      .map(mapping => mapping.teacher._id.toString());

    if (subjectTeachers.length === 0) {
      throw new AppError(
        ERROR_CODES.VALIDATION.GENERAL,
        HTTP_STATUS.BAD_REQUEST,
        { message: 'No teachers assigned to this subject for your Focus One program' }
      );
    }

    // Generate available start times for all teachers and merge them
    // A start time is available if at least one teacher can take it
    const slotDurationMinutes = parseInt(duration);
    const allAvailableTimesSet = new Set();

    for (const teacherId of subjectTeachers) {
      const teacherSlots = await generateAvailableSlots(
        teacherId,
        sessionDate,
        slotDurationMinutes,
        subject
      );

      // Extract start times from slots and add to set (deduplicate)
      for (const slot of teacherSlots) {
        const startTimeKey = slot.startTime.toISOString();
        allAvailableTimesSet.add(startTimeKey);
      }
    }

    // Convert set to array of available start times and sort
    const availableStartTimes = Array.from(allAvailableTimesSet)
      .map(timeStr => new Date(timeStr))
      .sort((a, b) => a.getTime() - b.getTime())
      .map(startTime => {
        const endTime = new Date(startTime.getTime() + slotDurationMinutes * 60 * 1000);
        return {
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          startTimeFormatted: startTime.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          }),
          endTimeFormatted: endTime.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          })
        };
      });

    successResponse(res, {
      date: sessionDate.toISOString().split('T')[0],
      availableSlots: availableStartTimes,
      totalSlots: availableStartTimes.length,
      slotDurationMinutes: slotDurationMinutes
    }, 'Available time slots retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Schedule Session Directly (Teacher endpoint)
 */
const teacherScheduleSession = async (req, res, next) => {
  try {
    const teacherId = req.user._id;
    const { title, description, startTime, endTime, focusOne, subject } = req.body;

    // Verify user has teacher role
    const teacher = await User.findById(teacherId).populate('roles');
    const hasTeacherRole = teacher.roles.some(role => role.name === 'teacher');
    if (!hasTeacherRole) {
      throw new AppError(
        ERROR_CODES.VALIDATION.INVALID_ROLE,
        HTTP_STATUS.BAD_REQUEST,
        { message: 'User does not have teacher role' }
      );
    }

    // Validate required fields
    if (!title || !title.trim()) {
      throw new AppError(
        ERROR_CODES.VALIDATION.GENERAL,
        HTTP_STATUS.BAD_REQUEST,
        { message: 'Session title is required' }
      );
    }

    if (!description || !description.trim()) {
      throw new AppError(
        ERROR_CODES.VALIDATION.GENERAL,
        HTTP_STATUS.BAD_REQUEST,
        { message: 'Session reason/description is required' }
      );
    }

    if (!startTime || !endTime) {
      throw new AppError(
        ERROR_CODES.VALIDATION.GENERAL,
        HTTP_STATUS.BAD_REQUEST,
        { message: 'Start time and end time are required' }
      );
    }

    if (!focusOne) {
      throw new AppError(
        ERROR_CODES.VALIDATION.GENERAL,
        HTTP_STATUS.BAD_REQUEST,
        { message: 'Focus One is required' }
      );
    }

    // Validate focusOne exists and teacher is assigned to it
    const focusOneDoc = await FocusOne.findById(focusOne)
      .populate('teacherSubjectMappings.teacher', 'name email')
      .populate('teacherSubjectMappings.subject', 'name description')
      .populate('student', 'name email');

    if (!focusOneDoc) {
      throw new AppError(
        ERROR_CODES.FOCUS_ONE.NOT_FOUND,
        HTTP_STATUS.NOT_FOUND,
        { message: 'Focus One not found' }
      );
    }

    // Verify teacher is assigned to this FocusOne
    const teacherAssigned = focusOneDoc.teacherSubjectMappings.some(
      mapping => mapping.teacher._id.toString() === teacherId.toString()
    );

    if (!teacherAssigned) {
      throw new AppError(
        ERROR_CODES.PERMISSION.FORBIDDEN,
        HTTP_STATUS.FORBIDDEN,
        { message: 'You are not assigned to this Focus One program' }
      );
    }

    // If subject is provided, verify teacher teaches that subject for this FocusOne
    if (subject) {
      const subjectMapping = focusOneDoc.teacherSubjectMappings.find(
        mapping => 
          mapping.teacher._id.toString() === teacherId.toString() &&
          mapping.subject._id.toString() === subject.toString()
      );

      if (!subjectMapping) {
        throw new AppError(
          ERROR_CODES.PERMISSION.FORBIDDEN,
          HTTP_STATUS.FORBIDDEN,
          { message: 'You are not assigned to teach this subject for this Focus One program' }
        );
      }
    }

    // Validate endTime is after startTime
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    if (endDate <= startDate) {
      throw new AppError(
        ERROR_CODES.SESSION.INVALID_TIME,
        HTTP_STATUS.BAD_REQUEST,
        { message: 'End time must be after start time' }
      );
    }

    // Create session with scheduled status directly
    const session = new Session({
      title: title.trim(),
      description: description.trim(),
      startTime: startDate,
      endTime: endDate,
      focusOne,
      subject: subject || null,
      teacher: teacherId,
      status: 'scheduled',
      history: [{
        action: 'scheduled',
        performedBy: teacherId,
        performedAt: new Date(),
        newStatus: 'scheduled',
        notes: 'Session scheduled directly by teacher'
      }]
    });

    // Create meeting link automatically
    const studentEmail = focusOneDoc.student?.email;
    const teacherEmail = teacher.email;

    let meetResult;
    try {
      meetResult = await createMeetingLink({
        title: session.title,
        description: session.description || '',
        startTime: session.startTime,
        endTime: session.endTime,
        teacherEmail: teacherEmail,
        studentEmail: studentEmail
      });
      session.meetingLink = meetResult.meetingLink;
      session.meetingPlatform = 'jitsi-meet';
    } catch (meetError) {
      console.error('Error creating meeting link:', meetError);
      // Continue without meeting link - it can be added later
    }

    await session.save();

    // Populate references for response
    await session.populate('focusOne', 'description student');
    await session.populate('focusOne.student', 'name email');
    await session.populate('subject', 'name description');
    await session.populate('teacher', 'name email');
    await session.populate('history.performedBy', 'name email');

    successResponse(res, session, 'Session scheduled successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel Session (Student or Teacher endpoint)
 */
const cancelSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      throw new AppError(
        ERROR_CODES.VALIDATION.GENERAL,
        HTTP_STATUS.BAD_REQUEST,
        { message: 'Cancellation reason is required' }
      );
    }

    const session = await Session.findById(id)
      .populate('focusOne', 'student teacherSubjectMappings')
      .populate('requestedBy', 'name email')
      .populate('teacher', 'name email');

    if (!session) {
      throw new AppError(
        ERROR_CODES.SESSION.NOT_FOUND,
        HTTP_STATUS.NOT_FOUND
      );
    }

    // Check if session can be cancelled (not already cancelled or completed)
    if (session.status === 'cancelled') {
      throw new AppError(
        ERROR_CODES.VALIDATION.GENERAL,
        HTTP_STATUS.BAD_REQUEST,
        { message: 'Session is already cancelled' }
      );
    }

    if (session.status === 'completed') {
      throw new AppError(
        ERROR_CODES.VALIDATION.GENERAL,
        HTTP_STATUS.BAD_REQUEST,
        { message: 'Cannot cancel a completed session' }
      );
    }

    // Verify user has permission to cancel (must be student who requested or teacher assigned)
    const isStudent = session.requestedBy && session.requestedBy._id.toString() === userId.toString();
    const isTeacher = session.teacher && session.teacher._id.toString() === userId.toString();
    
    // If not assigned teacher yet, check if user is a teacher assigned to the FocusOne
    let isAssignedTeacher = false;
    if (!isTeacher && session.focusOne && session.focusOne.teacherSubjectMappings) {
      const FocusOne = require('../models').FocusOne;
      const focusOneDoc = await FocusOne.findOne({
        _id: session.focusOne._id,
        'teacherSubjectMappings.teacher': userId,
        deletedAt: null
      });
      isAssignedTeacher = !!focusOneDoc;
    }

    if (!isStudent && !isTeacher && !isAssignedTeacher) {
      throw new AppError(
        ERROR_CODES.PERMISSION.FORBIDDEN,
        HTTP_STATUS.FORBIDDEN,
        { message: 'You do not have permission to cancel this session' }
      );
    }

    // Cancel the session
    // Note: Changing status to 'cancelled' automatically frees up the slot because
    // getTeacherSessionsForDate excludes cancelled sessions from availability checks
    const previousStatus = session.status;
    session.status = 'cancelled';
    session.cancelledBy = userId;
    session.cancelledAt = new Date();
    session.cancellationReason = reason.trim();

    // Add history entry
    session.history.push({
      action: 'cancelled',
      performedBy: userId,
      performedAt: new Date(),
      previousStatus,
      newStatus: 'cancelled',
      notes: `Session cancelled. Reason: ${reason.trim()}`
    });

    await session.save();

    // Send email notifications (similar to rejection flow)
    // Note: Email implementation can be added here if needed

    // Populate references for response
    await session.populate('focusOne', 'description student');
    await session.populate('cancelledBy', 'name email');
    await session.populate('requestedBy', 'name email');
    await session.populate('teacher', 'name email');
    await session.populate('subject', 'name description');

    successResponse(res, session, 'Session cancelled successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Reschedule Session (Student or Teacher endpoint)
 */
const rescheduleSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { startTime, endTime } = req.body;

    if (!startTime || !endTime) {
      throw new AppError(
        ERROR_CODES.VALIDATION.GENERAL,
        HTTP_STATUS.BAD_REQUEST,
        { message: 'Start time and end time are required' }
      );
    }

    const session = await Session.findById(id)
      .populate({
        path: 'focusOne',
        select: 'student teacherSubjectMappings',
        populate: [
          {
            path: 'teacherSubjectMappings.teacher',
            select: 'name email'
          }
        ]
      })
      .populate('requestedBy', 'name email')
      .populate('teacher', 'name email')
      .populate('subject', 'name description');

    if (!session) {
      throw new AppError(
        ERROR_CODES.SESSION.NOT_FOUND,
        HTTP_STATUS.NOT_FOUND
      );
    }

    // Check if session can be rescheduled (not cancelled or completed)
    if (session.status === 'cancelled') {
      throw new AppError(
        ERROR_CODES.VALIDATION.GENERAL,
        HTTP_STATUS.BAD_REQUEST,
        { message: 'Cannot reschedule a cancelled session' }
      );
    }

    if (session.status === 'completed') {
      throw new AppError(
        ERROR_CODES.VALIDATION.GENERAL,
        HTTP_STATUS.BAD_REQUEST,
        { message: 'Cannot reschedule a completed session' }
      );
    }

    // Verify user has permission to reschedule (must be student who requested or teacher assigned)
    const isStudent = session.requestedBy && session.requestedBy._id.toString() === userId.toString();
    const isTeacher = session.teacher && session.teacher._id.toString() === userId.toString();
    
    // If not assigned teacher yet, check if user is a teacher assigned to the FocusOne
    let isAssignedTeacher = false;
    if (!isTeacher && session.focusOne && session.focusOne.teacherSubjectMappings) {
      const FocusOne = require('../models').FocusOne;
      const focusOneDoc = await FocusOne.findOne({
        _id: session.focusOne._id,
        'teacherSubjectMappings.teacher': userId,
        deletedAt: null
      });
      isAssignedTeacher = !!focusOneDoc;
    }

    if (!isStudent && !isTeacher && !isAssignedTeacher) {
      throw new AppError(
        ERROR_CODES.PERMISSION.FORBIDDEN,
        HTTP_STATUS.FORBIDDEN,
        { message: 'You do not have permission to reschedule this session' }
      );
    }

    const newStartTime = new Date(startTime);
    const newEndTime = new Date(endTime);

    // Validate endTime is after startTime
    if (newEndTime <= newStartTime) {
      throw new AppError(
        ERROR_CODES.SESSION.INVALID_TIME,
        HTTP_STATUS.BAD_REQUEST,
        { message: 'End time must be after start time' }
      );
    }

    // If teacher is assigned, check teacher availability for new time slot
    // We need to exclude the current session from the conflict check since we're rescheduling it
    if (session.teacher) {
      const { getTeacherSessionsForDate, hasTimeConflict } = require('../utils/sessionSlots');
      
      // Get existing sessions for the teacher on the new date
      const sessionDate = new Date(newStartTime);
      sessionDate.setHours(0, 0, 0, 0);
      const existingSessions = await getTeacherSessionsForDate(
        session.teacher._id,
        sessionDate,
        session.subject ? session.subject._id.toString() : null
      );

      // Filter out the current session from existing sessions (we're rescheduling it)
      const otherSessions = existingSessions.filter(s => s._id.toString() !== session._id.toString());

      // Check if teacher would exceed max sessions (excluding current session)
      const MAX_SESSIONS_PER_DAY = 4;
      if (otherSessions.length >= MAX_SESSIONS_PER_DAY) {
        throw new AppError(
          ERROR_CODES.SESSION.INVALID_TIME,
          HTTP_STATUS.BAD_REQUEST,
          { message: `Teacher already has ${otherSessions.length} other sessions on this day (maximum: ${MAX_SESSIONS_PER_DAY})` }
        );
      }

      // Check for time conflicts with other sessions (excluding current session)
      if (hasTimeConflict(newStartTime, newEndTime, otherSessions)) {
        throw new AppError(
          ERROR_CODES.SESSION.INVALID_TIME,
          HTTP_STATUS.BAD_REQUEST,
          { message: 'This time slot conflicts with an existing session or does not maintain the required breaks' }
        );
      }
    }

    // Track changes
    const previousStartTime = session.startTime;
    const previousEndTime = session.endTime;
    const changes = {
      startTime: { from: previousStartTime, to: newStartTime },
      endTime: { from: previousEndTime, to: newEndTime }
    };

    // Update session times
    // Note: Changing startTime/endTime automatically frees up the old slot because
    // getTeacherSessionsForDate queries by date range, so the session will no longer
    // appear in the old date's session list, making that slot available again
    session.startTime = newStartTime;
    session.endTime = newEndTime;

    // Add history entry
    session.history.push({
      action: 'updated',
      performedBy: userId,
      performedAt: new Date(),
      previousStatus: session.status,
      newStatus: session.status,
      notes: `Session rescheduled by ${isStudent ? 'student' : 'teacher'}`,
      changes
    });

    await session.save();

    // Populate references for response
    await session.populate('focusOne', 'description student');
    await session.populate('requestedBy', 'name email');
    await session.populate('teacher', 'name email');
    await session.populate('subject', 'name description');
    await session.populate('history.performedBy', 'name email');

    successResponse(res, session, 'Session rescheduled successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSession,
  requestSession,
  getTeacherSessionRequests,
  acceptSessionRequest,
  rejectSessionRequest,
  getAllSessions,
  getSessionById,
  getAvailableSlots,
  updateSession,
  deleteSession,
  restoreSession,
  getDeletedSessions,
  teacherScheduleSession,
  cancelSession,
  rescheduleSession
};

