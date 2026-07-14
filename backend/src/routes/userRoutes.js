const express = require('express');
const {
  getAllUsersAdmin,
  getUserAdmin,
  updateUserStatus,
  getUserStatsAdmin,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All user-management routes are admin-only. Customer self-service
// (register/login/profile) already lives under /api/v1/auth.
router.use(protect, authorize('admin', 'superadmin'));

router.get('/admin/stats', getUserStatsAdmin);
router.get('/admin/all', getAllUsersAdmin);
router.get('/admin/:id', getUserAdmin);
router.patch('/:id/status', updateUserStatus);

module.exports = router;
