const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    List all vendor accounts, filterable by vendorStatus, with
 *          product/order counts for a quick overview.
 * @route   GET /api/v1/admin/vendors
 * @access  Private/Admin
 */
const listVendors = asyncHandler(async (req, res) => {
  const { search, vendorStatus } = req.query;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;

  const filter = { role: 'vendor' };
  if (vendorStatus) filter.vendorStatus = vendorStatus;
  if (search && search.trim()) {
    const term = search.trim();
    filter.$or = [
      { name: { $regex: term, $options: 'i' } },
      { email: { $regex: term, $options: 'i' } },
      { shopName: { $regex: term, $options: 'i' } },
    ];
  }

  const [vendors, total] = await Promise.all([
    User.find(filter).sort('-createdAt').skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  const vendorIds = vendors.map((v) => v._id);
  const productCounts = vendorIds.length
    ? await Product.aggregate([
        { $match: { vendor: { $in: vendorIds } } },
        { $group: { _id: '$vendor', count: { $sum: 1 } } },
      ])
    : [];
  const countMap = new Map(productCounts.map((p) => [String(p._id), p.count]));

  const shaped = vendors.map((v) => ({
    ...v.toObject(),
    productCount: countMap.get(String(v._id)) || 0,
  }));

  res.status(200).json({
    success: true,
    count: shaped.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    vendors: shaped,
  });
});

/**
 * @desc    Get a single vendor's full profile plus their products/orders.
 * @route   GET /api/v1/admin/vendors/:id
 * @access  Private/Admin
 */
const getVendor = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ success: false, message: 'Vendor not found.' });
  }

  const vendor = await User.findOne({ _id: req.params.id, role: 'vendor' });
  if (!vendor) {
    return res.status(404).json({ success: false, message: 'Vendor not found.' });
  }

  const products = await Product.find({ vendor: vendor._id }).populate('category', 'name slug').sort('-createdAt');

  const [salesSummary] = await Order.aggregate([
    { $match: { 'orderItems.vendor': vendor._id } },
    { $unwind: '$orderItems' },
    { $match: { 'orderItems.vendor': vendor._id } },
    {
      $group: {
        _id: null,
        totalOrders: { $addToSet: '$_id' },
        grossSales: {
          $sum: {
            $cond: [{ $eq: ['$isPaid', true] }, { $multiply: ['$orderItems.price', '$orderItems.qty'] }, 0],
          },
        },
      },
    },
  ]);

  res.status(200).json({
    success: true,
    vendor,
    products,
    orderCount: (salesSummary?.totalOrders || []).length,
    grossSales: salesSummary?.grossSales || 0,
  });
});

/**
 * @desc    Approve a pending vendor application.
 * @route   PATCH /api/v1/admin/vendors/:id/approve
 * @access  Private/Admin
 */
const approveVendor = asyncHandler(async (req, res) => {
  const vendor = await User.findOne({ _id: req.params.id, role: 'vendor' });
  if (!vendor) {
    return res.status(404).json({ success: false, message: 'Vendor not found.' });
  }

  vendor.vendorStatus = 'approved';
  vendor.rejectionReason = '';
  vendor.approvedAt = new Date();
  vendor.isActive = true;
  await vendor.save();

  res.status(200).json({ success: true, message: 'Vendor approved.', vendor });
});

/**
 * @desc    Reject a pending vendor application.
 * @route   PATCH /api/v1/admin/vendors/:id/reject
 * @access  Private/Admin
 * Body: { reason }
 */
const rejectVendor = asyncHandler(async (req, res) => {
  const vendor = await User.findOne({ _id: req.params.id, role: 'vendor' });
  if (!vendor) {
    return res.status(404).json({ success: false, message: 'Vendor not found.' });
  }

  vendor.vendorStatus = 'rejected';
  vendor.rejectionReason = req.body.reason || '';
  await vendor.save();

  res.status(200).json({ success: true, message: 'Vendor rejected.', vendor });
});

/**
 * @desc    Suspend a previously-approved vendor (their existing approved
 *          products are also pulled from the storefront by marking them
 *          inactive is NOT automatic — admin can still see & manage them).
 * @route   PATCH /api/v1/admin/vendors/:id/suspend
 * @access  Private/Admin
 */
const suspendVendor = asyncHandler(async (req, res) => {
  const vendor = await User.findOne({ _id: req.params.id, role: 'vendor' });
  if (!vendor) {
    return res.status(404).json({ success: false, message: 'Vendor not found.' });
  }

  vendor.vendorStatus = 'suspended';
  await vendor.save();

  res.status(200).json({ success: true, message: 'Vendor suspended.', vendor });
});

/**
 * @desc    Reactivate a suspended vendor back to approved.
 * @route   PATCH /api/v1/admin/vendors/:id/reactivate
 * @access  Private/Admin
 */
const reactivateVendor = asyncHandler(async (req, res) => {
  const vendor = await User.findOne({ _id: req.params.id, role: 'vendor' });
  if (!vendor) {
    return res.status(404).json({ success: false, message: 'Vendor not found.' });
  }

  vendor.vendorStatus = 'approved';
  await vendor.save();

  res.status(200).json({ success: true, message: 'Vendor reactivated.', vendor });
});

/**
 * @desc    List vendor-submitted products awaiting review.
 * @route   GET /api/v1/admin/vendors/products/pending
 * @access  Private/Admin
 */
