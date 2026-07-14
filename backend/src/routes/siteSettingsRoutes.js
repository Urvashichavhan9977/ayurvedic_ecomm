const express = require('express');
const {
  getTheme,
  updateTheme,
  getContactInfo,
  updateContactInfo,
  getHomeContent,
  updateHomeContent,
} = require('../controllers/siteSettingsController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// ─── Public: the customer storefront reads this on load + polls it ──────
router.get('/theme', getTheme);
router.get('/contact-info', getContactInfo);
router.get('/home-content', getHomeContent);

// ─── Admin: only admins/superadmins can change these ─────────────────────
router.put('/theme', protect, authorize('admin', 'superadmin'), updateTheme);
router.put('/contact-info', protect, authorize('admin', 'superadmin'), updateContactInfo);
router.put('/home-content', protect, authorize('admin', 'superadmin'), updateHomeContent);

module.exports = router;