const mongoose = require('mongoose');
  const heroSlideSchema = new mongoose.Schema({
    title:       { type: String, required: true, trim: true },
    subtitle:    { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
    imageUrl:    { type: String, required: true },
    buttonText:  { type: String, default: 'Shop Now' },
    buttonLink:  { type: String, default: '/shop' },
    isActive:    { type: Boolean, default: true },
    order:       { type: Number, default: 0 },
  }, { timestamps: true });
  module.exports = mongoose.model('HeroSlide', heroSlideSchema);
  