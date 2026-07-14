const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');

/**
 * Protects routes by requiring a valid JWT, sent either as an httpOnly
 * cookie ('token') or as a Bearer token in the Authorization header.
 *
 * Customers, admins and superadmins all live in the single User collection
 * (role: 'user' | 'admin' | 'superadmin'), so there is only one model to
 * look up here. Attaches the resolved document to req.user with
 * req.user.role set so downstream handlers and `authorize` can use it.
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized. Please log in to access this resource.',
    });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized. Invalid or expired token.',
    });
  }

  const account = await User.findById(decoded.id);

  if (!account) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized. Account no longer exists.',
    });
  }

  if (account.isActive === false) {
    return res.status(403).json({
      success: false,
      message: 'This account has been deactivated.',
    });
  }

  req.user = account;
  next();
});

/**
 * Restricts a route to the given role(s).
 * Must be used after `protect`.
 *
 * Usage: router.delete('/:id', protect, authorize('admin'), controller)
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Role '${req.user ? req.user.role : 'guest'}' is not permitted to access this resource.`,
    });
  }
  next();
};

module.exports = { protect, authorize };
