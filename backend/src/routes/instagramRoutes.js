const express = require('express');
  const router = express.Router();
  const InstagramPost = require('../models/InstagramPost');

  router.get('/', async (req, res) => {
    try {
      const posts = await InstagramPost.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
      res.json({ success: true, posts });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  });

  router.get('/admin/all', async (req, res) => {
    try {
      const posts = await InstagramPost.find().sort({ order: 1, createdAt: -1 });
      res.json({ success: true, posts });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  });

  router.post('/', async (req, res) => {
    try {
      const post = await InstagramPost.create(req.body);
      res.status(201).json({ success: true, post });
    } catch (err) { res.status(400).json({ success: false, message: err.message }); }
  });

  router.put('/:id', async (req, res) => {
    try {
      const post = await InstagramPost.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
      if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
      res.json({ success: true, post });
    } catch (err) { res.status(400).json({ success: false, message: err.message }); }
  });

  router.patch('/:id/toggle', async (req, res) => {
    try {
      const post = await InstagramPost.findById(req.params.id);
      if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
      post.isActive = !post.isActive;
      await post.save();
      res.json({ success: true, post });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  });

  router.delete('/:id', async (req, res) => {
    try {
      await InstagramPost.findByIdAndDelete(req.params.id);
      res.json({ success: true, message: 'Post deleted' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  });

  module.exports = router;