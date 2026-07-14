const mongoose = require('mongoose');

const AddressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Recipient name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    line1: {
      type: String,
      required: [true, 'Address line 1 is required'],
      trim: true,
    },
    line2: {
      type: String,
      default: '',
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      trim: true,
    },
    landmark: {
      type: String,
      default: '',
      trim: true,
    },
    type: {
      type: String,
      enum: ['Home', 'Office'],
      default: 'Home',
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

AddressSchema.index({ user: 1 });

module.exports = mongoose.model('Address', AddressSchema);
