const express = require('express');
const ReelController = require('../controllers/videos/reelController');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * PHASE 2 - Routes pour les Reels (mini-vidéos verticales type TikTok)
 */

/**
 * @route GET /api/reels/feed
 * @desc Récupérer le feed de Reels avec pagination par curseur
 * @access Public (optionalAuth pour like/unlock status)
 * @query cursor: ID du dernier Reel chargé
 * @query limit: Nombre de Reels à charger (défaut: 10, max: 50)
 * @query category: Filtrer par catégorie
 * @query accessType: FREE | PAID
 * @query sortBy: views | likes | recent (défaut: recent)
 */
router.get('/feed', optionalAuth, ReelController.getReelsFeed);

/**
 * @route GET /api/reels/categories
 * @desc Récupérer les catégories disponibles pour les Reels
 * @access Public
 */
router.get('/categories', ReelController.getCategories);

/**
 * @route GET /api/reels/expert/:expertId
 * @desc Récupérer les Reels d'un expert spécifique
 * @access Public
 */
router.get('/expert/:expertId', ReelController.getExpertReels);

/**
 * @route GET /api/reels/:id
 * @desc Récupérer un Reel spécifique par ID
 * @access Public (optionalAuth pour like/unlock status)
 */
router.get('/:id', optionalAuth, ReelController.getReelById);

module.exports = router;
