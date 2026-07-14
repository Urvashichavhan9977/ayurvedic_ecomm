const mongoose = require('mongoose');
const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Recalculates and persists a product's ratingsAverage / ratingsQuantity
 * from all of its currently-approved reviews. Called any time a review is
 * created, updated, deleted, or has its approval status changed.
 */
const recalculateProductRatings = async (productId) => {
  const castProductId = mongoose.Types.ObjectId.isValid(productId)
    ? new mongoose.Types.ObjectId(productId)
    : productId;
  const stats = await Review.aggregate([
    { $match: { product: castProductId, isApproved: true } },
    {
      $group: {
        _id: '$product',
        avgRating: { $avg: '$rating' },
        numRatings: { $sum: 1 },
      },
    },
  ]);

  const ratingsAverage = stats.length > 0 ? stats[0].avgRating : 0;
  const ratingsQuantity = stats.length > 0 ? stats[0].numRatings : 0;

  await Product.findByIdAndUpdate(productId, { ratingsAverage, ratingsQuantity });
};

/**
 * @desc    Get approved reviews for a product (public product page)
 * @route   GET /api/v1/reviews/product/:productId
 * @access  Public
 * Query params: sort, page, limit
 */
const getProductReviews = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
  const skip = (page - 1) * limit;

  const sortMap = {
    newest: '-createdAt',
    oldest: 'createdAt',
    highest: '-rating',
    lowest: 'rating',
  };
  const sort = sortMap[req.query.sort] || '-createdAt';

  const filter = { product: productId, isApproved: true };

  // Aggregation pipelines don't auto-cast query values the way find()/countDocuments()
  // do, so the string productId from the URL must be turned into a real ObjectId here,
  // otherwise $match silently matches nothing and the star breakdown bars always show
  // 0 even when approved reviews exist.
  const isValidProductId = mongoose.Types.ObjectId.isValid(productId);
  const aggMatch = {
    ...filter,
    product: isValidProductId ? new mongoose.Types.ObjectId(productId) : productId,
  };

  const [reviews, total, ratingBreakdown] = await Promise.all([
    Review.find(filter)
      .populate('user', 'name avatar')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Review.countDocuments(filter),
    Review.aggregate([
      { $match: aggMatch },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
    ]),
  ]);

  res.status(200).json({
    success: true,
    count: reviews.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    ratingBreakdown,
    reviews,
  });
});

/**
 * @desc    Get the logged-in user's own reviews
 * @route   GET /api/v1/reviews/my
 * @access  Private/User
 */
const getMyReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ user: req.user._id })
    .populate('product', 'name slug images')
    .sort('-createdAt');

  res.status(200).json({ success: true, count: reviews.length, reviews });
});

/**
 * @desc    Create a review for a product
 * @route   POST /api/v1/reviews/product/:productId
 * @access  Private/User
 * Body: { rating, title, comment, images, order }
 */
const createReview = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { rating, title, comment, images, order } = req.body;

  if (!rating || !comment) {
    return res.status(400).json({ success: false, message: 'Rating and comment are required.' });
  }

  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found.' });
  }

  const alreadyReviewed = await Review.findOne({ user: req.user._id, product: productId });
  if (alreadyReviewed) {
    return res
      .status(409)
      .json({ success: false, message: 'You have already reviewed this product.' });
  }

  // Determine verified-purchase status: does the user have a delivered/paid
  // order containing this product?
  const purchaseOrder = await Order.findOne({
    user: req.user._id,
    'orderItems.product': productId,
    ...(order ? { _id: order } : {}),
    $or: [{ isPaid: true }, { orderStatus: 'Delivered' }],
  });

  const review = await Review.create({
    user: req.user._id,
    product: productId,
    order: purchaseOrder ? purchaseOrder._id : null,
    rating,
    title,
    comment,
    images: images || [],
    isVerifiedPurchase: !!purchaseOrder,
  });

  await recalculateProductRatings(product._id);

  const populatedReview = await review.populate('user', 'name avatar');

  res.status(201).json({ success: true, review: populatedReview });
});

/**
 * @desc    Update the logged-in user's own review
 * @route   PUT /api/v1/reviews/:id
 * @access  Private/User
 */
const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    return res.status(404).json({ success: false, message: 'Review not found.' });
  }

  const isOwnerEdit = review.user.toString() === req.user._id.toString();
  const isAdminEdit = ['admin', 'superadmin'].includes(req.user.role);

  if (!isOwnerEdit && !isAdminEdit) {
    return res
      .status(403)
      .json({ success: false, message: 'You can only edit your own review.' });
  }

  const { rating, title, comment, images, isApproved } = req.body;
  if (rating !== undefined) review.rating = rating;
  if (title !== undefined) review.title = title;
  if (comment !== undefined) review.comment = comment;
  if (images !== undefined) review.images = images;
  // Owner edits go back to pending moderation; admin edits keep whatever
  // approval state the admin explicitly sets (defaulting to staying approved).
  if (isAdminEdit && isApproved !== undefined) {
    review.isApproved = isApproved;
  } else if (isOwnerEdit) {
    review.isApproved = true;
  }

  await review.save();
  await recalculateProductRatings(review.product);

  res.status(200).json({ success: true, review });
});

/**
 * @desc    Delete a review (owner or admin)
 * @route   DELETE /api/v1/reviews/:id
 * @access  Private/User or Private/Admin
 */
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    return res.status(404).json({ success: false, message: 'Review not found.' });
  }

  const isOwner = review.user.toString() === req.user._id.toString();
  const isAdmin = ['admin', 'superadmin'].includes(req.user.role);

  if (!isOwner && !isAdmin) {
    return res
      .status(403)
      .json({ success: false, message: 'You are not permitted to delete this review.' });
  }

  const { product } = review;
  await review.deleteOne();
  await recalculateProductRatings(product);

  res.status(200).json({ success: true, message: 'Review deleted.' });
});

/**
 * @desc    Get all reviews for admin moderation (filter, search, paginate)
 * @route   GET /api/v1/reviews/admin/all
 * @access  Private/Admin
 * Query params: isApproved, rating, product, search, page, limit
 */
const getAllReviewsAdmin = asyncHandler(async (req, res) => {
  const { isApproved, rating, product, search } = req.query;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;

  const filter = {};
  if (isApproved !== undefined) filter.isApproved = isApproved === 'true';
  if (rating) filter.rating = Number(rating);
  if (product) filter.product = product;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { comment: { $regex: search, $options: 'i' } },
    ];
  }

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('user', 'name email')
      .populate('product', 'name slug')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit),
    Review.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count: reviews.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    reviews,
  });
});

/**
 * @desc    Approve or unapprove a review (moderation)
 * @route   PATCH /api/v1/reviews/:id/approve
 * @access  Private/Admin
 * Body: { isApproved } — if omitted, toggles current value
 */
const toggleApproveReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    return res.status(404).json({ success: false, message: 'Review not found.' });
  }

  review.isApproved = req.body.isApproved !== undefined ? !!req.body.isApproved : !review.isApproved;
  await review.save();
  await recalculateProductRatings(review.product);

  res.status(200).json({ success: true, review });
});

module.exports = {
  getProductReviews,
  getMyReviews,
  createReview,
  updateReview,
  deleteReview,
  getAllReviewsAdmin,
  toggleApproveReview,
};