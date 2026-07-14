const mongoose = require('mongoose');
const crypto = require('crypto');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const razorpay = require('../config/razorpay');
const asyncHandler = require('../utils/asyncHandler');
const { creditVendorEarnings } = require('../utils/vendorWallet');

const VALID_STATUSES = [
  'Placed',
  'Confirmed',
  'Packed',
  'Out of Stock',
  'Shipped',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
  'Returned',
];

// Maps a status to the order-level timestamp field that should be stamped
// the first time the order reaches that status.
const STATUS_TIMESTAMP_FIELD = {
  Confirmed: 'confirmedAt',
  Packed: 'packedAt',
  Shipped: 'shippedAt',
  'Out for Delivery': 'outForDeliveryAt',
  Delivered: 'deliveredAt',
};

const FREE_SHIPPING_THRESHOLD = 999;
const SHIPPING_FEE = 60;

/* ────────────────────────────────────────────────────────────────
   Shared helpers for the customer-facing order/payment flow
   ──────────────────────────────────────────────────────────────── */

/**
 * Re-prices the cart on the server using the current Product documents.
 * Never trusts price/name/image sent by the client — only the product id
 * and quantity are used, so a tampered client payload can't change the
 * amount actually charged.
 */
async function validateAndPriceItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    const err = new Error('Your cart is empty.');
    err.status = 400;
    throw err;
  }

  const ids = items
    .map((i) => i.id || i.productId || i._id)
    .filter((id) => mongoose.Types.ObjectId.isValid(id));

  const products = await Product.find({ _id: { $in: ids } });
  const productMap = new Map(products.map((p) => [String(p._id), p]));

  const orderItems = [];
  let itemsPrice = 0;

  for (const raw of items) {
    const pid = raw.id || raw.productId || raw._id;
    const qty = Number(raw.qty) || 0;
    const product = productMap.get(String(pid));

    if (!product) {
      const err = new Error(`One of the products in your cart is no longer available.`);
      err.status = 400;
      throw err;
    }
    if (qty < 1) {
      const err = new Error(`Invalid quantity for ${product.name}.`);
      err.status = 400;
      throw err;
    }
    if (product.stock < qty) {
      const err = new Error(`${product.name} has only ${product.stock} left in stock.`);
      err.status = 400;
      throw err;
    }

    orderItems.push({
      product: product._id,
      name: product.name,
      image: (product.images && product.images[0]) || '',
      price: product.price,
      qty,
      vendor: product.vendor || null,
    });
    itemsPrice += product.price * qty;
  }

  return { orderItems, itemsPrice };
}

function validateAddress(address) {
  const required = ['name', 'phone', 'line1', 'city', 'state', 'pincode'];
  for (const field of required) {
    if (!address || !String(address[field] || '').trim()) {
      const err = new Error(`Address field '${field}' is required.`);
      err.status = 400;
      throw err;
    }
  }
}

function priceSummary(itemsPrice) {
  const shippingPrice = itemsPrice >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const totalPrice = itemsPrice + shippingPrice;
  return { shippingPrice, totalPrice };
}

async function decrementStock(orderItems) {
  await Promise.all(
    orderItems.map((it) => Product.findByIdAndUpdate(it.product, { $inc: { stock: -it.qty } }))
  );
}

/* ────────────────────────────────────────────────────────────────
   Customer-facing: place a Cash on Delivery order
   ──────────────────────────────────────────────────────────────── */

/**
 * @desc    Place an order paid by Cash on Delivery.
 * @route   POST /api/v1/orders
 * @access  Private (logged-in customer)
 * Body: { items: [{ id, qty }], address }
 */
const createOrder = asyncHandler(async (req, res) => {
  const { items, address } = req.body;

  validateAddress(address);
  const { orderItems, itemsPrice } = await validateAndPriceItems(items);
  const { shippingPrice, totalPrice } = priceSummary(itemsPrice);

  const order = await Order.create({
    user: req.user._id,
    orderItems,
    shippingAddress: address,
    paymentMethod: 'cod',
    itemsPrice,
    shippingPrice,
    discountPrice: 0,
    totalPrice,
  });

  await decrementStock(orderItems);

  res.status(201).json({ success: true, order });
});

/* ────────────────────────────────────────────────────────────────
   Customer-facing: Razorpay online payment
   ──────────────────────────────────────────────────────────────── */

