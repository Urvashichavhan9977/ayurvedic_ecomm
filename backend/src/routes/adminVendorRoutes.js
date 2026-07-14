const express = require('express');
const {
  listVendors,
  getVendor,
  approveVendor,
  rejectVendor,
  suspendVendor,
  reactivateVendor,
  listPendingVendorProducts,
  approveVendorProduct,
  rejectVendorProduct,
  getFinanceSummary,
} = require('../controllers/adminVendorController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect, authorize('admin', 'superadmin'));

// Pending product-approval queue (must come before /:id routes below it
// would otherwise be ambiguous with — kept as its own sub-path instead).
router.get('/products/pending', listPendingVendorProducts);
router.patch('/products/:id/approve', approveVendorProduct);
router.patch('/products/:id/reject', rejectVendorProduct);

// Platform-wide Amount / finance dashboard (own products vs vendor
// products vs vendor's 5% share) — must also come before /:id.
router.get('/finance/summary', getFinanceSummary);

router.get('/', listVendors);
router.get('/:id', getVendor);
router.patch('/:id/approve', approveVendor);
router.patch('/:id/reject', rejectVendor);
router.patch('/:id/suspend', suspendVendor);
router.patch('/:id/reactivate', reactivateVendor);

module.exports = router;
