const mongoose = require('mongoose');
  const concernSchema = new mongoose.Schema({
    name:        { type: String, required: true, trim: true },
    emoji:       { type: String, default: '🌿' },
    description: { type: String, default: '' },
    products:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    isActive:    { type: Boolean, default: true },
    order:       { type: Number, default: 0 },
  }, { timestamps: true });
  module.exports = mongoose.model('Concern', concernSchema);
  