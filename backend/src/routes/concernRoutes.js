const express = require('express');
  const router = express.Router();
  const Concern = require('../models/Concern');
  router.get('/', async (req, res) => {
    try {
      const concerns = await Concern.find({ isActive: true }).sort({ order: 1 }).populate('products', 'name images price');
      res.json({ success: true, concerns });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  });
  router.get('/admin/all', async (req, res) => {
    try {
      const concerns = await Concern.find().sort({ order: 1 }).populate('products', 'name images price');
      res.json({ success: true, concerns });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  });
  router.post('/', async (req, res) => {
    try {
      const concern = await Concern.create(req.body);
      res.status(201).json({ success: true, concern });
    } catch (err) { res.status(400).json({ success: false, message: err.message }); }
  });
  router.put('/:id', async (req, res) => {
    try {
      const concern = await Concern.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('products', 'name images price');
      if (!concern) return res.status(404).json({ success: false, message: 'Concern not found' });
      res.json({ success: true, concern });
    } catch (err) { res.status(400).json({ success: false, message: err.message }); }
  });
  router.patch('/:id/toggle', async (req, res) => {
    try {
      const concern = await Concern.findById(req.params.id);
      if (!concern) return res.status(404).json({ success: false, message: 'Concern not found' });
      concern.isActive = !concern.isActive;
      await concern.save();
      res.json({ success: true, concern });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  });
  router.delete('/:id', async (req, res) => {
    try {
      await Concern.findByIdAndDelete(req.params.id);
      res.json({ success: true, message: 'Concern deleted' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  });
  module.exports = router;
  