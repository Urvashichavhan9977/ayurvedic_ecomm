const mongoose = require('mongoose');

const blogPostSchema = new mongoose.Schema({
  title:      { type: String, required: true, trim: true },
  tag:        { type: String, trim: true, default: 'Wellness' },
  readTime:   { type: String, trim: true, default: '3 min read' },
  img:        { type: String, required: true },
  excerpt:    { type: String, trim: true, default: '' },
  content:    { type: [String], default: [] }, // array of paragraphs
  product:    { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null }, // linked product shown as a "Shop This" card
  isActive:   { type: Boolean, default: true },
  order:      { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('BlogPost', blogPostSchema);
