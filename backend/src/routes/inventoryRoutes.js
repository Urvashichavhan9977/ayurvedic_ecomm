const express = require('express');
const {
  getInventoryOverview,
  getInventoryList,
  adjustProductStock,
  bulkUpdateStock,
  getStockByCategory,
} = require('../controllers/inventoryController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All inventory routes are admin-only
router.use(protect, authorize('admin', 'superadmin'));

router.get('/overview', getInventoryOverview);
router.get('/by-category', getStockByCategory);
router.patch('/bulk-update', bulkUpdateStock);
router.get('/', getInventoryList);
router.patch('/:id', adjustProductStock);

module.exports = router;
