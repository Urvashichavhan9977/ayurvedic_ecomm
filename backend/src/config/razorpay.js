const Razorpay = require('razorpay');

// Reads keys from .env (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET).
// Get test/live keys from: https://dashboard.razorpay.com/app/keys
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.warn(
    '⚠️  RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are missing from .env — online payments will fail until you add them.'
  );
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

module.exports = razorpay;