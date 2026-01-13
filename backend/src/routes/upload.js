const express = require('express');
const UploadController = require('../controllers/upload/uploadController');
const { verifyToken, requireExpert } = require('../middleware/auth');

const router = express.Router();

router.post('/avatar', verifyToken, UploadController.handleAvatarUpload);
router.post('/formation-image', verifyToken, requireExpert, UploadController.handleFormationImageUpload);

module.exports = router;