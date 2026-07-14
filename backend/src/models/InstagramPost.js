const mongoose = require('mongoose');
  const instagramPostSchema = new mongoose.Schema({
    imageUrl: { type: String, required: true },
    postLink: { type: String, default: '' },
    caption:  { type: String, trim: true, default: '' },
    isActive: { type: Boolean, default: true },
    order:    { type: Number, default: 0 },
  }, { timestamps: true });
  module.exports = mongoose.model('InstagramPost', instagramPostSchema);