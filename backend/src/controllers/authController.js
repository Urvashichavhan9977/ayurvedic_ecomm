const crypto = require('crypto');
const validator = require('validator');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { sendTokenResponse } = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');

const hashOtp = (otp) => crypto.createHash('sha256').update(otp).digest('hex');

/**
 * @desc    Register a new user and log them in immediately.
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide name, email and password.',
    });
  }

  if (!validator.isEmail(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address.',
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long.',
    });
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: 'An account with this email already exists.',
    });
  }

  // role is never taken from the request body — public sign-up always
  // creates a plain 'user' account. Admin/superadmin accounts are created
  // via the seed script or by an existing superadmin, never self-service.
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    phone: phone || '',
  });

  sendTokenResponse(user, user.role, 201, res);
});

/**
 * @desc    Log in an existing account — this is the single, role-based
 *          login used by both the customer site and the admin panel.
 *          The account's role ('user' | 'admin' | 'superadmin') lives on
 *          the User document itself, so the same email+password form can
 *          be used everywhere; the frontend decides where to redirect
 *          based on the `role` returned in the response.
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and password.',
    });
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password.',
    });
  }

  if (user.isActive === false) {
    return res.status(403).json({
      success: false,
      message: 'This account has been deactivated. Please contact support.',
    });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password.',
    });
  }

  // Track last login for admin/superadmin accounts only.
  if (user.role === 'admin' || user.role === 'superadmin') {
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
  }

  sendTokenResponse(user, user.role, 200, res);
});

const sendOtpLogin = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email || !validator.isEmail(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address.',
    });
  }

  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    return res.status(200).json({
      success: true,
      message: 'If an account exists, an OTP has been sent to your email.',
    });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.loginOtpCode = hashOtp(otp);
  user.loginOtpExpire = Date.now() + (Number(process.env.OTP_EXPIRE_MINUTES) || 10) * 60 * 1000;
  await user.save({ validateBeforeSave: false });

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color:#1B5E20;">Amrita Ayurveda — Login OTP</h2>
      <p>Hello ${user.name || 'there'},</p>
      <p>Use the following One-Time Password to log in:</p>
      <p style="font-size: 24px; font-weight: bold; letter-spacing: 0.12em; margin: 16px 0;">${otp}</p>
      <p>This OTP is valid for ${Number(process.env.OTP_EXPIRE_MINUTES) || 10} minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
    </div>
  `;

  try {
    await sendEmail({
      to: user.email,
      subject: 'Your Amrita Ayurveda Login OTP',
      html,
    });

    res.status(200).json({
      success: true,
      message: 'If an account exists, an OTP has been sent to your email.',
    });
  } catch (err) {
    user.loginOtpCode = undefined;
    user.loginOtpExpire = undefined;
    await user.save({ validateBeforeSave: false });

    console.error('[sendOtpLogin] email send failed:', err && err.message ? err.message : err);
    return res.status(500).json({
      success: false,
      message: 'Unable to send OTP. Please try again later.',
    });
  }
});

const verifyOtpLogin = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !validator.isEmail(email) || !otp || otp.length < 4) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email and OTP.',
    });
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select(
    '+loginOtpCode +loginOtpExpire'
  );

  if (
    !user ||
    !user.loginOtpCode ||
    !user.loginOtpExpire ||
    user.loginOtpExpire < Date.now() ||
    hashOtp(otp) !== user.loginOtpCode
  ) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired OTP.',
    });
  }

  if (user.isActive === false) {
    return res.status(403).json({
      success: false,
      message: 'This account has been deactivated. Please contact support.',
    });
  }

  user.loginOtpCode = undefined;
  user.loginOtpExpire = undefined;
  await user.save({ validateBeforeSave: false });

  sendTokenResponse(user, user.role, 200, res);
});

/**
 * @desc    Log out the current user by clearing the auth cookie
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
const logoutUser = asyncHandler(async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({ success: true, message: 'Logged out successfully.' });
});

/**
 * @desc    Get the currently logged-in user's profile
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  res.status(200).json({ success: true, user, role: user.role });
});

/**
 * @desc    Request a password reset email
 * @route   POST /api/v1/auth/forgot-password
 * @access  Public
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Please provide an email address.' });
  }

  const user = await User.findOne({ email: email.toLowerCase() });

  // Respond with a generic success message even if the account doesn't
  // exist, to avoid leaking which emails are registered.
  if (!user) {
    return res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a reset link has been sent.',
    });
  }

  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color:#1B5E20;">Amrita Ayurveda — Password Reset</h2>
      <p>Hello ${user.name},</p>
      <p>You requested a password reset. Click the button below to set a new password. This link expires in 30 minutes.</p>
      <p style="margin: 24px 0;">
        <a href="${resetUrl}" style="background:#1B5E20;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;">
          Reset Password
        </a>
      </p>
      <p>If you did not request this, you can safely ignore this email.</p>
    </div>
  `;

  try {
    console.log(`[forgotPassword] sending reset email to ${user.email}`);
    await sendEmail({
      to: user.email,
      subject: 'Amrita Ayurveda — Password Reset Request',
      html,
    });

    res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a reset link has been sent.',
    });
  } catch (err) {
    console.error(
      `[forgotPassword] email send failed for ${user.email}:`,
      err && err.message ? err.message : err,
      'code=',
      err && err.code,
      'responseCode=',
      err && err.responseCode
    );

    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return res.status(500).json({
      success: false,
      message: 'Email could not be sent. Please try again later.',
    });
  }
});

/**
 * @desc    Reset password using the token emailed to the user
 * @route   PUT /api/v1/auth/reset-password/:resettoken
 * @access  Public
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;

  if (!password || password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a new password of at least 6 characters.',
    });
  }

  const hashedToken = crypto.createHash('sha256').update(req.params.resettoken).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  }).select('+resetPasswordToken +resetPasswordExpire');

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired reset token.',
    });
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendTokenResponse(user, user.role, 200, res);
});

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
  forgotPassword,
  resetPassword,
  sendOtpLogin,
  verifyOtpLogin,
};