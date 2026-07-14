const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [80, 'Name cannot exceed 80 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: [validator.isEmail, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    avatar: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'superadmin', 'vendor'],
      default: 'user',
    },
    // Only meaningful for role = 'admin' | 'superadmin'. Kept generic so
    // the same model can express fine-grained admin permissions later.
    permissions: {
      type: [String],
      default: [],
    },
    // ─── Vendor (multi-vendor marketplace) fields ───────────────────
    // Only meaningful for role = 'vendor'. Kept on the same User model
    // (rather than a separate collection) so login/JWT/auth middleware
    // work exactly the same way as they already do for user/admin.
    shopName: {
      type: String,
      trim: true,
      default: '',
      maxlength: [100, 'Shop name cannot exceed 100 characters'],
    },
    shopSlug: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
      sparse: true,
    },
    shopDescription: {
      type: String,
      trim: true,
      default: '',
    },
    shopLogo: {
      type: String,
      default: '',
    },
    gstNumber: {
      type: String,
      trim: true,
      default: '',
    },
    businessAddress: {
      line1: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      pincode: { type: String, default: '' },
    },
    bankDetails: {
      accountHolder: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      ifsc: { type: String, default: '' },
      bankName: { type: String, default: '' },
    },
    // pending → newly registered, awaiting admin review
    // approved → can list products & sell
    // rejected → application declined (see rejectionReason)
    // suspended → was approved, temporarily disabled by admin
    vendorStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'suspended'],
      default: 'pending',
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    commissionRate: {
      // Vendor's share (%) of every sale of their products. Default is 5%,
      // i.e. the vendor gets 5% of the sale value credited to their wallet
      // once the item is delivered, and the platform (admin) keeps the
      // remaining 95%. See utils/vendorWallet.js for the crediting logic
      // and controllers/adminVendorController.js#getFinanceSummary for the
      // admin-side amount breakdown.
      type: Number,
      default: 5,
      min: 0,
      max: 100,
    },
    // Running wallet balance credited from delivered order items (see
    // utils/vendorWallet.js#creditVendorEarnings). This is real, persisted
    // money owed/paid to the vendor — walletBalance can be reduced by a
    // withdrawal, totalEarnings never decreases (lifetime total).
    walletBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalEarnings: {
      type: Number,
      default: 0,
      min: 0,
    },
    approvedAt: {
      type: Date,
    },
    isVerified: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Only set/updated for admin & superadmin logins.
    lastLogin: {
      type: Date,
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpire: {
      type: Date,
      select: false,
    },
    loginOtpCode: {
      type: String,
      select: false,
    },
    loginOtpExpire: {
      type: Date,
      select: false,
    },
  },
  { timestamps: true }
);

// Auto-generate a URL-friendly shopSlug for vendor accounts (used on
// public storefront links like /vendor-store/:slug in the future).
UserSchema.pre('validate', function generateShopSlug(next) {
  if (this.role === 'vendor' && this.shopName && (!this.shopSlug || this.isModified('shopName'))) {
    const base = this.shopName
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    this.shopSlug = `${base}-${Math.random().toString(36).slice(2, 7)}`;
  }
  next();
});

// Hash password before saving whenever it has been modified
UserSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare a plaintext candidate password with the stored hash
UserSchema.methods.comparePassword = async function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate and store a hashed password-reset token; returns the raw
// (unhashed) token that should be emailed to the user.
UserSchema.methods.getResetPasswordToken = function getResetPasswordToken() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes

  return resetToken;
};

module.exports = mongoose.model('User', UserSchema);