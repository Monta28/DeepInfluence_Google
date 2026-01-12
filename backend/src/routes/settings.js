const express = require('express');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const SettingsController = require('../controllers/settings/settingsController');

const router = express.Router();

// Public routes
router.get('/currency', SettingsController.getCurrency);

// Admin routes
router.get('/', verifyToken, requireAdmin, SettingsController.getAllSettings);
router.put('/currency', verifyToken, requireAdmin, SettingsController.updateCurrency);
router.put('/:key', verifyToken, requireAdmin, SettingsController.updateSetting);

module.exports = router;
