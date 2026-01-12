const express = require('express');
const StatsController = require('../controllers/stats/statsController');

const router = express.Router();

/**
 * @route GET /api/stats/public
 * @desc Récupérer les statistiques publiques pour la page d'accueil
 * @access Public
 */
router.get('/public', StatsController.getPublicStats);

module.exports = router;