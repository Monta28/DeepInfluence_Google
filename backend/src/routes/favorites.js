const express = require('express');
const FavoritesController = require('../controllers/favorites/favoritesController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Experts
router.get('/experts', verifyToken, FavoritesController.listExperts);
router.post('/experts/:id', verifyToken, FavoritesController.toggleExpert);

// Formations
router.get('/formations', verifyToken, FavoritesController.listFormations);
router.post('/formations/:id', verifyToken, FavoritesController.toggleFormation);
// Vidéos (vrais favoris séparés des likes)
router.get('/videos', verifyToken, FavoritesController.listVideos);
router.post('/videos/:id', verifyToken, FavoritesController.toggleVideo);

module.exports = router;
