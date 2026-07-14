const Product = require('../models/Product');
const Category = require('../models/Category');
const ApiFeatures = require('../utils/apiFeatures');
const asyncHandler = require('../utils/asyncHandler');
const Essential = require('../models/Essential');

const SEARCH_FIELDS = ['name', 'shortDescription', 'sku'];

/**
 * @desc    Get products for the storefront (filter, search, sort, paginate)
 * @route   GET /api/v1/products
 * @access  Public
 * Query params: category, search, minPrice, maxPrice, isFeatured, isBestSeller,
 *               isNewArrival, isTrending, sort, page, limit
 */
const getProducts = asyncHandler(async (req, res) => {
  const queryString = { ...req.query };

  if (req.query.minPrice || req.query.maxPrice) {
    queryString.price = {};
    if (req.query.minPrice) queryString.price.gte = req.query.minPrice;
    if (req.query.maxPrice) queryString.price.lte = req.query.maxPrice;
    delete queryString.minPrice;
    delete queryString.maxPrice;
  }

  // Storefront visibility rule: isActive must be true (or unset, so older
  // admin-created products saved before this field existed still show up),
  // and approvalStatus must be approved (or unset, for the same reason —
  // every admin product created before the multi-vendor upgrade never had
  // an approvalStatus written to it, so it must be treated as approved).
  const visibilityFilter = {
    $and: [
      { $or: [{ isActive: true }, { isActive: { $exists: false } }] },
      { $or: [{ approvalStatus: 'approved' }, { approvalStatus: { $exists: false } }] },
    ],
  };
// Daily Essentials tile click -> ?essential=<id>. Product has no
  // "essential" field, so resolve the tile's linked product list here and
  // constrain the query to just those products, then strip the param
  // before ApiFeatures.filter() sees it (it isn't a real Product field).
  if (queryString.essential) {
    const essential = await Essential.findById(queryString.essential).select('products');
    const ids = essential ? essential.products : [];
    visibilityFilter.$and.push({ _id: { $in: ids } });
    delete queryString.essential;
  }
  const features = new ApiFeatures(
    Product.find(visibilityFilter)
      .populate('category', 'name slug')
      .populate('vendor', 'shopName shopSlug'),
    queryString
  )
    .filter()
    .search(SEARCH_FIELDS)
    .sort('-createdAt')
    .limitFields()
    .paginate();
  features._searchFields = SEARCH_FIELDS;

  const [products, total] = await Promise.all([
    features.query,
    features.countTotal(Product, visibilityFilter),
  ]);

  res.status(200).json({
    success: true,
    count: products.length,
    total,
    page: features.pagination.page,
    pages: Math.ceil(total / features.pagination.limit),
    products,
  });
});

/**
 * @desc    Get a single active product by slug (public product page)
 * @route   GET /api/v1/products/:slug
 * @access  Public
 */
const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({
    slug: req.params.slug,
    $and: [
      { $or: [{ isActive: true }, { isActive: { $exists: false } }] },
      { $or: [{ approvalStatus: 'approved' }, { approvalStatus: { $exists: false } }] },
    ],
  })
    .populate('category', 'name slug')
    .populate('vendor', 'shopName shopSlug');

  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found.' });
  }

  res.status(200).json({ success: true, product });
});

/**
 * @desc    Get all products for admin (includes inactive, full filters, search, pagination)
 * @route   GET /api/v1/products/admin/all
 * @access  Private/Admin
 */
const getAllProductsAdmin = asyncHandler(async (req, res) => {
  const queryString = { ...req.query };

  if (req.query.minPrice || req.query.maxPrice) {
    queryString.price = {};
    if (req.query.minPrice) queryString.price.gte = req.query.minPrice;
    if (req.query.maxPrice) queryString.price.lte = req.query.maxPrice;
    delete queryString.minPrice;
    delete queryString.maxPrice;
  }

  const features = new ApiFeatures(
    Product.find().populate('category', 'name slug').populate('vendor', 'shopName email'),
    queryString
  )
    .filter()
    .search(SEARCH_FIELDS)
    .sort('-createdAt')
    .limitFields()
    .paginate(5000); // admin management screens need the whole catalog, not just 100
  features._searchFields = SEARCH_FIELDS;

  const [products, total] = await Promise.all([
    features.query,
    features.countTotal(Product),
  ]);

  res.status(200).json({
    success: true,
    count: products.length,
    total,
    page: features.pagination.page,
    pages: Math.ceil(total / features.pagination.limit),
    products,
  });
});

/**
 * @desc    Get a single product by id for admin (edit form)
 * @route   GET /api/v1/products/admin/:id
 * @access  Private/Admin
 */
const getProductAdmin = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('category', 'name slug');

  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found.' });
  }

  res.status(200).json({ success: true, product });
});

/**
 * @desc    Create a new product
 * @route   POST /api/v1/products
 * @access  Private/Admin
 */
const createProduct = asyncHandler(async (req, res) => {
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
    badge,
    badgeType,
    ingredients,
    benefits,
    isFeatured,
    isBestSeller,
    isNewArrival,
    isTrending,
    isActive,
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
    badge,
    badgeType,
    ingredients,
    benefits,
    isFeatured,
    isBestSeller,
    isNewArrival,
    isTrending,
    isActive,
    createdBy: req.user._id,
  });

  await Category.findByIdAndUpdate(category, { $inc: { productCount: 1 } });

  res.status(201).json({ success: true, product });
});

/**
 * @desc    Update a product
 * @route   PUT /api/v1/products/:id
 * @access  Private/Admin
 */
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
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
    'badge',
    'badgeType',
    'ingredients',
    'benefits',
    'isFeatured',
    'isBestSeller',
    'isNewArrival',
    'isTrending',
    'isActive',
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

  await product.save();

  // Keep category productCount accurate if the product moved categories
  const newCategory = product.category.toString();
  if (newCategory !== previousCategory) {
    await Category.findByIdAndUpdate(previousCategory, { $inc: { productCount: -1 } });
    await Category.findByIdAndUpdate(newCategory, { $inc: { productCount: 1 } });
  }

  res.status(200).json({ success: true, product });
});

/**
 * @desc    Delete a product
 * @route   DELETE /api/v1/products/:id
 * @access  Private/Admin
 */
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found.' });
  }

  await product.deleteOne();
  await Category.findByIdAndUpdate(product.category, { $inc: { productCount: -1 } });

  res.status(200).json({ success: true, message: 'Product deleted.' });
});

/**
 * @desc    Adjust stock for a product (inventory management)
 * @route   PATCH /api/v1/products/:id/stock
 * @access  Private/Admin
 * Body: { mode: 'set' | 'increment' | 'decrement', quantity: Number }
 */
const updateStock = asyncHandler(async (req, res) => {
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
  } else {
    product.stock = Math.max(0, qty);
  }

  await product.save();

  res.status(200).json({ success: true, product });
});

/**
 * @desc    Get products at or below a low-stock threshold (inventory alerts)
 * @route   GET /api/v1/products/admin/low-stock?threshold=10
 * @access  Private/Admin
 */
const getLowStockProducts = asyncHandler(async (req, res) => {
  const threshold = Number(req.query.threshold) || 10;

  const products = await Product.find({ stock: { $lte: threshold }, isActive: true })
    .populate('category', 'name slug')
    .sort('stock');

  res.status(200).json({ success: true, threshold, count: products.length, products });
});

module.exports = {
  getProducts,
  getProduct,
  getAllProductsAdmin,
  getProductAdmin,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  getLowStockProducts,
};
