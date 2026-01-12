const bcrypt = require('bcryptjs');
const prisma = require('../../services/database');
const JWTUtils = require('../../utils/jwt');
const ApiResponse = require('../../utils/response');

/**
 * Contrôleur pour l'authentification
 */
class AuthController {
  /**
   * Inscription d'un nouvel utilisateur
   */
  static async register(req, res) {
    try {
      const { 
        firstName, lastName, email, password, userType = 'user'
      } = req.body;

      if (!firstName || !lastName || !email || !password) {
        return ApiResponse.badRequest(res, 'Tous les champs obligatoires doivent être remplis');
      }
      if (password.length < 8) {
        return ApiResponse.badRequest(res, 'Le mot de passe doit contenir au moins 8 caractères');
      }
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return ApiResponse.badRequest(res, 'Un utilisateur avec cet email existe déjà');
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            firstName,
            lastName,
            email,
            password: hashedPassword,
            userType,
            avatar: '/images/users/default-avatar.jpg', // <-- Image par défaut
            coins: 100
          }
        });

        if (userType === 'expert') {
          await tx.expert.create({
            data: {
              userId: newUser.id,
              name: `${firstName} ${lastName}`,
              specialty: 'Non spécifiée',
              category: 'Non classée',
              hourlyRate: 0,
              pricePerMessage: 0,
              tags: '[]',
              languages: '[]',
              description: 'Profil en attente de complétion.',
            }
          });
        }
        return newUser;
      });

      return ApiResponse.created(res, { id: user.id }, 'Inscription réussie.');
    } catch (error) {
      console.error('Register error:', error);
      return ApiResponse.error(res, 'Erreur lors de l\'inscription');
    }
  }

  /**
   * Connexion d'un utilisateur
   */
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return ApiResponse.badRequest(res, 'Email et mot de passe requis');
      }

      const user = await prisma.user.findUnique({
        where: { email },
        include: { expert: true }
      });

      if (!user) {
        return ApiResponse.unauthorized(res, 'Email ou mot de passe incorrect');
      }

      if (!user.password) {
        return ApiResponse.unauthorized(res, 'Veuillez vous connecter avec votre fournisseur social (Google, Facebook, etc.).');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return ApiResponse.unauthorized(res, 'Email ou mot de passe incorrect');
      }

      const token = JWTUtils.generateToken({
        userId: user.id,
        email: user.email,
        userType: user.userType
      });

      const { password: _, ...userData } = user;
      return ApiResponse.success(res, { user: userData, token }, 'Connexion réussie');
    } catch (error) {
      console.error('Login error:', error);
      return ApiResponse.error(res, 'Erreur lors de la connexion');
    }
  }

  /**
   * Récupérer les informations de l'utilisateur connecté (CORRIGÉ)
   */
  static async me(req, res) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
          expert: true // On utilise `include` pour récupérer le profil expert associé
        }
      });

      if (!user) {
        return ApiResponse.notFound(res, 'Utilisateur non trouvé');
      }

      const { password, ...userData } = user;
      return ApiResponse.success(res, userData);
    } catch (error) {
      console.error('Me error:', error);
      return ApiResponse.error(res, 'Erreur lors de la récupération du profil');
    }
  }

  /**
   * Callback pour l'authentification sociale
   */
  static async socialLoginCallback(req, res) {
    try {
      const user = req.user;
      if (!user) {
        throw new Error('Utilisateur non trouvé après authentification sociale.');
      }

      const token = JWTUtils.generateToken({
        userId: user.id,
        email: user.email,
        userType: user.userType
      });

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
    } catch (error) {
      console.error('Social login callback error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/signin?error=social_login_failed`);
    }
  }

  /**
   * Déconnexion (côté client principalement)
   */
  static async logout(req, res) {
    try {
      return ApiResponse.success(res, null, 'Déconnexion réussie');
    } catch (error) {
      console.error('Logout error:', error);
      return ApiResponse.error(res, 'Erreur lors de la déconnexion');
    }
  }

  /**
   * Rafraîchir le token
   */
  static async refreshToken(req, res) {
    try {
      const token = JWTUtils.generateToken({
        userId: req.user.id,
        email: req.user.email,
        userType: req.user.userType
      });

      return ApiResponse.success(res, { token }, 'Token rafraîchi');
    } catch (error) {
      console.error('Refresh token error:', error);
      return ApiResponse.error(res, 'Erreur lors du rafraîchissement du token');
    }
  }
}

module.exports = AuthController;