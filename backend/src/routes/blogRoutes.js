const express = require('express');
const router = express.Router();
const BlogPost = require('../models/BlogPost');
const { protect, authorize } = require('../middleware/auth');

const PRODUCT_FIELDS = 'name images price slug';

// Turn '' into null so Mongoose doesn't try to cast an empty string to
// ObjectId (happens when the admin leaves "Link a Product" unselected).
function sanitizeBody(body) {
  const out = { ...body };
  if (out.product === '' || out.product === undefined) out.product = null;
  return out;
}

// Public: active posts only, used by the storefront blog drawer
router.get('/', async (req, res) => {
  try {
    const posts = await BlogPost.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .populate('product', PRODUCT_FIELDS);
    res.json({ success: true, posts });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Admin: all posts (active + inactive)
router.get('/admin/all', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const posts = await BlogPost.find()
      .sort({ order: 1, createdAt: -1 })
      .populate('product', PRODUCT_FIELDS);
    res.json({ success: true, posts });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    let post = await BlogPost.create(sanitizeBody(req.body));
    post = await post.populate('product', PRODUCT_FIELDS);
    res.status(201).json({ success: true, post });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

router.put('/:id', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const post = await BlogPost.findByIdAndUpdate(req.params.id, sanitizeBody(req.body), { new: true, runValidators: true })
      .populate('product', PRODUCT_FIELDS);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    res.json({ success: true, post });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

router.patch('/:id/toggle', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    post.isActive = !post.isActive;
    await post.save();
    await post.populate('product', PRODUCT_FIELDS);
    res.json({ success: true, post });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/:id', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    await BlogPost.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Post deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
