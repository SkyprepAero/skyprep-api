const path = require('path');

const toBool = (value, fallback = false) => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) {
      return true;
    }
    if (['false', '0', 'no', 'off'].includes(normalized)) {
      return false;
    }
  }
  return fallback;
};

const port = Number.parseInt(process.env.SMTP_PORT || '', 10);

const isDevelopment =
  (process.env.NODE_ENV || '').trim().toLowerCase() === 'development';

const emailConfig = {
  host: process.env.SMTP_HOST || '',
  port: Number.isNaN(port) ? 587 : port,
  secure: toBool(process.env.SMTP_SECURE, false),
  auth:
    process.env.SMTP_USER && process.env.SMTP_PASSWORD
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        }
      : undefined,
  from:
    process.env.SMTP_FROM_EMAIL && process.env.SMTP_FROM_NAME
      ? `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`
      : process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || '',
  templateDir:
    process.env.EMAIL_TEMPLATE_DIR ||
    path.join(__dirname, '..', 'templates', 'emails'),
  enabled: toBool(
    process.env.EMAIL_ENABLED,
    isDevelopment ? false : true
  ),
  verifyConnection: toBool(process.env.SMTP_VERIFY || 'true', true),
  logPreview: toBool(process.env.EMAIL_PREVIEW_LOG || 'false', false),
};

module.exports = emailConfig;


