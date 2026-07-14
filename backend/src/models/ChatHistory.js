const mongoose = require('mongoose');

// Stores one row per chatbot session so conversations can be reviewed later
// from the admin panel (not wired into the admin UI yet — this only
// persists the data). A session is a random id generated on the frontend
// the first time the widget opens, kept in memory for that tab.
const chatMessageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['user', 'bot'], required: true },
    text: { type: String, required: true },
    matchedConcern: { type: String, default: '' },
  },
  { _id: false, timestamps: { createdAt: true, updatedAt: false } }
);

const chatHistorySchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    messages: { type: [chatMessageSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ChatHistory', chatHistorySchema);
