const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: { type: String, required: true },
    image: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    qty: { type: Number, required: true, min: 1 },
    // null = this item was sold directly by the platform (no vendor).
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // Per-vendor fulfillment status for this line item, independent of
    // the order-level orderStatus, so each vendor only manages their own
    // items on a multi-vendor order.
    vendorItemStatus: {
      type: String,
      enum: ['Placed', 'Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'],
      default: 'Placed',
    },
    // Per-item shipment/tracking details, set by the vendor as their
    // fulfillment of this line item progresses. Mirrors the order-level
    // tracking fields below, but scoped to just this vendor's item so a
    // multi-vendor order can show correct tracking per product.
    trackingNumber: { type: String, default: '' },
    courierName: { type: String, default: '' },
    shippingPartner: { type: String, default: '' },
    estimatedDeliveryDate: { type: Date, default: null },
    confirmedAt: { type: Date, default: null },
    packedAt: { type: Date, default: null },
    shippedAt: { type: Date, default: null },
    outForDeliveryAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    // Amount actually credited to the vendor's wallet for this line item
    // (saleAmount * vendor.commissionRate / 100), written once by
    // utils/vendorWallet.js#creditVendorEarnings when the item is marked
    // Delivered. Stays 0 for platform-sold items (vendor === null).
    vendorEarning: {
      type: Number,
      default: 0,
    },
    // True once this item's vendor commission has been credited, so it's
    // never double-paid if the status is touched again.
    commissionCredited: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const ShippingAddressSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String, default: '' },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    landmark: { type: String, default: '' },
    type: { type: String, enum: ['Home', 'Office'], default: 'Home' },
  },
  { _id: false }
);

const StatusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: [
        'Placed',
        'Confirmed',
        'Packed',
        'Out of Stock',
        'Shipped',
        'Out for Delivery',
        'Delivered',
        'Cancelled',
        'Returned',
      ],
      required: true,
    },
    note: { type: String, default: '' },
    date: { type: Date, default: Date.now },
    // Who made this update — 'admin' or 'vendor' — so the status history
    // can show whether the platform or a marketplace seller moved the
    // order forward.
    updatedBy: { type: String, enum: ['admin', 'vendor', 'system'], default: 'system' },
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      unique: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    orderItems: {
      type: [OrderItemSchema],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: 'Order must contain at least one item',
      },
    },
    shippingAddress: {
      type: ShippingAddressSchema,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['upi', 'gpay', 'phonepe', 'paytm', 'credit', 'debit', 'netbanking', 'wallet', 'cod'],
      required: true,
    },
    paymentResult: {
      id: { type: String },
      status: { type: String },
      update_time: { type: String },
      email_address: { type: String },
    },
    itemsPrice: { type: Number, required: true, default: 0 },
    shippingPrice: { type: Number, required: true, default: 0 },
    discountPrice: { type: Number, required: true, default: 0 },
    totalPrice: { type: Number, required: true, default: 0 },
    coupon: {
      code: { type: String, default: null },
      discountAmount: { type: Number, default: 0 },
    },
    orderStatus: {
      type: String,
      enum: [
        'Placed',
        'Confirmed',
        'Packed',
        'Out of Stock',
        'Shipped',
        'Out for Delivery',
        'Delivered',
        'Cancelled',
        'Returned',
      ],
      default: 'Placed',
    },
    statusHistory: {
      type: [StatusHistorySchema],
      default: [],
    },
    isPaid: { type: Boolean, default: false },
    paidAt: { type: Date },
    isDelivered: { type: Boolean, default: false },
    deliveredAt: { type: Date },
    estimatedDelivery: { type: Date },
    trackingId: { type: String, default: '' },
    // Order-level tracking/courier details for admin-owned (non-vendor)
    // items, plus the timestamps each status transition happened at.
    // vendor-sold items carry their own equivalent fields on the item.
    courierName: { type: String, default: '' },
    shippingPartner: { type: String, default: '' },
    confirmedAt: { type: Date, default: null },
    packedAt: { type: Date, default: null },
    shippedAt: { type: Date, default: null },
    outForDeliveryAt: { type: Date, default: null },
    // Who last touched this order's top-level status: 'admin' or 'vendor'.
    updatedBy: { type: String, enum: ['admin', 'vendor', 'system'], default: 'system' },
  },
  { timestamps: true }
);

OrderSchema.index({ user: 1, createdAt: -1 });

OrderSchema.pre('validate', function generateOrderId(next) {
  if (!this.orderId) {
    this.orderId = 'AYU' + Math.floor(100000 + Math.random() * 900000);
  }
  if (this.isNew && this.statusHistory.length === 0) {
    this.statusHistory.push({ status: this.orderStatus || 'Placed', note: 'Order placed' });
  }
  next();
});

module.exports = mongoose.model('Order', OrderSchema);