const express = require('express');
const UploadController = require('../controllers/upload/uploadController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.post('/avatar', verifyToken, UploadController.handleAvatarUpload);

module.exports = router;