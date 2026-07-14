const express = require('express');
const {
  getCategories,
  getCategory,
  getAllCategoriesAdmin,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus,
} = require('../controllers/categoryController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// ─── Public ──────────────────────────────────────────────────────
router.get('/', getCategories);

// ─── Admin (must come before the /:idOrSlug catch-all) ──────────
router.get('/admin/all', protect, authorize('admin', 'superadmin'), getAllCategoriesAdmin);
router.post('/', protect, authorize('admin', 'superadmin'), createCategory);
router.put('/:id', protect, authorize('admin', 'superadmin'), updateCategory);
router.delete('/:id', protect, authorize('admin', 'superadmin'), deleteCategory);
router.patch('/:id/toggle', protect, authorize('admin', 'superadmin'), toggleCategoryStatus);

// ─── Public (catch-all by id or slug, must be last) ─────────────
router.get('/:idOrSlug', getCategory);

module.exports = router;
