const Session = require('../models/Session');
const FocusOne = require('../models/FocusOne');

// Constants
const MAX_SESSIONS_PER_DAY = 4;
const BREAK_DURATION_MINUTES = 15;
const WORKING_HOUR_START = 9; // 9 AM
const WORKING_HOUR_END = 21; // 9 PM
const LECTURE_UNAVAILABLE_DURATION_MINUTES = 60; // 1 hour unavailable after back-to-back sessions

/**
 * Get all existing sessions for a teacher on a specific date
 * Includes sessions with status: requested, accepted, scheduled, ongoing
 * Also includes requested sessions that could be assigned to this teacher (same subject)
 * 
 * Note: Cancelled, rejected, and completed sessions are excluded from availability checks,
 * which means their slots are automatically freed up when sessions are cancelled or completed.
 */
const getTeacherSessionsForDate = async (teacherId, date, subjectId = null) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Get sessions where teacher is already assigned
  // Excludes cancelled, rejected, and completed sessions - these slots are available again
  const assignedSessions = await Session.find({
    teacher: teacherId,
    startTime: { $gte: startOfDay, $lte: endOfDay },
    status: { $in: ['requested', 'accepted', 'scheduled', 'ongoing'] },
    deletedAt: null
  }).sort({ startTime: 1 });

  // If subjectId is provided, also check for requested sessions that could be assigned to this teacher
  // (sessions with same subject where the teacher is assigned to that subject in the FocusOne)
  let requestedSessions = [];
  if (subjectId) {
    // Find all FocusOnes where this teacher is assigned to this subject
    const focusOnes = await FocusOne.find({
      'teacherSubjectMappings.teacher': teacherId,
      'teacherSubjectMappings.subject': subjectId,
      deletedAt: null
    }).select('_id');

    const focusOneIds = focusOnes.map(f => f._id.toString());

    if (focusOneIds.length > 0) {
      // Get requested sessions for these FocusOnes with the same subject
      requestedSessions = await Session.find({
        teacher: null, // Not yet assigned
        focusOne: { $in: focusOneIds },
        subject: subjectId,
        startTime: { $gte: startOfDay, $lte: endOfDay },
        status: 'requested',
        deletedAt: null
      }).sort({ startTime: 1 });
    }
  }

  // Combine and return unique sessions
  const allSessions = [...assignedSessions, ...requestedSessions];
  
  // Remove duplicates (in case a session appears in both lists)
  const uniqueSessions = Array.from(
    new Map(allSessions.map(session => [session._id.toString(), session])).values()
  );

  return uniqueSessions.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
};

/**
 * Find back-to-back session pairs (two consecutive sessions)
 * Returns array of objects with { firstSession, secondSession, unavailableUntil }
 */
const findBackToBackSessions = (existingSessions) => {
  const backToBackPairs = [];
  const breakMs = BREAK_DURATION_MINUTES * 60 * 1000;

  // Sort sessions by start time
  const sortedSessions = [...existingSessions].sort((a, b) => 
    new Date(a.startTime) - new Date(b.startTime)
  );

  // Check for consecutive sessions
  for (let i = 0; i < sortedSessions.length - 1; i++) {
    const firstSession = sortedSessions[i];
    const secondSession = sortedSessions[i + 1];

    const firstEnd = new Date(firstSession.endTime).getTime();
    const secondStart = new Date(secondSession.startTime).getTime();

    // Check if sessions are back-to-back (with or without the 15-minute break)
    // Back-to-back means second session starts within 15 minutes after first ends
    if (secondStart <= firstEnd + breakMs) {
      const secondEnd = new Date(secondSession.endTime).getTime();
      const unavailableUntil = new Date(secondEnd + LECTURE_UNAVAILABLE_DURATION_MINUTES * 60 * 1000);
      
      backToBackPairs.push({
        firstSession,
        secondSession,
        unavailableUntil
      });
    }
  }

  return backToBackPairs;
};

/**
 * Check if a time slot conflicts with existing sessions (considering 15-min breaks)
 * Also checks if the slot falls within the 1-hour unavailable period after back-to-back sessions
 */
const hasTimeConflict = (newStartTime, newEndTime, existingSessions) => {
  const newStart = new Date(newStartTime).getTime();
  const newEnd = new Date(newEndTime).getTime();
  const breakMs = BREAK_DURATION_MINUTES * 60 * 1000;

  // Check for conflicts with existing sessions (including breaks)
  for (const session of existingSessions) {
    const existingStart = new Date(session.startTime).getTime();
    const existingEnd = new Date(session.endTime).getTime();

    // Check if new session overlaps with existing session (including breaks)
    // New session starts before existing ends + break, and new session ends after existing starts - break
    if (newStart < existingEnd + breakMs && newEnd > existingStart - breakMs) {
      return true;
    }
  }

  // Check if the slot falls within the 1-hour unavailable period after back-to-back sessions
  const backToBackPairs = findBackToBackSessions(existingSessions);
  for (const pair of backToBackPairs) {
    const unavailableUntil = new Date(pair.unavailableUntil).getTime();
    
    // If the new session overlaps with the unavailable period, it's a conflict
    // The unavailable period starts from when the second session ends
    const secondSessionEnd = new Date(pair.secondSession.endTime).getTime();
    if (newStart < unavailableUntil && newEnd > secondSessionEnd) {
      return true;
    }
  }

  return false;
};

