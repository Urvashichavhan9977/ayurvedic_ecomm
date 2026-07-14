const express = require('express');
  const router = express.Router();
  const HeroSlide = require('../models/HeroSlide');
  router.get('/', async (req, res) => {
    try {
      const slides = await HeroSlide.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
      res.json({ success: true, slides });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  });
  router.get('/admin/all', async (req, res) => {
    try {
      const slides = await HeroSlide.find().sort({ order: 1, createdAt: -1 });
      res.json({ success: true, slides });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  });
  router.post('/', async (req, res) => {
    try {
      const slide = await HeroSlide.create(req.body);
      res.status(201).json({ success: true, slide });
    } catch (err) { res.status(400).json({ success: false, message: err.message }); }
  });
  router.put('/:id', async (req, res) => {
    try {
      const slide = await HeroSlide.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
      if (!slide) return res.status(404).json({ success: false, message: 'Slide not found' });
      res.json({ success: true, slide });
    } catch (err) { res.status(400).json({ success: false, message: err.message }); }
  });
  router.patch('/:id/toggle', async (req, res) => {
    try {
      const slide = await HeroSlide.findById(req.params.id);
      if (!slide) return res.status(404).json({ success: false, message: 'Slide not found' });
      slide.isActive = !slide.isActive;
      await slide.save();
      res.json({ success: true, slide });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  });
  router.delete('/:id', async (req, res) => {
    try {
      await HeroSlide.findByIdAndDelete(req.params.id);
      res.json({ success: true, message: 'Slide deleted' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  });
  module.exports = router;
  