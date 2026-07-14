const nodemailer = require('nodemailer');

const normalizeSmtpPassword = (host, pass) => {
  if (!pass) return pass;
  const trimmed = pass.trim();

  // Gmail app passwords are displayed in groups of 4 characters.
  // Normalize common copy/paste formatting by removing spaces.
  if (/gmail\.com$/i.test(host) && /^(?:[A-Za-z0-9]{4}\s+){3}[A-Za-z0-9]{4}$/.test(trimmed)) {
    return trimmed.replace(/\s+/g, '');
  }

  return pass;
};

/**
 * Sends an email using SMTP credentials configured via environment variables.
 *
 * @param {Object} options
 * @param {String} options.to      Recipient email address
 * @param {String} options.subject Email subject line
 * @param {String} options.html    HTML body
 * @param {String} [options.text]  Plain text fallback body
 */
let transporter;

const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const pass = normalizeSmtpPassword(host, process.env.SMTP_PASS);
  if (pass !== process.env.SMTP_PASS) {
    console.warn('SMTP_PASS appears to be a Gmail app password with spaces; normalizing to remove spaces.');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass,
    },
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    requireTLS: port === 587,
    // timeouts to avoid hanging on verify/send when the SMTP server is unreachable
    connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS) || 10000,
    greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT_MS) || 10000,
    socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS) || 10000,
  });
};

const getTransporter = async () => {
  if (!transporter) {
    transporter = createTransporter();
    try {
      await transporter.verify();
    } catch (verifyErr) {
      console.error('SMTP verification failed:', verifyErr && verifyErr.message ? verifyErr.message : verifyErr);
      transporter = undefined;
      throw new Error('SMTP verification failed: ' + (verifyErr && verifyErr.message ? verifyErr.message : String(verifyErr)));
    }
  }
  return transporter;
};

const sendEmail = async ({ to, subject, html, text }) => {
  const fromName = process.env.SMTP_FROM_NAME || 'Amrita Ayurveda';
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;

  const activeTransporter = await getTransporter();
  const maxAttempts = 2;
  let attempt = 0;

  while (attempt < maxAttempts) {
    attempt += 1;
    if (attempt > 1) {
      console.warn(`Retrying email send (${attempt}/${maxAttempts}) to ${to}`);
    }

    try {
      const info = await activeTransporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to,
        subject,
        text: text || undefined,
        html,
      });

      console.log(`Email sent to ${to}: ${info.messageId || info.response || 'sent'}`);
      if (attempt > 1) {
        console.log(`Email send retry succeeded for ${to} on attempt ${attempt}`);
      }
      return info;
    } catch (err) {
      console.error(
        `Email send failed for ${to} on attempt ${attempt}:`,
        err && err.message ? err.message : err,
        'code=',
        err && err.code,
        'responseCode=',
        err && err.responseCode
      );

      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        continue;
      }

      throw err;
    }
  }
};

module.exports = sendEmail;
