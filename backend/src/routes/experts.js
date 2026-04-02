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
 * @route GET /api/experts/availability
 * @desc Récupérer la disponibilité de l'expert connecté
 * @access Private (Expert only)
 */
router.get('/availability', verifyToken, requireExpert, ExpertController.getMyAvailability);

/**
 * @route PUT /api/experts/availability
 * @desc Mettre à jour la disponibilité de l'expert connecté
 * @access Private (Expert only)
 */
router.put('/availability', verifyToken, requireExpert, ExpertController.updateMyAvailability);

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

/**
 * @route GET /api/experts/:id/availability
 * @desc Récupérer la disponibilité d'un expert (pour la page de réservation)
 * @access Public
 */
router.get('/:id/availability', ExpertController.getExpertAvailability);

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

// ==========================================
// PHASE 2 - VALIDATION KYC
// ==========================================

/**
 * @route GET /api/experts/verification/status
 * @desc Récupérer le statut de vérification KYC de l'expert connecté
 * @access Private (Expert only)
 */
router.get('/verification/status', verifyToken, requireExpert, ExpertController.getMyVerificationStatus);

// ==========================================
// PHASE 2 - EXCEPTIONS HORAIRES
// ==========================================

/**
 * @route POST /api/experts/schedule-exception
 * @desc Créer une exception horaire (jour indisponible ou heures personnalisées)
 * @access Private (Expert only)
 */
router.post('/schedule-exception', verifyToken, requireExpert, ExpertController.createScheduleException);

/**
 * @route GET /api/experts/schedule-exceptions
 * @desc Lister les exceptions horaires de l'expert connecté
 * @access Private (Expert only)
 */
router.get('/schedule-exceptions', verifyToken, requireExpert, ExpertController.listScheduleExceptions);

/**
 * @route DELETE /api/experts/schedule-exception/:id
 * @desc Supprimer une exception horaire
 * @access Private (Expert only)
 */
router.delete('/schedule-exception/:id', verifyToken, requireExpert, ExpertController.deleteScheduleException);

/**
 * @route GET /api/experts/:id
 * @desc RÃ©cupÃ©rer un expert par ID
 * @access Public
 */
router.get('/:id', optionalAuth, ExpertController.getExpertById);

module.exports = router;
