const express = require('express');
const {
  adminLogin,
  adminLogout,
  getAdminMe,
  adminForgotPassword,
  adminResetPassword,
  adminChangePassword,
} = require('../controllers/adminAuthController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/login', adminLogin);
router.post('/logout', protect, authorize('admin', 'superadmin'), adminLogout);
router.get('/me', protect, authorize('admin', 'superadmin'), getAdminMe);
router.post('/forgot-password', adminForgotPassword);
router.put('/reset-password/:resettoken', adminResetPassword);
router.put('/change-password', protect, authorize('admin', 'superadmin'), adminChangePassword);

module.exports = router;
