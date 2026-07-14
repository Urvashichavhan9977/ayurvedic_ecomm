const express = require('express');
const {
  createContact,
  getAllContactsAdmin,
  getContactAdmin,
  updateContactStatus,
  deleteContactAdmin,
} = require('../controllers/contactController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public — the storefront Contact page posts here, no login required.
router.post('/', createContact);

// Everything below is admin-only.
router.use(protect, authorize('admin', 'superadmin'));

router.get('/admin/all', getAllContactsAdmin);
router.get('/admin/:id', getContactAdmin);
router.patch('/admin/:id/status', updateContactStatus);
router.delete('/admin/:id', deleteContactAdmin);

module.exports = router;