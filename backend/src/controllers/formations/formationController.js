const prisma = require('../../services/database');
const ApiResponse = require('../../utils/response');

/**
 * Contrôleur pour la gestion des formations
 */
class FormationController {
  /**
   * Récupérer toutes les formations
   */
  static async getAllFormations(req, res) {
    try {
      const { 
        category, 
        level, 
        type,
        search, 
        sortBy = 'rating',
        order = 'desc',
        page = 1,
        limit = 20 
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const where = {};
      
      if (category && category !== 'all') where.category = category;
      if (level) where.level = level;
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
          { instructor: { contains: term } },
          { instructor: { contains: termLower } },
          { instructor: { contains: termUpper } },
          { description: { contains: term } },
          { description: { contains: termLower } },
          { description: { contains: termUpper } },
          { titleNormalized: { contains: termNorm } },
          { instructorNormalized: { contains: termNorm } },
          { descriptionNormalized: { contains: termNorm } },
        ];
      }

      const orderBy = { [sortBy]: order };

      const [formations, total] = await Promise.all([
        prisma.formation.findMany({
          where,
          orderBy,
          skip,
          take: parseInt(limit),
          include: {
            expert: {
              select: {
                id: true,
                name: true,
                verified: true,
                user: { // On inclut l'utilisateur lié à l'expert
                  select: {
                    avatar: true // Pour récupérer l'avatar
                  }
                }
              }
            },
            enrollments: { select: { userId: true } }
          }
        }),
        prisma.formation.count({ where })
      ]);

      // Helper
      const safeParse = (str, fallback) => {
        try { if (str == null || str === '') return fallback; return JSON.parse(str); } catch { return fallback; }
      };

      // Formater les données pour le frontend
      // Trouver l'expert du viewer si connecté (pour marquer isOwner)
      const viewerExpertPromise = req.user ? prisma.expert.findUnique({ where: { userId: req.user.id } }) : null;
      const viewerExpert = viewerExpertPromise ? await viewerExpertPromise : null;

      const formattedFormations = formations.map(formation => {
        const expert = formation.expert || null;
        const expertUser = expert && expert.user ? expert.user : null;
        return ({
          ...formation,
          instructorId: formation.instructorId,
          tags: safeParse(formation.tags, []),
          modules: safeParse(formation.modules, []),
          expert: expert ? { ...expert, image: expertUser ? expertUser.avatar : undefined } : null,
          isEnrolled: req.user ? formation.enrollments.some(e => e.userId === req.user.id) : false,
          isOwner: req.user && viewerExpert ? formation.instructorId === viewerExpert.id : false
        });
      });

      return ApiResponse.success(res, {
        formations: formattedFormations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });

    } catch (error) {
      console.error('Get all formations error:', error);
      return ApiResponse.error(res, 'Erreur lors de la récupération des formations');
    }
  }

  /**
   * Récupérer une formation par ID
   */
  static async getFormationById(req, res) {
    try {
      const { id } = req.params;

      const formation = await prisma.formation.findUnique({
        where: { id: parseInt(id) },
        include: {
          expert: {
            select: {
              id: true,
              name: true,
              verified: true,
              user: { select: { id: true, avatar: true } }
            }
          },
          enrollments: {
            select: {
              enrolledAt: true,
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                  userType: true
                }
              }
            }
          },
          reviews: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  avatar: true
                }
              }
            },
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (!formation) {
        return ApiResponse.notFound(res, 'Formation non trouvée');
      }

      // Helpers robustes
      const safeParse = (str, fallback) => {
        try {
          if (str == null || str === '') return fallback;
          return JSON.parse(str);
        } catch { return fallback; }
      };

      // Formater les données
      const isOwner = !!(req.user && formation.expert && formation.expert.user && formation.expert.user.id === req.user.id);
      const isEnrolled = req.user ? formation.enrollments.some(e => e.user && e.user.id === req.user.id) : false;

      // Le lien de vidéoconférence n'est accessible qu'aux inscrits ou au propriétaire
      const canAccessVideoLink = isOwner || isEnrolled;

      const formattedFormation = {
        id: formation.id,
        title: formation.title,
        instructor: formation.instructor,
        duration: formation.duration,
        level: formation.level,
        rating: formation.rating,
        students: formation.students,
        price: formation.price,
        type: formation.type,
        instructorId: formation.instructorId,
        maxPlaces: formation.maxPlaces,
        currentPlaces: formation.currentPlaces,
        location: formation.location,
        image: formation.image,
        tags: safeParse(formation.tags, []),
        nextSession: formation.nextSession,
        description: formation.description,
        schedule: formation.schedule,
        modules: safeParse(formation.modules, []),
        // Champs additionnels si présents dans le schéma
        language: formation.language,
        certificate: formation.certificate,
        support: formation.support,
        accessDuration: formation.accessDuration,
        objectives: safeParse(formation.objectives, []),
        prerequisites: safeParse(formation.prerequisites, []),
        included: safeParse(formation.included, []),
        tools: safeParse(formation.tools, []),
        category: formation.category,
        // Lien vidéoconférence - uniquement pour les inscrits ou le propriétaire
        videoConferenceLink: canAccessVideoLink ? formation.videoConferenceLink : null,
        hasVideoConferenceLink: !!formation.videoConferenceLink, // Indique si un lien existe (même si non accessible)
        expert: formation.expert ? {
          id: formation.expert.id,
          name: formation.expert.name,
          verified: formation.expert.verified,
          image: formation.expert.user?.avatar
        } : null,
        enrollments: formation.enrollments,
        reviews: formation.reviews,
        isEnrolled,
        isOwner
      };

      return ApiResponse.success(res, formattedFormation);

    } catch (error) {
      console.error('Get formation by ID error:', error?.message || error);
      return ApiResponse.error(res, 'Erreur lors de la récupération de la formation');
    }
  }

  /**
   * Créer une nouvelle formation
   */
  static async createFormation(req, res) {
    try {
      const {
        title,
        duration,
        level,
        price,
        type,
        maxPlaces,
        location,
        image,
        tags = [],
        nextSession,
        description,
        schedule,
        modules = [],
        objectives = [],
        prerequisites = [],
        included = [],
        tools = [],
        category
      } = req.body;

      // Helpers de normalisation
      const toArray = (val) => {
        if (Array.isArray(val)) return val;
        if (typeof val === 'string') {
          try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) return parsed;
          } catch {}
          // fallback: split comma string
          return val
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
        }
        return [];
      };

      const parsedPrice = Number.parseInt(String(price), 10);
      const parsedMaxPlaces = Number.parseInt(String(maxPlaces), 10);

      // Validation des champs requis + types
      if (!title || !duration || !level || price === undefined || !type || maxPlaces === undefined || !category || !description || !location) {
        return ApiResponse.badRequest(res, 'Champs obligatoires manquants (title, duration, level, price, type, maxPlaces, category, description, location)');
      }
      if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
        return ApiResponse.badRequest(res, 'Le champ price doit être un entier positif');
      }
      if (!Number.isFinite(parsedMaxPlaces) || parsedMaxPlaces <= 0) {
        return ApiResponse.badRequest(res, 'Le champ maxPlaces doit être un entier strictement positif');
      }

      // Vérifier que l'utilisateur est un expert
      const expert = req.expert || (await prisma.expert.findUnique({ where: { userId: req.user.id } }));

      if (!expert) {
        return ApiResponse.forbidden(res, 'Seuls les experts peuvent créer des formations');
      }

      // Générer un identifiant unique pour la salle Jitsi de la formation
      const generateRoomId = () => {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      };

      // Créer la formation
      const normalize = (s) => s ? s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase() : s;
      const roomId = generateRoomId();

      const created = await prisma.formation.create({
        data: {
          title,
          titleNormalized: normalize(title),
          instructorId: expert.id,
          instructor: expert.name,
          instructorNormalized: normalize(expert.name),
          duration,
          level,
          price: parsedPrice,
          type,
          maxPlaces: parsedMaxPlaces,
          location,
          image,
          tags: JSON.stringify(toArray(tags)),
          nextSession,
          description,
          descriptionNormalized: normalize(description),
          schedule,
          modules: JSON.stringify(toArray(modules)),
          objectives: JSON.stringify(toArray(objectives)),
          prerequisites: JSON.stringify(toArray(prerequisites)),
          included: JSON.stringify(toArray(included)),
          tools: JSON.stringify(toArray(tools)),
          category,
          // Générer automatiquement le lien Jitsi uniquement pour les formations "En direct"
          videoConferenceLink: type === 'live' ? `formation-${roomId}` : null
        },
        include: {
          expert: {
            select: {
              id: true,
              name: true,
              verified: true,
              user: { select: { avatar: true } }
            }
          }
        }
      });

      // Normaliser la réponse pour rester cohérent avec les autres endpoints
      const responseFormation = {
        ...created,
        tags: toArray(created.tags ? JSON.parse(created.tags) : []),
        modules: toArray(created.modules ? JSON.parse(created.modules) : []),
        objectives: toArray(created.objectives ? JSON.parse(created.objectives) : []),
        prerequisites: toArray(created.prerequisites ? JSON.parse(created.prerequisites) : []),
        included: toArray(created.included ? JSON.parse(created.included) : []),
        tools: toArray(created.tools ? JSON.parse(created.tools) : []),
        expert: created.expert
          ? {
              id: created.expert.id,
              name: created.expert.name,
              verified: created.expert.verified,
              image: created.expert.user?.avatar,
            }
          : null,
      };

      // Notifier les followers de l'expert
      try {
        const followers = await prisma.expertFollow.findMany({ where: { expertId: expert.id }, select: { userId: true } });
        const io = req.app.get('io');
        const onlineUsers = req.app.get('onlineUsers');
        const notifTitle = 'Nouvelle formation publiée';
        const notifMsg = `${expert.name} a publié « ${title} »`;
        const actionUrl = `/formations/${responseFormation.id}`;
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
        console.warn('Notify followers (formation) failed:', e?.message || e);
      }

      return ApiResponse.created(res, responseFormation, 'Formation créée avec succès');

    } catch (error) {
      console.error('Create formation error:', error);
      return ApiResponse.error(res, 'Erreur lors de la création de la formation');
    }
  }

  /**
   * S'inscrire à une formation
   */
  static async enrollInFormation(req, res) {
    try {
      const { id } = req.params;
      const formationId = parseInt(id);

      // Vérifier que la formation existe
      const formation = await prisma.formation.findUnique({
        where: { id: formationId }
      });

      if (!formation) {
        return ApiResponse.notFound(res, 'Formation non trouvée');
      }

      // Empêcher un expert de s'inscrire à sa propre formation
      try {
        const expert = await prisma.expert.findUnique({ where: { userId: req.user.id } });
        if (expert && formation.instructorId && Number(formation.instructorId) === Number(expert.id)) {
          return ApiResponse.badRequest(res, 'Vous ne pouvez pas vous inscrire à votre propre formation');
        }
      } catch {}

      // Vérifier si l'utilisateur est déjà inscrit
      const existingEnrollment = await prisma.userFormation.findUnique({
        where: {
          userId_formationId: {
            userId: req.user.id,
            formationId: formationId
          }
        }
      });

      if (existingEnrollment) {
        return ApiResponse.badRequest(res, 'Vous êtes déjà inscrit à cette formation');
      }

      // Vérifier s'il reste des places
      if (formation.currentPlaces >= formation.maxPlaces) {
        return ApiResponse.badRequest(res, 'Cette formation est complète');
      }

      // Vérifier si l'utilisateur a assez de coins
      if (req.user.coins < formation.price) {
        return ApiResponse.badRequest(res, 'Vous n\'avez pas assez de coins pour cette formation');
      }

      // Créer l'inscription et débiter les coins
      await prisma.$transaction(async (tx) => {
        // Créer l'inscription
        await tx.userFormation.create({
          data: {
            userId: req.user.id,
            formationId: formationId
          }
        });

        // Débiter les coins
        await tx.user.update({
          where: { id: req.user.id },
          data: {
            coins: { decrement: formation.price },
            formationsFollowed: { increment: 1 }
          }
        });

        // Mettre à jour le nombre de places
        await tx.formation.update({
          where: { id: formationId },
          data: {
            currentPlaces: { increment: 1 },
            students: { increment: 1 }
          }
        });

        // Créer une transaction
        await tx.transaction.create({
          data: {
            userId: req.user.id,
            type: 'spend',
            amount: formation.price * 100, // en centimes
            coins: formation.price,
            description: `Inscription à la formation: ${formation.title}`,
            relatedId: formationId
          }
        });
      });

      // Notifier l'expert et l'utilisateur en temps réel
      try {
        const io = req.app.get('io');
        const onlineUsers = req.app.get('onlineUsers');
        // Récupérer l'expert (owner) de la formation
        const f = await prisma.formation.findUnique({
          where: { id: formationId },
          include: {
            expert: { include: { user: { select: { id: true } } } }
          }
        });
        if (f?.expert?.user?.id && io) {
          // Créer une notification pour l'expert
          await prisma.notification.create({
            data: {
              userId: f.expert.user.id,
              title: 'Nouvelle inscription à votre formation',
              message: `${req.user.firstName} ${req.user.lastName} s'est inscrit(e) à "${formation.title}"`,
              type: 'enrollment',
              actionUrl: `/dashboard/formations`
            }
          });
          const sockId = onlineUsers?.get(f.expert.user.id);
          if (sockId) io.to(sockId).emit('formationEnrollmentCreated', { formationId: formationId });
        }
        // Notification de confirmation pour l'utilisateur
        await prisma.notification.create({
          data: {
            userId: req.user.id,
            title: 'Réservation confirmée',
            message: `Votre inscription à la formation "${formation.title}" est confirmée.`,
            type: 'enrollment',
            actionUrl: `/dashboard/formations`
          }
        });
        // Émettre à l'utilisateur pour mettre à jour son dashboard
        if (io) {
          const userSock = onlineUsers?.get(req.user.id);
          if (userSock) io.to(userSock).emit('formationEnrolled', { formationId: formationId });
        }
      } catch {}

      return ApiResponse.success(res, null, 'Inscription réussie à la formation');

    } catch (error) {
      console.error('Enroll in formation error:', error);
      return ApiResponse.error(res, 'Erreur lors de l\'inscription à la formation');
    }
  }

  /**
   * Récupérer les formations de l'utilisateur
   */
  static async getUserFormations(req, res) {
    try {
      const enrollments = await prisma.userFormation.findMany({
        where: { userId: req.user.id },
        include: {
          formation: {
            include: {
              expert: {
                select: {
                  id: true,
                  name: true,
                  user: {
                    select: {
                      avatar: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: { enrolledAt: 'desc' }
      });

      const formattedEnrollments = enrollments.map(enrollment => ({
        ...enrollment,
        formation: {
          ...enrollment.formation,
          tags: JSON.parse(enrollment.formation.tags || '[]'),
          modules: JSON.parse(enrollment.formation.modules || '[]')
        }
      }));

      return ApiResponse.success(res, formattedEnrollments);

    } catch (error) {
      console.error('Get user formations error:', error);
      return ApiResponse.error(res, 'Erreur lors de la récupération des formations');
    }
  }

  /**
   * Récupérer les formations de l'expert connecté
   */
  static async getExpertFormations(req, res) {
    try {
      const expert = await prisma.expert.findUnique({
        where: { userId: req.user.id }
      });

      if (!expert) {
        return ApiResponse.notFound(res, "Profil expert non trouvé.");
      }

      const formations = await prisma.formation.findMany({
        where: { instructorId: expert.id },
        orderBy: { students: 'desc' }, // Trier par popularité (nombre d'étudiants)
        take: 6 // Limiter aux plus populaires
      });

      const formattedFormations = formations.map(f => ({
        ...f,
        tags: JSON.parse(f.tags || '[]'),
        modules: JSON.parse(f.modules || '[]'),
      }));

      return ApiResponse.success(res, { formations: formattedFormations });

    } catch (error) {
      console.error('Get expert formations error:', error);
      return ApiResponse.error(res, 'Erreur lors de la récupération de vos formations');
    }
  }

  /**
   * Exporter tous les inscrits des formations du propriétaire (CSV)
   */
  static async exportAllEnrollmentsCsv(req, res) {
    try {
      const viewerExpert = await prisma.expert.findUnique({ where: { userId: req.user.id } });
      if (!viewerExpert) return ApiResponse.forbidden(res, "Accès refusé");

      const formations = await prisma.formation.findMany({
        where: { instructorId: viewerExpert.id },
        select: {
          id: true,
          title: true,
          enrollments: {
            select: {
              enrolledAt: true,
              user: { select: { firstName: true, lastName: true, userType: true } }
            },
            orderBy: { enrolledAt: 'desc' }
          }
        }
      });

      const headers = ['FormationID','Formation','Prénom','Nom','Rôle','Inscrit le'];
      const esc = (v) => {
        if (v === null || v === undefined) return '';
        const s = String(v).replace(/\"/g, '\"\"');
        return /[\",\n]/.test(s) ? `\"${s}\"` : s;
      };
      const rows = [];
      for (const f of formations) {
        for (const e of f.enrollments) {
          rows.push([
            f.id,
            f.title,
            e.user?.firstName || '',
            e.user?.lastName || '',
            e.user?.userType || '',
            e.enrolledAt ? new Date(e.enrolledAt).toISOString() : ''
          ]);
        }
      }
      const csv = [headers.join(',')].concat(rows.map(r => r.map(esc).join(','))).join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=\"formations_inscrits_tous.csv\"`);
      return res.send(csv);
    } catch (e) {
      console.error('Export all formations enrollments error:', e?.message || e);
      return ApiResponse.error(res, "Erreur export CSV");
    }
  }

  /**
   * Démarrer la session vidéo de la formation (expert propriétaire uniquement)
   */
  static async startVideoSession(req, res) {
    try {
      const formationId = parseInt(req.params.id);
      if (!Number.isFinite(formationId)) return ApiResponse.badRequest(res, 'ID invalide');

      // Vérifier que l'utilisateur est l'expert propriétaire
      const expert = await prisma.expert.findUnique({ where: { userId: req.user.id } });
      if (!expert) return ApiResponse.forbidden(res, "Accès refusé");

      const formation = await prisma.formation.findUnique({
        where: { id: formationId },
        select: { id: true, instructorId: true, videoConferenceLink: true }
      });

      if (!formation) return ApiResponse.notFound(res, 'Formation non trouvée');
      if (formation.instructorId !== expert.id) return ApiResponse.forbidden(res, "Vous n'êtes pas propriétaire de cette formation");
      if (!formation.videoConferenceLink) return ApiResponse.badRequest(res, "Cette formation n'a pas de vidéoconférence configurée");

      // Démarrer la session
      await prisma.formation.update({
        where: { id: formationId },
        data: {
          videoSessionStartedAt: new Date(),
          videoSessionEndedAt: null // Reset end time
        }
      });

      // Notifier les inscrits en temps réel via Socket.IO
      try {
        const io = req.app.get('io');
        const onlineUsers = req.app.get('onlineUsers');
        if (io) {
          const enrollments = await prisma.userFormation.findMany({
            where: { formationId },
            select: { userId: true }
          });
          for (const e of enrollments) {
            const sockId = onlineUsers?.get(e.userId);
            if (sockId) {
              io.to(sockId).emit('formationVideoStarted', { formationId });
            }
          }
        }
      } catch {}

      return ApiResponse.success(res, { started: true }, 'Session vidéo démarrée');
    } catch (error) {
      console.error('Start video session error:', error);
      return ApiResponse.error(res, 'Erreur lors du démarrage de la session vidéo');
    }
  }

  /**
   * Terminer la session vidéo de la formation (expert propriétaire uniquement)
   */
  static async stopVideoSession(req, res) {
    try {
      const formationId = parseInt(req.params.id);
      if (!Number.isFinite(formationId)) return ApiResponse.badRequest(res, 'ID invalide');

      // Vérifier que l'utilisateur est l'expert propriétaire
      const expert = await prisma.expert.findUnique({ where: { userId: req.user.id } });
      if (!expert) return ApiResponse.forbidden(res, "Accès refusé");

      const formation = await prisma.formation.findUnique({
        where: { id: formationId },
        select: { id: true, instructorId: true }
      });

      if (!formation) return ApiResponse.notFound(res, 'Formation non trouvée');
      if (formation.instructorId !== expert.id) return ApiResponse.forbidden(res, "Vous n'êtes pas propriétaire de cette formation");

      // Terminer la session
      await prisma.formation.update({
        where: { id: formationId },
        data: {
          videoSessionEndedAt: new Date()
        }
      });

      // Notifier les inscrits en temps réel via Socket.IO pour qu'ils quittent
      try {
        const io = req.app.get('io');
        const onlineUsers = req.app.get('onlineUsers');
        if (io) {
          const enrollments = await prisma.userFormation.findMany({
            where: { formationId },
            select: { userId: true }
          });
          for (const e of enrollments) {
            const sockId = onlineUsers?.get(e.userId);
            if (sockId) {
              io.to(sockId).emit('formationVideoEnded', { formationId });
            }
          }
        }
      } catch {}

      return ApiResponse.success(res, { stopped: true }, 'Session vidéo terminée');
    } catch (error) {
      console.error('Stop video session error:', error);
      return ApiResponse.error(res, 'Erreur lors de l\'arrêt de la session vidéo');
    }
  }

  /**
   * Obtenir le statut de la session vidéo (pour savoir si les clients peuvent rejoindre)
   */
  static async getVideoSessionStatus(req, res) {
    try {
      const formationId = parseInt(req.params.id);
      if (!Number.isFinite(formationId)) return ApiResponse.badRequest(res, 'ID invalide');

      const formation = await prisma.formation.findUnique({
        where: { id: formationId },
        select: {
          id: true,
          instructorId: true,
          nextSession: true,
          videoSessionStartedAt: true,
          videoSessionEndedAt: true,
          videoConferenceLink: true,
          expert: {
            select: {
              user: { select: { id: true } }
            }
          }
        }
      });

      if (!formation) return ApiResponse.notFound(res, 'Formation non trouvée');

      // Vérifier si l'utilisateur est le propriétaire
      const isOwner = req.user && formation.expert?.user?.id === req.user.id;

      // La session est active si elle a été démarrée et non terminée
      const isSessionActive = formation.videoSessionStartedAt && !formation.videoSessionEndedAt;

      // Vérifier si on est dans les 5 minutes avant la date prévue
      let isWithin5MinutesOfSchedule = false;
      if (formation.nextSession) {
        try {
          const nextSessionDate = new Date(formation.nextSession);
          const now = new Date();
          const diffMs = nextSessionDate.getTime() - now.getTime();
          const fiveMinutesMs = 5 * 60 * 1000;
          // Dans les 5 minutes avant OU après la date prévue (pour permettre un délai raisonnable)
          isWithin5MinutesOfSchedule = diffMs <= fiveMinutesMs && diffMs >= -30 * 60 * 1000; // jusqu'à 30min après
        } catch {}
      }

      // Les clients peuvent rejoindre si:
      // 1. La session est active (expert a cliqué "Lancer")
      // 2. OU on est dans les 5 minutes avant/après la date prévue
      const canJoin = isOwner || isSessionActive || isWithin5MinutesOfSchedule;

      return ApiResponse.success(res, {
        isSessionActive,
        isWithin5MinutesOfSchedule,
        canJoin,
        isOwner,
        videoSessionStartedAt: formation.videoSessionStartedAt,
        videoSessionEndedAt: formation.videoSessionEndedAt,
        nextSession: formation.nextSession,
        hasVideoConferenceLink: !!formation.videoConferenceLink
      });
    } catch (error) {
      console.error('Get video session status error:', error);
      return ApiResponse.error(res, 'Erreur lors de la récupération du statut de la session');
    }
  }

  /**
   * Mettre à jour une formation existante
   */
  static async updateFormation(req, res) {
    try {
      const formationId = parseInt(req.params.id);
      if (!Number.isFinite(formationId)) {
        return ApiResponse.badRequest(res, 'ID invalide');
      }

      // Vérifier que la formation existe
      const formation = await prisma.formation.findUnique({
        where: { id: formationId }
      });

      if (!formation) {
        return ApiResponse.notFound(res, 'Formation non trouvée');
      }

      // Vérifier que l'expert est le propriétaire
      if (formation.instructorId !== req.expert.id) {
        return ApiResponse.forbidden(res, "Vous n'êtes pas propriétaire de cette formation");
      }

      // Helpers
      const toArray = (val) => {
        if (Array.isArray(val)) return val;
        if (typeof val === 'string') {
          try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) return parsed;
          } catch {}
          return val.split(',').map((s) => s.trim()).filter(Boolean);
        }
        return [];
      };

      const normalize = (s) => s ? s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase() : s;

      // Champs acceptés depuis le body
      const {
        title,
        duration,
        level,
        price,
        type,
        maxPlaces,
        location,
        image,
        tags,
        nextSession,
        description,
        schedule,
        modules,
        objectives,
        prerequisites,
        included,
        tools,
        category,
        // Phase 3 fields
        subtitle,
        shortDescription,
        learningObjectives,
        targetAudience,
        subcategory,
        language,
        totalHours,
        totalMinutes,
        totalWeeks,
        totalModules,
        frequency,
        startDate,
        endDate,
        promoCode,
        promoDiscount,
        promoMaxUses,
        maxEnrolled,
        structuredModules
      } = req.body;

      // Construire l'objet de mise à jour (uniquement les champs fournis)
      const data = {};

      // Champs texte simples
      if (title !== undefined) {
        data.title = title;
        data.titleNormalized = normalize(title);
      }
      if (duration !== undefined) data.duration = duration;
      if (level !== undefined) data.level = level;
      if (type !== undefined) data.type = type;
      if (location !== undefined) data.location = location;
      if (image !== undefined) data.image = image;
      if (nextSession !== undefined) data.nextSession = nextSession;
      if (schedule !== undefined) data.schedule = schedule;
      if (category !== undefined) data.category = category;

      if (description !== undefined) {
        data.description = description;
        data.descriptionNormalized = normalize(description);
      }

      // Champs numériques
      if (price !== undefined) {
        const parsedPrice = Number.parseInt(String(price), 10);
        if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
          return ApiResponse.badRequest(res, 'Le champ price doit être un entier positif');
        }
        data.price = parsedPrice;
      }
      if (maxPlaces !== undefined) {
        const parsedMaxPlaces = Number.parseInt(String(maxPlaces), 10);
        if (!Number.isFinite(parsedMaxPlaces) || parsedMaxPlaces <= 0) {
          return ApiResponse.badRequest(res, 'Le champ maxPlaces doit être un entier strictement positif');
        }
        data.maxPlaces = parsedMaxPlaces;
      }

      // Champs JSON array
      const jsonArrayFields = { tags, modules, objectives, prerequisites, included, tools, learningObjectives, structuredModules };
      for (const [key, val] of Object.entries(jsonArrayFields)) {
        if (val !== undefined) {
          data[key] = Array.isArray(val) ? JSON.stringify(val) : (typeof val === 'string' ? val : JSON.stringify(toArray(val)));
        }
      }

      // Phase 3 - Champs texte simples
      if (subtitle !== undefined) data.subtitle = subtitle;
      if (shortDescription !== undefined) data.shortDescription = shortDescription;
      if (targetAudience !== undefined) data.targetAudience = targetAudience;
      if (subcategory !== undefined) data.subcategory = subcategory;
      if (language !== undefined) data.language = language;
      if (frequency !== undefined) data.frequency = frequency;
      if (promoCode !== undefined) data.promoCode = promoCode;

      // Phase 3 - Champs numériques
      if (totalHours !== undefined) data.totalHours = totalHours !== null ? parseInt(String(totalHours), 10) : null;
      if (totalMinutes !== undefined) data.totalMinutes = totalMinutes !== null ? parseInt(String(totalMinutes), 10) : null;
      if (totalWeeks !== undefined) data.totalWeeks = totalWeeks !== null ? parseInt(String(totalWeeks), 10) : null;
      if (totalModules !== undefined) data.totalModules = totalModules !== null ? parseInt(String(totalModules), 10) : null;
      if (promoDiscount !== undefined) data.promoDiscount = promoDiscount !== null ? parseInt(String(promoDiscount), 10) : null;
      if (promoMaxUses !== undefined) data.promoMaxUses = promoMaxUses !== null ? parseInt(String(promoMaxUses), 10) : null;
      if (maxEnrolled !== undefined) data.maxEnrolled = maxEnrolled !== null ? parseInt(String(maxEnrolled), 10) : null;

      // Phase 3 - Champs date
      if (startDate !== undefined) data.startDate = startDate ? new Date(startDate) : null;
      if (endDate !== undefined) data.endDate = endDate ? new Date(endDate) : null;

      // Si le type passe en "live" et qu'il n'y a pas encore de lien Jitsi, en générer un
      if (data.type === 'live' && !formation.videoConferenceLink) {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let roomId = '';
        for (let i = 0; i < 8; i++) {
          roomId += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        data.videoConferenceLink = `formation-${roomId}`;
      }

      const updated = await prisma.formation.update({
        where: { id: formationId },
        data,
        include: {
          expert: {
            select: {
              id: true,
              name: true,
              verified: true,
              user: { select: { avatar: true } }
            }
          }
        }
      });

      // Normaliser la réponse
      const safeParse = (str, fallback) => {
        try { if (str == null || str === '') return fallback; return JSON.parse(str); } catch { return fallback; }
      };

      const responseFormation = {
        ...updated,
        tags: safeParse(updated.tags, []),
        modules: safeParse(updated.modules, []),
        objectives: safeParse(updated.objectives, []),
        prerequisites: safeParse(updated.prerequisites, []),
        included: safeParse(updated.included, []),
        tools: safeParse(updated.tools, []),
        learningObjectives: safeParse(updated.learningObjectives, []),
        structuredModules: safeParse(updated.structuredModules, []),
        expert: updated.expert
          ? {
              id: updated.expert.id,
              name: updated.expert.name,
              verified: updated.expert.verified,
              image: updated.expert.user?.avatar,
            }
          : null,
      };

      return ApiResponse.success(res, responseFormation, 'Formation mise à jour avec succès');

    } catch (error) {
      console.error('Update formation error:', error);
      return ApiResponse.error(res, 'Erreur lors de la mise à jour de la formation');
    }
  }

  /**
   * Supprimer une formation
   */
  static async deleteFormation(req, res) {
    try {
      const formationId = parseInt(req.params.id);
      if (!Number.isFinite(formationId)) {
        return ApiResponse.badRequest(res, 'ID invalide');
      }

      // Vérifier que la formation existe
      const formation = await prisma.formation.findUnique({
        where: { id: formationId },
        include: {
          enrollments: { select: { id: true, userId: true } }
        }
      });

      if (!formation) {
        return ApiResponse.notFound(res, 'Formation non trouvée');
      }

      // Vérifier que l'expert est le propriétaire
      if (formation.instructorId !== req.expert.id) {
        return ApiResponse.forbidden(res, "Vous n'êtes pas propriétaire de cette formation");
      }

      // Avertissement si des inscriptions actives existent
      const activeEnrollments = formation.enrollments.length;

      await prisma.$transaction(async (tx) => {
        // Dissocier les rendez-vous liés (formationId est nullable, pas de cascade)
        await tx.appointment.updateMany({
          where: { formationId },
          data: { formationId: null }
        });

        // Supprimer les inscriptions (UserFormation) -- cascade existe mais on le fait explicitement par sécurité
        await tx.userFormation.deleteMany({
          where: { formationId }
        });

        // Supprimer les avis liés
        await tx.review.deleteMany({
          where: { formationId }
        });

        // Supprimer les favoris liés
        await tx.favoriteFormation.deleteMany({
          where: { formationId }
        });

        // Supprimer la formation
        await tx.formation.delete({
          where: { id: formationId }
        });
      });

      return ApiResponse.success(res, {
        deletedId: formationId,
        enrollmentsRemoved: activeEnrollments
      }, activeEnrollments > 0
        ? `Formation supprimée avec succès (${activeEnrollments} inscription(s) retirée(s))`
        : 'Formation supprimée avec succès'
      );

    } catch (error) {
      console.error('Delete formation error:', error);
      return ApiResponse.error(res, 'Erreur lors de la suppression de la formation');
    }
  }

  /**
   * Exporter les inscrits d'une formation (CSV)
   */
  static async exportEnrollmentsCsv(req, res) {
    try {
      const formationId = parseInt(req.params.id);
      if (!Number.isFinite(formationId)) return ApiResponse.badRequest(res, 'ID invalide');

      // Vérifier que le requester est bien l'expert propriétaire
      const viewerExpert = await prisma.expert.findUnique({ where: { userId: req.user.id } });
      if (!viewerExpert) return ApiResponse.forbidden(res, "Accès refusé");

      const formation = await prisma.formation.findUnique({
        where: { id: formationId },
        select: {
          id: true,
          title: true,
          instructorId: true,
          enrollments: {
            select: {
              enrolledAt: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  userType: true
                }
              }
            },
            orderBy: { enrolledAt: 'desc' }
          }
        }
      });
      if (!formation) return ApiResponse.notFound(res, 'Formation non trouvée');
      if (formation.instructorId !== viewerExpert.id) return ApiResponse.forbidden(res, "Vous n'êtes pas propriétaire de cette formation");

      const headers = ['Prénom','Nom','Rôle','Inscrit le'];
      const esc = (v) => {
        if (v === null || v === undefined) return '';
        const s = String(v).replace(/\"/g, '\"\"');
        return /[\",\n]/.test(s) ? `\"${s}\"` : s;
      };
      const rows = formation.enrollments.map(e => [
        e.user?.firstName || '',
        e.user?.lastName || '',
        e.user?.userType || '',
        e.enrolledAt ? new Date(e.enrolledAt).toISOString() : ''
      ]);
      const csv = [headers.join(',')].concat(rows.map(r => r.map(esc).join(','))).join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="formation_${formationId}_inscrits.csv"`);
      return res.send(csv);
    } catch (e) {
      console.error('Export formation enrollments error:', e?.message || e);
      return ApiResponse.error(res, "Erreur export CSV");
    }
  }
}

module.exports = FormationController;
