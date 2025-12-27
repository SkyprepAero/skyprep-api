const { body } = require('express-validator');

// Create Session Validation Rules (Admin endpoint)
exports.createSessionValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Session title is required')
    .isLength({ max: 200 })
    .withMessage('Title cannot be more than 200 characters'),

  body('description')
    .optional()
    .trim()
    .isString()
    .withMessage('Description must be a string'),

  body('startTime')
    .notEmpty()
    .withMessage('Session start time is required')
    .isISO8601()
    .withMessage('Start time must be a valid ISO 8601 date'),

  body('endTime')
    .notEmpty()
    .withMessage('Session end time is required')
    .isISO8601()
    .withMessage('End time must be a valid ISO 8601 date')
    .custom((value, { req }) => {
      if (req.body.startTime && new Date(value) <= new Date(req.body.startTime)) {
        throw new Error('End time must be after start time');
      }
      return true;
    }),

  body('focusOne')
    .optional()
    .isMongoId()
    .withMessage('Focus One must be a valid MongoDB ID'),

  body('cohort')
    .optional()
    .isMongoId()
    .withMessage('Cohort must be a valid MongoDB ID'),

  body('subject')
    .optional()
    .isMongoId()
    .withMessage('Subject must be a valid MongoDB ID'),

  body('teacher')
    .optional()
    .isMongoId()
    .withMessage('Teacher must be a valid MongoDB ID'),

  body('meetingLink')
    .optional()
    .trim()
    .isURL()
    .withMessage('Meeting link must be a valid URL'),

  body('meetingPlatform')
    .optional()
    .isIn(['jitsi-meet', null])
    .withMessage('Meeting platform must be jitsi-meet'),

  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object')
];

// Request Session Validation Rules (Student endpoint)
exports.requestSessionValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Title cannot be more than 200 characters'),

  body('description')
    .optional()
    .trim()
    .isString()
    .withMessage('Description must be a string'),

  body('startTime')
    .notEmpty()
    .withMessage('Session start time is required')
    .isISO8601()
    .withMessage('Start time must be a valid ISO 8601 date')
    .custom((value) => {
      const startDate = new Date(value);
      const now = new Date();
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      
      const sessionDay = new Date(startDate);
      sessionDay.setHours(0, 0, 0, 0);
      
      // Check if session is on the same day (not allowed - must be at least one day in advance)
      if (sessionDay.getTime() === today.getTime()) {
        throw new Error('Sessions must be scheduled at least one day in advance');
      }
      
      // Check if session is in the past
      if (sessionDay < today) {
        throw new Error('Cannot schedule sessions in the past');
      }
      
      // Check if session is more than 1.5 weeks (10.5 days) in advance
      // Calculate 10.5 days = 10 days + 12 hours
      // Since we compare dates at midnight, we allow up to the 11th day (to account for sessions throughout that day)
      const maxAllowedDate = new Date(today);
      maxAllowedDate.setDate(today.getDate() + 11); // 11 days ahead to allow 10.5 days of booking window
      maxAllowedDate.setHours(0, 0, 0, 0);
      
      if (sessionDay >= maxAllowedDate) {
        throw new Error('Sessions can only be scheduled up to 1.5 weeks (10.5 days) in advance');
      }
      
      // Check if session is on Sunday
      if (startDate.getDay() === 0) {
        throw new Error('Sessions cannot be scheduled on Sundays');
      }
      
      // Note: Public holiday check is done in the controller since validation
      // middleware cannot easily handle async database queries
      
      // Check if session is on Saturday (restricted hours: 9 AM - 4 PM)
      const isSaturday = startDate.getDay() === 6;
      const startHour = startDate.getHours();
      const startMinute = startDate.getMinutes();
      
      if (isSaturday) {
        // Saturday: validate start time is between 9 AM and 3:15 PM (75 minutes before 4 PM)
        if (startHour < 9 || (startHour > 15) || (startHour === 15 && startMinute > 15)) {
          throw new Error('On Saturdays, session start time must be between 9 AM and 3:15 PM');
        }
      } else {
        // Weekdays: validate start time is between 9 AM and 7:45 PM (75 minutes before 9 PM)
        // Allow times from 9:00 AM to 7:45 PM (latest start time to allow 75 min session ending at 9 PM)
        if (startHour < 9 || (startHour > 19) || (startHour === 19 && startMinute > 45)) {
          throw new Error('Session start time must be between 9 AM and 7:45 PM');
        }
      }
      
      return true;
    }),

  body('endTime')
    .notEmpty()
    .withMessage('Session end time is required')
    .isISO8601()
    .withMessage('End time must be a valid ISO 8601 date')
    .custom((value, { req }) => {
      const endDate = new Date(value);
      const startDate = req.body.startTime ? new Date(req.body.startTime) : null;
      
      if (startDate && endDate <= startDate) {
        throw new Error('End time must be after start time');
      }
      
      // Check if end time is on the same day as start time
      let isSaturday = false;
      if (startDate) {
        const startDay = startDate.toDateString();
        const endDay = endDate.toDateString();
        if (startDay !== endDay) {
          throw new Error('Session must start and end on the same day');
        }
        // Use start date to determine if it's Saturday (since they must be on the same day)
        isSaturday = startDate.getDay() === 6;
      } else {
        // Fallback to end date if start date is not available (shouldn't happen in practice)
        isSaturday = endDate.getDay() === 6;
      }
      
      const endHour = endDate.getHours();
      
      if (isSaturday) {
        // Saturday: validate end time is at most 4 PM
        if (endHour < 9 || endHour > 16) {
          throw new Error('On Saturdays, session end time must be between 9 AM and 4 PM');
        }
        
        // If end time is 4 PM, ensure it's exactly 4 PM (not later)
        if (endHour === 16 && endDate.getMinutes() > 0) {
          throw new Error('On Saturdays, session cannot extend beyond 4 PM');
        }
      } else {
        // Weekdays: validate end time is within 9 AM to 9 PM
        if (endHour < 9 || endHour > 21) {
          throw new Error('Session end time must be between 9 AM and 9 PM');
        }
        
        // If end time is 9 PM, ensure it's exactly 9 PM (not later)
        if (endHour === 21 && endDate.getMinutes() > 0) {
          throw new Error('Session cannot extend beyond 9 PM');
        }
      }
      
      return true;
    }),

  body('focusOne')
    .notEmpty()
    .withMessage('Focus One is required for session requests')
    .isMongoId()
    .withMessage('Focus One must be a valid MongoDB ID'),

  body('subject')
    .notEmpty()
    .withMessage('Subject is required for session requests')
    .isMongoId()
    .withMessage('Subject must be a valid MongoDB ID'),

  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object')
];