/**
 * Check if a teacher has availability for a new session on a specific date
 * @param {string} teacherId - Teacher ID
 * @param {Date} sessionStartTime - Start time of the new session
 * @param {Date} sessionEndTime - End time of the new session
 * @param {string} subjectId - Subject ID (optional, used to check for conflicting requested sessions)
 * @returns {Object} { available: boolean, reason: string, existingCount: number }
 */
const checkTeacherAvailability = async (teacherId, sessionStartTime, sessionEndTime, subjectId = null) => {
  const sessionDate = new Date(sessionStartTime);
  sessionDate.setHours(0, 0, 0, 0);

  // Get existing sessions for the teacher on that date (including requested sessions with same subject)
  const existingSessions = await getTeacherSessionsForDate(teacherId, sessionDate, subjectId);

  // Check if teacher already has 4 sessions on that day
  if (existingSessions.length >= MAX_SESSIONS_PER_DAY) {
    return {
      available: false,
      reason: `Teacher already has ${existingSessions.length} sessions on this day (maximum: ${MAX_SESSIONS_PER_DAY})`,
      existingCount: existingSessions.length
    };
  }

  // Check for time conflicts (including 15-minute breaks and 1-hour unavailable period after back-to-back sessions)
  if (hasTimeConflict(sessionStartTime, sessionEndTime, existingSessions)) {
    return {
      available: false,
      reason: 'This time slot conflicts with an existing session, does not maintain the required 15-minute break, or falls within the 1-hour unavailable period after back-to-back sessions',
      existingCount: existingSessions.length
    };
  }

  return {
    available: true,
    reason: null,
    existingCount: existingSessions.length
  };
};

/**
 * Generate available time slots for a teacher on a specific date
 * @param {string} teacherId - Teacher ID
 * @param {Date} date - Date to generate slots for
 * @param {number} slotDurationMinutes - Duration of each slot in minutes (default: 60)
 * @param {string} subjectId - Subject ID (optional, used to check for conflicting requested sessions)
 * @returns {Array} Array of available time slot objects { startTime: Date, endTime: Date }
 */
const generateAvailableSlots = async (teacherId, date, slotDurationMinutes = 75, subjectId = null) => {
  const sessionDate = new Date(date);
  sessionDate.setHours(0, 0, 0, 0);

  // Get existing sessions (including requested sessions with same subject)
  const existingSessions = await getTeacherSessionsForDate(teacherId, sessionDate, subjectId);

  // If teacher already has 4 sessions, no slots available
  if (existingSessions.length >= MAX_SESSIONS_PER_DAY) {
    return [];
  }

  // Generate potential slots from 9 AM to 9 PM
  const availableSlots = [];
  const slotDurationMs = slotDurationMinutes * 60 * 1000;
  const breakMs = BREAK_DURATION_MINUTES * 60 * 1000;

  // Start from 9 AM on the given date
  const currentSlotStart = new Date(sessionDate);
  currentSlotStart.setHours(WORKING_HOUR_START, 0, 0, 0);
  
  // End at 9 PM on the given date
  const dayEnd = new Date(sessionDate);
  dayEnd.setHours(WORKING_HOUR_END, 0, 0, 0);

  // Generate slots in 15-minute increments to allow for flexible scheduling with breaks
  const incrementMs = 15 * 60 * 1000; // 15 minutes

  while (currentSlotStart.getTime() + slotDurationMs <= dayEnd.getTime()) {
    const currentSlotEnd = new Date(currentSlotStart.getTime() + slotDurationMs);

    // Check if this slot conflicts with existing sessions (including breaks)
    const hasConflict = hasTimeConflict(currentSlotStart, currentSlotEnd, existingSessions);

    if (!hasConflict) {
      availableSlots.push({
        startTime: new Date(currentSlotStart),
        endTime: new Date(currentSlotEnd)
      });
    }

    // Move to next potential slot (15-minute increments)
    // This allows for flexible scheduling while maintaining breaks
    currentSlotStart.setTime(currentSlotStart.getTime() + incrementMs);
  }

  // Return all available slots (the 4-session limit is already enforced by checking existingSessions.length at the start)
  return availableSlots;
};

/**
 * Check if at least one teacher from a list has availability
 * Used when multiple teachers can potentially accept a session
 * @param {Array} teacherIds - Array of teacher IDs
 * @param {Date} sessionStartTime - Start time of the new session
 * @param {Date} sessionEndTime - End time of the new session
 * @param {string} subjectId - Subject ID (optional, used to check for conflicting requested sessions)
 * @returns {Object} { available: boolean, availableTeachers: Array, reason: string }
 */
const checkMultipleTeachersAvailability = async (teacherIds, sessionStartTime, sessionEndTime, subjectId = null) => {
  const availableTeachers = [];
  const availabilityResults = [];

  for (const teacherId of teacherIds) {
    const availability = await checkTeacherAvailability(teacherId, sessionStartTime, sessionEndTime, subjectId);
    availabilityResults.push({ teacherId, ...availability });
    
    if (availability.available) {
      availableTeachers.push(teacherId);
    }
  }

  if (availableTeachers.length === 0) {
    return {
      available: false,
      availableTeachers: [],
      reason: 'All assigned teachers have reached their maximum sessions for this day or the time slot conflicts with existing sessions',
      details: availabilityResults
    };
  }

  return {
    available: true,
    availableTeachers,
    reason: null,
    details: availabilityResults
  };
};

module.exports = {
  getTeacherSessionsForDate,
  hasTimeConflict,
  checkTeacherAvailability,
  generateAvailableSlots,
  checkMultipleTeachersAvailability,
  MAX_SESSIONS_PER_DAY,
  BREAK_DURATION_MINUTES
};

