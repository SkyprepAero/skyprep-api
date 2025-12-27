/**
 * Meeting link service - Jitsi Meet only
 * Generates meeting links - no RTC setup needed on your server
 * No authentication or API keys required
 */

const { generateJitsiMeetLink } = require('./jitsiMeet');

/**
 * Create a meeting link using Jitsi Meet
 * @param {Object} options - Meeting options
 * @param {string} options.title - Meeting title
 * @param {string} options.description - Meeting description (optional, not used by Jitsi)
 * @param {Date} options.startTime - Meeting start time (optional)
 * @param {Date} options.endTime - Meeting end time (optional)
 * @param {string} options.teacherEmail - Teacher's email (optional, for logging)
 * @param {string} options.studentEmail - Student's email (optional, for logging)
 * @param {string} options.teacherUserId - Teacher's user ID (optional, not used)
 * @returns {Promise<{meetingLink: string, calendarEventId: null, provider: string}>}
 */
const createMeetingLink = async (options) => {
  const { 
    title,  
    startTime
  } = options;

  console.log('Creating Jitsi Meet link...');
  const jitsiResult = await generateJitsiMeetLink({
    title,
    startTime
  });
  
  return {
    ...jitsiResult,
    provider: 'jitsi-meet'
  };
};

module.exports = {
  createMeetingLink,
  generateJitsiMeetLink
};

