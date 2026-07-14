const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const VendorTransaction = require('../models/VendorTransaction');
const asyncHandler = require('../utils/asyncHandler');
const { creditVendorEarnings } = require('../utils/vendorWallet');

/**
 * @desc    Get the logged-in vendor's own products (any approval status).
 * @route   GET /api/v1/vendor/products
 * @access  Private/Vendor
 */
const getMyProducts = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;

  const filter = { vendor: req.user._id };
  if (req.query.approvalStatus) filter.approvalStatus = req.query.approvalStatus;
  if (req.query.search && req.query.search.trim()) {
    filter.name = { $regex: req.query.search.trim(), $options: 'i' };
  }

  const [products, total] = await Promise.all([
    Product.find(filter).populate('category', 'name slug').sort('-createdAt').skip(skip).limit(limit),
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
 * @desc    Get one of the vendor's own products by id (edit form).
 * @route   GET /api/v1/vendor/products/:id
 * @access  Private/Vendor
 */
const getMyProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, vendor: req.user._id }).populate(
    'category',
    'name slug'
  );
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found.' });
  }
  res.status(200).json({ success: true, product });
});

/**
 * @desc    Create a new product owned by the logged-in vendor. Goes live
 *          on the storefront only after an admin approves it.
 * @route   POST /api/v1/vendor/products
 * @access  Private/Vendor (must be approved)
 */
const createMyProduct = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    shortDescription,
    price,
    oldPrice,
    category,
    images,
    stock,
    sku,
    ingredients,
    benefits,
  } = req.body;

  if (!name || !description || price === undefined || !category || !images || !images.length) {
    return res.status(400).json({
      success: false,
      message: 'name, description, price, category, and at least one image are required.',
    });
  }

  const categoryExists = await Category.findById(category);
  if (!categoryExists) {
    return res.status(400).json({ success: false, message: 'Selected category does not exist.' });
  }

  const product = await Product.create({
    name,
    description,
    shortDescription,
    price,
    oldPrice: oldPrice || null,
    category,
    images,
    stock: stock ?? 0,
    sku,
    ingredients,
    benefits,
    vendor: req.user._id,
    approvalStatus: 'pending',
    isActive: true,
  });

  await Category.findByIdAndUpdate(category, { $inc: { productCount: 1 } });

  res.status(201).json({
    success: true,
    message: 'Product submitted. It will appear on the store once approved by the admin.',
    product,
  });
});

/**
 * @desc    Update one of the vendor's own products. Editing a
 *          previously-approved product sends it back to 'pending' so the
 *          admin can review the change before it goes live again.
 * @route   PUT /api/v1/vendor/products/:id
 * @access  Private/Vendor
 */
const updateMyProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, vendor: req.user._id });
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found.' });
  }

  const previousCategory = product.category.toString();
  const updatableFields = [
    'name',
    'description',
    'shortDescription',
    'price',
    'oldPrice',
    'category',
    'images',
    'stock',
    'sku',
    'ingredients',
    'benefits',
  ];

  if (req.body.category) {
    const categoryExists = await Category.findById(req.body.category);
    if (!categoryExists) {
      return res.status(400).json({ success: false, message: 'Selected category does not exist.' });
    }
  }

  updatableFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      product[field] = req.body[field];
    }
  });

  // Re-review needed after a vendor edits an already-approved product.
  if (product.approvalStatus === 'approved') {
    product.approvalStatus = 'pending';
  }

  await product.save();

  const newCategory = product.category.toString();
  if (newCategory !== previousCategory) {
    await Category.findByIdAndUpdate(previousCategory, { $inc: { productCount: -1 } });
    await Category.findByIdAndUpdate(newCategory, { $inc: { productCount: 1 } });
  }

  res.status(200).json({
    success: true,
    message: 'Product updated and sent for admin re-approval.',
    product,
  });
});

/**
 * @desc    Delete one of the vendor's own products.
 * @route   DELETE /api/v1/vendor/products/:id
 * @access  Private/Vendor
 */
const deleteMyProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, vendor: req.user._id });
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found.' });
  }

  await product.deleteOne();
  await Category.findByIdAndUpdate(product.category, { $inc: { productCount: -1 } });

  res.status(200).json({ success: true, message: 'Product deleted.' });
});

/**
 * @desc    Update stock for one of the vendor's own products.
 * @route   PATCH /api/v1/vendor/products/:id/stock
 * @access  Private/Vendor
 */
const updateMyProductStock = asyncHandler(async (req, res) => {
  const { mode = 'set', quantity } = req.body;
  if (quantity === undefined || Number.isNaN(Number(quantity))) {
    return res.status(400).json({ success: false, message: 'A numeric quantity is required.' });
  }

  const product = await Product.findOne({ _id: req.params.id, vendor: req.user._id });
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found.' });
  }

  const qty = Number(quantity);
  if (mode === 'increment') product.stock += qty;
  else if (mode === 'decrement') product.stock = Math.max(0, product.stock - qty);
  else product.stock = Math.max(0, qty);

  await product.save();
  res.status(200).json({ success: true, product });
});

/**
 * @desc    Orders that contain at least one item sold by this vendor.
 *          Only that vendor's own line items are returned per order (not
 *          other vendors' items in the same order), so a vendor never
 *          sees another seller's product/price data.
 * @route   GET /api/v1/vendor/orders
 * @access  Private/Vendor
 */
const getMyOrders = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;

  const vendorId = req.user._id;
  const filter = { 'orderItems.vendor': vendorId };
  if (req.query.status) filter['orderItems.vendorItemStatus'] = req.query.status;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('user', 'name email phone')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  const shaped = orders.map((o) => {
    const myItems = o.orderItems.filter((i) => String(i.vendor) === String(vendorId));
    const myTotal = myItems.reduce((sum, i) => sum + i.price * i.qty, 0);
    return {
      _id: o._id,
      orderId: o.orderId,
      customer: o.user ? { name: o.user.name, email: o.user.email, phone: o.user.phone } : null,
      shippingAddress: o.shippingAddress,
      myItems,
      myTotal,
      paymentMethod: o.paymentMethod,
      orderStatus: o.orderStatus,
      isPaid: o.isPaid,
      createdAt: o.createdAt,
    };
  });

  res.status(200).json({
    success: true,
    count: shaped.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    orders: shaped,
  });
});

// Maps a vendor item status to the per-item timestamp field stamped the
// first time that item reaches that status.
const VENDOR_ITEM_TIMESTAMP_FIELD = {
  Confirmed: 'confirmedAt',
  Packed: 'packedAt',
  Shipped: 'shippedAt',
  'Out for Delivery': 'outForDeliveryAt',
  Delivered: 'deliveredAt',
};

/**
 * @desc    Vendor updates the fulfillment status of their own line item(s)
 *          within an order (e.g. Confirmed → Shipped), without touching
 *          other vendors' items or the overall order status. Also accepts
 *          tracking number, courier name and an estimated delivery date so
 *          the vendor can set full shipment details on their own items —
 *          this never touches the order-level (admin) tracking fields.
 * @route   PATCH /api/v1/vendor/orders/:orderId/item-status
 * @access  Private/Vendor
 * Body: { status, trackingNumber, courierName, estimatedDeliveryDate }
 */
