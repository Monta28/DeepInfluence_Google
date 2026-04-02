const prisma = require('../../services/database');
const ApiResponse = require('../../utils/response');

/**
 * PHASE 2 - Contrôleur pour la gestion des Reels (mini-vidéos verticales)
 * Format: Portrait 9:16, durée 15s-3min, scroll vertical type TikTok
 */
class ReelController {
  /**
   * PHASE 2 - Récupérer le feed de Reels avec pagination par curseur
   * @route GET /api/reels/feed
   * @access Public (optionalAuth)
   *
   * Query params:
   * - cursor: ID du dernier Reel chargé (pour pagination)
   * - limit: Nombre de Reels à charger (défaut: 10, max: 50)
   * - category: Filtrer par catégorie
   * - accessType: FREE | PAID
   * - sortBy: views | likes | recent (défaut: recent)
   */
  static async getReelsFeed(req, res) {
    try {
      const {
        cursor, // ID du dernier Reel vu (pour cursor-based pagination)
        limit = 10,
        category,
        accessType,
        sortBy = 'recent' // views | likes | recent
      } = req.query;

      const take = Math.min(parseInt(limit), 50); // Max 50 Reels par requête

      // Construction du WHERE
      const where = {
        videoType: 'REEL', // Seulement les Reels
        status: 'PUBLISHED', // Seulement les Reels publiés
        orientation: 'PORTRAIT' // Seulement portrait (9:16)
      };

      if (category && category !== 'all') {
        where.category = category;
      }

      if (accessType) {
        where.accessType = accessType;
      }

      // Cursor-based pagination (mieux que offset pour scroll infini)
      if (cursor) {
        where.id = { lt: parseInt(cursor) }; // Reels avec ID < cursor
      }

      // Déterminer l'ordre de tri
      let orderBy;
      switch (sortBy) {
        case 'views':
          orderBy = [{ views: 'desc' }, { id: 'desc' }];
          break;
        case 'likes':
          orderBy = [{ likes: 'desc' }, { id: 'desc' }];
          break;
        case 'recent':
        default:
          orderBy = { id: 'desc' }; // Plus récent en premier (ID décroissant)
          break;
      }

      // Récupérer les Reels
      const reels = await prisma.video.findMany({
        where,
        orderBy,
        take: take + 1, // Charger +1 pour savoir s'il y a une page suivante
        include: {
          expertRel: {
            select: {
              id: true,
              name: true,
              verified: true,
              user: {
                select: {
                  avatar: true
                }
              }
            }
          },
          _count: {
            select: {
              videoLikes: true,
              comments: true
            }
          }
        }
      });

      // Vérifier s'il y a une page suivante
      const hasNextPage = reels.length > take;
      const actualReels = hasNextPage ? reels.slice(0, take) : reels;
      const nextCursor = hasNextPage ? actualReels[actualReels.length - 1].id : null;

      // Si utilisateur connecté, récupérer les Reels déjà likés/débloqués
      let likedSet = new Set();
      let unlockedSet = new Set();

      if (req.user && actualReels.length > 0) {
        const reelIds = actualReels.map(r => r.id);

        // Récupérer les likes
        const likes = await prisma.videoLike.findMany({
          where: {
            userId: req.user.id,
            videoId: { in: reelIds }
          },
          select: { videoId: true }
        });
        likedSet = new Set(likes.map(l => l.videoId));

        // Récupérer les déblocages (pour Reels payants)
        const unlocked = await prisma.userVideo.findMany({
          where: {
            userId: req.user.id,
            videoId: { in: reelIds }
          },
          select: { videoId: true }
        });
        unlockedSet = new Set(unlocked.map(u => u.videoId));
      }

      // Formater les Reels
      const formattedReels = actualReels.map(reel => {
        const isFree = reel.accessType === 'FREE' || (reel.price || 0) === 0;
        const isLiked = likedSet.has(reel.id);
        const isUnlocked = unlockedSet.has(reel.id) || isFree;

        return {
          id: reel.id,
          title: reel.title,
          description: reel.description,
          videoUrl: reel.videoUrl,
          thumbnail: reel.thumbnail,
          duration: reel.duration,
          category: reel.category,
          // Statistiques
          views: reel.views || 0,
          likes: reel._count?.videoLikes || reel.likes || 0,
          comments: reel._count?.comments || 0,
          // Accès
          accessType: reel.accessType,
          price: reel.price,
          isUnlocked,
          isLiked,
          // Expert
          expert: reel.expertRel ? {
            id: reel.expertRel.id,
            name: reel.expertRel.name,
            profilePicture: reel.expertRel.user?.avatar,
            verified: reel.expertRel.verified
          } : null,
          // Métadonnées
          createdAt: reel.createdAt,
          publishedAt: reel.publishedAt
        };
      });

      return ApiResponse.success(res, {
        reels: formattedReels,
        pagination: {
          nextCursor,
          hasNextPage,
          limit: take
        }
      });

    } catch (error) {
      console.error('Get reels feed error:', error);
      return ApiResponse.error(res, 'Erreur lors de la récupération du feed de Reels');
    }
  }

