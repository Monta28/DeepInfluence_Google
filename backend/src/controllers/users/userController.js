const prisma = require('../../services/database');
const ApiResponse = require('../../utils/response');

/**
 * Contrôleur pour la gestion des utilisateurs
 */
class UserController {
  /**
   * Récupérer le profil de l'utilisateur
   */
  static async getProfile(req, res) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
          expert: true
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          bio: true,
          location: true,
          avatar: true,
          userType: true,
          isVerified: true,
          coins: true,
          sessionsCompleted: true,
          formationsFollowed: true,
          learningHours: true,
          expertsFollowed: true,
          joinDate: true,
          expert: true
        }
      });

      return ApiResponse.success(res, user);
    } catch (error) {
      console.error('Get profile error:', error);
      return ApiResponse.error(res, 'Erreur lors de la récupération du profil');
    }
  }

  /**
   * Mettre à jour le profil de l'utilisateur
   */
  static async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const { 
        firstName, lastName, phone, bio, location, avatar,
        specialty, hourlyRate, pricePerMessage, tags, languages, category 
      } = req.body;

      const updatedUser = await prisma.$transaction(async (tx) => {
        const userUpdateData = {};
        if (firstName !== undefined) userUpdateData.firstName = firstName;
        if (lastName !== undefined) userUpdateData.lastName = lastName;
        if (phone !== undefined) userUpdateData.phone = phone;
        if (bio !== undefined) userUpdateData.bio = bio;
        if (location !== undefined) userUpdateData.location = location;
        if (avatar !== undefined) userUpdateData.avatar = avatar;

        const currentUser = await tx.user.findUnique({ where: { id: userId }, include: { expert: true } });
        
        const isUserPartComplete = (userUpdateData.phone || currentUser.phone) && (userUpdateData.location || currentUser.location) && (userUpdateData.bio || currentUser.bio);
        let isProfileFullyComplete = isUserPartComplete;

        if (req.user.userType === 'expert') {
          const expertUpdateData = {};
          if (specialty !== undefined) expertUpdateData.specialty = specialty;
          if (hourlyRate !== undefined) expertUpdateData.hourlyRate = parseInt(hourlyRate, 10) || 0;
          if (pricePerMessage !== undefined) expertUpdateData.pricePerMessage = parseInt(pricePerMessage, 10) || 0;
          if (tags !== undefined) expertUpdateData.tags = JSON.stringify(tags);
          if (languages !== undefined) expertUpdateData.languages = JSON.stringify(languages);
          if (category !== undefined) expertUpdateData.category = category;
          expertUpdateData.name = `${userUpdateData.firstName || currentUser.firstName} ${userUpdateData.lastName || currentUser.lastName}`;

          await tx.expert.update({ where: { userId: userId }, data: expertUpdateData });

          const currentExpert = currentUser.expert;
          const isExpertPartComplete = (expertUpdateData.specialty || currentExpert.specialty) && (expertUpdateData.category || currentExpert.category) && (expertUpdateData.hourlyRate || currentExpert.hourlyRate) > 0;
          isProfileFullyComplete = isUserPartComplete && isExpertPartComplete;
        }

        if (isProfileFullyComplete && !currentUser.profileCompleted) {
          userUpdateData.profileCompleted = true;
        }

        return tx.user.update({
          where: { id: userId },
          data: userUpdateData,
          include: { expert: true }
        });
      });

      const { password, ...userData } = updatedUser;
      return ApiResponse.success(res, userData, 'Profil mis à jour');
    } catch (error) {
      console.error('Update profile error:', error);
      return ApiResponse.error(res, 'Erreur lors de la mise à jour du profil');
    }
  }

  /**
   * Récupérer les statistiques de l'utilisateur
   */
  static async getStats(req, res) {
    try {
      const stats = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          sessionsCompleted: true,
          formationsFollowed: true,
          learningHours: true,
          expertsFollowed: true,
          coins: true
        }
      });

      return ApiResponse.success(res, stats);
    } catch (error) {
      console.error('Get stats error:', error);
      return ApiResponse.error(res, 'Erreur lors de la récupération des statistiques');
    }
  }

  /**
   * Récupérer le solde de coins de l'utilisateur
   */
  static async getCoins(req, res) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { coins: true }
      });
      return ApiResponse.success(res, { balance: user?.coins || 0 });
    } catch (error) {
      console.error('Get coins error:', error);
      return ApiResponse.error(res, "Erreur lors de la récupération du solde");
    }
  }

  /**
   * Récupérer l'historique des transactions de l'utilisateur
   */
  static async getTransactions(req, res) {
    try {
      const take = Math.min(parseInt(req.query.limit || '50', 10), 200);
      const list = await prisma.transaction.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        take
      });
      return ApiResponse.success(res, list);
    } catch (error) {
      console.error('Get transactions error:', error);
      return ApiResponse.error(res, "Erreur lors de la récupération des transactions");
    }
  }

  /**
   * Achat d'un pack de coins
   */
  static async purchaseCoins(req, res) {
    try {
      const userId = req.user.id;
      const { coins, bonus = 0, priceMillimes = 0, packageId } = req.body || {};
      const coinsToAdd = parseInt(coins, 10) + parseInt(bonus, 10) || 0;
      if (!Number.isFinite(coinsToAdd) || coinsToAdd <= 0) {
        return ApiResponse.error(res, 'Montant de coins invalide', 400);
      }
      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.update({
          where: { id: userId },
          data: { coins: { increment: coinsToAdd } },
          select: { coins: true }
        });
        const t = await tx.transaction.create({
          data: {
            userId,
            type: 'purchase',
            amount: coinsToAdd,
            coins: coinsToAdd,
            description: packageId ? `Achat pack #${packageId}` : 'Achat de coins'
          }
        });
        return { balance: user.coins, transaction: t };
      });
      return ApiResponse.success(res, result, 'Achat effectué');
    } catch (error) {
      console.error('Purchase coins error:', error);
      return ApiResponse.error(res, "Erreur lors de l\'achat de coins");
    }
  }

  /**
   * Transférer des coins (retrait)
   */
  static async transferCoins(req, res) {
    try {
      const userId = req.user.id;
      const { coins } = req.body || {};
      const coinsToWithdraw = parseInt(coins, 10) || 0;
      if (!Number.isFinite(coinsToWithdraw) || coinsToWithdraw <= 0) {
        return ApiResponse.error(res, 'Montant de coins invalide', 400);
      }
      const result = await prisma.$transaction(async (tx) => {
        const current = await tx.user.findUnique({ where: { id: userId }, select: { coins: true } });
        if (!current || current.coins < coinsToWithdraw) {
          throw new Error('Solde insuffisant');
        }
        const user = await tx.user.update({
          where: { id: userId },
          data: { coins: { decrement: coinsToWithdraw } },
          select: { coins: true }
        });
        const t = await tx.transaction.create({
          data: {
            userId,
            type: 'transfer',
            amount: -coinsToWithdraw,
            coins: -coinsToWithdraw,
            description: 'Transfert vers carte bancaire'
          }
        });
        return { balance: user.coins, transaction: t };
      });
      return ApiResponse.success(res, result, 'Transfert effectué');
    } catch (error) {
      console.error('Transfer coins error:', error);
      const message = /Solde insuffisant/i.test(String(error)) ? 'Solde insuffisant' : "Erreur lors du transfert";
      return ApiResponse.error(res, message, /Solde insuffisant/i.test(String(error)) ? 400 : 500);
    }
  }
}

module.exports = UserController;
