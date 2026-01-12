const express = require('express');
const VideoController = require('../controllers/videos/videoController');
const { verifyToken, optionalAuth, requireExpert } = require('../middleware/auth');

const router = express.Router();

/**
 * @route GET /api/videos
 * @desc Récupérer toutes les vidéos (pour utilisateurs/visiteurs)
 * @access Public
 */
router.get('/', optionalAuth, VideoController.getAllVideos);

/**
 * @route GET /api/videos/my
 * @desc Récupérer les vidéos de l'expert connecté
 * @access Private (Expert Only)
 */
router.get('/my', verifyToken, requireExpert, VideoController.getExpertVideos);

/**
 * @route GET /api/videos/:id
 * @desc Récupérer les vidéos des utilisateurs
 * @access Public
 */
router.get('/unlocked', verifyToken, VideoController.getMyUnlockedVideos);

/**
 * @route GET /api/videos/:id
 * @desc Récupérer une vidéo par ID
 * @access Public
 */
router.get('/:id', optionalAuth, VideoController.getVideoById);

/**
 * @route POST /api/videos/:id/like
 * @desc Liker/Unliker une vidéo
 * @access Private
 */
router.post('/:id/like', verifyToken, VideoController.toggleLike);

/**
 * @route POST /api/videos/:id/purchase
 * @desc Acheter/Débloquer une vidéo payante
 * @access Private
 */
router.post('/:id/purchase', verifyToken, VideoController.purchaseVideo);

/**
 * @route POST /api/videos
 * @desc Créer une vidéo (Expert)
 * @access Private (Expert Only)
 */
router.post('/', verifyToken, requireExpert, VideoController.createVideo);

module.exports = router;
