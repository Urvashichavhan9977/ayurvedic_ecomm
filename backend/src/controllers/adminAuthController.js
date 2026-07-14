const crypto = require('crypto');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { sendTokenResponse } = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');

/**
 * NOTE: Admin and Admin/superadmin accounts now live in the same `User`
 * collection/model as customers (see models/User.js, role field). This
 * controller is kept only so the existing admin-panel routes
 * (/api/v1/admin/auth/...) keep working unchanged; it simply queries the
 * User model and additionally rejects plain 'user' accounts. New code
 * should prefer the single login at POST /api/v1/auth/login, which
 * returns the account's role and works for every role.
 */

/**
 * @desc    Log in an admin/superadmin
 * @route   POST /api/v1/admin/auth/login
 * @access  Public
 */
const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and password.',
    });
  }

  const admin = await User.findOne({
    email: email.toLowerCase(),
    role: { $in: ['admin', 'superadmin'] },
  }).select('+password');

  if (!admin) {
    return res.status(401).json({
      success: false,
      message: 'Invalid admin credentials.',
    });
  }

  if (admin.isActive === false) {
    return res.status(403).json({
      success: false,
      message: 'This admin account has been deactivated.',
    });
  }

  const isMatch = await admin.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid admin credentials.',
    });
  }

  admin.lastLogin = new Date();
  await admin.save({ validateBeforeSave: false });

  sendTokenResponse(admin, admin.role, 200, res);
});

/**
 * @desc    Log out the current admin by clearing the auth cookie
 * @route   POST /api/v1/admin/auth/logout
 * @access  Private/Admin
 */
const adminLogout = asyncHandler(async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({ success: true, message: 'Admin logged out successfully.' });
});

/**
 * @desc    Get the currently logged-in admin's profile
 * @route   GET /api/v1/admin/auth/me
 * @access  Private/Admin
 */
const getAdminMe = asyncHandler(async (req, res) => {
  const admin = await User.findById(req.user._id);

  res.status(200).json({ success: true, admin });
});

/**
 * @desc    Request a password reset email for an admin account
 * @route   POST /api/v1/admin/auth/forgot-password
 * @access  Public
 */
const adminForgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Please provide an email address.' });
  }

  const admin = await User.findOne({
    email: email.toLowerCase(),
    role: { $in: ['admin', 'superadmin'] },
  });

  if (!admin) {
    return res.status(200).json({
      success: true,
      message: 'If an admin account with that email exists, a reset link has been sent.',
    });
  }

  const resetToken = admin.getResetPasswordToken();
  await admin.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/admin/reset-password?token=${resetToken}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color:#1B5E20;">Amrita Ayurveda Admin — Password Reset</h2>
      <p>Hello ${admin.name},</p>
      <p>You requested a password reset for your admin account. This link expires in 30 minutes.</p>
      <p style="margin: 24px 0;">
        <a href="${resetUrl}" style="background:#1B5E20;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;">
          Reset Password
        </a>
      </p>
      <p>If you did not request this, please contact your system administrator immediately.</p>
    </div>
  `;

  try {
    console.log(`[adminForgotPassword] sending reset email to ${admin.email}`);
    await sendEmail({
      to: admin.email,
      subject: 'Amrita Ayurveda Admin — Password Reset Request',
      html,
    });

    res.status(200).json({
      success: true,
      message: 'If an admin account with that email exists, a reset link has been sent.',
    });
  } catch (err) {
    console.error(
      `[adminForgotPassword] email send failed for ${admin.email}:`,
      err && err.message ? err.message : err,
      'code=',
      err && err.code,
      'responseCode=',
      err && err.responseCode
    );

    admin.resetPasswordToken = undefined;
    admin.resetPasswordExpire = undefined;
    await admin.save({ validateBeforeSave: false });

    return res.status(500).json({
      success: false,
      message: 'Email could not be sent. Please try again later.',
    });
  }
});

/**
 * @desc    Reset admin password using the token emailed to the admin
 * @route   PUT /api/v1/admin/auth/reset-password/:resettoken
 * @access  Public
 */
const adminResetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;

  if (!password || password.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a new password of at least 8 characters.',
    });
  }

  const hashedToken = crypto.createHash('sha256').update(req.params.resettoken).digest('hex');

  const admin = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
    role: { $in: ['admin', 'superadmin'] },
  }).select('+resetPasswordToken +resetPasswordExpire');

  if (!admin) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired reset token.',
    });
  }

  admin.password = password;
  admin.resetPasswordToken = undefined;
  admin.resetPasswordExpire = undefined;
  await admin.save();

  sendTokenResponse(admin, admin.role, 200, res);
});


  /**
   * @desc    Change password while logged in (Settings page)
   * @route   PUT /api/v1/admin/auth/change-password
   * @access  Private/Admin
   */
  const adminChangePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide current and new password.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters.' });
    }
    const admin = await User.findById(req.user._id).select('+password');
    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }
    admin.password = newPassword;
    await admin.save();
    res.json({ success: true, message: 'Password changed successfully.' });
  });

  module.exports = {
  adminLogin,
  adminLogout,
  getAdminMe,
  adminForgotPassword,
  adminResetPassword,
  adminChangePassword,
};
