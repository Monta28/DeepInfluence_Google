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
   */
  static async getReferralStats(req, res) {
    try {
      const referrals = await prisma.referral.findMany({
        where: { referrerId: req.user.id }
      });

      const totalReferrals = referrals.length;
      const activeReferrals = referrals.filter(r => r.isActive).length;
      const totalEarnings = referrals.reduce(
        (sum, r) => sum + parseFloat(r.totalEarnings || 0), 0
      );

      return ApiResponse.success(res, {
        totalReferrals,
        activeReferrals,
        totalEarnings
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