/**
 * @desc    Create a Razorpay order for the current cart. The amount is
 *          computed server-side (never trusts a client-sent total).
 * @route   POST /api/v1/orders/razorpay/create-order
 * @access  Private (logged-in customer)
 * Body: { items: [{ id, qty }], address }
 */
const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { items, address } = req.body;

  validateAddress(address);
  const { itemsPrice } = await validateAndPriceItems(items);
  const { totalPrice } = priceSummary(itemsPrice);

  const razorpayOrder = await razorpay.orders.create({
    amount: Math.round(totalPrice * 100), // Razorpay expects paise
    currency: 'INR',
    receipt: `rcpt_${Date.now()}`,
    notes: { userId: String(req.user._id) },
  });

  res.status(200).json({
    success: true,
    key: process.env.RAZORPAY_KEY_ID,
    amount: totalPrice,
    razorpayOrder,
  });
});

/**
 * @desc    Verify a completed Razorpay payment's signature, then create
 *          the real Order document in our DB marked as paid.
 * @route   POST /api/v1/orders/razorpay/verify
 * @access  Private (logged-in customer)
 * Body: {
 *   razorpay_order_id, razorpay_payment_id, razorpay_signature,
 *   items: [{ id, qty }], address, paymentMethod
 * }
 */
const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    items,
    address,
    paymentMethod,
  } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ success: false, message: 'Missing payment verification fields.' });
  }

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({
      success: false,
      message: 'Payment verification failed. Signature mismatch — this payment was not confirmed.',
    });
  }

  validateAddress(address);
  const { orderItems, itemsPrice } = await validateAndPriceItems(items);
  const { shippingPrice, totalPrice } = priceSummary(itemsPrice);

  const order = await Order.create({
    user: req.user._id,
    orderItems,
    shippingAddress: address,
    paymentMethod: paymentMethod || 'upi',
    paymentResult: {
      id: razorpay_payment_id,
      status: 'paid',
      update_time: new Date().toISOString(),
      email_address: req.user.email || '',
    },
    itemsPrice,
    shippingPrice,
    discountPrice: 0,
    totalPrice,
    isPaid: true,
    paidAt: new Date(),
  });

  await decrementStock(orderItems);

  res.status(201).json({ success: true, order });
});

/**
 * @desc    Logged-in customer's own order history.
 * @route   GET /api/v1/orders/my
 * @access  Private (logged-in customer)
 */
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort('-createdAt');
  res.status(200).json({ success: true, orders });
});

/**
 * @desc    A single order belonging to the logged-in customer — used by
 *          the Track Order page. Accepts either the Mongo _id or the
 *          human-readable orderId (e.g. AYU123456), and includes each
 *          item's per-vendor tracking status (vendorItemStatus) so a
 *          customer can see exactly where a vendor-sold product is, same
 *          as any platform-sold item. No Tracking ID input is required —
 *          the customer only ever needs the Order ID clicked from "My
 *          Orders", never a manually-entered tracking number.
 *          Also returns a "Continue Shopping" recommendation list: same
 *          category as the ordered products first, falling back to Best
 *          Sellers, then the latest active products, so the section on
 *          the tracking page is never empty.
 * @route   GET /api/v1/orders/my/:orderId
 * @access  Private (logged-in customer)
 */
const getMyOrderByOrderId = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const query = mongoose.Types.ObjectId.isValid(orderId)
    ? { _id: orderId, user: req.user._id }
    : { orderId: orderId.toUpperCase(), user: req.user._id };

  const order = await Order.findOne(query).populate(
    'orderItems.product',
    'name slug images category'
  );

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }

  // ── "Continue Shopping" / "You May Also Like" recommendations ──────
  const visibilityFilter = {
    $or: [{ isActive: true }, { isActive: { $exists: false } }],
    $and: [
      { $or: [{ approvalStatus: 'approved' }, { approvalStatus: { $exists: false } }] },
    ],
  };

  const orderedProductIds = order.orderItems
    .map((i) => i.product && i.product._id)
    .filter(Boolean);

  const categoryIds = [
    ...new Set(
      order.orderItems
        .map((i) => i.product && i.product.category)
        .filter(Boolean)
        .map(String)
    ),
  ];

  let recommendedProducts = [];

  // 1) Same category as items in this order.
  if (categoryIds.length) {
    recommendedProducts = await Product.find({
      ...visibilityFilter,
      category: { $in: categoryIds },
      _id: { $nin: orderedProductIds },
    })
      .populate('category', 'name slug')
      .limit(8);
  }

  // 2) Fall back to Best Sellers.
  if (recommendedProducts.length === 0) {
    recommendedProducts = await Product.find({
      ...visibilityFilter,
      isBestSeller: true,
      _id: { $nin: orderedProductIds },
    })
      .populate('category', 'name slug')
      .limit(8);
  }

  // 3) Fall back to the latest active products.
  if (recommendedProducts.length === 0) {
    recommendedProducts = await Product.find({
      ...visibilityFilter,
      _id: { $nin: orderedProductIds },
    })
      .populate('category', 'name slug')
      .sort('-createdAt')
      .limit(8);
  }

  res.status(200).json({ success: true, order, recommendedProducts });
});

