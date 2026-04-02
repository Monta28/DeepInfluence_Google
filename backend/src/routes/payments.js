const express = require('express');
const PaymentController = require('../controllers/payments/paymentController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

/**
 * PHASE 2 - Routes pour le module de paiement Flouci
 */

/**
 * @route GET /api/payments/coin-packs
 * @desc Récupérer les packs de coins disponibles
 * @access Public
 */
router.get('/coin-packs', PaymentController.getCoinPacks);

/**
 * @route POST /api/payments/buy-coins
 * @desc Acheter un pack de coins via Flouci
 * @access Private
 */
router.post('/buy-coins', verifyToken, PaymentController.buyCoinPack);

/**
 * @route POST /api/payments/buy-course
 * @desc Acheter un cours directement via Flouci (paiement en TND)
 * @access Private
 */
router.post('/buy-course', verifyToken, PaymentController.buyCourse);

/**
 * @route POST /api/payments/buy-video
 * @desc Acheter une vidéo directement via Flouci (paiement en TND)
 * @access Private
 */
router.post('/buy-video', verifyToken, PaymentController.buyVideo);

/**
 * @route GET /api/payments/my
 * @desc Récupérer l'historique de paiements de l'utilisateur
 * @access Private
 */
router.get('/my', verifyToken, PaymentController.getPaymentHistory);

/**
 * @route GET /api/payments/:id/verify
 * @desc Vérifier le statut d'un paiement auprès de Flouci
 * @access Private
 */
router.get('/:id/verify', verifyToken, PaymentController.verifyPayment);

/**
 * @route POST /api/payments/webhook/flouci
 * @desc Webhook Flouci pour notification de paiement
 * @access Public (with signature verification)
 */
router.post('/webhook/flouci', PaymentController.handleFlouciWebhook);

module.exports = router;
