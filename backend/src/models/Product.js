const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [150, 'Product name cannot exceed 150 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
    },
    shortDescription: {
      type: String,
      default: '',
      maxlength: [300, 'Short description cannot exceed 300 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative'],
    },
    oldPrice: {
      type: Number,
      min: [0, 'Old price cannot be negative'],
      default: null,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Product category is required'],
    },
    images: {
      type: [String],
      required: [true, 'At least one product image is required'],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: 'At least one product image is required',
      },
    },
    stock: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    sku: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true,
    },
    badge: {
      type: String,
      default: '',
    },
    badgeType: {
      type: String,
      enum: ['red', 'gold', ''],
      default: '',
    },
    ingredients: {
      type: [String],
      default: [],
    },
    benefits: {
      type: [String],
      default: [],
    },
    ratingsAverage: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isBestSeller: {
      type: Boolean,
      default: false,
    },
    isNewArrival: {
      type: Boolean,
      default: false,
    },
    isTrending: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
    // ─── Multi-vendor fields ───────────────────────────────────────
    // null/undefined = product belongs to the platform itself (the
    // original single-vendor products all stay this way — no data
    // migration needed, and nothing changes for them on the storefront).
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    // approved  → visible on the public storefront (default, so existing
    //             admin-created products behave exactly as before)
    // pending   → submitted by a vendor, awaiting admin review
    // rejected  → admin declined it (see rejectionReason)
    approvalStatus: {
      type: String,
      enum: ['approved', 'pending', 'rejected'],
      default: 'approved',
    },
    rejectionReason: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

ProductSchema.index({ name: 'text', description: 'text' });
ProductSchema.index({ category: 1 });

ProductSchema.virtual('discountPercent').get(function computeDiscount() {
  if (!this.oldPrice || this.oldPrice <= this.price) return 0;
  return Math.round(((this.oldPrice - this.price) / this.oldPrice) * 100);
});

ProductSchema.set('toJSON', { virtuals: true });
ProductSchema.set('toObject', { virtuals: true });

ProductSchema.pre('validate', function generateSlug(next) {
  if (this.name && (!this.slug || this.isModified('name'))) {
    const base = this.name
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    this.slug = `${base}-${Math.random().toString(36).slice(2, 7)}`;
  }
  next();
});

module.exports = mongoose.model('Product', ProductSchema);
