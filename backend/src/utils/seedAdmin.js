/**
 * One-time script to create (or reset the password of) the first admin
 * account, since there is no admin sign-up route by design.
 *
 * Usage (from the backend/ folder):
 *   node src/utils/seedAdmin.js
 *
 * Reads credentials from env vars if provided, otherwise falls back to
 * the defaults below. Edit the defaults (or pass env vars) before running.
 *
 *   SEED_ADMIN_NAME="Admin"
 *   SEED_ADMIN_EMAIL="admin@amritaayurveda.com"
 *   SEED_ADMIN_PASSWORD="ChangeMe123!"
 *   node src/utils/seedAdmin.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const NAME = process.env.SEED_ADMIN_NAME || 'Admin';
const EMAIL = (process.env.SEED_ADMIN_EMAIL || 'admin@amritaayurveda.com').toLowerCase();
const PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!';
const ROLE = process.env.SEED_ADMIN_ROLE === 'admin' ? 'admin' : 'superadmin';

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB.');

  // Admin/superadmin accounts live in the same User collection as
  // customers — only the `role` field differs.
  let admin = await User.findOne({ email: EMAIL }).select('+password');

  if (admin) {
    admin.password = PASSWORD; // pre-save hook re-hashes it
    admin.isActive = true;
    admin.role = ROLE;
    await admin.save();
    console.log(`Existing account found — upgraded to '${ROLE}' and password reset for: ${EMAIL}`);
  } else {
    admin = await User.create({
      name: NAME,
      email: EMAIL,
      password: PASSWORD,
      role: ROLE,
    });
    console.log(`New ${ROLE} created: ${EMAIL}`);
  }

  console.log('----------------------------------------');
  console.log('Login with:');
  console.log(`  email:    ${EMAIL}`);
  console.log(`  password: ${PASSWORD}`);
  console.log('----------------------------------------');
  console.log('IMPORTANT: change this password after logging in, and never commit real credentials.');

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('Seeding failed:', err.message);
  process.exit(1);
});