/* ────────────────────────────────────────────────────────────────
   Admin-only order management (unchanged)
   ──────────────────────────────────────────────────────────────── */

/**
 * @desc    Get a searchable, filterable, sortable, paginated list of orders
 *          for the admin Orders Management screen.
 * @route   GET /api/v1/orders/admin/all
 * @access  Private/Admin
 * Query params: search, status, paymentMethod, isPaid, dateFrom, dateTo,
 *               sort, page, limit
 */
const getAllOrdersAdmin = asyncHandler(async (req, res) => {
  const { search, status, paymentMethod, isPaid, dateFrom, dateTo } = req.query;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;

  const filter = {};

  if (status && VALID_STATUSES.includes(status)) {
    filter.orderStatus = status;
  }

  if (paymentMethod) {
    filter.paymentMethod = paymentMethod;
  }

  if (isPaid !== undefined) {
    filter.isPaid = isPaid === 'true';
  }

  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  if (search && search.trim()) {
    const term = search.trim();
    const matchingUsers = await User.find({
      $or: [
        { name: { $regex: term, $options: 'i' } },
        { email: { $regex: term, $options: 'i' } },
      ],
    }).select('_id');

    filter.$or = [
      { orderId: { $regex: term, $options: 'i' } },
      { trackingId: { $regex: term, $options: 'i' } },
      { user: { $in: matchingUsers.map((u) => u._id) } },
    ];
  }

  const sortMap = {
    newest: '-createdAt',
    oldest: 'createdAt',
    'amount-desc': '-totalPrice',
    'amount-asc': 'totalPrice',
  };
  const sort = sortMap[req.query.sort] || '-createdAt';

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('user', 'name email phone')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count: orders.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    orders,
  });
});

/**
 * @desc    Dedicated feed for the "📦 Admin Orders" page — returns ONLY
 *          orders that contain at least one item owned by the platform
 *          itself (item.vendor === null), and only that admin-owned
 *          slice of each order (mirrors the shape of the vendor
 *          equivalent, vendorController#getMyOrders). Vendor-owned items
 *          on the same order are left out entirely, so a vendor's
 *          products never show up here and an admin's products never
 *          show up on a vendor's dashboard. Reads the same single Orders
 *          collection — nothing is duplicated.
 * @route   GET /api/v1/orders/admin/owned
 * @access  Private/Admin
 * Query params: status, page, limit
 */
const getAdminOwnedOrders = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;

  const filter = { 'orderItems.vendor': null };
  if (req.query.status && VALID_STATUSES.includes(req.query.status)) {
    filter.orderStatus = req.query.status;
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('user', 'name email phone')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  const shaped = orders.map((o) => {
    const myItems = o.orderItems.filter((i) => !i.vendor);
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
      trackingId: o.trackingId,
      courierName: o.courierName,
      shippingPartner: o.shippingPartner,
      estimatedDelivery: o.estimatedDelivery,
      confirmedAt: o.confirmedAt,
      packedAt: o.packedAt,
      shippedAt: o.shippedAt,
      outForDeliveryAt: o.outForDeliveryAt,
      deliveredAt: o.deliveredAt,
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

/**
 * @desc    Get a single order's full detail (admin order-detail drawer/page)
 * @route   GET /api/v1/orders/admin/:id
 * @access  Private/Admin
 */
const getOrderAdmin = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }

  const order = await Order.findById(req.params.id)
    .populate('user', 'name email phone')
    .populate('orderItems.product', 'name slug images');

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }

  res.status(200).json({ success: true, order });
});

