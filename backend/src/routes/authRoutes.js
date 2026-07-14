const express = require('express');
const {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
  forgotPassword,
  resetPassword,
  sendOtpLogin,
  verifyOtpLogin,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', registerUser);
// Single, role-based login for every account type (user/admin/superadmin).
// The response includes `role` so the frontend knows where to redirect.
router.post('/login', loginUser);
router.post('/logout', protect, logoutUser);
router.get('/me', protect, getMe);
router.post('/send-otp', sendOtpLogin);
router.post('/verify-otp', verifyOtpLogin);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:resettoken', resetPassword);

module.exports = router;