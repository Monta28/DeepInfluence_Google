const prisma = require('../../services/database');
const ApiResponse = require('../../utils/response');

/**
 * Contrôleur pour la gestion des avis
 */
class ReviewController {
  /**
   * Récupérer les meilleurs avis pour les afficher en tant que témoignages
   */
  static async getFeaturedReviews(req, res) {
    try {
      const reviews = await prisma.review.findMany({
        where: {
          rating: 5, // On ne sélectionne que les avis 5 étoiles
        },
        orderBy: {
          createdAt: 'desc', // Les plus récents en premier
        },
        take: 3, // On en prend 3
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          expert: {
            select: {
              specialty: true,
            },
          },
        },
      });

      // Formater les données pour correspondre à ce que le frontend attend
      const formattedReviews = reviews.map(review => ({
        name: `${review.user.firstName} ${review.user.lastName}`,
        role: review.expert?.specialty || 'Utilisateur', // Le rôle est la spécialité de l'expert
        content: review.comment,
        avatar: review.user.avatar || `https://ui-avatars.com/api/?name=${review.user.firstName}+${review.user.lastName}&size=80&background=random`,
        rating: review.rating,
      }));

      return ApiResponse.success(res, formattedReviews);
    } catch (error) {
      console.error('Get featured reviews error:', error);
      return ApiResponse.error(res, 'Erreur lors de la récupération des témoignages');
    }
  }

  /**
   * Créer un nouvel avis pour un expert
   */
  static async createReview(req, res) {
    try {
      const { expertId, rating, comment } = req.body;
      const userId = req.user.id;

      if (!expertId || !rating || !comment) {
        return ApiResponse.badRequest(res, 'Tous les champs sont requis.');
      }

      // Utilise une transaction pour garantir l'intégrité des données
      const newReview = await prisma.$transaction(async (tx) => {
        // 1. Créer le nouvel avis
        const review = await tx.review.create({
          data: {
            userId: userId,
            expertId: parseInt(expertId),
            rating: parseInt(rating),
            comment: comment,
          },
        });

        // 2. Obtenir tous les avis pour recalculer la moyenne
        const allReviews = await tx.review.findMany({
          where: { expertId: parseInt(expertId) },
        });

        const totalReviews = allReviews.length;
        const averageRating = allReviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews;

        // 3. Mettre à jour le profil de l'expert avec les nouvelles statistiques
        const expert = await tx.expert.update({
          where: { id: parseInt(expertId) },
          data: {
            reviews: totalReviews,
            rating: parseFloat(averageRating.toFixed(1)),
          },
        });

        // 4. Créer une notification pour l'expert (envoyée à son userId)
        const notif = await tx.notification.create({
          data: {
            userId: expert.userId,
            title: 'Nouvel avis reçu',
            message: `Vous avez reçu un avis (${parseInt(rating)}/5).`,
            type: 'review',
            actionUrl: `/experts/${expertId}/reviews`
          }
        });

        return { review, expert, notif };
      });

      // Émettre un événement socket au destinataire si en ligne
      try {
        const io = req.app.get('io');
        const onlineUsers = req.app.get('onlineUsers');
        const socketId = onlineUsers?.get(newReview.expert.userId);
        if (io && socketId) {
          io.to(socketId).emit('notification', {
            id: newReview.notif.id,
            title: newReview.notif.title,
            message: newReview.notif.message,
            type: newReview.notif.type,
            actionUrl: newReview.notif.actionUrl,
            createdAt: newReview.notif.createdAt
          });
        }
      } catch (e) {
        console.log('Socket notify review error:', e?.message || e);
      }

      return ApiResponse.created(res, newReview.review, 'Avis soumis avec succès.');
    } catch (error) {
      console.error('Create review error:', error);
      return ApiResponse.error(res, "Erreur lors de la soumission de l'avis.");
    }
  }
}

module.exports = ReviewController;
