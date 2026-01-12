const prisma = require('../../services/database');
const ApiResponse = require('../../utils/response');

/**
 * Contrôleur pour la gestion des vidéos
 */
class VideoController {
  /**
   * Récupérer toutes les vidéos
   */
  static async getAllVideos(req, res) {
    try {
      const { 
        category, 
        type,
        search, 
        sortBy = 'publishedAt',
        order = 'desc',
        page = 1,
        limit = 20 
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const where = {};
      
      if (category && category !== 'all') where.category = category;
      if (type) where.type = type;
      if (search) {
        const term = String(search || '').trim();
        const norm = (s) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
        const termLower = term.toLowerCase();
        const termUpper = term.toUpperCase();
        const termNorm = norm(term);
        where.OR = [
          { title: { contains: term } },
          { title: { contains: termLower } },
          { title: { contains: termUpper } },
          { expert: { contains: term } },
          { expert: { contains: termLower } },
          { expert: { contains: termUpper } },
          { titleNormalized: { contains: termNorm } },
          { expertNormalized: { contains: termNorm } },
        ];
      }

      const orderBy = { [sortBy]: order };

      const [videos, total] = await Promise.all([
        prisma.video.findMany({
          where,
          orderBy,
          skip,
          take: parseInt(limit),
          include: {
            expertRel: {
              include: {
                user: { select: { avatar: true } }
              }
            }
          }
        }),
        prisma.video.count({ where })
      ]);

      // Marquer les vidéos déjà débloquées par l'utilisateur connecté
      let unlockedSet = new Set();
      if (req.user && videos.length > 0) {
        const ids = videos.map(v => v.id);
        const rels = await prisma.userVideo.findMany({
          where: { userId: req.user.id, videoId: { in: ids } },
          select: { videoId: true }
        });
        unlockedSet = new Set(rels.map(r => r.videoId));
      }

      const formattedVideos = videos.map(video => ({
        ...video,
        isUnlocked: unlockedSet.has(video.id) || video.type === 'free' || (video.price || 0) === 0,
        expertRel: video.expertRel
          ? {
              ...video.expertRel,
              image: video.expertRel.user?.avatar || null
            }
          : null
      }));

      return ApiResponse.success(res, {
        videos: formattedVideos,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });

    } catch (error) {
      console.error('Get all videos error:', error);
      return ApiResponse.error(res, 'Erreur lors de la récupération des vidéos');
    }
  }

  

  /**
   * Créer une vidéo (Expert)
   */
  static async createVideo(req, res) {
    try {
      const expert = req.expert || (await prisma.expert.findUnique({ where: { userId: req.user.id } }));
      if (!expert) return ApiResponse.forbidden(res, 'Seuls les experts peuvent créer des vidéos');

      const { title, duration, type, price = 0, category, thumbnail, description, videoUrl } = req.body;
      if (!title || !duration || !type || price === undefined || !category || !description) {
        return ApiResponse.badRequest(res, 'Champs obligatoires manquants (title, duration, type, price, category, description)');
      }

      const normalize = (s) => s ? s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase() : s;
      const created = await prisma.video.create({
        data: {
          title,
          titleNormalized: normalize(title),
          expertId: expert.id,
          expert: expert.name,
          expertNormalized: normalize(expert.name),
          duration: String(duration),
          type,
          price: Number(price) || 0,
          category,
          thumbnail,
          description,
          videoUrl
        },
        include: {
          expertRel: { include: { user: { select: { avatar: true } } } }
        }
      });

      // Notifier les followers de l'expert
      try {
        const followers = await prisma.expertFollow.findMany({ where: { expertId: expert.id }, select: { userId: true } });
        const io = req.app.get('io');
        const onlineUsers = req.app.get('onlineUsers');
        const notifTitle = 'Nouvelle vidéo publiée';
        const notifMsg = `${expert.name} a publié « ${title} »`;
        const actionUrl = `/videos/${created.id}`;
        for (const f of followers) {
          await prisma.notification.create({
            data: { userId: f.userId, title: notifTitle, message: notifMsg, type: 'follow_update', actionUrl }
          });
          try {
            if (io && onlineUsers) {
              const sockId = onlineUsers.get(f.userId);
              if (sockId) io.to(sockId).emit('notification', { title: notifTitle, message: notifMsg, type: 'follow_update', actionUrl, createdAt: new Date().toISOString() });
            }
          } catch {}
        }
      } catch (e) {
        console.warn('Notify followers (video) failed:', e?.message || e);
      }

      return ApiResponse.created(res, created, 'Vidéo créée avec succès');
    } catch (error) {
      console.error('Create video error:', error);
      return ApiResponse.error(res, 'Erreur lors de la création de la vidéo');
    }
  }

  /**
   * Utilitaire de normalisation (public pour réutilisation éventuelle)
   */
  static normalize(s) {
    return s ? s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase() : s;
  }

  /**
   * Récupérer les vidéos de l'expert connecté
   */
  static async getExpertVideos(req, res) {
    try {
      const expert = await prisma.expert.findUnique({
        where: { userId: req.user.id }
      });

      if (!expert) {
        return ApiResponse.notFound(res, "Profil expert non trouvé.");
      }

      const videos = await prisma.video.findMany({
        where: { expertId: expert.id },
        orderBy: { views: 'desc' }, // Trier par popularité (nombre de vues)
        take: 6 // Limiter aux plus populaires
      });

      // Marquer comme débloquées pour l'auteur
      const formatted = videos.map((v) => ({ ...v, isUnlocked: true }));

      return ApiResponse.success(res, { videos: formatted });

    } catch (error) {
      console.error('Get expert videos error:', error);
      return ApiResponse.error(res, 'Erreur lors de la récupération de vos vidéos');
    }
  }

  /**
   * Récupérer les vidéos de l'utilisateur connecté
   */
  static async getMyUnlockedVideos(req, res) {
    try {
      const userId = req.user.id;

      // 1. Récupérer toutes les vidéos gratuites
      const freeVideos = await prisma.video.findMany({
        where: { type: 'free' },
        include: {
          expertRel: {
            select: {
              id: true,
              name: true,
              verified: true,
              user: { select: { avatar: true } }
            }
          }
        }
      });

      // 2. Récupérer toutes les vidéos associées à cet utilisateur (UserVideo)
      const unlockedRelations = await prisma.userVideo.findMany({
        where: { userId },
        include: {
          video: {
            include: {
              expertRel: {
                select: {
                  id: true,
                  name: true,
                  verified: true,
                  user: { select: { avatar: true } }
                }
              }
            }
          }
        }
      });

      // 3. Extraire les vidéos de la relation
      const unlockedVideos = unlockedRelations.map(rel => rel.video);

      // 4. Fusionner et éviter les doublons
      const allVideos = [...freeVideos, ...unlockedVideos].filter(
        (video, index, self) =>
          index === self.findIndex(v => v.id === video.id)
      );

      // 5. Formater les données
      const formattedVideos = allVideos.map(video => ({
        ...video,
        isUnlocked: true,
        expertRel: {
          ...video.expertRel,
          image: video.expertRel?.user?.avatar || null
        }
      }));

      return ApiResponse.success(res, { videos: formattedVideos });
    } catch (error) {
      console.error('Get my unlocked videos error:', error);
      return ApiResponse.error(res, 'Erreur lors de la récupération des vidéos débloquées');
    }
  }

  /**
   * Récupérer une vidéo par ID
   */
  static async getVideoById(req, res) {
    try {
      const { id } = req.params;

      const video = await prisma.video.findUnique({
        where: { id: parseInt(id) },
        include: {
          expertRel: {
            select: {
              id: true,
              name: true,
              verified: true,
              user: { select: { avatar: true } }
            }
          }
        }
      });

      if (!video) {
        return ApiResponse.notFound(res, 'Vidéo non trouvée');
      }

      // Déterminer si la vidéo est débloquée et/ou likée par l'utilisateur
      let isUnlocked = video.type === 'free' || (video.price || 0) === 0;
      let likedByUser = false;
      if (req.user) {
        const rel = await prisma.userVideo.findUnique({
          where: { userId_videoId: { userId: req.user.id, videoId: video.id } },
          select: { videoId: true, liked: true }
        });
        if (rel) {
          isUnlocked = true; // relation existante => vidéo débloquée/achetée
          likedByUser = !!rel.liked;
        }
        // Débloquée si l'utilisateur est l'auteur de la vidéo
        try {
          const owner = await prisma.expert.findUnique({ where: { id: video.expertId }, select: { userId: true } });
          if (owner && owner.userId === req.user.id) isUnlocked = true;
        } catch {}
      }

      // Incrémenter le nombre de vues seulement si débloquée (ou gratuite)
      if (isUnlocked) {
        await prisma.video.update({
          where: { id: parseInt(id) },
          data: { views: { increment: 1 } }
        });
      }

      const formatted = {
        ...video,
        isUnlocked,
        liked: likedByUser,
        expertRel: video.expertRel
          ? { ...video.expertRel, image: video.expertRel.user?.avatar }
          : null
      };

      return ApiResponse.success(res, formatted);

    } catch (error) {
      console.error('Get video by ID error:', error);
      return ApiResponse.error(res, 'Erreur lors de la récupération de la vidéo');
    }
  }

  /**
   * Liker/Unliker une vidéo
   */
  static async toggleLike(req, res) {
    try {
      const { id } = req.params;
      const videoId = parseInt(id);

      // Vérifier si la vidéo existe
      const video = await prisma.video.findUnique({
        where: { id: videoId }
      });

      if (!video) {
        return ApiResponse.notFound(res, 'Vidéo non trouvée');
      }

      // Vérifier si l'utilisateur a déjà liké
      const existingLike = await prisma.userVideo.findUnique({
        where: {
          userId_videoId: {
            userId: req.user.id,
            videoId: videoId
          }
        }
      });

      let liked = false;

      if (existingLike) {
        // Toggle le like
        liked = !existingLike.liked;
        await prisma.userVideo.update({
          where: {
            userId_videoId: {
              userId: req.user.id,
              videoId: videoId
            }
          },
          data: { liked }
        });
      } else {
        // Créer un nouveau like
        liked = true;
        await prisma.userVideo.create({
          data: {
            userId: req.user.id,
            videoId: videoId,
            liked: true
          }
        });
      }

      // Mettre à jour le compteur de likes et notifier en temps réel
      const increment = liked ? 1 : -1;
      await prisma.video.update({ where: { id: videoId }, data: { likes: { increment } } });

      // Récupérer le total mis à jour
      const after = await prisma.video.findUnique({ where: { id: videoId }, select: { likes: true, expertId: true, title: true } });
      const likes = after?.likes || 0;

      // Emit temps réel aux visionneurs de la vidéo
      try {
        const io = req.app.get('io');
        if (io) io.to(`video:${videoId}`).emit('video:likesUpdated', { videoId, likes });
      } catch {}

      // Notifier le propriétaire uniquement lors d'un LIKE (pas lors d'un UNLIKE)
      if (liked) {
        try {
          const expert = await prisma.expert.findUnique({ where: { id: after.expertId }, select: { userId: true, name: true } });
          if (expert?.userId && Number(expert.userId) !== Number(req.user.id)) {
            const msg = `${req.user.firstName} ${req.user.lastName} a aimé votre vidéo « ${after.title} »`;
            await prisma.notification.create({
              data: { userId: expert.userId, title: 'Nouveau like sur votre vidéo', message: msg, type: 'video_like', actionUrl: `/videos/${videoId}` }
            });
            try {
              const io = req.app.get('io');
              const online = req.app.get('onlineUsers');
              const sockId = online?.get(expert.userId);
              if (io && sockId) io.to(sockId).emit('notification', { title: 'Nouveau like sur votre vidéo', message: msg, type: 'video_like', actionUrl: `/videos/${videoId}`, createdAt: new Date().toISOString() });
            } catch {}
          }
        } catch {}
      }

      return ApiResponse.success(res, { liked, likes }, liked ? 'Vidéo likée' : 'Like retiré');

    } catch (error) {
      console.error('Toggle like error:', error);
      return ApiResponse.error(res, 'Erreur lors du like');
    }
  }

  /**
   * Acheter/Débloquer une vidéo payante
   */
  static async purchaseVideo(req, res) {
    try {
      const { id } = req.params;
      const videoId = parseInt(id);

      const video = await prisma.video.findUnique({ where: { id: videoId } });
      if (!video) return ApiResponse.notFound(res, 'Vidéo non trouvée');

      // Gratuit ? inutile d'acheter
      if (video.type === 'free' || (video.price || 0) === 0) {
        return ApiResponse.success(res, { unlocked: true }, 'Vidéo gratuite');
      }

      // Déjà débloquée ?
      const existing = await prisma.userVideo.findUnique({
        where: { userId_videoId: { userId: req.user.id, videoId } }
      });
      if (existing) {
        return ApiResponse.success(res, { unlocked: true }, 'Déjà achetée');
      }

      // Solde suffisant ?
      if ((req.user.coins || 0) < (video.price || 0)) {
        return ApiResponse.badRequest(res, "Solde insuffisant");
      }

      await prisma.$transaction(async (tx) => {
        // Débiter les coins
        await tx.user.update({
          where: { id: req.user.id },
          data: { coins: { decrement: video.price } }
        });

        // Marquer comme débloquée
        await tx.userVideo.create({
          data: {
            userId: req.user.id,
            videoId,
            completed: false,
            watchTime: 0,
            liked: false
          }
        });

        // Enregistrer transaction
        await tx.transaction.create({
          data: {
            userId: req.user.id,
            type: 'spend',
            amount: (video.price || 0) * 100, // en centimes
            coins: video.price || 0,
            description: `Achat vidéo: ${video.title}`,
            relatedId: videoId
          }
        });
      });

      // Émettre une mise à jour des coins au client connecté (temps réel)
      try {
        const io = req.app.get('io');
        const onlineUsers = req.app.get('onlineUsers');
        const sockId = onlineUsers?.get(req.user.id);
        if (io && sockId) io.to(sockId).emit('coinUpdate', { reason: 'videoPurchase', videoId });
      } catch {}

      return ApiResponse.success(res, { unlocked: true }, 'Vidéo débloquée');
    } catch (error) {
      console.error('Purchase video error:', error);
      return ApiResponse.error(res, "Erreur lors de l'achat de la vidéo");
    }
  }
}

module.exports = VideoController;
