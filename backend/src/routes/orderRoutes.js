const express = require('express');
const {
  createOrder,
  createRazorpayOrder,
  verifyRazorpayPayment,
  getMyOrders,
  getMyOrderByOrderId,
  getAllOrdersAdmin,
  getAdminOwnedOrders,
  getOrderAdmin,
  updateOrderStatus,
  getOrderStatsAdmin,
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// ── Customer-facing routes (any logged-in user) ───────────────────
router.post('/', protect, createOrder); // Cash on Delivery
router.get('/my', protect, getMyOrders);
router.get('/my/:orderId', protect, getMyOrderByOrderId);
router.post('/razorpay/create-order', protect, createRazorpayOrder);
router.post('/razorpay/verify', protect, verifyRazorpayPayment);

// ── Everything below is admin-only ────────────────────────────────
router.use(protect, authorize('admin', 'superadmin'));

router.get('/admin/stats', getOrderStatsAdmin);
router.get('/admin/owned', getAdminOwnedOrders); // 📦 Admin Orders page — admin-owned items only
router.get('/admin/all', getAllOrdersAdmin);
router.get('/admin/:id', getOrderAdmin);
router.patch('/:id/status', updateOrderStatus);

module.exports = router;