const updateMyOrderItemStatus = asyncHandler(async (req, res) => {
  const { status, trackingNumber, courierName, estimatedDeliveryDate } = req.body;
  const validStatuses = ['Placed', 'Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status value.' });
  }

  const order = await Order.findById(req.params.orderId);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }

  let updated = false;
  order.orderItems.forEach((item) => {
    if (String(item.vendor) === String(req.user._id)) {
      item.vendorItemStatus = status;
      if (trackingNumber !== undefined) item.trackingNumber = trackingNumber;
      if (courierName !== undefined) item.courierName = courierName;
      if (estimatedDeliveryDate) item.estimatedDeliveryDate = new Date(estimatedDeliveryDate);
      const tsField = VENDOR_ITEM_TIMESTAMP_FIELD[status];
      if (tsField && !item[tsField]) item[tsField] = new Date();
      updated = true;
    }
  });

  if (!updated) {
    return res.status(404).json({ success: false, message: 'You have no items on this order.' });
  }

  order.statusHistory.push({
    status: status === 'Cancelled' ? 'Cancelled' : status,
    note: `Vendor updated item(s) to "${status}".`,
    updatedBy: 'vendor',
  });

  // The moment a vendor's own line item is marked Delivered, credit their
  // wallet with their commissionRate% (default 5%) share of that item's
  // sale value. Safe to call unconditionally — it only ever credits items
  // that are Delivered AND not already credited (see utils/vendorWallet.js).
  if (status === 'Delivered') {
    await creditVendorEarnings(order);
  }

  await order.save();
  res.status(200).json({ success: true, message: 'Item status updated.', order });
});

/**
 * @desc    Dashboard summary for the logged-in vendor: product counts by
 *          approval status, order count, and earnings (net of platform
 *          commission) from paid orders.
 * @route   GET /api/v1/vendor/dashboard
 * @access  Private/Vendor
 */
