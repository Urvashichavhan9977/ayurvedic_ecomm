const express = require('express');
const router = express.Router();
const Essential = require('../models/Essential');

// Storefront: only active essentials, sorted by admin-defined order,
// with linked products populated (name/images/price is enough for the grid).
router.get('/', async (req, res) => {
  try {
    const essentials = await Essential.find({ isActive: true }).sort({ order: 1 }).populate('products', 'name images price');
    res.json({ success: true, essentials });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Admin: everything, active or not.
router.get('/admin/all', async (req, res) => {
  try {
    const essentials = await Essential.find().sort({ order: 1 }).populate('products', 'name images price');
    res.json({ success: true, essentials });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const essential = await Essential.findById(req.params.id).populate('products', 'name images price');
    if (!essential) return res.status(404).json({ success: false, message: 'Essential not found' });
    res.json({ success: true, essential });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const essential = await Essential.create(req.body);
    res.status(201).json({ success: true, essential });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const essential = await Essential.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('products', 'name images price');
    if (!essential) return res.status(404).json({ success: false, message: 'Essential not found' });
    res.json({ success: true, essential });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

router.patch('/:id/toggle', async (req, res) => {
  try {
    const essential = await Essential.findById(req.params.id);
    if (!essential) return res.status(404).json({ success: false, message: 'Essential not found' });
    essential.isActive = !essential.isActive;
    await essential.save();
    res.json({ success: true, essential });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await Essential.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Essential deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;