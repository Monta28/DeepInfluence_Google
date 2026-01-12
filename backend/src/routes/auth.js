const express = require('express');
const passport = require('passport');
const AuthController = require('../controllers/auth/authController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Routes locales
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.get('/me', verifyToken, AuthController.me);
router.post('/logout', verifyToken, AuthController.logout);
router.post('/refresh', verifyToken, AuthController.refreshToken);

// --- CORRECTION POUR GOOGLE ---
// Route pour initier l'authentification Google
router.get('/google', (req, res, next) => {
  // On récupère le 'state' (qui contient le userType) depuis la requête du frontend
  const state = req.query.state; 
  // On le passe à la stratégie Passport
  passport.authenticate('google', { scope: ['profile', 'email'], session: false, state: state })(req, res, next);
});

// Route de callback après l'authentification Google
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  AuthController.socialLoginCallback
);

// --- CORRECTION POUR FACEBOOK (similaire) ---
router.get('/facebook', (req, res, next) => {
    const state = req.query.state;
    passport.authenticate('facebook', { scope: ['email'], session: false, state: state })(req, res, next);
});

router.get(
  '/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login', session: false }),
  AuthController.socialLoginCallback
);

module.exports = router;