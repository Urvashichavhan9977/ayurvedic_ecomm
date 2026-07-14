const mongoose = require('mongoose');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');

const DEFAULT_LOW_STOCK_THRESHOLD = 10;

/**
 * @desc    Get store-wide inventory summary for the admin dashboard:
 *          total SKUs, total units in stock, total stock value, and
 *          counts of low-stock / out-of-stock products.
 * @route   GET /api/v1/inventory/overview
 * @access  Private/Admin
 * Query params: threshold (low-stock cutoff, default 10)
 */
const getInventoryOverview = asyncHandler(async (req, res) => {
  const threshold = Number(req.query.threshold) || DEFAULT_LOW_STOCK_THRESHOLD;

  const [summary] = await Product.aggregate([
    {
      $group: {
        _id: null,
        totalProducts: { $sum: 1 },
        totalUnits: { $sum: '$stock' },
        totalStockValue: { $sum: { $multiply: ['$stock', '$price'] } },
        outOfStockCount: {
          $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] },
        },
        lowStockCount: {
          $sum: {
            $cond: [{ $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', threshold] }] }, 1, 0],
          },
        },
      },
    },
  ]);

  const overview = summary || {
    totalProducts: 0,
    totalUnits: 0,
    totalStockValue: 0,
    outOfStockCount: 0,
    lowStockCount: 0,
  };
  delete overview._id;

  res.status(200).json({ success: true, threshold, overview });
});

/**
 * @desc    Get a filterable, searchable, paginated inventory list for the
 *          admin stock-management screen.
 * @route   GET /api/v1/inventory
 * @access  Private/Admin
 * Query params: status ('in-stock' | 'low-stock' | 'out-of-stock'),
 *               category, search, threshold, sort, page, limit
 */
const getInventoryList = asyncHandler(async (req, res) => {
  const { status, category, search } = req.query;
  const threshold = Number(req.query.threshold) || DEFAULT_LOW_STOCK_THRESHOLD;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;

  const filter = {};
  if (category) filter.category = category;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } },
    ];
  }

  if (status === 'out-of-stock') {
    filter.stock = 0;
  } else if (status === 'low-stock') {
    filter.stock = { $gt: 0, $lte: threshold };
  } else if (status === 'in-stock') {
    filter.stock = { $gt: threshold };
  }

  const sortMap = {
    'stock-asc': 'stock',
    'stock-desc': '-stock',
    'value-asc': 'price',
    'value-desc': '-price',
    name: 'name',
  };
  const sort = sortMap[req.query.sort] || 'stock';

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name slug')
      .select('name slug sku price stock images isActive category')
      .sort(sort)
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
    threshold,
    products,
  });
});

/**
 * @desc    Adjust stock for a single product (thin wrapper kept here for
 *          inventory-module symmetry; mirrors productController.updateStock)
 * @route   PATCH /api/v1/inventory/:id
 * @access  Private/Admin
 * Body: { mode: 'set' | 'increment' | 'decrement', quantity: Number }
 */
const adjustProductStock = asyncHandler(async (req, res) => {
  const { mode = 'set', quantity } = req.body;

  if (quantity === undefined || Number.isNaN(Number(quantity))) {
    return res.status(400).json({ success: false, message: 'A numeric quantity is required.' });
  }

  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found.' });
  }

  const qty = Number(quantity);

  if (mode === 'increment') {
    product.stock += qty;
  } else if (mode === 'decrement') {
    product.stock = Math.max(0, product.stock - qty);
  } else if (mode === 'set') {
    product.stock = Math.max(0, qty);
  } else {
    return res
      .status(400)
      .json({ success: false, message: "mode must be 'set', 'increment', or 'decrement'." });
  }

  await product.save();

  res.status(200).json({ success: true, product });
});

/**
 * @desc    Adjust stock for many products in one request (e.g. after a
 *          bulk restock or a stock-take reconciliation).
 * @route   PATCH /api/v1/inventory/bulk-update
 * @access  Private/Admin
 * Body: { updates: [{ productId, mode, quantity }, ...] }
 */
const bulkUpdateStock = asyncHandler(async (req, res) => {
  const { updates } = req.body;

  if (!Array.isArray(updates) || updates.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: 'updates must be a non-empty array.' });
  }

  const results = [];
  const errors = [];

  for (const update of updates) {
    const { productId, mode = 'set', quantity } = update || {};

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      errors.push({ productId, message: 'Invalid or missing productId.' });
      continue;
    }

    if (quantity === undefined || Number.isNaN(Number(quantity))) {
      errors.push({ productId, message: 'A numeric quantity is required.' });
      continue;
    }

    // eslint-disable-next-line no-await-in-loop
    const product = await Product.findById(productId);
    if (!product) {
      errors.push({ productId, message: 'Product not found.' });
      continue;
    }

    const qty = Number(quantity);
    if (mode === 'increment') {
      product.stock += qty;
    } else if (mode === 'decrement') {
      product.stock = Math.max(0, product.stock - qty);
    } else {
      product.stock = Math.max(0, qty);
    }

    // eslint-disable-next-line no-await-in-loop
    await product.save();
    results.push({ productId, stock: product.stock });
  }

  res.status(200).json({
    success: errors.length === 0,
    updatedCount: results.length,
    results,
    errors,
  });
});

/**
 * @desc    Get stock and stock-value totals grouped by category, for the
 *          admin inventory dashboard's category breakdown chart.
 * @route   GET /api/v1/inventory/by-category
 * @access  Private/Admin
 */
const getStockByCategory = asyncHandler(async (req, res) => {
  const breakdown = await Product.aggregate([
    {
      $group: {
        _id: '$category',
        productCount: { $sum: 1 },
        totalUnits: { $sum: '$stock' },
        totalStockValue: { $sum: { $multiply: ['$stock', '$price'] } },
      },
    },
    {
      $lookup: {
        from: 'categories',
        localField: '_id',
        foreignField: '_id',
        as: 'category',
      },
    },
    { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        categoryId: '$_id',
        categoryName: '$category.name',
        productCount: 1,
        totalUnits: 1,
        totalStockValue: 1,
      },
    },
    { $sort: { totalStockValue: -1 } },
  ]);

  res.status(200).json({ success: true, count: breakdown.length, breakdown });
});

module.exports = {
  getInventoryOverview,
  getInventoryList,
  adjustProductStock,
  bulkUpdateStock,
  getStockByCategory,
};
