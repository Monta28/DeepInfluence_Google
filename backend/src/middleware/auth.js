const { PrismaClient } = require('@prisma/client');
const JWTUtils = require('../utils/jwt');
const ApiResponse = require('../utils/response');

const prisma = new PrismaClient();

/**
 * Middleware pour vérifier l'authentification
 */
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      try { console.warn(`[AUTH] Missing/invalid Authorization header for ${req.method} ${req.originalUrl || req.url}`); } catch {}
      return ApiResponse.error(res, 'Token manquant ou invalide', 401, { code: 'TOKEN_MISSING', path: req.originalUrl || req.url });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    const decoded = JWTUtils.verifyToken(token);
    
    // Vérifier que l'utilisateur existe toujours
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        userType: true,
        banned: true,
        isVerified: true,
        coins: true
      }
    });

    if (!user) {
      return ApiResponse.unauthorized(res, 'Utilisateur non trouvé');
    }

    if (user.banned) {
      try { console.warn(`[AUTH] Banned user attempted access userId=${user.id} (${req.method} ${req.originalUrl || req.url})`); } catch {}
      return ApiResponse.error(res, 'Compte banni', 403, { code: 'USER_BANNED', userId: user.id });
    }
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return ApiResponse.error(res, 'Token invalide', 401, { code: 'TOKEN_INVALID' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return ApiResponse.unauthorized(res, 'Token expiré');
    }
    
    return ApiResponse.error(res, 'Erreur d\'authentification');
  }
};

/**
 * Middleware pour vérifier que l'utilisateur est un expert
 */
const requireExpert = async (req, res, next) => {
  try {
    if (req.user.userType !== 'expert') {
      return ApiResponse.forbidden(res, 'Accès réservé aux experts');
    }
    
    // Récupérer les informations de l'expert
    const expert = await prisma.expert.findUnique({
      where: { userId: req.user.id }
    });
    
    if (!expert) {
      return ApiResponse.forbidden(res, 'Profil expert non trouvé');
    }
    
    req.expert = expert;
    next();
  } catch (error) {
    console.error('Expert middleware error:', error);
    return ApiResponse.error(res, 'Erreur de vérification expert');
  }
};

/**
 * Middleware optionnel pour l'authentification
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = JWTUtils.verifyToken(token);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        userType: true,
        isVerified: true,
        coins: true
      }
    });

    if (user) {
      req.user = user;
    }
    
    next();
  } catch (error) {
    // En cas d'erreur, on continue sans utilisateur authentifié
    next();
  }
};

module.exports = {
  verifyToken,
  requireExpert,
  optionalAuth,
  /**
   * Middleware pour vérifier que l'utilisateur est un administrateur
   */
  requireAdmin: async (req, res, next) => {
    try {
      if (!req.user || req.user.userType !== 'admin') {
        return ApiResponse.forbidden(res, 'Accès réservé aux administrateurs');
      }
      next();
    } catch (error) {
      console.error('Admin middleware error:', error);
      return ApiResponse.error(res, 'Erreur de vérification administrateur');
    }
  }
};


