const express = require('express');
const {
  getProductReviews,
  getMyReviews,
  createReview,
  updateReview,
  deleteReview,
  getAllReviewsAdmin,
  toggleApproveReview,
} = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// ─── Admin (must come before any dynamic :id routes) ──────────────
router.get('/admin/all', protect, authorize('admin', 'superadmin'), getAllReviewsAdmin);
router.patch('/:id/approve', protect, authorize('admin', 'superadmin'), toggleApproveReview);

// ─── User ───────────────────────────────────────────────────────
router.get('/my', protect, getMyReviews);
router.get('/product/:productId', getProductReviews);
router.post('/product/:productId', protect, createReview);
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);

module.exports = router;
