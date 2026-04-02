const express = require('express');
const FormationController = require('../controllers/formations/formationController');
const { verifyToken, optionalAuth, requireExpert } = require('../middleware/auth');

const router = express.Router();

/**
 * @route GET /api/formations
 * @desc Récupérer toutes les formations (pour utilisateurs et visiteurs)
 * @access Public
 */
router.get('/', optionalAuth, FormationController.getAllFormations);

/**
 * @route GET /api/formations/my
 * @desc Récupérer les formations populaires de l'expert connecté
 * @access Private (Expert only)
 */
// CORRECTION : Utilisation de requireExpert et de la nouvelle fonction getExpertFormations
router.get('/my', verifyToken, requireExpert, FormationController.getExpertFormations);

/**
 * @route GET /api/formations/enrollments
 * @desc Récupérer les inscriptions de l'utilisateur standard
 * @access Private
 */
router.get('/enrollments', verifyToken, FormationController.getUserFormations);

/**
 * @route GET /api/formations/:id
 * @desc Récupérer une formation par ID
 * @access Public
 */
router.get('/:id', optionalAuth, FormationController.getFormationById);
// Export CSV des inscrits (propriétaire uniquement)
router.get('/:id/enrollments/export.csv', verifyToken, requireExpert, FormationController.exportEnrollmentsCsv);
router.get('/enrollments/export.csv', verifyToken, requireExpert, FormationController.exportAllEnrollmentsCsv);

/**
 * @route POST /api/formations
 * @desc Créer une nouvelle formation
 * @access Private (Expert only)
 */
router.post('/', verifyToken, requireExpert, FormationController.createFormation);

/**
 * @route PUT /api/formations/:id
 * @desc Mettre à jour une formation
 * @access Private (Expert owner only)
 */
router.put('/:id', verifyToken, requireExpert, FormationController.updateFormation);

/**
 * @route DELETE /api/formations/:id
 * @desc Supprimer une formation
 * @access Private (Expert owner only)
 */
router.delete('/:id', verifyToken, requireExpert, FormationController.deleteFormation);

/**
 * @route POST /api/formations/:id/enroll
 * @desc S'inscrire à une formation
 * @access Private
 */
router.post('/:id/enroll', verifyToken, FormationController.enrollInFormation);

/**
 * @route POST /api/formations/:id/video/start
 * @desc Démarrer la session vidéo de la formation (expert propriétaire uniquement)
 * @access Private (Expert owner only)
 */
router.post('/:id/video/start', verifyToken, requireExpert, FormationController.startVideoSession);

/**
 * @route POST /api/formations/:id/video/stop
 * @desc Terminer la session vidéo de la formation (expert propriétaire uniquement)
 * @access Private (Expert owner only)
 */
router.post('/:id/video/stop', verifyToken, requireExpert, FormationController.stopVideoSession);

/**
 * @route GET /api/formations/:id/video/status
 * @desc Obtenir le statut de la session vidéo
 * @access Private
 */
router.get('/:id/video/status', verifyToken, FormationController.getVideoSessionStatus);

module.exports = router;
