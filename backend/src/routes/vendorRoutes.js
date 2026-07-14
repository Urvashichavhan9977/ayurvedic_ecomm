const express = require('express');
const {
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
} = require('../controllers/vendorController');
const { protect, authorize } = require('../middleware/auth');
const { requireApprovedVendor } = require('../middleware/vendorAuth');

const router = express.Router();

// Every route here is a vendor-only route.
router.use(protect, authorize('vendor'));

router.get('/dashboard', getVendorDashboard);
router.get('/earnings', getMyEarnings);

router.get('/products', getMyProducts);
router.get('/products/:id', getMyProduct);
router.post('/products', requireApprovedVendor, createMyProduct);
router.put('/products/:id', requireApprovedVendor, updateMyProduct);
router.delete('/products/:id', requireApprovedVendor, deleteMyProduct);
router.patch('/products/:id/stock', requireApprovedVendor, updateMyProductStock);

router.get('/orders', requireApprovedVendor, getMyOrders);
router.patch('/orders/:orderId/item-status', requireApprovedVendor, updateMyOrderItemStatus);

module.exports = router;
