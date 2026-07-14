const Contact = require('../models/Contact');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Public "Contact Us" form submission. Anyone can hit this —
 *          no auth required.
 * @route   POST /api/v1/contact
 * @access  Public
 */
const createContact = asyncHandler(async (req, res) => {
  const { fname, lname, email, phone, subject, message } = req.body;

  if (!fname || !email || !message) {
    return res.status(400).json({
      success: false,
      message: 'Name, email, and message are required.',
    });
  }

  const contact = await Contact.create({ fname, lname, email, phone, subject, message });

  res.status(201).json({
    success: true,
    message: 'Thank you for reaching out! Our team will get back to you soon.',
    contact,
  });
});

/**
 * @desc    Searchable, filterable, paginated list of contact-form
 *          submissions for the admin "Contact Messages" screen.
 * @route   GET /api/v1/contact/admin/all
 * @access  Private/Admin
 * Query params: search, status, sort, page, limit
 */
const getAllContactsAdmin = asyncHandler(async (req, res) => {
  const { search, status } = req.query;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;

  const filter = {};
  if (status) filter.status = status;
  if (search && search.trim()) {
    const term = search.trim();
    filter.$or = [
      { fname: { $regex: term, $options: 'i' } },
      { lname: { $regex: term, $options: 'i' } },
      { email: { $regex: term, $options: 'i' } },
      { phone: { $regex: term, $options: 'i' } },
      { subject: { $regex: term, $options: 'i' } },
      { message: { $regex: term, $options: 'i' } },
    ];
  }

  const sortMap = {
    newest: '-createdAt',
    oldest: 'createdAt',
  };
  const sort = sortMap[req.query.sort] || '-createdAt';

  const [contacts, total, newCount] = await Promise.all([
    Contact.find(filter).sort(sort).skip(skip).limit(limit),
    Contact.countDocuments(filter),
    Contact.countDocuments({ status: 'new' }),
  ]);

  res.status(200).json({
    success: true,
    count: contacts.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    newCount,
    contacts,
  });
});

/**
 * @desc    Get a single contact submission. Automatically flips a "new"
 *          message to "read" the first time an admin opens it.
 * @route   GET /api/v1/contact/admin/:id
 * @access  Private/Admin
 */
const getContactAdmin = asyncHandler(async (req, res) => {
  const contact = await Contact.findById(req.params.id);
  if (!contact) {
    return res.status(404).json({ success: false, message: 'Message not found.' });
  }

  if (contact.status === 'new') {
    contact.status = 'read';
    await contact.save();
  }

  res.status(200).json({ success: true, contact });
});

/**
 * @desc    Update a message's triage status (new / read / resolved).
 * @route   PATCH /api/v1/contact/admin/:id/status
 * @access  Private/Admin
 * Body: { status: 'new' | 'read' | 'resolved' }
 */
const updateContactStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['new', 'read', 'resolved'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status value.' });
  }

  const contact = await Contact.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  );
  if (!contact) {
    return res.status(404).json({ success: false, message: 'Message not found.' });
  }

  res.status(200).json({ success: true, contact });
});

/**
 * @desc    Delete a contact-form submission.
 * @route   DELETE /api/v1/contact/admin/:id
 * @access  Private/Admin
 */
const deleteContactAdmin = asyncHandler(async (req, res) => {
  const contact = await Contact.findByIdAndDelete(req.params.id);
  if (!contact) {
    return res.status(404).json({ success: false, message: 'Message not found.' });
  }

  res.status(200).json({ success: true, message: 'Message deleted.' });
});

module.exports = {
  createContact,
  getAllContactsAdmin,
  getContactAdmin,
  updateContactStatus,
  deleteContactAdmin,
};