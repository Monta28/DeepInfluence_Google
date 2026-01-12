const express = require('express');
const { verifyToken } = require('../middleware/auth');
const NotificationController = require('../controllers/notifications/notificationController');

const router = express.Router();

router.get('/', verifyToken, NotificationController.list);
router.put('/:id/read', verifyToken, NotificationController.markRead);
router.put('/read-all', verifyToken, NotificationController.markAllRead);

module.exports = router;

