const validator = require('validator');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { sendTokenResponse } = require('../utils/generateToken');

/**
 * @desc    Register a new vendor (seller) account. Starts in
 *          vendorStatus='pending' — cannot list products until an admin
 *          approves the application.
 * @route   POST /api/v1/vendor/auth/register
 * @access  Public
 */
const registerVendor = asyncHandler(async (req, res) => {
  const { name, email, password, phone, shopName, shopDescription, gstNumber, businessAddress } =
    req.body;

  if (!name || !email || !password || !shopName) {
    return res.status(400).json({
      success: false,
      message: 'Please provide name, email, password and shop name.',
    });
  }

  if (!validator.isEmail(email)) {
    return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long.',
    });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({
      success: false,
      message: 'An account with this email already exists.',
    });
  }

  const vendor = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    phone: phone || '',
    role: 'vendor',
    shopName,
    shopDescription: shopDescription || '',
    gstNumber: gstNumber || '',
    businessAddress: businessAddress || {},
    vendorStatus: 'pending',
  });

  sendTokenResponse(vendor, vendor.role, 201, res);
});

/**
 * @desc    Log in a vendor account.
 * @route   POST /api/v1/vendor/auth/login
 * @access  Public
 */
const loginVendor = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password.' });
  }

  const vendor = await User.findOne({ email: email.toLowerCase(), role: 'vendor' }).select(
    '+password'
  );

  if (!vendor) {
    return res.status(401).json({ success: false, message: 'Invalid vendor credentials.' });
  }

  if (vendor.isActive === false) {
    return res.status(403).json({
      success: false,
      message: 'This vendor account has been deactivated. Please contact support.',
    });
  }

  const isMatch = await vendor.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid vendor credentials.' });
  }

  vendor.lastLogin = new Date();
  await vendor.save({ validateBeforeSave: false });

  sendTokenResponse(vendor, vendor.role, 200, res);
});

/**
 * @desc    Log out the current vendor by clearing the auth cookie.
 * @route   POST /api/v1/vendor/auth/logout
 * @access  Private/Vendor
 */
const logoutVendor = asyncHandler(async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({ success: true, message: 'Logged out successfully.' });
});

/**
 * @desc    Get the currently logged-in vendor's profile.
 * @route   GET /api/v1/vendor/auth/me
 * @access  Private/Vendor
 */
const getVendorMe = asyncHandler(async (req, res) => {
  const vendor = await User.findById(req.user._id);
  res.status(200).json({ success: true, vendor });
});

/**
 * @desc    Update the current vendor's shop profile / bank details.
 * @route   PUT /api/v1/vendor/auth/profile
 * @access  Private/Vendor
 */
const updateVendorProfile = asyncHandler(async (req, res) => {
  const vendor = await User.findById(req.user._id);
  if (!vendor) {
    return res.status(404).json({ success: false, message: 'Vendor not found.' });
  }

  const updatableFields = [
    'name',
    'phone',
    'shopName',
    'shopDescription',
    'shopLogo',
    'gstNumber',
    'businessAddress',
    'bankDetails',
  ];

  updatableFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      vendor[field] = req.body[field];
    }
  });

  await vendor.save();

  res.status(200).json({ success: true, vendor });
});

/**
 * @desc    Change password while logged in.
 * @route   PUT /api/v1/vendor/auth/change-password
 * @access  Private/Vendor
 */
const changeVendorPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Please provide current and new password.' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
  }
  const vendor = await User.findById(req.user._id).select('+password');
  const isMatch = await vendor.comparePassword(currentPassword);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
  }
  vendor.password = newPassword;
  await vendor.save();
  res.status(200).json({ success: true, message: 'Password changed successfully.' });
});

module.exports = {
  registerVendor,
  loginVendor,
  logoutVendor,
  getVendorMe,
  updateVendorProfile,
  changeVendorPassword,
};
