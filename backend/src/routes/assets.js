const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// GET /api/assets/users/:id -> returns the user's image from public/images/users
router.get('/users/:id', async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ success: false, message: 'Missing id' });
    const publicDir = path.join(__dirname, '..', '..', 'public');
    const usersDir = path.join(publicDir, 'images', 'users');
    const exts = ['jpg', 'jpeg', 'png', 'webp'];
    let foundPath = null;
    for (const ext of exts) {
      const p = path.join(usersDir, `${id}.${ext}`);
      if (fs.existsSync(p)) { foundPath = p; break; }
    }
    if (!foundPath) {
      return res.status(404).json({ success: false, message: 'User image not found' });
    }
    return res.sendFile(foundPath);
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Error serving image' });
  }
});

module.exports = router;

// Also serve experts' images by id
router.get('/experts/:id', async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ success: false, message: 'Missing id' });
    const publicDir = path.join(__dirname, '..', '..', 'public');
    const expertsDir = path.join(publicDir, 'images', 'experts');
    const exts = ['jpg', 'jpeg', 'png', 'webp'];
    let foundPath = null;
    for (const ext of exts) {
      const p = path.join(expertsDir, `${id}.${ext}`);
      if (fs.existsSync(p)) { foundPath = p; break; }
    }
    if (!foundPath) {
      return res.status(404).json({ success: false, message: 'Expert image not found' });
    }
    return res.sendFile(foundPath);
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Error serving image' });
  }
});
