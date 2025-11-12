const fs = require('fs/promises');
const path = require('path');
const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const emailConfig = require('../config/email');

let transporterPromise = null;
let partialsLoaded = false;
const templateCache = new Map();

const resolveTemplatePath = (templateName) => {
  const normalized = templateName.endsWith('.hbs')
    ? templateName
    : `${templateName}.hbs`;
  return path.join(emailConfig.templateDir, normalized);
};

const htmlToPlainText = (html = '') =>
  html
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<\/(div|p|br|li|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

const loadPartials = async () => {
  if (partialsLoaded) {
    return;
  }

  const partialsDir = path.join(emailConfig.templateDir, 'partials');

  try {
    const partialFiles = await fs.readdir(partialsDir);

    await Promise.all(
      partialFiles
        .filter((file) => path.extname(file) === '.hbs')
        .map(async (file) => {
          const name = path.basename(file, '.hbs');
          const content = await fs.readFile(
            path.join(partialsDir, file),
            'utf8'
          );
          handlebars.registerPartial(name, content);
        })
    );
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  partialsLoaded = true;
};

const compileTemplate = async (templateName) => {
  const cached = templateCache.get(templateName);
  if (cached) {
    return cached;
  }

  await loadPartials();

  const templatePath = resolveTemplatePath(templateName);

  let fileContent;
  try {
    fileContent = await fs.readFile(templatePath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Email template "${templateName}" not found at ${templatePath}`);
    }
    throw error;
  }

  const compiled = handlebars.compile(fileContent);
  templateCache.set(templateName, compiled);

  return compiled;
};

const renderTemplate = async (templateName, context = {}) => {
  const template = await compileTemplate(templateName);
  return template(context);
};

const buildTransportOptions = () => {
  if (!emailConfig.host) {
    throw new Error(
      'SMTP_HOST is not set. Please configure SMTP settings before sending emails.'
    );
  }

  const options = {
    host: emailConfig.host,
    port: emailConfig.port,
    secure:
      typeof emailConfig.secure === 'boolean'
        ? emailConfig.secure
        : emailConfig.port === 465,
    auth: emailConfig.auth,
  };

  if (!options.auth) {
    delete options.auth;
  }

  return options;
};

const verifyTransporter = async (transporter) => {
  try {
    await transporter.verify();
  } catch (error) {
    throw new Error(`Unable to verify SMTP connection: ${error.message}`);
  }
};

const getTransporter = async () => {
  if (!transporterPromise) {
    transporterPromise = (async () => {
      const transporter = nodemailer.createTransport(buildTransportOptions());
      if (emailConfig.verifyConnection) {
        await verifyTransporter(transporter);
      }
      return transporter;
    })();
  }

  return transporterPromise;
};

const sendEmail = async ({
  to,
  subject,
  template,
  context = {},
  html,
  text,
  from = emailConfig.from,
  cc,
  bcc,
  attachments,
  headers,
}) => {
  if (!emailConfig.enabled) {
    if (emailConfig.logPreview) {
      /* eslint-disable no-console */
      console.info(
        '[EmailService] Email sending disabled; skipping message to:',
        to
      );
      /* eslint-enable no-console */
    }
    return {
      accepted: [],
      rejected: [to],
      messageId: null,
      envelope: { from, to: Array.isArray(to) ? to : [to] },
      response: 'Email sending disabled by configuration',
      previewUrl: null,
    };
  }

  if (!to) {
    throw new Error('Email recipient "to" is required.');
  }

  if (!subject) {
    throw new Error('Email subject is required.');
  }

  let htmlBody = html;
  let textBody = text;

  if (template) {
    htmlBody = await renderTemplate(template, context);
    if (!textBody) {
      textBody = htmlToPlainText(htmlBody);
    }
  }

  if (!htmlBody && !textBody) {
    throw new Error(
      'Either "template" with context or direct "html"/"text" content must be provided.'
    );
  }

  const transporter = await getTransporter();

  const message = {
    from,
    to,
    subject,
    html: htmlBody,
    text: textBody,
    cc,
    bcc,
    attachments,
    headers,
  };

  const info = await transporter.sendMail(message);

  if (emailConfig.logPreview) {
    /* eslint-disable no-console */
    console.info('Email sent:', info.messageId);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.info('Preview URL:', previewUrl);
    }
    /* eslint-enable no-console */
  }

  return info;
};

module.exports = {
  sendEmail,
  renderTemplate,
};


