/**
 * Generate a Jitsi Meet link
 * No authentication or API keys needed - just generate a URL
 * Users click the link and join directly in their browser
 * 
 * @param {Object} options - Meeting options
 * @param {string} options.title - Meeting title (optional, for room name)
 * @param {Date} options.startTime - Meeting start time (optional)
 * @returns {Promise<{meetingLink: string, roomName: string}>}
 */
const generateJitsiMeetLink = async (options = {}) => {
  const { title, startTime } = options;
  
  // Generate a unique room name
  // Format: skyprep-{timestamp}-{random}
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  const roomName = title 
    ? `skyprep-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${random}`
    : `skyprep-${timestamp}-${random}`;
  
  // Jitsi Meet public instance (or use your own domain if self-hosted)
  const jitsiDomain = process.env.JITSI_DOMAIN || 'meet.jit.si';
  const meetingLink = `https://${jitsiDomain}/${roomName}`;
  
  console.log('=== Jitsi Meet Link Generated ===');
  console.log('Room name:', roomName);
  console.log('Meeting link:', meetingLink);
  
  return {
    meetingLink,
    roomName,
    // No calendar event ID since Jitsi doesn't integrate with calendars
    calendarEventId: null
  };
};

module.exports = {
  generateJitsiMeetLink
};

