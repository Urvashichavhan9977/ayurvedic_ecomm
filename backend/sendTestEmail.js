require('dotenv').config();
const sendEmail = require('./src/utils/sendEmail');

async function run() {
  try {
    const info = await sendEmail({
      to: 'urvashichavhan9977@gmail.com',
      subject: 'Test email from Amrita Ayurveda',
      html: '<p>This is a test email from the local backend.</p>',
    });
    console.log('sendTestEmail: success', info && (info.messageId || info.response));
  } catch (err) {
    console.error('sendTestEmail: error', err && err.message ? err.message : err);
    if (err && err.response) console.error('SMTP response:', err.response);
    if (err && err.code) console.error('SMTP error code:', err.code);
    if (err && err.responseCode) console.error('SMTP responseCode:', err.responseCode);
    process.exit(1);
  }
  process.exit(0);
}

run();
