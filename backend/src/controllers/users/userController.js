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
        specialty, hourlyRate, minuteRate, pricePerMessage, videoMessageRate,
        tags, languages, category, categories, country, linkedinUrl, rnePatente,
        profileCompleted: forceProfileCompleted
      } = req.body;

      const parseInteger = (value) => {
        const parsed = parseInt(value, 10);
        return Number.isFinite(parsed) ? parsed : 0;
      };

      const toStringArray = (value) => {
        if (value === undefined) return undefined;
        if (Array.isArray(value)) {
          return value
            .map((item) => String(item || '').trim())
            .filter(Boolean);
        }
        if (typeof value === 'string') {
          const trimmed = value.trim();
          if (!trimmed) return [];
          try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
              return parsed
                .map((item) => String(item || '').trim())
                .filter(Boolean);
            }
          } catch (_) {}
          return trimmed
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
        }
        return [];
      };

      const toBoolean = (value) => value === true || value === 'true';

      const parseStoredArray = (value) => {
        if (!value) return [];
        if (Array.isArray(value)) return value;
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed) ? parsed : [];
        } catch (_) {
          return [];
        }
      };

      const updatedUser = await prisma.$transaction(async (tx) => {
        const userUpdateData = {};
        if (firstName !== undefined) userUpdateData.firstName = firstName;
        if (lastName !== undefined) userUpdateData.lastName = lastName;
        if (phone !== undefined) userUpdateData.phone = phone;
        if (bio !== undefined) userUpdateData.bio = bio;
        if (location !== undefined) userUpdateData.location = location;
        if (avatar !== undefined) userUpdateData.avatar = avatar;

        const currentUser = await tx.user.findUnique({ where: { id: userId }, include: { expert: true } });

        if (!currentUser) {
          throw new Error('Utilisateur non trouve');
        }

        const mergedUser = {
          phone: userUpdateData.phone !== undefined ? userUpdateData.phone : currentUser.phone,
          location: userUpdateData.location !== undefined ? userUpdateData.location : currentUser.location,
          bio: userUpdateData.bio !== undefined ? userUpdateData.bio : currentUser.bio
        };

        const isUserPartComplete = Boolean(
          mergedUser.phone &&
          String(mergedUser.phone).trim() &&
          mergedUser.location &&
          String(mergedUser.location).trim() &&
          mergedUser.bio &&
          String(mergedUser.bio).trim()
        );

        let isProfileFullyComplete = isUserPartComplete;

        if (req.user.userType === 'expert' && currentUser.expert) {
          const expertUpdateData = {};
          if (specialty !== undefined) expertUpdateData.specialty = specialty;
          if (hourlyRate !== undefined) expertUpdateData.hourlyRate = parseInteger(hourlyRate);
          if (minuteRate !== undefined) expertUpdateData.minuteRate = parseInteger(minuteRate);
          if (pricePerMessage !== undefined) expertUpdateData.pricePerMessage = parseInteger(pricePerMessage);
          if (videoMessageRate !== undefined) expertUpdateData.videoMessageRate = parseInteger(videoMessageRate);
          if (tags !== undefined) expertUpdateData.tags = JSON.stringify(toStringArray(tags));
          if (languages !== undefined) expertUpdateData.languages = JSON.stringify(toStringArray(languages));
          if (category !== undefined) expertUpdateData.category = category;
          if (categories !== undefined) {
            const parsedCategories = toStringArray(categories);
            expertUpdateData.categories = JSON.stringify(parsedCategories);
            if (category === undefined) {
              expertUpdateData.category = parsedCategories[0] || '';
            }
          }
          if (country !== undefined) expertUpdateData.country = country;
          if (linkedinUrl !== undefined) expertUpdateData.linkedinUrl = linkedinUrl;
          if (rnePatente !== undefined) expertUpdateData.rnePatente = rnePatente;
          expertUpdateData.name = `${userUpdateData.firstName || currentUser.firstName} ${userUpdateData.lastName || currentUser.lastName}`;

          await tx.expert.update({ where: { userId: userId }, data: expertUpdateData });

          const currentExpert = currentUser.expert;
          const mergedExpert = {
            specialty: expertUpdateData.specialty !== undefined ? expertUpdateData.specialty : currentExpert.specialty,
            category: expertUpdateData.category !== undefined ? expertUpdateData.category : currentExpert.category,
            categories: expertUpdateData.categories !== undefined ? expertUpdateData.categories : currentExpert.categories,
            hourlyRate: expertUpdateData.hourlyRate !== undefined ? expertUpdateData.hourlyRate : currentExpert.hourlyRate,
            minuteRate: expertUpdateData.minuteRate !== undefined ? expertUpdateData.minuteRate : currentExpert.minuteRate
          };

          const mergedCategories = parseStoredArray(mergedExpert.categories);
          const hasRate = Math.max(
            Number(mergedExpert.hourlyRate || 0),
            Number(mergedExpert.minuteRate || 0)
          ) > 0;
          const hasCategory = Boolean(
            (mergedExpert.category && String(mergedExpert.category).trim()) ||
            mergedCategories.length > 0
          );
          const isExpertPartComplete = Boolean(
            mergedExpert.specialty &&
            String(mergedExpert.specialty).trim() &&
            hasCategory &&
            hasRate
          );
          isProfileFullyComplete = isUserPartComplete && isExpertPartComplete;
        }

        userUpdateData.profileCompleted = toBoolean(forceProfileCompleted) || isProfileFullyComplete;

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
