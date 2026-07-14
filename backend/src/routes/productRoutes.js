const express = require('express');
const {
  getProducts,
  getProduct,
  getAllProductsAdmin,
  getProductAdmin,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  getLowStockProducts,
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// ─── Public ──────────────────────────────────────────────────────
router.get('/', getProducts);

// ─── Admin (must come before the /:slug catch-all) ───────────────
router.get('/admin/all', protect, authorize('admin', 'superadmin'), getAllProductsAdmin);
router.get('/admin/low-stock', protect, authorize('admin', 'superadmin'), getLowStockProducts);
router.get('/admin/:id', protect, authorize('admin', 'superadmin'), getProductAdmin);
router.post('/', protect, authorize('admin', 'superadmin'), createProduct);
router.put('/:id', protect, authorize('admin', 'superadmin'), updateProduct);
router.patch('/:id', protect, authorize('admin', 'superadmin'), updateProduct);
router.delete('/:id', protect, authorize('admin', 'superadmin'), deleteProduct);
router.patch('/:id/stock', protect, authorize('admin', 'superadmin'), updateStock);

// ─── Public (catch-all by slug, must be last) ────────────────────
router.get('/:slug', getProduct);

module.exports = router;