const getVendorDashboard = asyncHandler(async (req, res) => {
  const vendorId = req.user._id;

  const [productStats, orderAgg] = await Promise.all([
    Product.aggregate([
      { $match: { vendor: vendorId } },
      { $group: { _id: '$approvalStatus', count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { 'orderItems.vendor': vendorId } },
      { $unwind: '$orderItems' },
      { $match: { 'orderItems.vendor': vendorId } },
      {
        $group: {
          _id: null,
          totalOrders: { $addToSet: '$_id' },
          totalUnitsSold: { $sum: '$orderItems.qty' },
          grossSales: {
            $sum: {
              $cond: [
                { $eq: ['$isPaid', true] },
                { $multiply: ['$orderItems.price', '$orderItems.qty'] },
                0,
              ],
            },
          },
        },
      },
    ]),
  ]);

  const productsByStatus = { approved: 0, pending: 0, rejected: 0 };
  productStats.forEach((p) => {
    productsByStatus[p._id] = p.count;
  });

  const agg = orderAgg[0] || { totalOrders: [], totalUnitsSold: 0, grossSales: 0 };
  // commissionRate is the VENDOR's share % (default 5%). The vendor is
  // credited commissionRate% of every sale; the remaining share stays
  // with the platform/admin (see utils/vendorWallet.js for the actual
  // per-item crediting that happens on delivery, and
  // adminVendorController.getFinanceSummary for the admin-side view of
  // the same split across all vendors).
  const commissionRate = req.user.commissionRate ?? 5;
  const grossSales = agg.grossSales || 0;
  const vendorEarning = Math.round((grossSales * commissionRate) / 100);
  const platformAmount = grossSales - vendorEarning;

  res.status(200).json({
    success: true,
    vendorStatus: req.user.vendorStatus,
    products: {
      total: productsByStatus.approved + productsByStatus.pending + productsByStatus.rejected,
      ...productsByStatus,
    },
    orders: {
      totalOrders: (agg.totalOrders || []).length,
      totalUnitsSold: agg.totalUnitsSold || 0,
    },
    earnings: {
      grossSales,
      commissionRate,
      // netEarnings kept for backward compatibility with existing UI —
      // it now correctly equals the vendor's commissionRate% share.
      netEarnings: vendorEarning,
      vendorEarning,
      platformAmount,
      walletBalance: req.user.walletBalance || 0,
      totalEarnings: req.user.totalEarnings || 0,
    },
  });
});

/**
 * @desc    Dedicated "Amount" section for the logged-in vendor: current
 *          wallet balance, lifetime earnings, and a paginated transaction
 *          ledger of every commission credit (which order, which product,
 *          the sale amount, the commissionRate% applied, and the amount
 *          actually credited). Each row is written once, at the moment
 *          creditVendorEarnings() marks that order item Delivered — see
 *          utils/vendorWallet.js — so this is always the vendor's real,
 *          dynamic earnings history, not a static/cached number.
 * @route   GET /api/v1/vendor/earnings
 * @access  Private/Vendor
 */
const getMyEarnings = asyncHandler(async (req, res) => {
  const vendorId = req.user._id;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;

  const [transactions, total, pendingAgg, productRows] = await Promise.all([
    VendorTransaction.find({ vendor: vendorId }).sort('-createdAt').skip(skip).limit(limit),
    VendorTransaction.countDocuments({ vendor: vendorId }),
    // Items already sold (paid) but not yet Delivered/credited — lets the
    // vendor see money that's on its way in, not just what's landed.
    Order.aggregate([
      { $match: { isPaid: true, 'orderItems.vendor': vendorId } },
      { $unwind: '$orderItems' },
      {
        $match: {
          'orderItems.vendor': vendorId,
          'orderItems.commissionCredited': { $ne: true },
        },
      },
      {
        $group: {
          _id: null,
          pendingSaleAmount: { $sum: { $multiply: ['$orderItems.price', '$orderItems.qty'] } },
        },
      },
    ]),
    // Per-product breakdown: each product's own gross sales and its own
    // commissionRate% ("your amount") — this is what the "Amount By
    // Product" table on the vendor dashboard renders.
    Order.aggregate([
      { $match: { isPaid: true, 'orderItems.vendor': vendorId } },
      { $unwind: '$orderItems' },
      { $match: { 'orderItems.vendor': vendorId } },
      {
        $group: {
          _id: '$orderItems.product',
          name: { $first: '$orderItems.name' },
          unitsSold: { $sum: '$orderItems.qty' },
          salesAmount: { $sum: { $multiply: ['$orderItems.price', '$orderItems.qty'] } },
          creditedAmount: { $sum: { $ifNull: ['$orderItems.vendorEarning', 0] } },
        },
      },
      { $sort: { salesAmount: -1 } },
    ]),
  ]);

  const commissionRate = req.user.commissionRate ?? 5;
  const pendingSaleAmount = pendingAgg[0]?.pendingSaleAmount || 0;
  const pendingAmount = Math.round((pendingSaleAmount * commissionRate) / 100);

  let totalSalesAmount = 0;
  let totalVendorAmount = 0;
  const productBreakdown = productRows.map((row) => {
    // Every product's own commissionRate% share, shown right next to its
    // gross sales — the product-level "5% amount" the vendor wants to see.
    const yourAmount = Math.round((row.salesAmount * commissionRate) / 100);
    totalSalesAmount += row.salesAmount;
    totalVendorAmount += yourAmount;
    return {
      productId: row._id,
      name: row.name,
      unitsSold: row.unitsSold,
      salesAmount: row.salesAmount,
      yourAmount,
      creditedAmount: row.creditedAmount,
      pendingAmount: Math.max(0, yourAmount - row.creditedAmount),
    };
  });
  const platformAmount = totalSalesAmount - totalVendorAmount;

  res.status(200).json({
    success: true,
    summary: {
      commissionRate,
      walletBalance: req.user.walletBalance || 0,
      totalEarnings: req.user.totalEarnings || 0,
      pendingAmount,
      // Gross value of everything sold (100%) and the vendor's total
      // commissionRate% share of it — independent of the pagination below.
      totalSalesAmount,
      totalVendorAmount,
      platformAmount,
    },
    productBreakdown,
    transactions,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
});

module.exports = {
  getMyProducts,
  getMyProduct,
  createMyProduct,
  updateMyProduct,
  deleteMyProduct,
  updateMyProductStock,
  getMyOrders,
  updateMyOrderItemStatus,
  getVendorDashboard,
  getMyEarnings,
};
