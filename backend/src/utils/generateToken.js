const jwt = require('jsonwebtoken');

/**
 * Signs a JWT containing the document's id and role.
 * role is embedded so the auth middleware knows whether to look the
 * subject up in the User collection or the Admin collection.
 */
const signToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

/**
 * Signs a token for the given document, sets it as an httpOnly cookie,
 * and sends a standardized JSON response containing the token and a
 * sanitized (password-free) copy of the user/admin document.
 *
 * @param {Document} user   Mongoose document (User or Admin)
 * @param {String}   role   'user' | 'admin'
 * @param {Number}   statusCode HTTP status code to respond with
 * @param {Response} res    Express response object
 */
const sendTokenResponse = (user, role, statusCode, res) => {
  const token = signToken(user._id, role);

  const cookieExpireDays = Number(process.env.JWT_COOKIE_EXPIRE) || 7;

  const cookieOptions = {
    expires: new Date(Date.now() + cookieExpireDays * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  };

  const safeUser = user.toObject ? user.toObject() : { ...user };
  delete safeUser.password;
  delete safeUser.resetPasswordToken;
  delete safeUser.resetPasswordExpire;
  delete safeUser.__v;

  res.status(statusCode).cookie('token', token, cookieOptions).json({
    success: true,
    token,
    role,
    user: safeUser,
  });
};

module.exports = { signToken, sendTokenResponse };