  /**
   * PHASE 2 - Récupérer un Reel spécifique par ID
   * @route GET /api/reels/:id
   * @access Public (optionalAuth)
   */
  static async getReelById(req, res) {
    try {
      const { id } = req.params;
      const reelId = parseInt(id);

      const reel = await prisma.video.findUnique({
        where: { id: reelId },
        include: {
          expertRel: {
            select: {
              id: true,
              name: true,
              verified: true,
              category: true,
              user: {
                select: {
                  avatar: true
                }
              }
            }
          },
          _count: {
            select: {
              videoLikes: true,
              comments: true
            }
          }
        }
      });

      if (!reel) {
        return ApiResponse.notFound(res, 'Reel non trouvé');
      }

      // Vérifier que c'est bien un Reel
      if (reel.videoType !== 'REEL') {
        return ApiResponse.badRequest(res, 'Cette vidéo n\'est pas un Reel');
      }

      // Si utilisateur connecté, récupérer like/unlock status
      let isLiked = false;
      let isUnlocked = false;

      if (req.user) {
        const like = await prisma.videoLike.findUnique({
          where: {
            videoId_userId: {
              userId: req.user.id,
              videoId: reelId
            }
          }
        });
        isLiked = !!like;

        const userVideo = await prisma.userVideo.findUnique({
          where: {
            userId_videoId: {
              userId: req.user.id,
              videoId: reelId
            }
          }
        });
        isUnlocked = !!userVideo;
      }

      const isFree = reel.accessType === 'FREE' || (reel.price || 0) === 0;

      const formatted = {
        id: reel.id,
        title: reel.title,
        description: reel.description,
        videoUrl: reel.videoUrl,
        thumbnail: reel.thumbnail,
        duration: reel.duration,
        category: reel.category,
        // Statistiques
        views: reel.views || 0,
        likes: reel._count?.videoLikes || 0,
        comments: reel._count?.comments || 0,
        // Accès
        accessType: reel.accessType,
        price: reel.price,
        isUnlocked: isUnlocked || isFree,
        isLiked,
        // Expert
        expert: reel.expertRel ? {
          id: reel.expertRel.id,
          name: reel.expertRel.name,
          profilePicture: reel.expertRel.user?.avatar,
          verified: reel.expertRel.verified,
          category: reel.expertRel.category
        } : null,
        // Métadonnées
        createdAt: reel.createdAt,
        publishedAt: reel.publishedAt
      };

      return ApiResponse.success(res, formatted);
    } catch (error) {
      console.error('Get reel by ID error:', error);
      return ApiResponse.error(res, 'Erreur lors de la récupération du Reel');
    }
  }

  /**
   * PHASE 2 - Récupérer les Reels d'un expert spécifique
   * @route GET /api/reels/expert/:expertId
   * @access Public
   */
  static async getExpertReels(req, res) {
    try {
      const { expertId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      // Vérifier que l'expert existe
      const expert = await prisma.expert.findUnique({
        where: { id: parseInt(expertId) },
        select: { id: true, name: true }
      });

      if (!expert) {
        return ApiResponse.notFound(res, 'Expert non trouvé');
      }

      // Récupérer les Reels de l'expert
      const [reels, total] = await Promise.all([
        prisma.video.findMany({
          where: {
            expertId: parseInt(expertId),
            videoType: 'REEL',
            status: 'PUBLISHED'
          },
          orderBy: { publishedAt: 'desc' },
          skip,
          take: limit,
          select: {
            id: true,
            title: true,
            thumbnail: true,
            duration: true,
            views: true,
            accessType: true,
            price: true,
            publishedAt: true,
            _count: {
              select: {
                videoLikes: true,
                comments: true
              }
            }
          }
        }),
        prisma.video.count({
          where: {
            expertId: parseInt(expertId),
            videoType: 'REEL',
            status: 'PUBLISHED'
          }
        })
      ]);

      const formattedReels = reels.map(r => ({
        id: r.id,
        title: r.title,
        thumbnail: r.thumbnail,
        duration: r.duration,
        views: r.views || 0,
        likes: r._count?.videoLikes || 0,
        comments: r._count?.comments || 0,
        accessType: r.accessType,
        price: r.price,
        publishedAt: r.publishedAt
      }));

      return ApiResponse.success(res, {
        reels: formattedReels,
        expert: {
          id: expert.id,
          name: expert.name
        },
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get expert reels error:', error);
      return ApiResponse.error(res, 'Erreur lors de la récupération des Reels de l\'expert');
    }
  }

  /**
   * PHASE 2 - Récupérer les catégories disponibles pour les Reels
   * @route GET /api/reels/categories
   * @access Public
   */
  static async getCategories(req, res) {
    try {
      // Récupérer les catégories uniques des Reels publiés
      const categories = await prisma.video.findMany({
        where: {
          videoType: 'REEL',
          status: 'PUBLISHED'
        },
        select: {
          category: true
        },
        distinct: ['category']
      });

      // Compter le nombre de Reels par catégorie
      const categoriesWithCount = await Promise.all(
        categories.map(async (cat) => {
          const count = await prisma.video.count({
            where: {
              videoType: 'REEL',
              status: 'PUBLISHED',
              category: cat.category
            }
          });

          return {
            name: cat.category,
            count
          };
        })
      );

      // Trier par nombre de Reels décroissant
      categoriesWithCount.sort((a, b) => b.count - a.count);

      return ApiResponse.success(res, categoriesWithCount);
    } catch (error) {
      console.error('Get reel categories error:', error);
      return ApiResponse.error(res, 'Erreur lors de la récupération des catégories');
    }
  }
}

module.exports = ReelController;
