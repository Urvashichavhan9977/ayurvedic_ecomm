const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/authRoutes');
const adminAuthRoutes = require('./routes/adminAuthRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const couponRoutes = require('./routes/couponRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');
const comboRoutes = require('./routes/comboRoutes');
const heroSlideRoutes = require('./routes/heroSlideRoutes');
const concernRoutes = require('./routes/concernRoutes');
const blogRoutes = require('./routes/blogRoutes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const siteSettingsRoutes = require('./routes/siteSettingsRoutes');
const contactRoutes = require('./routes/contactRoutes');
const vendorAuthRoutes = require('./routes/vendorAuthRoutes');
const vendorRoutes = require('./routes/vendorRoutes');
const adminVendorRoutes = require('./routes/adminVendorRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
const essentialRoutes = require('./routes/essentialRoutes');
const app = express();

// ─── Security & Core Middleware ────────────────────────────────
app.use(helmet());
const allowedOrigins = [
     'https://endearing-queijadas-0448a0.netlify.app',
     process.env.CLIENT_URL,
     'https://e-commerce-u71n.onrender.com',
     ...(process.env.NODE_ENV !== 'production' ? ['http://localhost:5173'] : []),
   ].filter(Boolean).map((url) => url.replace(/\/$/, ''));

   
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS: ' + origin));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
);

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ─── Health Check ───────────────────────────────────────────────
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Amrita Ayurveda API is running',
    timestamp: new Date().toISOString(),
  });
});

// app.js mein, health check ke just niche add karo
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Amrita Ayurveda API — visit /api/v1/health for status',
  });
});

// ─── Routes ─────────────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin/auth', adminAuthRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/coupons', couponRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/combos', comboRoutes);
app.use('/api/v1/hero-slides', heroSlideRoutes);
app.use('/api/v1/concerns', concernRoutes);
app.use('/api/v1/settings', siteSettingsRoutes);
app.use('/api/v1/blog', blogRoutes);
app.use('/api/v1/contact', contactRoutes);
app.use('/api/v1/vendor/auth', vendorAuthRoutes);
app.use('/api/v1/vendor', vendorRoutes);
app.use('/api/v1/admin/vendors', adminVendorRoutes);
app.use('/api/v1/chatbot', chatbotRoutes);
app.use('/api/v1/essentials', essentialRoutes);


// ─── 404 + Error Handling ───────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;