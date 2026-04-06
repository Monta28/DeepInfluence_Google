const crypto = require('crypto');
const prisma = require('../../services/database');
const ApiResponse = require('../../utils/response');

/**
 * Contrôleur pour le système de parrainage
 */
class ReferralController {
  /**
   * Générer un code de parrainage unique pour l'utilisateur connecté
   */
  static async generateReferralCode(req, res) {
    try {
      // Vérifier si l'utilisateur a déjà un code
      const existingUser = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { referralCode: true }
      });

      if (existingUser.referralCode) {
        return ApiResponse.success(res, { referralCode: existingUser.referralCode }, 'Code de parrainage existant');
      }

      // Générer un code unique de 8 caractères alphanumériques
      let referralCode;
      let isUnique = false;
      while (!isUnique) {
        referralCode = crypto.randomBytes(4).toString('hex').toUpperCase();
        const existing = await prisma.user.findUnique({ where: { referralCode } });
        if (!existing) isUnique = true;
      }

      await prisma.user.update({
        where: { id: req.user.id },
        data: { referralCode }
      });

      return ApiResponse.success(res, { referralCode }, 'Code de parrainage généré');
    } catch (error) {
      console.error('Generate referral code error:', error);
      return ApiResponse.error(res, 'Erreur lors de la génération du code de parrainage');
    }
  }

  /**
   * Récupérer les statistiques de parrainage de l'utilisateur connecté
   * Retourne des stats détaillées : totaux par type, earnings par type, transactions récentes
   */
  static async getReferralStats(req, res) {
    try {
      const now = new Date();

      const referrals = await prisma.referral.findMany({
        where: { referrerId: req.user.id },
        include: {
          referredUser: {
            select: { id: true, firstName: true, lastName: true, userType: true }
          }
        }
      });

      // Totaux par type
      const userReferrals = referrals.filter(r => r.type === 'user');
      const expertReferrals = referrals.filter(r => r.type === 'expert');

      // Parrainages actifs (expiresAt dans le futur)
      const activeReferrals = referrals.filter(r => r.isActive && new Date(r.expiresAt) > now).length;

      // Gains ventilés par type
      const userEarnings = userReferrals.reduce(
        (sum, r) => sum + parseFloat(r.totalEarnings || 0), 0
      );
      const expertEarnings = expertReferrals.reduce(
        (sum, r) => sum + parseFloat(r.totalEarnings || 0), 0
      );
      const totalEarnings = userEarnings + expertEarnings;

      // Transactions récentes ayant généré des commissions de parrainage
      const recentCommissions = await prisma.transaction.findMany({
        where: {
          userId: req.user.id,
          type: 'referral_commission'
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      });

      return ApiResponse.success(res, {
        totalReferrals: referrals.length,
        userReferrals: userReferrals.length,
        expertReferrals: expertReferrals.length,
        activeReferrals,
        totalEarnings,
        userEarnings,
        expertEarnings,
        recentCommissions
      });
    } catch (error) {
      console.error('Get referral stats error:', error);
      return ApiResponse.error(res, 'Erreur lors de la récupération des statistiques');
    }
  }

  /**
   * Lister tous les filleuls de l'utilisateur connecté
   */
  static async getMyReferrals(req, res) {
    try {
      const referrals = await prisma.referral.findMany({
        where: { referrerId: req.user.id },
        include: {
          referredUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return ApiResponse.success(res, referrals);
    } catch (error) {
      console.error('Get my referrals error:', error);
      return ApiResponse.error(res, 'Erreur lors de la récupération des parrainages');
    }
  }
}

module.exports = ReferralController;
