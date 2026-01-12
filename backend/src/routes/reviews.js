const express = require('express');
const ReviewController = require('../controllers/reviews/reviewController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

/**
 * @route GET /api/reviews/featured
 * @desc Récupérer les témoignages pour la page d'accueil
 * @access Public
 */
router.get('/featured', ReviewController.getFeaturedReviews);

/**
 * @route POST /api/reviews
 * @desc Créer un nouvel avis
 * @access Private
 */
router.post('/', verifyToken, ReviewController.createReview);

module.exports = router;