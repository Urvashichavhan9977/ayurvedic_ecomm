const express = require('express');
const {
  getAllCouponsAdmin,
  getCouponAdmin,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
  validateCoupon,
} = require('../controllers/couponController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// ─── User ───────────────────────────────────────────────────────
router.post('/validate', protect, validateCoupon);

// ─── Admin ──────────────────────────────────────────────────────
router.get('/admin/all', protect, authorize('admin', 'superadmin'), getAllCouponsAdmin);
router.get('/admin/:id', protect, authorize('admin', 'superadmin'), getCouponAdmin);
router.post('/', protect, authorize('admin', 'superadmin'), createCoupon);
router.put('/:id', protect, authorize('admin', 'superadmin'), updateCoupon);
router.delete('/:id', protect, authorize('admin', 'superadmin'), deleteCoupon);
router.patch('/:id/toggle', protect, authorize('admin', 'superadmin'), toggleCouponStatus);

module.exports = router;
