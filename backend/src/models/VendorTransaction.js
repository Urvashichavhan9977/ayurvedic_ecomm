const mongoose = require('mongoose');

// A running ledger of every amount credited to (or withdrawn from) a
// vendor's wallet. Credits are created automatically the moment an order
// item belonging to that vendor is marked 'Delivered' — see
// utils/vendorWallet.js. This is what powers both the vendor's own
// "Earnings" page and the admin's platform-wide "Amount" dashboard.
const VendorTransactionSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    orderId: {
      type: String, // human-readable order code e.g. AYU123456
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
    productName: {
      type: String,
      default: '',
    },
    qty: {
      type: Number,
      default: 1,
    },
    saleAmount: {
      // The full sale value of this line item (price * qty), i.e. 100%.
      type: Number,
      required: true,
      min: 0,
    },
    commissionRate: {
      // Vendor's share % that was applied at the time of crediting.
      type: Number,
      required: true,
    },
    amount: {
      // Amount actually credited to the vendor (saleAmount * commissionRate / 100).
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ['credit', 'withdrawal'],
      default: 'credit',
    },
    note: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

VendorTransactionSchema.index({ vendor: 1, createdAt: -1 });

module.exports = mongoose.model('VendorTransaction', VendorTransactionSchema);
