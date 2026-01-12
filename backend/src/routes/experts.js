const express = require('express');
const ExpertController = require('../controllers/experts/expertController');
const VerificationController = require('../controllers/upload/verificationController');
const { verifyToken, optionalAuth, requireExpert } = require('../middleware/auth');

const router = express.Router();

/**
 * @route GET /api/experts
 * @desc Récupérer tous les experts
 * @access Public
 */
router.get('/', optionalAuth, ExpertController.getAllExperts);

/**
 * @route GET /api/experts/categories
 * @desc Récupérer les catégories d'experts
 * @access Public
 */
router.get('/categories', ExpertController.getCategories);

/**
 * @route GET /api/experts/stats
 * @desc Récupérer les statistiques du dashboard pour l'expert connecté
 * @access Private (Expert only)
 */
router.get('/stats', verifyToken, requireExpert, ExpertController.getExpertStats);
router.get('/me', verifyToken, requireExpert, ExpertController.getMyExpert);
router.get('/stats/analytics', verifyToken, requireExpert, ExpertController.getAnalytics);
router.get('/stats/top', verifyToken, requireExpert, ExpertController.getTopContent);

/**
 * @route GET /api/experts/:id
 * @desc Récupérer un expert par ID
 * @access Public
 */
/**
 * @route GET /api/experts/following
 * @desc Lister les experts suivis par l'utilisateur connecté
 * @access Private
 */
router.get('/following', verifyToken, ExpertController.listFollowing);

router.get('/:id', optionalAuth, ExpertController.getExpertById);

/**
 * @route POST /api/experts/:id/follow
 * @desc Suivre/Ne plus suivre un expert (toggle)
 * @access Private
 */
router.post('/:id/follow', verifyToken, ExpertController.toggleFollow);

/**
 * @route POST /api/experts
 * @desc Créer un profil expert
 * @access Private
 */
router.post('/', verifyToken, ExpertController.createExpert);

/**
 * @route PUT /api/experts/:id
 * @desc Mettre à jour un profil expert
 * @access Private
 */
router.put('/:id', verifyToken, ExpertController.updateExpert);

/**
 * @route POST /api/experts/submit-verification
 * @desc Soumettre les documents pour la vérification de l'expert
 * @access Private (Expert only)
 */
router.post('/submit-verification', verifyToken, requireExpert, VerificationController.submitForVerification);

module.exports = router;
