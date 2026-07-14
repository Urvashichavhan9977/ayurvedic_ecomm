const express = require('express');
  const router = express.Router();
  const Combo = require('../models/Combo');
  const { protect, authorize } = require('../middleware/auth');
  const pSel = 'name images price';
  router.get('/', async (req, res) => {
    try {
      const combos = await Combo.find({ isActive: true }).sort({ order: 1, createdAt: -1 }).populate('product1', pSel).populate('product2', pSel);
      res.json({ success: true, combos });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  });
  router.get('/admin/all', protect, authorize('admin', 'superadmin'), async (req, res) => {
    try {
      const { isActive, page = 1, limit = 20 } = req.query;
      const filter = {};
      if (isActive === 'true') filter.isActive = true;
      if (isActive === 'false') filter.isActive = false;
      const skip = (Number(page) - 1) * Number(limit);
      const total = await Combo.countDocuments(filter);
      const combos = await Combo.find(filter).sort({ order: 1, createdAt: -1 }).skip(skip).limit(Number(limit)).populate('product1', pSel).populate('product2', pSel);
      res.json({ success: true, combos, total, pages: Math.ceil(total / limit), page: Number(page) });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  });
  router.post('/', protect, authorize('admin', 'superadmin'), async (req, res) => {
    try {
      let combo = await Combo.create(req.body);
      combo = await combo.populate('product1 product2', pSel);
      res.status(201).json({ success: true, combo });
    } catch (err) { res.status(400).json({ success: false, message: err.message }); }
  });
  router.put('/:id', protect, authorize('admin', 'superadmin'), async (req, res) => {
    try {
      const combo = await Combo.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('product1 product2', pSel);
      if (!combo) return res.status(404).json({ success: false, message: 'Combo not found' });
      res.json({ success: true, combo });
    } catch (err) { res.status(400).json({ success: false, message: err.message }); }
  });
  router.patch('/:id/toggle', protect, authorize('admin', 'superadmin'), async (req, res) => {
    try {
      const combo = await Combo.findById(req.params.id);
      if (!combo) return res.status(404).json({ success: false, message: 'Combo not found' });
      combo.isActive = !combo.isActive;
      await combo.save();
      await combo.populate('product1 product2', pSel);
      res.json({ success: true, combo });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  });
  router.delete('/:id', protect, authorize('admin', 'superadmin'), async (req, res) => {
    try {
      await Combo.findByIdAndDelete(req.params.id);
      res.json({ success: true, message: 'Combo deleted' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  });
  module.exports = router;