// Update Session Validation Rules
exports.updateSessionValidation = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Session title cannot be empty')
    .isLength({ max: 200 })
    .withMessage('Title cannot be more than 200 characters'),

  body('description')
    .optional()
    .trim()
    .isString()
    .withMessage('Description must be a string'),

  body('startTime')
    .optional()
    .isISO8601()
    .withMessage('Start time must be a valid ISO 8601 date'),

  body('endTime')
    .optional()
    .isISO8601()
    .withMessage('End time must be a valid ISO 8601 date')
    .custom((value, { req }) => {
      if (req.body.startTime && new Date(value) <= new Date(req.body.startTime)) {
        throw new Error('End time must be after start time');
      }
      return true;
    }),

  body('subject')
    .optional()
    .isMongoId()
    .withMessage('Subject must be a valid MongoDB ID'),

  body('teacher')
    .optional()
    .isMongoId()
    .withMessage('Teacher must be a valid MongoDB ID'),

  body('meetingLink')
    .optional()
    .trim()
    .isURL()
    .withMessage('Meeting link must be a valid URL'),

  body('meetingPlatform')
    .optional()
    .isIn(['jitsi-meet', null])
    .withMessage('Meeting platform must be jitsi-meet'),

  body('status')
    .optional()
    .isIn(['requested', 'accepted', 'rejected', 'scheduled', 'ongoing', 'completed', 'cancelled'])
    .withMessage('Status must be one of: requested, accepted, rejected, scheduled, ongoing, completed, cancelled'),

  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object')
];

// Accept Session Request Validation Rules (Teacher endpoint)
exports.acceptSessionRequestValidation = [
  body('title')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 200 })
    .withMessage('Title cannot be more than 200 characters'),

  body('description')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters if provided')
];

// Reject Session Request Validation Rules (Teacher endpoint)
exports.rejectSessionRequestValidation = [
  body('reason')
    .trim()
    .notEmpty()
    .withMessage('Rejection reason is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Rejection reason must be between 10 and 500 characters')
];

// Teacher Schedule Session Validation Rules (Teacher endpoint)
exports.cancelSessionValidation = [
  body('reason')
    .trim()
    .notEmpty()
    .withMessage('Cancellation reason is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Cancellation reason must be between 10 and 500 characters'),
];

exports.rescheduleSessionValidation = [
  body('startTime')
    .notEmpty()
    .withMessage('Start time is required')
    .isISO8601()
    .withMessage('Start time must be a valid ISO 8601 date'),

  body('endTime')
    .notEmpty()
    .withMessage('End time is required')
    .isISO8601()
    .withMessage('End time must be a valid ISO 8601 date')
    .custom((value, { req }) => {
      if (req.body.startTime && new Date(value) <= new Date(req.body.startTime)) {
        throw new Error('End time must be after start time');
      }
      return true;
    }),
];

exports.teacherScheduleSessionValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Session title is required')
    .isLength({ max: 200 })
    .withMessage('Title cannot be more than 200 characters'),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Session reason/description is required')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),

  body('startTime')
    .notEmpty()
    .withMessage('Session start time is required')
    .isISO8601()
    .withMessage('Start time must be a valid ISO 8601 date'),

  body('endTime')
    .notEmpty()
    .withMessage('Session end time is required')
    .isISO8601()
    .withMessage('End time must be a valid ISO 8601 date')
    .custom((value, { req }) => {
      if (req.body.startTime && new Date(value) <= new Date(req.body.startTime)) {
        throw new Error('End time must be after start time');
      }
      return true;
    }),

  body('focusOne')
    .notEmpty()
    .withMessage('Focus One is required')
    .isMongoId()
    .withMessage('Focus One must be a valid MongoDB ID'),

  body('subject')
    .optional()
    .isMongoId()
    .withMessage('Subject must be a valid MongoDB ID')
];