/**
 * @desc    Update an order's status, appending an entry to its status
 *          history and keeping isPaid/isDelivered flags in sync. Also
 *          accepts tracking number, courier name, shipping partner and
 *          estimated delivery date so the Admin Orders dashboard can set
 *          full shipment details in the same call. Every status change
 *          is timestamped (confirmedAt/packedAt/shippedAt/...) so the
 *          customer Track Order page can show real dates per stage.
 * @route   PATCH /api/v1/orders/:id/status
 * @access  Private/Admin
 * Body: { status, note, trackingId, courierName, shippingPartner, estimatedDeliveryDate }
 */
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note, trackingId, courierName, shippingPartner, estimatedDeliveryDate } = req.body;

  if (!status || !VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `status must be one of: ${VALID_STATUSES.join(', ')}.`,
    });
  }

  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }

  order.orderStatus = status;
  order.updatedBy = 'admin';
  order.statusHistory.push({ status, note: note || '', updatedBy: 'admin' });

  if (trackingId !== undefined) {
    order.trackingId = trackingId;
  }
  if (courierName !== undefined) {
    order.courierName = courierName;
  }
  if (shippingPartner !== undefined) {
    order.shippingPartner = shippingPartner;
  }
  if (estimatedDeliveryDate !== undefined && estimatedDeliveryDate) {
    order.estimatedDelivery = new Date(estimatedDeliveryDate);
  }

  const timestampField = STATUS_TIMESTAMP_FIELD[status];
  if (timestampField && !order[timestampField]) {
    order[timestampField] = new Date();
  }

  if (status === 'Delivered') {
    order.isDelivered = true;
    order.deliveredAt = order.deliveredAt || new Date();
    if (order.paymentMethod === 'cod' && !order.isPaid) {
      order.isPaid = true;
      order.paidAt = order.paidAt || new Date();
    }
    // When the admin marks the WHOLE order Delivered, also close out any
    // vendor line items still sitting in an earlier state, then credit
    // every vendor's commissionRate% (default 5%) share for those items.
    order.orderItems.forEach((item) => {
      if (item.vendor && item.vendorItemStatus !== 'Delivered' && item.vendorItemStatus !== 'Cancelled') {
        item.vendorItemStatus = 'Delivered';
      }
    });
    await creditVendorEarnings(order);
  }

  if (status === 'Cancelled' || status === 'Returned' || status === 'Out of Stock') {
    order.isDelivered = false;
  }

  await order.save();

  const populated = await order.populate('user', 'name email phone');

  res.status(200).json({ success: true, order: populated });
});

/**
 * @desc    Store-wide order analytics for the admin Dashboard: revenue,
 *          order counts by status, and recent orders.
 * @route   GET /api/v1/orders/admin/stats
 * @access  Private/Admin
 */
const getOrderStatsAdmin = asyncHandler(async (req, res) => {
  const [totals] = await Order.aggregate([
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: {
          $sum: { $cond: [{ $eq: ['$isPaid', true] }, '$totalPrice', 0] },
        },
        totalItemsSold: { $sum: { $sum: '$orderItems.qty' } },
      },
    },
  ]);

  const statusCountsRaw = await Order.aggregate([
    { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
  ]);
  const ordersByStatus = VALID_STATUSES.map((s) => ({
    status: s,
    count: statusCountsRaw.find((r) => r._id === s)?.count || 0,
  }));

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const revenueByDayRaw = await Order.aggregate([
    { $match: { createdAt: { $gte: sevenDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$totalPrice' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const revenueLast7Days = [];
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const match = revenueByDayRaw.find((r) => r._id === key);
    revenueLast7Days.push({
      date: key,
      revenue: match ? match.revenue : 0,
      orders: match ? match.orders : 0,
    });
  }

  const recentOrders = await Order.find()
    .populate('user', 'name email phone')
    .sort('-createdAt')
    .limit(5);

  res.status(200).json({
    success: true,
    totalOrders: totals?.totalOrders || 0,
    totalRevenue: totals?.totalRevenue || 0,
    totalItemsSold: totals?.totalItemsSold || 0,
    pendingOrders:
      (ordersByStatus.find((s) => s.status === 'Placed')?.count || 0) +
      (ordersByStatus.find((s) => s.status === 'Confirmed')?.count || 0),
    ordersByStatus,
    revenueLast7Days,
    recentOrders,
  });
});

module.exports = {
  // customer
  createOrder,
  createRazorpayOrder,
  verifyRazorpayPayment,
  getMyOrders,
  getMyOrderByOrderId,
  // admin
  getAllOrdersAdmin,
  getAdminOwnedOrders,
  getOrderAdmin,
  updateOrderStatus,
  getOrderStatsAdmin,
};