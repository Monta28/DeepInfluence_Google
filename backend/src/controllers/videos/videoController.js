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
        type, // DEPRECATED - ancien champ 'free'/'premium'
        videoType, // PHASE 2 - NORMAL/REEL
        accessType, // PHASE 2 - FREE/PAID
        orientation, // PHASE 2 - LANDSCAPE/PORTRAIT
        status, // PHASE 2 - PUBLISHED/DRAFT/ARCHIVED
        expertId, // Filtrer par expert
        search,
        sortBy = 'publishedAt',
        order = 'desc',
        page = 1,
        limit = 20
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const where = {};

      // Filtres existants
      if (category && category !== 'all') where.category = category;
      if (type) where.type = type; // Compatibilité ancien système
      if (expertId) where.expertId = parseInt(expertId);

      // PHASE 2 - Nouveaux filtres
      if (videoType) where.videoType = videoType; // NORMAL ou REEL
      if (accessType) where.accessType = accessType; // FREE ou PAID
      if (orientation) where.orientation = orientation; // LANDSCAPE ou PORTRAIT

      // Par défaut, ne montrer que les vidéos publiées (sauf si filtre status explicite)
      if (status) {
        where.status = status;
      } else {
        where.status = 'PUBLISHED';
      }

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

      const formattedVideos = videos.map(video => {
        // Déterminer si la vidéo est gratuite (compatibilité ancien/nouveau système)
        const isFree =
          video.type === 'free' ||
          video.accessType === 'FREE' ||
          (video.price || 0) === 0;

        return {
          ...video,
          isUnlocked: unlockedSet.has(video.id) || isFree,
          expertRel: video.expertRel
            ? {
                ...video.expertRel,
                image: video.expertRel.user?.avatar || null
              }
            : null
        };
      });

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
   * PHASE 2 - Support des nouveaux champs (videoType, accessType, orientation, status)
   */
  static async createVideo(req, res) {
    try {
      const expert = req.expert || (await prisma.expert.findUnique({ where: { userId: req.user.id } }));
      if (!expert) return ApiResponse.forbidden(res, 'Seuls les experts peuvent créer des vidéos');

      const {
        title,
        duration,
        type, // DEPRECATED - 'free'/'premium' (optionnel pour compatibilité)
        videoType, // PHASE 2 - NORMAL/REEL
        accessType, // PHASE 2 - FREE/PAID
        orientation, // PHASE 2 - LANDSCAPE/PORTRAIT
        status = 'DRAFT', // PHASE 2 - PUBLISHED/DRAFT/ARCHIVED (DRAFT par défaut)
        price = 0,
        category,
        thumbnail,
        description,
        videoUrl
      } = req.body;

      // Validation des champs obligatoires
      if (!title || !duration || !category || !description) {
        return ApiResponse.badRequest(res, 'Champs obligatoires manquants (title, duration, category, description)');
      }

      // PHASE 2 - Déterminer le type de vidéo (migration progressive)
      let finalVideoType = videoType;
      let finalAccessType = accessType;
      let finalOrientation = orientation;

      // Si nouveau système utilisé (videoType fourni)
      if (videoType) {
        // Valider les valeurs
        if (!['NORMAL', 'REEL'].includes(videoType)) {
          return ApiResponse.badRequest(res, 'videoType doit être NORMAL ou REEL');
        }

        // Déterminer accessType si pas fourni
        if (!finalAccessType) {
          finalAccessType = (price && price > 0) ? 'PAID' : 'FREE';
        }

        // Déterminer orientation si pas fournie
        if (!finalOrientation) {
          finalOrientation = (videoType === 'REEL') ? 'PORTRAIT' : 'LANDSCAPE';
        }

        // Valider les contraintes des Reels
        if (videoType === 'REEL') {
          const durationSeconds = parseInt(duration);

          if (finalOrientation !== 'PORTRAIT') {
            return ApiResponse.badRequest(res, 'Les Reels doivent être en orientation PORTRAIT (9:16)');
          }

          if (durationSeconds < 10 || durationSeconds > 180) {
            return ApiResponse.badRequest(res, 'Les Reels doivent durer entre 10 secondes et 3 minutes');
          }
        }

        // Valider les contraintes des vidéos NORMAL
        if (videoType === 'NORMAL') {
          const durationSeconds = parseInt(duration);

          if (durationSeconds < 300 || durationSeconds > 7200) {
            return ApiResponse.badRequest(res, 'Les vidéos normales doivent durer entre 5 minutes et 2 heures');
          }
        }
      }
      // Si ancien système utilisé (type fourni mais pas videoType)
      else if (type) {
        finalVideoType = 'NORMAL'; // Par défaut, ancien système = vidéos normales
        finalAccessType = (type === 'premium' || (price && price > 0)) ? 'PAID' : 'FREE';
        finalOrientation = 'LANDSCAPE'; // Par défaut
      }
      // Si aucun système fourni, erreur
      else {
        return ApiResponse.badRequest(res, 'Vous devez fournir soit "type" (ancien système) soit "videoType" (nouveau système)');
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
          // Ancien système (pour compatibilité)
          type: type || (finalAccessType === 'PAID' ? 'premium' : 'free'),
          price: Number(price) || 0,
          // PHASE 2 - Nouveaux champs
          videoType: finalVideoType,
          accessType: finalAccessType,
          orientation: finalOrientation,
          status: status,
          descriptionNormalized: normalize(description),
          // Autres champs
          category,
          thumbnail,
          description,
          videoUrl
        },
        include: {
          expertRel: { include: { user: { select: { avatar: true } } } }
        }
      });

      // Notifier les followers de l'expert (seulement si la vidéo est publiée)
      if (status === 'PUBLISHED') {
        try {
          const followers = await prisma.expertFollow.findMany({ where: { expertId: expert.id }, select: { userId: true } });
          const io = req.app.get('io');
          const onlineUsers = req.app.get('onlineUsers');
          const notifTitle = finalVideoType === 'REEL' ? 'Nouveau Reel publié' : 'Nouvelle vidéo publiée';
          const notifMsg = `${expert.name} a publié « ${title} »`;
          const actionUrl = finalVideoType === 'REEL' ? `/reels/${created.id}` : `/videos/${created.id}`;

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
        return ApiResponse.success(res, {
          insufficientCoins: true,
          currentBalance: req.user.coins || 0,
          requiredCoins: video.price || 0,
          videoId: video.id,
          videoTitle: video.title
        }, 'Solde de coins insuffisant. Veuillez recharger votre solde.');
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

  // ==========================================
  // PHASE 2 - NOUVELLES FONCTIONNALITÉS
  // ==========================================

  /**
   * PHASE 2 - Ajouter un commentaire sur une vidéo
   * @route POST /api/videos/:id/comment
   * @access Private
   */
  static async addComment(req, res) {
    try {
      const { id } = req.params;
      const videoId = parseInt(id);
      const { content, parentId } = req.body;

      // Validation
      if (!content || content.trim().length === 0) {
        return ApiResponse.badRequest(res, 'Le commentaire ne peut pas être vide');
      }

      if (content.length > 500) {
        return ApiResponse.badRequest(res, 'Le commentaire ne peut pas dépasser 500 caractères');
      }

      // Vérifier que la vidéo existe
      const video = await prisma.video.findUnique({
        where: { id: videoId },
        select: { id: true, title: true, expertId: true }
      });

      if (!video) {
        return ApiResponse.notFound(res, 'Vidéo non trouvée');
      }

      // Si c'est une réponse, vérifier que le commentaire parent existe
      if (parentId) {
        const parentComment = await prisma.videoComment.findUnique({
          where: { id: parseInt(parentId) }
        });

        if (!parentComment || parentComment.videoId !== videoId) {
          return ApiResponse.badRequest(res, 'Commentaire parent invalide');
        }
      }

      // Créer le commentaire
      const comment = await prisma.videoComment.create({
        data: {
          content: content.trim(),
          videoId,
          userId: req.user.id,
          parentId: parentId ? parseInt(parentId) : null
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          },
          _count: {
            select: { replies: true }
          }
        }
      });

      // Notifier l'expert propriétaire de la vidéo (sauf si c'est lui qui commente)
      if (video.expertId) {
        try {
          const expert = await prisma.expert.findUnique({
            where: { id: video.expertId },
            select: { userId: true }
          });

          if (expert?.userId && expert.userId !== req.user.id) {
            const message = parentId
              ? `${req.user.firstName} ${req.user.lastName} a répondu à un commentaire sur votre vidéo "${video.title}"`
              : `${req.user.firstName} ${req.user.lastName} a commenté votre vidéo "${video.title}"`;

            await prisma.notification.create({
              data: {
                userId: expert.userId,
                title: 'Nouveau commentaire',
                message,
                type: 'video_comment',
                actionUrl: `/videos/${videoId}`
              }
            });

            // Notification temps réel
            try {
              const io = req.app.get('io');
              const onlineUsers = req.app.get('onlineUsers');
              const socketId = onlineUsers?.get(expert.userId);
              if (io && socketId) {
                io.to(socketId).emit('notification', {
                  title: 'Nouveau commentaire',
                  message,
                  type: 'video_comment',
                  actionUrl: `/videos/${videoId}`,
                  createdAt: new Date().toISOString()
                });
              }
            } catch (e) {
              console.error('Socket notification error:', e);
            }
          }
        } catch (e) {
          console.error('Expert notification error:', e);
        }
      }

      // Si c'est une réponse, notifier l'auteur du commentaire parent
      if (parentId) {
        try {
          const parentComment = await prisma.videoComment.findUnique({
            where: { id: parseInt(parentId) },
            select: { userId: true }
          });

          if (parentComment?.userId && parentComment.userId !== req.user.id) {
            const message = `${req.user.firstName} ${req.user.lastName} a répondu à votre commentaire`;

            await prisma.notification.create({
              data: {
                userId: parentComment.userId,
                title: 'Nouvelle réponse',
                message,
                type: 'comment_reply',
                actionUrl: `/videos/${videoId}`
              }
            });
          }
        } catch (e) {
          console.error('Parent comment notification error:', e);
        }
      }

      return ApiResponse.success(res, comment, 'Commentaire ajouté avec succès');
    } catch (error) {
      console.error('Add comment error:', error);
      return ApiResponse.error(res, 'Erreur lors de l\'ajout du commentaire');
    }
  }

  /**
   * PHASE 2 - Récupérer les commentaires d'une vidéo
   * @route GET /api/videos/:id/comments
   * @access Public
   */
  static async getComments(req, res) {
    try {
      const { id } = req.params;
      const videoId = parseInt(id);
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      // Vérifier que la vidéo existe
      const video = await prisma.video.findUnique({
        where: { id: videoId },
        select: { id: true }
      });

      if (!video) {
        return ApiResponse.notFound(res, 'Vidéo non trouvée');
      }

      // Récupérer les commentaires principaux (sans parent)
      const comments = await prisma.videoComment.findMany({
        where: {
          videoId,
          parentId: null
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          },
          replies: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  profilePicture: true
                }
              }
            },
            orderBy: { createdAt: 'asc' },
            take: 3 // Limiter les réponses affichées initialement
          },
          _count: {
            select: { replies: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      });

      // Compter le total de commentaires
      const total = await prisma.videoComment.count({
        where: {
          videoId,
          parentId: null
        }
      });

      return ApiResponse.success(res, {
        comments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get comments error:', error);
      return ApiResponse.error(res, 'Erreur lors de la récupération des commentaires');
    }
  }

  /**
   * PHASE 2 - Tracker une vue de vidéo
   * @route POST /api/videos/:id/view
   * @access Private (optionalAuth)
   */
  static async trackView(req, res) {
    try {
      const { id } = req.params;
      const videoId = parseInt(id);
      const { watchTime = 0 } = req.body; // Durée de visionnage en secondes

      // Vérifier que la vidéo existe
      const video = await prisma.video.findUnique({
        where: { id: videoId },
        select: { id: true, duration: true }
      });

      if (!video) {
        return ApiResponse.notFound(res, 'Vidéo non trouvée');
      }

      // Déterminer si c'est une vue complète (>70% de la vidéo visionnée)
      const durationSec = parseInt(video.duration) || 0;
      const completed = durationSec > 0 ? (watchTime / durationSec) >= 0.7 : false;

      // Si utilisateur connecté, enregistrer/mettre à jour la vue via UserVideo
      if (req.user) {
        const existingUserVideo = await prisma.userVideo.findUnique({
          where: {
            userId_videoId: {
              userId: req.user.id,
              videoId
            }
          }
        });

        if (existingUserVideo) {
          // Mettre à jour le temps de visionnage
          await prisma.userVideo.update({
            where: {
              userId_videoId: {
                userId: req.user.id,
                videoId
              }
            },
            data: {
              watchTime: Math.max(existingUserVideo.watchTime, watchTime),
              completed: completed || existingUserVideo.completed
            }
          });
        } else {
          // Créer une nouvelle entrée et incrémenter les vues
          await prisma.userVideo.create({
            data: {
              userId: req.user.id,
              videoId,
              watchTime,
              completed
            }
          });

          // Incrémenter le compteur de vues (seulement pour les nouvelles vues)
          await prisma.video.update({
            where: { id: videoId },
            data: { views: { increment: 1 } }
          });
        }
      } else {
        // Utilisateur non connecté : vue anonyme
        await prisma.video.update({
          where: { id: videoId },
          data: { views: { increment: 1 } }
        });
      }

      return ApiResponse.success(res, {
        tracked: true,
        completed
      }, 'Vue enregistrée');
    } catch (error) {
      console.error('Track view error:', error);
      return ApiResponse.error(res, 'Erreur lors de l\'enregistrement de la vue');
    }
  }

  /**
   * PHASE 2 - Modifier une vidéo
   * @route PUT /api/videos/:id
   * @access Private (Expert only)
   */
  static async updateVideo(req, res) {
    try {
      const videoId = parseInt(req.params.id);
      const userId = req.user.id;

      // Vérifier que la vidéo existe et appartient à l'expert
      const video = await prisma.video.findUnique({
        where: { id: videoId },
        include: {
          expertRel: { select: { userId: true } }
        }
      });

      if (!video) {
        return ApiResponse.notFound(res, 'Vidéo non trouvée');
      }

      if (video.expertRel.userId !== userId) {
        return ApiResponse.forbidden(res, 'Vous n\'êtes pas autorisé à modifier cette vidéo');
      }

      // Données autorisées à être modifiées
      const {
        title,
        description,
        category,
        tags,
        accessType,
        price,
        status,
        thumbnail
      } = req.body;

      const updateData = {};
      if (title) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (category) updateData.category = category;
      if (tags) updateData.tags = tags;
      if (accessType) updateData.accessType = accessType;
      if (price !== undefined) updateData.price = parseFloat(price);
      if (status) updateData.status = status;
      if (thumbnail) updateData.thumbnail = thumbnail;

      // Mise à jour de la vidéo
      const updatedVideo = await prisma.video.update({
        where: { id: videoId },
        data: {
          ...updateData,
          updatedAt: new Date()
        },
        include: {
          expertRel: {
            select: {
              id: true,
              name: true,
              verified: true,
              user: {
                select: { avatar: true }
              }
            }
          }
        }
      });

      return ApiResponse.success(res, updatedVideo, 'Vidéo mise à jour avec succès');
    } catch (error) {
      console.error('Update video error:', error);
      return ApiResponse.error(res, 'Erreur lors de la mise à jour de la vidéo');
    }
  }

  /**
   * PHASE 2 - Supprimer une vidéo
   * @route DELETE /api/videos/:id
   * @access Private (Expert only)
   */
  static async deleteVideo(req, res) {
    try {
      const videoId = parseInt(req.params.id);
      const userId = req.user.id;

      // Vérifier que la vidéo existe et appartient à l'expert
      const video = await prisma.video.findUnique({
        where: { id: videoId },
        include: {
          expertRel: { select: { userId: true } }
        }
      });

      if (!video) {
        return ApiResponse.notFound(res, 'Vidéo non trouvée');
      }

      if (video.expertRel.userId !== userId) {
        return ApiResponse.forbidden(res, 'Vous n\'êtes pas autorisé à supprimer cette vidéo');
      }

      // Supprimer la vidéo et toutes ses relations en cascade
      await prisma.video.delete({
        where: { id: videoId }
      });

      return ApiResponse.success(res, null, 'Vidéo supprimée avec succès');
    } catch (error) {
      console.error('Delete video error:', error);
      return ApiResponse.error(res, 'Erreur lors de la suppression de la vidéo');
    }
  }
}

module.exports = VideoController;
