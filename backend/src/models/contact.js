const mongoose = require('mongoose');

/**
 * Stores every submission from the public "Contact Us" form so the admin
 * panel can list, search, and triage them (mirrors the Users Management
 * pattern used for customer accounts).
 */
const contactSchema = new mongoose.Schema(
  {
    fname: { type: String, required: true, trim: true },
    lname: { type: String, trim: true, default: '' },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true, default: '' },
    subject: { type: String, trim: true, default: 'General Inquiry' },
    message: { type: String, required: true, trim: true },

    // Simple triage state for the admin inbox.
    status: {
      type: String,
      enum: ['new', 'read', 'resolved'],
      default: 'new',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Contact', contactSchema);