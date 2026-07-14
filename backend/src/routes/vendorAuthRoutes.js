const express = require('express');
const {
  registerVendor,
  loginVendor,
  logoutVendor,
  getVendorMe,
  updateVendorProfile,
  changeVendorPassword,
} = require('../controllers/vendorAuthController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/register', registerVendor);
router.post('/login', loginVendor);
router.post('/logout', protect, authorize('vendor'), logoutVendor);
router.get('/me', protect, authorize('vendor'), getVendorMe);
router.put('/profile', protect, authorize('vendor'), updateVendorProfile);
router.put('/change-password', protect, authorize('vendor'), changeVendorPassword);

module.exports = router;
