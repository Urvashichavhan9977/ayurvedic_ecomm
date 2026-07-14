const Category = require('../models/Category');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Get all active categories (public storefront)
 * @route   GET /api/v1/categories
 * @access  Public
 */
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort('displayOrder name');

  res.status(200).json({ success: true, count: categories.length, categories });
});

/**
 * @desc    Get a single category by slug or id (public)
 * @route   GET /api/v1/categories/:idOrSlug
 * @access  Public
 */
const getCategory = asyncHandler(async (req, res) => {
  const { idOrSlug } = req.params;
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);

  const category = await Category.findOne(
    isObjectId ? { _id: idOrSlug } : { slug: idOrSlug }
  );

  if (!category) {
    return res.status(404).json({ success: false, message: 'Category not found.' });
  }

  res.status(200).json({ success: true, category });
});

/**
 * @desc    Get all categories including inactive ones (admin list, with search)
 * @route   GET /api/v1/categories/admin/all
 * @access  Private/Admin
 */
const getAllCategoriesAdmin = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const filter = {};
  if (search) {
    filter.name = { $regex: search, $options: 'i' };
  }

  const categories = await Category.find(filter).sort('displayOrder name');

  res.status(200).json({ success: true, count: categories.length, categories });
});

/**
 * @desc    Create a new category
 * @route   POST /api/v1/categories
 * @access  Private/Admin
 */
const createCategory = asyncHandler(async (req, res) => {
  const { name, image, description, displayOrder, isActive } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, message: 'Category name is required.' });
  }

  const category = await Category.create({
    name,
    image,
    description,
    displayOrder,
    isActive,
  });

  res.status(201).json({ success: true, category });
});

/**
 * @desc    Update a category
 * @route   PUT /api/v1/categories/:id
 * @access  Private/Admin
 */
const updateCategory = asyncHandler(async (req, res) => {
  const { name, image, description, displayOrder, isActive } = req.body;

  const category = await Category.findById(req.params.id);
  if (!category) {
    return res.status(404).json({ success: false, message: 'Category not found.' });
  }

  if (name !== undefined) category.name = name;
  if (image !== undefined) category.image = image;
  if (description !== undefined) category.description = description;
  if (displayOrder !== undefined) category.displayOrder = displayOrder;
  if (isActive !== undefined) category.isActive = isActive;

  await category.save();

  res.status(200).json({ success: true, category });
});

/**
 * @desc    Delete a category (blocked if products still reference it)
 * @route   DELETE /api/v1/categories/:id
 * @access  Private/Admin
 */
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return res.status(404).json({ success: false, message: 'Category not found.' });
  }

  const productsInCategory = await Product.countDocuments({ category: category._id });
  if (productsInCategory > 0) {
    return res.status(409).json({
      success: false,
      message: `Cannot delete: ${productsInCategory} product(s) are still assigned to this category. Reassign or delete them first.`,
    });
  }

  await category.deleteOne();

  res.status(200).json({ success: true, message: 'Category deleted.' });
});

/**
 * @desc    Toggle a category's active status
 * @route   PATCH /api/v1/categories/:id/toggle
 * @access  Private/Admin
 */
const toggleCategoryStatus = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return res.status(404).json({ success: false, message: 'Category not found.' });
  }

  category.isActive = !category.isActive;
  await category.save();

  res.status(200).json({ success: true, category });
});

module.exports = {
  getCategories,
  getCategory,
  getAllCategoriesAdmin,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus,
};
