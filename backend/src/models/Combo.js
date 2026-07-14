const mongoose = require('mongoose');
  const comboSchema = new mongoose.Schema({
    title:         { type: String, required: true, trim: true },
    description:   { type: String, required: true, trim: true },
    tag:           { type: String, default: 'Special Offer' },
    product1:      { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    product2:      { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    originalPrice: { type: Number, required: true, min: 1 },
    comboPrice:    { type: Number, required: true, min: 1 },
    isActive:      { type: Boolean, default: true },
    order:         { type: Number, default: 0 },
  }, { timestamps: true });
  module.exports = mongoose.model('Combo', comboSchema);
  