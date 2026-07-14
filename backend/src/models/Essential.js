const mongoose = require('mongoose');

const essentialSchema = new mongoose.Schema({
  tag:         { type: String, default: '' },        // e.g. "Season Special"
  title:       { type: String, required: true, trim: true }, // e.g. "Summer Care"
  desc:        { type: String, default: '' },
  image:       { type: String, default: '' },         // background image URL
  overlay:     { type: String, default: 'linear-gradient(to top, rgba(20,50,100,.85), rgba(50,80,160,.3))' },
  products:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  isActive:    { type: Boolean, default: true },
  order:       { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Essential', essentialSchema);