const listPendingVendorProducts = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;

  const filter = { vendor: { $ne: null }, approvalStatus: 'pending' };

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name slug')
      .populate('vendor', 'name shopName email')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit),
    Product.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count: products.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    products,
  });
});

/**
 * @desc    Approve a vendor-submitted product so it appears on the
 *          storefront.
 * @route   PATCH /api/v1/admin/vendors/products/:id/approve
 * @access  Private/Admin
 */
const approveVendorProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found.' });
  }

  product.approvalStatus = 'approved';
  product.rejectionReason = '';
  await product.save();

  res.status(200).json({ success: true, message: 'Product approved.', product });
});

/**
 * @desc    Reject a vendor-submitted product.
 * @route   PATCH /api/v1/admin/vendors/products/:id/reject
 * @access  Private/Admin
 * Body: { reason }
 */
const rejectVendorProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found.' });
  }

  product.approvalStatus = 'rejected';
  product.rejectionReason = req.body.reason || '';
  await product.save();

  res.status(200).json({ success: true, message: 'Product rejected.', product });
});

/**
 * @desc    Platform-wide "Amount" dashboard for the admin: total revenue
 *          split between the platform's own product sales and vendor
 *          product sales, with the vendor's entitled commissionRate%
 *          share (default 5%) shown separately from the amount the
 *          platform keeps for itself — exactly what the admin Amount
 *          page renders.
 * @route   GET /api/v1/admin/vendors/finance/summary
 * @access  Private/Admin
 */
const getFinanceSummary = asyncHandler(async (req, res) => {
  const rows = await Order.aggregate([
    { $match: { isPaid: true } },
    { $unwind: '$orderItems' },
    {
      $group: {
        _id: { $ifNull: ['$orderItems.vendor', null] },
        saleAmount: { $sum: { $multiply: ['$orderItems.price', '$orderItems.qty'] } },
        creditedAmount: { $sum: { $ifNull: ['$orderItems.vendorEarning', 0] } },
        unitsSold: { $sum: '$orderItems.qty' },
      },
    },
  ]);

  const platformRow = rows.find((r) => r._id === null) || { saleAmount: 0, unitsSold: 0 };
  const vendorRows = rows.filter((r) => r._id !== null);

  const vendorIds = vendorRows.map((r) => r._id);
  const vendors = vendorIds.length
    ? await User.find({ _id: { $in: vendorIds } }).select(
        'name shopName commissionRate walletBalance totalEarnings'
      )
    : [];
  const vendorMap = new Map(vendors.map((v) => [String(v._id), v]));

  let vendorProductsTotalSales = 0;
  let vendorAmount = 0; // total owed to vendors (their commissionRate% share)
  let vendorAmountCredited = 0; // already paid into vendor wallets (Delivered items)

  const vendorBreakdown = vendorRows
    .map((r) => {
      const vendor = vendorMap.get(String(r._id));
      const rate = vendor?.commissionRate ?? 5;
      const entitled = Math.round((r.saleAmount * rate) / 100);

      vendorProductsTotalSales += r.saleAmount;
      vendorAmount += entitled;
      vendorAmountCredited += r.creditedAmount;

      return {
        vendorId: r._id,
        vendorName: vendor?.name || 'Unknown vendor',
        shopName: vendor?.shopName || '',
        commissionRate: rate,
        productsAmount: r.saleAmount, // 100% — this vendor's product sales
        unitsSold: r.unitsSold,
        vendorAmount: entitled, // vendor's commissionRate% share
        vendorAmountCredited: r.creditedAmount, // already in their wallet
        vendorAmountPending: Math.max(0, entitled - r.creditedAmount),
        platformAmountFromVendor: r.saleAmount - entitled, // admin's share of this vendor's sales
        walletBalance: vendor?.walletBalance || 0,
      };
    })
    .sort((a, b) => b.productsAmount - a.productsAmount);

  const platformOwnProductsAmount = platformRow.saleAmount || 0;
  const platformShareFromVendorProducts = vendorProductsTotalSales - vendorAmount;
  const grandTotalRevenue = platformOwnProductsAmount + vendorProductsTotalSales;
  // Everything that stays with the admin: 100% of its own products +
  // its share (100% - vendor%) of every vendor product.
  const platformAmount = platformOwnProductsAmount + platformShareFromVendorProducts;

  res.status(200).json({
    success: true,
    summary: {
      grandTotalRevenue,
      // Admin's own products (vendor === null), shown separately.
      platformOwnProductsAmount,
      // All vendor products combined, at their full 100% sale value.
      vendorProductsTotalSales,
      // What vendors are owed in total (their commissionRate%, default 5%).
      vendorAmount,
      vendorAmountCredited,
      vendorAmountPending: Math.max(0, vendorAmount - vendorAmountCredited),
      // What the admin keeps from vendor products (100% - vendor%).
      platformShareFromVendorProducts,
      // Grand total the admin actually keeps (own products + its share of
      // vendor products) — vendorAmount is excluded from this figure.
      platformAmount,
    },
    vendorBreakdown,
  });
});

module.exports = {
  listVendors,
  getVendor,
  approveVendor,
  rejectVendor,
  suspendVendor,
  reactivateVendor,
  listPendingVendorProducts,
  approveVendorProduct,
  rejectVendorProduct,
  getFinanceSummary,
};
