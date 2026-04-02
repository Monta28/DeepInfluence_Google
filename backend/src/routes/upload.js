const express = require('express');
const UploadController = require('../controllers/upload/uploadController');
const { verifyToken, requireExpert } = require('../middleware/auth');

const router = express.Router();

router.post('/avatar', verifyToken, UploadController.handleAvatarUpload);
router.post('/formation-image', verifyToken, requireExpert, UploadController.handleFormationImageUpload);
router.post('/video', verifyToken, requireExpert, UploadController.handleVideoUpload);
router.post('/thumbnail', verifyToken, requireExpert, UploadController.handleThumbnailUpload);
router.post('/chat-attachment', verifyToken, UploadController.handleChatAttachmentUpload);

module.exports = router;