const express = require('express');
const AppointmentController = require('../controllers/appointments/appointmentController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

/**
 * @route GET /api/appointments
 * @desc Récupérer tous les rendez-vous de l'utilisateur
 * @access Private
 */
router.get('/', verifyToken, AppointmentController.getUserAppointments);

/**
 * @route POST /api/appointments
 * @desc Créer un nouveau rendez-vous
 * @access Private
 */
router.post('/', verifyToken, AppointmentController.createAppointment);

/**
 * @route GET /api/appointments/occupied
 * @desc Obtenir les créneaux occupés d'un expert pour une date
 * @access Private (auth pour éviter abus)
 */
router.get('/occupied', verifyToken, AppointmentController.getOccupiedSlots);

// Expert appointments list
router.get('/expert', verifyToken, AppointmentController.getExpertAppointments);

// Workflow actions
router.put('/:id/confirm', verifyToken, AppointmentController.confirmAppointment);
router.put('/:id/cancel', verifyToken, AppointmentController.cancelAppointment);
router.put('/:id/complete', verifyToken, AppointmentController.completeAppointment);

module.exports = router;
