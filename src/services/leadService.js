const { Lead } = require('../models');
const { AppError, ERROR_CODES } = require('../errors');
const { HTTP_STATUS } = require('../utils/constants');
const emailService = require('./emailService');

const normalizeOptionalString = (value) => {
  if (value === undefined || value === null) {
    return null;
  }
  const trimmed = String(value).trim();
  return trimmed === '' ? null : trimmed;
};

const getNotificationRecipients = () => {
  const envValue = process.env.LEAD_NOTIFICATION_EMAIL || process.env.LEADS_NOTIFICATION_EMAIL;
  if (envValue) {
    return envValue
      .split(',')
      .map(email => email.trim())
      .filter(Boolean);
  }
  return ['leads@skyprepaero.com'];
};

const notifyLeadTeam = async (lead) => {
  const recipients = getNotificationRecipients();

  try {
    await emailService.sendEmail({
      to: recipients,
      subject: `[Lead] ${lead.source || 'unknown'} • ${lead.name || 'New submission'}`,
      template: 'leads/new-lead',
      context: {
        name: lead.name || 'N/A',
        email: lead.email || 'N/A',
        phone: lead.phone || 'N/A',
        topic: lead.topic || 'General',
        message: lead.message || 'N/A',
        source: lead.source || 'unknown',
        status: lead.status || 'new',
        submittedAt: lead.createdAt?.toISOString?.() || new Date().toISOString(),
        clientTimestamp: lead.clientTimestamp ? lead.clientTimestamp.toISOString() : 'Not provided',
        referrer: lead.metadata?.referrer || 'N/A',
        userAgent: lead.metadata?.userAgent || 'N/A',
        ipAddress: lead.metadata?.ipAddress || 'N/A'
      }
    });
  } catch (error) {
    // Do not block lead creation if email fails, but log for troubleshooting
    /* eslint-disable no-console */
    console.error('[LeadService] Failed to send lead notification email', error);
    /* eslint-enable no-console */
  }
};

const createLead = async ({
  name,
  email,
  phone,
  topic,
  message,
  source,
  timestamp,
  referrer,
  userAgent,
  ipAddress
}) => {
  const leadPayload = {
    name,
    email,
    phone: normalizeOptionalString(phone),
    topic: normalizeOptionalString(topic) || 'General',
    message,
    source: source || 'unknown',
    clientTimestamp: timestamp ? new Date(timestamp) : null,
    metadata: {
      referrer: normalizeOptionalString(referrer),
      userAgent: normalizeOptionalString(userAgent),
      ipAddress: normalizeOptionalString(ipAddress)
    }
  };

  let lead;
  try {
    lead = await Lead.create(leadPayload);
  } catch (error) {
    throw new AppError(
      ERROR_CODES.SERVER.INTERNAL_ERROR,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      { message: 'Unable to store lead at this time', details: error.message }
    );
  }

  if (!lead) {
    throw new AppError(
      ERROR_CODES.SERVER.INTERNAL_ERROR,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      { message: 'Unable to store lead at this time' }
    );
  }

  await notifyLeadTeam(lead);

  return lead;
};

module.exports = {
  createLead
};


