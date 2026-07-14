const Coupon = require('../models/Coupon');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Computes the discount amount a coupon yields for a given cart total,
 * respecting discountType (flat/percentage) and the maxDiscount cap.
 */
const computeDiscountAmount = (coupon, cartTotal) => {
  let discount =
    coupon.discountType === 'percentage'
      ? (cartTotal * coupon.discountValue) / 100
      : coupon.discountValue;

  if (coupon.maxDiscount !== null && coupon.maxDiscount !== undefined) {
    discount = Math.min(discount, coupon.maxDiscount);
  }

  discount = Math.min(discount, cartTotal);
  return Math.round(discount * 100) / 100;
};

/**
 * @desc    Get all coupons for admin (filter, search, paginate)
 * @route   GET /api/v1/coupons/admin/all
 * @access  Private/Admin
 * Query params: isActive, search, page, limit
 */
const getAllCouponsAdmin = asyncHandler(async (req, res) => {
  const { isActive, search } = req.query;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;

  const filter = {};
  if (isActive !== undefined) filter.isActive = isActive === 'true';
  if (search) filter.code = { $regex: search, $options: 'i' };

  const [coupons, total] = await Promise.all([
    Coupon.find(filter).sort('-createdAt').skip(skip).limit(limit),
    Coupon.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count: coupons.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    coupons,
  });
});

/**
 * @desc    Get a single coupon by id (admin edit form)
 * @route   GET /api/v1/coupons/admin/:id
 * @access  Private/Admin
 */
const getCouponAdmin = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) {
    return res.status(404).json({ success: false, message: 'Coupon not found.' });
  }

  res.status(200).json({ success: true, coupon });
});

/**
 * @desc    Create a new coupon
 * @route   POST /api/v1/coupons
 * @access  Private/Admin
 */
const createCoupon = asyncHandler(async (req, res) => {
  const {
    code,
    description,
    discountType,
    discountValue,
    minPurchase,
    maxDiscount,
    expiryDate,
    usageLimit,
    isActive,
  } = req.body;

  if (!code || !discountType || discountValue === undefined || !expiryDate) {
    return res.status(400).json({
      success: false,
      message: 'code, discountType, discountValue, and expiryDate are required.',
    });
  }

  if (!['percentage', 'flat'].includes(discountType)) {
    return res
      .status(400)
      .json({ success: false, message: "discountType must be 'percentage' or 'flat'." });
  }

  if (discountType === 'percentage' && discountValue > 100) {
    return res
      .status(400)
      .json({ success: false, message: 'Percentage discount cannot exceed 100.' });
  }

  if (new Date(expiryDate) <= new Date()) {
    return res
      .status(400)
      .json({ success: false, message: 'Expiry date must be in the future.' });
  }

  const coupon = await Coupon.create({
    code,
    description,
    discountType,
    discountValue,
    minPurchase: minPurchase || 0,
    maxDiscount: maxDiscount ?? null,
    expiryDate,
    usageLimit: usageLimit ?? null,
    isActive,
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, coupon });
});

/**
 * @desc    Update a coupon
 * @route   PUT /api/v1/coupons/:id
 * @access  Private/Admin
 */
const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) {
    return res.status(404).json({ success: false, message: 'Coupon not found.' });
  }

  const updatableFields = [
    'code',
    'description',
    'discountType',
    'discountValue',
    'minPurchase',
    'maxDiscount',
    'expiryDate',
    'usageLimit',
    'isActive',
  ];

  if (req.body.discountType && !['percentage', 'flat'].includes(req.body.discountType)) {
    return res
      .status(400)
      .json({ success: false, message: "discountType must be 'percentage' or 'flat'." });
  }

  const nextType = req.body.discountType || coupon.discountType;
  const nextValue = req.body.discountValue !== undefined ? req.body.discountValue : coupon.discountValue;
  if (nextType === 'percentage' && nextValue > 100) {
    return res
      .status(400)
      .json({ success: false, message: 'Percentage discount cannot exceed 100.' });
  }

  updatableFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      coupon[field] = req.body[field];
    }
  });

  await coupon.save();

  res.status(200).json({ success: true, coupon });
});

/**
 * @desc    Delete a coupon
 * @route   DELETE /api/v1/coupons/:id
 * @access  Private/Admin
 */
const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) {
    return res.status(404).json({ success: false, message: 'Coupon not found.' });
  }

  await coupon.deleteOne();

  res.status(200).json({ success: true, message: 'Coupon deleted.' });
});

/**
 * @desc    Toggle a coupon's active status
 * @route   PATCH /api/v1/coupons/:id/toggle
 * @access  Private/Admin
 */
const toggleCouponStatus = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) {
    return res.status(404).json({ success: false, message: 'Coupon not found.' });
  }

  coupon.isActive = !coupon.isActive;
  await coupon.save();

  res.status(200).json({ success: true, coupon });
});

/**
 * @desc    Validate a coupon code against the current cart and return the
 *          discount it would yield, without marking it as used. Order
 *          creation is responsible for calling incrementCouponUsage once
 *          the order is actually placed.
 * @route   POST /api/v1/coupons/validate
 * @access  Private/User
 * Body: { code, cartTotal }
 */
const validateCoupon = asyncHandler(async (req, res) => {
  const { code, cartTotal } = req.body;

  if (!code || cartTotal === undefined) {
    return res.status(400).json({ success: false, message: 'code and cartTotal are required.' });
  }

  const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });

  if (!coupon) {
    return res.status(404).json({ success: false, message: 'Invalid coupon code.' });
  }

  if (!coupon.isActive) {
    return res.status(400).json({ success: false, message: 'This coupon is no longer active.' });
  }

  if (coupon.expiryDate < new Date()) {
    return res.status(400).json({ success: false, message: 'This coupon has expired.' });
  }

  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    return res
      .status(400)
      .json({ success: false, message: 'This coupon has reached its usage limit.' });
  }

  if (Number(cartTotal) < coupon.minPurchase) {
    return res.status(400).json({
      success: false,
      message: `A minimum purchase of ₹${coupon.minPurchase} is required to use this coupon.`,
    });
  }

  const discountAmount = computeDiscountAmount(coupon, Number(cartTotal));

  res.status(200).json({
    success: true,
    coupon: {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
    },
    discountAmount,
    newTotal: Math.round((Number(cartTotal) - discountAmount) * 100) / 100,
  });
});

/**
 * Increments a coupon's usedCount. Not exposed as a route — intended to be
 * called internally (e.g. by the order controller) once an order that used
 * this coupon is successfully placed.
 */
const incrementCouponUsage = async (code) => {
  await Coupon.findOneAndUpdate(
    { code: code.toUpperCase().trim() },
    { $inc: { usedCount: 1 } }
  );
};

module.exports = {
  getAllCouponsAdmin,
  getCouponAdmin,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
  validateCoupon,
  incrementCouponUsage,
};
