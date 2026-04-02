const prisma = require('../../services/database');
const ApiResponse = require('../../utils/response');

/**
 * Contrôleur pour la gestion des experts
 */
class ExpertController {
  /**
   * Récupérer tous les experts
   */
  static async getAllExperts(req, res) {
    try {
      const { 
        category, 
        search, 
        sortBy = 'rating',
        order = 'desc',
        page = 1,
        limit = 20 
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const where = {};
      
      const andConditions = [];

      if (category && category !== 'all') {
        andConditions.push({
          OR: [
            { category: category },
            { categories: { contains: category } }
          ]
        });
      }
      if (search) {
        const term = String(search || '').trim();
        const norm = (s) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
        const termLower = term.toLowerCase();
        const termUpper = term.toUpperCase();
        const termNorm = norm(term);
        andConditions.push({
          OR: [
            { name: { contains: term } },
            { name: { contains: termLower } },
            { name: { contains: termUpper } },
            { specialty: { contains: term } },
            { specialty: { contains: termLower } },
            { specialty: { contains: termUpper } },
            { nameNormalized: { contains: termNorm } },
            { specialtyNormalized: { contains: termNorm } },
          ]
        });
      }

      if (andConditions.length > 0) {
        where.AND = andConditions;
      }

      const orderBy = { [sortBy]: order };

      const [experts, total] = await Promise.all([
        prisma.expert.findMany({
          where,
          orderBy,
          skip,
          take: parseInt(limit),
          include: { user: { select: { avatar: true } } }
        }),
        prisma.expert.count({ where })
      ]);

      const formattedExperts = experts.map(expert => ({
        ...expert,
        image: expert.user.avatar,
        tags: JSON.parse(expert.tags || '[]'),
        languages: JSON.parse(expert.languages || '[]'),
        categories: JSON.parse(expert.categories || '[]'),
      }));

      return ApiResponse.success(res, {
        experts: formattedExperts,
        pagination: { total, pages: Math.ceil(total / parseInt(limit)) }
      });
    } catch (error) {
      console.error('Get all experts error:', error);
      return ApiResponse.error(res, 'Erreur lors de la récupération des experts');
    }
  }

  /**
   * Récupérer les statistiques spécifiques pour le dashboard d'un expert
   */
  static async getExpertStats(req, res) {
    try {
      const expert = await prisma.expert.findUnique({
        where: { userId: req.user.id },
        include: {
          formations: true,
          videos: true,
        }
      });

      if (!expert) {
        return ApiResponse.notFound(res, 'Profil expert non trouvé');
      }

      // Calculer les statistiques
      const totalStudents = expert.formations.reduce((sum, f) => sum + (f.students || 0), 0);
      const formationRevenue = expert.formations.reduce((sum, f) => sum + ((f.price || 0) * (f.currentPlaces || 0)), 0);
      const formationCount = expert.formations.length;

      // Note moyenne et nombre d'avis (basés sur les avis Expert)
      let averageRating = 0;
      let reviewCount = 0;
      try {
        const agg = await prisma.review.aggregate({
          where: { expertId: expert.id },
          _avg: { rating: true },
          _count: { _all: true }
        });
        averageRating = Number(agg?._avg?.rating || 0);
        reviewCount = Number(agg?._count?._all || 0);
      } catch {}

      const totalViews = expert.videos.reduce((sum, v) => sum + (v.views || 0), 0);
      const totalLikes = expert.videos.reduce((sum, v) => sum + (v.likes || 0), 0);

      // Revenus vidéo: nombre d'achats (user_videos) pour les vidéos premium x prix
      let videoRevenue = 0;
      try {
        const premiumVideos = await prisma.video.findMany({ where: { expertId: expert.id, type: 'premium' }, select: { id: true, price: true } });
        const ids = premiumVideos.map(v => v.id);
        if (ids.length > 0) {
          const grouped = await prisma.userVideo.groupBy({ by: ['videoId'], where: { videoId: { in: ids } }, _count: { videoId: true } });
          const countMap = new Map(grouped.map(g => [g.videoId, g._count.videoId]));
          videoRevenue = premiumVideos.reduce((sum, v) => sum + ((v.price || 0) * (countMap.get(v.id) || 0)), 0);
        }
      } catch {}

      const stats = {
        totalStudents,
        formationRevenue,
        formationCount,
        averageRating,
        reviewCount,
        totalViews,
        totalLikes,
        videoRevenue
      };

      return ApiResponse.success(res, stats);
    } catch (error) {
      console.error('Get expert stats error:', error);
      return ApiResponse.error(res, 'Erreur lors de la récupération des statistiques de l\'expert');
    }
  }

  /**
   * Récupérer un expert par ID
   */
  static async getExpertById(req, res) {
    try {
      const { id } = req.params;
      const expertId = parseInt(id, 10);

      if (Number.isNaN(expertId)) {
        return ApiResponse.badRequest(res, 'ID expert invalide');
      }

      const expert = await prisma.expert.findUnique({
        where: { id: expertId },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              avatar: true,
              joinDate: true
            }
          },
          formations: { take: 5, orderBy: { createdAt: 'desc' } },
          videos: { take: 5, orderBy: { publishedAt: 'desc' } },
          receivedReviews: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  avatar: true
                }
              }
            }
          }
        }
      });

      if (!expert) {
        return ApiResponse.notFound(res, 'Expert non trouvé');
      }

      // Déterminer si l'utilisateur courant suit cet expert
      let isFollowed = false;
      try {
        if (req.user) {
          const f = await prisma.expertFollow.findUnique({ where: { userId_expertId: { userId: req.user.id, expertId: expert.id } } });
          isFollowed = !!f;
        }
      } catch {}

      // Formater les données
      const formattedExpert = {
        id: expert.id,
        // **LA CORRECTION CLÉ EST ICI**
        // On ajoute le userId à la réponse pour que le frontend puisse l'utiliser.
        userId: expert.userId,
        name: expert.name,
        specialty: expert.specialty,
        rating: expert.rating,
        reviews: expert.reviews, // Ceci est le nombre total d'avis
        hourlyRate: expert.hourlyRate,
        minuteRate: expert.minuteRate,
        videoMessageRate: expert.videoMessageRate,
        pricePerMessage: expert.pricePerMessage,
        image: expert.user.avatar,
        isOnline: expert.isOnline,
        nextAvailable: expert.nextAvailable,
        tags: JSON.parse(expert.tags || '[]'),
        verified: expert.verified,
        category: expert.category,
        categories: JSON.parse(expert.categories || '[]'),
        languages: JSON.parse(expert.languages || '[]'),
        responseTime: expert.responseTime,
        sessions: expert.sessions,
        followers: expert.followers,
        description: expert.description,
        country: expert.country,
        linkedinUrl: expert.linkedinUrl,
        rnePatente: expert.rnePatente,
        user: expert.user,
        formations: expert.formations,
        videos: expert.videos,
        reviewList: expert.receivedReviews, // Ceci est la liste détaillée des avis
        isFollowed
      };

      return ApiResponse.success(res, formattedExpert);

    } catch (error) {
      console.error('Get expert by ID error:', error);
      return ApiResponse.error(res, 'Erreur lors de la récupération de l\'expert');
    }
  }

  /**
   * Récupérer le profil expert de l'utilisateur connecté
   */
  static async getMyExpert(req, res) {
    try {
      const expert = await prisma.expert.findUnique({
        where: { userId: req.user.id },
        include: {
          user: { select: { firstName: true, lastName: true, avatar: true, joinDate: true } },
          formations: { orderBy: { createdAt: 'desc' } },
          videos: { orderBy: { publishedAt: 'desc' } },
          receivedReviews: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { firstName: true, lastName: true, avatar: true } } }
          }
        }
      });
      if (!expert) return ApiResponse.notFound(res, 'Profil expert non trouvé');

      const formattedExpert = {
        id: expert.id,
        userId: expert.userId,
        name: expert.name,
        specialty: expert.specialty,
        rating: expert.rating,
        reviews: expert.reviews,
        hourlyRate: expert.hourlyRate,
        minuteRate: expert.minuteRate,
        videoMessageRate: expert.videoMessageRate,
        pricePerMessage: expert.pricePerMessage,
        image: expert.user?.avatar,
        isOnline: expert.isOnline,
        nextAvailable: expert.nextAvailable,
        tags: JSON.parse(expert.tags || '[]'),
        verified: expert.verified,
        category: expert.category,
        categories: JSON.parse(expert.categories || '[]'),
        languages: JSON.parse(expert.languages || '[]'),
        responseTime: expert.responseTime,
        sessions: expert.sessions,
        followers: expert.followers,
        description: expert.description,
        country: expert.country,
        linkedinUrl: expert.linkedinUrl,
        rnePatente: expert.rnePatente,
        user: expert.user,
        formations: expert.formations,
        videos: expert.videos,
        reviewList: expert.receivedReviews,
        isFollowed: false
      };
      return ApiResponse.success(res, formattedExpert);
    } catch (error) {
      console.error('Get my expert error:', error);
      return ApiResponse.error(res, "Erreur lors de la récupération du profil expert");
    }
  }

  /**
   * Suivre / Ne plus suivre un expert (toggle)
   */
  static async toggleFollow(req, res) {
    try {
      const expertId = parseInt(req.params.id);
      const expert = await prisma.expert.findUnique({ where: { id: expertId } });
      if (!expert) return ApiResponse.notFound(res, 'Expert non trouvé');

      const existing = await prisma.expertFollow.findUnique({ where: { userId_expertId: { userId: req.user.id, expertId } } });
      if (existing) {
        await prisma.$transaction([
          prisma.expertFollow.delete({ where: { userId_expertId: { userId: req.user.id, expertId } } }),
          prisma.user.update({ where: { id: req.user.id }, data: { expertsFollowed: { decrement: 1 } } }),
          prisma.expert.update({ where: { id: expertId }, data: { followers: { decrement: 1 } } }),
        ]);
        return ApiResponse.success(res, { following: false }, 'Vous ne suivez plus cet expert');
      }
      await prisma.$transaction([
        prisma.expertFollow.create({ data: { userId: req.user.id, expertId } }),
        prisma.user.update({ where: { id: req.user.id }, data: { expertsFollowed: { increment: 1 } } }),
        prisma.expert.update({ where: { id: expertId }, data: { followers: { increment: 1 } } }),
      ]);
      return ApiResponse.success(res, { following: true }, 'Vous suivez désormais cet expert');
    } catch (error) {
      console.error('Toggle follow expert error:', error);
      return ApiResponse.error(res, 'Erreur lors de la mise à jour du suivi');
    }
  }

  /**
   * Lister les experts suivis par l'utilisateur connecté
   */
  static async listFollowing(req, res) {
    try {
      const rows = await prisma.expertFollow.findMany({
        where: { userId: req.user.id },
        include: { expert: { include: { user: { select: { avatar: true } } } } },
        orderBy: { createdAt: 'desc' }
      });
      const experts = rows.map(r => ({ ...r.expert, image: r.expert.user?.avatar }));
      return ApiResponse.success(res, { experts });
    } catch (error) {
      console.error('List following error:', error);
      return ApiResponse.error(res, 'Erreur lors de la récupération des suivis');
    }
  }

  /**
   * Créer un profil expert
   */
  static async createExpert(req, res) {
    try {
      const {
        name,
        specialty,
        hourlyRate,
        pricePerMessage,
        minuteRate,
        videoMessageRate,
        image,
        tags = [],
        category,
        categories,
        languages = [],
        description,
        country
      } = req.body;

      // Validation des champs requis
      if (!name || !specialty || !hourlyRate || !pricePerMessage || !category) {
        return ApiResponse.badRequest(res, 'Tous les champs obligatoires doivent être remplis');
      }

      // Vérifier si l'utilisateur a déjà un profil expert
      const existingExpert = await prisma.expert.findUnique({
        where: { userId: req.user.id }
      });

      if (existingExpert) {
        return ApiResponse.badRequest(res, 'Vous avez déjà un profil expert');
      }

      // Créer le profil expert
      const normalize = (s) => s ? s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase() : s;
      const expert = await prisma.expert.create({
        data: {
          userId: req.user.id,
          name,
          nameNormalized: normalize(name),
          specialty,
          specialtyNormalized: normalize(specialty),
          hourlyRate: parseInt(hourlyRate),
          pricePerMessage: parseInt(pricePerMessage),
          minuteRate: minuteRate !== undefined ? parseInt(minuteRate) : undefined,
          videoMessageRate: videoMessageRate !== undefined ? parseInt(videoMessageRate) : undefined,
          image,
          tags: JSON.stringify(tags),
          category,
          categories: Array.isArray(categories) ? JSON.stringify(categories) : categories,
          languages: JSON.stringify(languages),
          description,
          country
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      // Mettre à jour le type d'utilisateur
      await prisma.user.update({
        where: { id: req.user.id },
        data: { userType: 'expert' }
      });

      return ApiResponse.created(res, expert, 'Profil expert créé avec succès');

    } catch (error) {
      console.error('Create expert error:', error);
      return ApiResponse.error(res, 'Erreur lors de la création du profil expert');
    }
  }

  /**
   * Mettre à jour un profil expert
   */
  static async updateExpert(req, res) {
    try {
      const { id } = req.params;
      const expertId = parseInt(id);

      // Vérifier que l'expert appartient à l'utilisateur connecté
      const expert = await prisma.expert.findUnique({
        where: { id: expertId }
      });

      if (!expert) {
        return ApiResponse.notFound(res, 'Expert non trouvé');
      }

      if (expert.userId !== req.user.id) {
        return ApiResponse.forbidden(res, 'Vous ne pouvez modifier que votre propre profil');
      }

      const {
        name,
        specialty,
        hourlyRate,
        pricePerMessage,
        minuteRate,
        videoMessageRate,
        image,
        tags,
        category,
        categories,
        languages,
        description,
        isOnline,
        nextAvailable,
        country,
        linkedinUrl,
        rnePatente
      } = req.body;

      // Préparer les données à mettre à jour
      const normalize = (s) => s ? s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase() : s;
      const updateData = {};
      
      if (name !== undefined) {
        updateData.name = name;
        updateData.nameNormalized = normalize(name);
      }
      if (specialty !== undefined) {
        updateData.specialty = specialty;
        updateData.specialtyNormalized = normalize(specialty);
      }
      if (hourlyRate !== undefined) updateData.hourlyRate = parseInt(hourlyRate);
      if (pricePerMessage !== undefined) updateData.pricePerMessage = parseInt(pricePerMessage);
      if (minuteRate !== undefined) updateData.minuteRate = parseInt(minuteRate);
      if (videoMessageRate !== undefined) updateData.videoMessageRate = parseInt(videoMessageRate);
      if (image !== undefined) updateData.image = image;
      if (tags !== undefined) updateData.tags = JSON.stringify(tags);
      if (category !== undefined) updateData.category = category;
      if (categories !== undefined) updateData.categories = Array.isArray(categories) ? JSON.stringify(categories) : categories;
      if (languages !== undefined) updateData.languages = JSON.stringify(languages);
      if (description !== undefined) updateData.description = description;
      if (isOnline !== undefined) updateData.isOnline = isOnline;
      if (nextAvailable !== undefined) updateData.nextAvailable = nextAvailable;
      if (country !== undefined) updateData.country = country;
      if (linkedinUrl !== undefined) updateData.linkedinUrl = linkedinUrl;
      if (rnePatente !== undefined) updateData.rnePatente = rnePatente;

      const updatedExpert = await prisma.expert.update({
        where: { id: expertId },
        data: updateData,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      return ApiResponse.success(res, updatedExpert, 'Profil expert mis à jour');

    } catch (error) {
      console.error('Update expert error:', error);
      return ApiResponse.error(res, 'Erreur lors de la mise à jour du profil expert');
    }
  }

  /**
   * Récupérer les catégories d'experts
   */
  static async getCategories(req, res) {
    try {
      const categories = await prisma.expert.findMany({
        select: { category: true },
        distinct: ['category']
      });

      const categoryList = categories.map(c => c.category).filter(Boolean);

      return ApiResponse.success(res, categoryList);

    } catch (error) {
      console.error('Get categories error:', error);
      return ApiResponse.error(res, 'Erreur lors de la récupération des catégories');
    }
  }

  /**
   * Analytique: revenus et créations par mois (6 derniers mois)
   */
  static async getAnalytics(req, res) {
    try {
      const expert = await prisma.expert.findUnique({ where: { userId: req.user.id } });
      if (!expert) return ApiResponse.notFound(res, 'Profil expert non trouvé');

      const now = new Date();
      const startMonths = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1, 0, 0, 0));
        startMonths.push(d);
      }
      const monthLabels = startMonths.map(d => `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}`);
      const monthStart = startMonths[0];
      const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth()+1, 1, 0, 0, 0));

      // IDs des contenus de l'expert
      const [videos, forms] = await Promise.all([
        prisma.video.findMany({ where: { expertId: expert.id }, select: { id: true, createdAt: true } }),
        prisma.formation.findMany({ where: { instructorId: expert.id }, select: { id: true, createdAt: true } })
      ]);
      const videoIds = videos.map(v => v.id);
      const formationIds = forms.map(f => f.id);

      // Transactions liées à ces contenus
      const tx = await prisma.transaction.findMany({
        where: {
          type: 'spend',
          createdAt: { gte: monthStart, lt: nextMonth },
          relatedId: { in: [...videoIds, ...formationIds] }
        },
        select: { amount: true, relatedId: true, createdAt: true }
      });

      const series = {
        revenueVideo: new Array(6).fill(0),
        revenueFormation: new Array(6).fill(0),
        createdVideos: new Array(6).fill(0),
        createdFormations: new Array(6).fill(0)
      };

      const monthIndex = (date) => {
        const y = date.getUTCFullYear();
        const m = date.getUTCMonth();
        const key = `${y}-${String(m+1).padStart(2,'0')}`;
        return monthLabels.indexOf(key);
      };

      videos.forEach(v => {
        const idx = monthIndex(new Date(v.createdAt));
        if (idx >= 0) series.createdVideos[idx] += 1;
      });
      forms.forEach(f => {
        const idx = monthIndex(new Date(f.createdAt));
        if (idx >= 0) series.createdFormations[idx] += 1;
      });

      const videoIdSet = new Set(videoIds);
      const formationIdSet = new Set(formationIds);
      tx.forEach(t => {
        const idx = monthIndex(new Date(t.createdAt));
        if (idx < 0) return;
        const euros = Number(t.amount || 0) / 100;
        if (videoIdSet.has(t.relatedId)) series.revenueVideo[idx] += euros;
        else if (formationIdSet.has(t.relatedId)) series.revenueFormation[idx] += euros;
      });

      return ApiResponse.success(res, { months: monthLabels, ...series });
    } catch (e) {
      console.error('Get analytics error:', e);
      return ApiResponse.error(res, 'Erreur lors de la récupération des analytiques');
    }
  }

  /**
   * Top contenu: vidéos (revenus, vues) et formations (étudiants)
   */
  static async getTopContent(req, res) {
    try {
      const expert = await prisma.expert.findUnique({ where: { userId: req.user.id } });
      if (!expert) return ApiResponse.notFound(res, 'Profil expert non trouvé');

      const [videos, forms] = await Promise.all([
        prisma.video.findMany({ where: { expertId: expert.id }, select: { id: true, title: true, views: true, price: true, type: true } }),
        prisma.formation.findMany({ where: { instructorId: expert.id }, select: { id: true, title: true, students: true } })
      ]);

      // Top vidéos par revenus (achats * prix) pour premium uniquement
      const premium = videos.filter(v => v.type === 'premium');
      let topVideosByRevenue = [];
      if (premium.length > 0) {
        const ids = premium.map(v => v.id);
        const grouped = await prisma.userVideo.groupBy({ by: ['videoId'], where: { videoId: { in: ids } }, _count: { videoId: true } });
        const map = new Map(grouped.map(g => [g.videoId, g._count.videoId]));
        topVideosByRevenue = premium.map(v => ({ id: v.id, title: v.title, revenue: (v.price || 0) * (map.get(v.id) || 0) }))
          .sort((a,b)=> b.revenue - a.revenue)
          .slice(0,5);
      }

      const topVideosByViews = videos
        .map(v => ({ id: v.id, title: v.title, views: v.views || 0 }))
        .sort((a,b)=> (b.views - a.views))
        .slice(0,5);

      const topFormationsByStudents = forms
        .map(f => ({ id: f.id, title: f.title, students: f.students || 0 }))
        .sort((a,b)=> (b.students - a.students))
        .slice(0,5);

      return ApiResponse.success(res, { topVideosByRevenue, topVideosByViews, topFormationsByStudents });
    } catch (e) {
      console.error('Get top content error:', e);
      return ApiResponse.error(res, 'Erreur lors de la récupération du top contenu');
    }
  }

  /**
   * Récupérer la disponibilité de l'expert connecté
   */
  static async getMyAvailability(req, res) {
    try {
      const expert = await prisma.expert.findUnique({
        where: { userId: req.user.id },
        select: { id: true, availableDays: true, availableTimeSlots: true, vacationDays: true, appointmentInterval: true }
      });

      if (!expert) {
        return ApiResponse.notFound(res, 'Profil expert non trouvé');
      }

      const availability = {
        availableDays: expert.availableDays ? JSON.parse(expert.availableDays) : [],
        availableTimeSlots: expert.availableTimeSlots ? JSON.parse(expert.availableTimeSlots) : [],
        vacationDays: expert.vacationDays ? JSON.parse(expert.vacationDays) : [],
        appointmentInterval: expert.appointmentInterval || 30
      };

      return ApiResponse.success(res, availability);
    } catch (error) {
      console.error('Get my availability error:', error);
      return ApiResponse.error(res, 'Erreur lors de la récupération de la disponibilité');
    }
  }

  /**
   * Mettre à jour la disponibilité de l'expert connecté
   */
  static async updateMyAvailability(req, res) {
    try {
      const { availableDays, availableTimeSlots, vacationDays, appointmentInterval } = req.body;

      const expert = await prisma.expert.findUnique({
        where: { userId: req.user.id }
      });

      if (!expert) {
        return ApiResponse.notFound(res, 'Profil expert non trouvé');
      }

      // Valider les jours (0-6 pour dimanche-samedi)
      if (availableDays && !Array.isArray(availableDays)) {
        return ApiResponse.badRequest(res, 'availableDays doit être un tableau');
      }

      // Valider les créneaux horaires
      if (availableTimeSlots && !Array.isArray(availableTimeSlots)) {
        return ApiResponse.badRequest(res, 'availableTimeSlots doit être un tableau');
      }

      // Valider les jours de congé
      if (vacationDays && !Array.isArray(vacationDays)) {
        return ApiResponse.badRequest(res, 'vacationDays doit être un tableau');
      }

      // Valider l'intervalle
      if (appointmentInterval && (typeof appointmentInterval !== 'number' || appointmentInterval < 15)) {
        return ApiResponse.badRequest(res, 'appointmentInterval doit être un nombre >= 15');
      }

      const updateData = {};
      if (availableDays !== undefined) {
        updateData.availableDays = JSON.stringify(availableDays);
      }
      if (availableTimeSlots !== undefined) {
        updateData.availableTimeSlots = JSON.stringify(availableTimeSlots);
      }
      if (vacationDays !== undefined) {
        updateData.vacationDays = JSON.stringify(vacationDays);
      }
      if (appointmentInterval !== undefined) {
        updateData.appointmentInterval = parseInt(appointmentInterval);
      }

      await prisma.expert.update({
        where: { id: expert.id },
        data: updateData
      });

      return ApiResponse.success(res, { availableDays, availableTimeSlots, vacationDays, appointmentInterval }, 'Disponibilité mise à jour');
    } catch (error) {
      console.error('Update my availability error:', error);
      return ApiResponse.error(res, 'Erreur lors de la mise à jour de la disponibilité');
    }
  }

  /**
   * Récupérer la disponibilité d'un expert par ID (endpoint public pour la réservation)
   */
  static async getExpertAvailability(req, res) {
    try {
      const { id } = req.params;

      const expert = await prisma.expert.findUnique({
        where: { id: parseInt(id) },
        select: { id: true, availableDays: true, availableTimeSlots: true, vacationDays: true, appointmentInterval: true }
      });

      if (!expert) {
        return ApiResponse.notFound(res, 'Expert non trouvé');
      }

      // Si pas de disponibilité configurée, retourner des valeurs par défaut
      const defaultDays = [1, 2, 3, 4, 5]; // Lundi à vendredi
      const defaultTimeSlots = [
        { start: '09:00', end: '12:00' },
        { start: '14:00', end: '18:30' }
      ];

      const interval = expert.appointmentInterval || 30;
      const vacationDays = expert.vacationDays ? JSON.parse(expert.vacationDays) : [];

      const availability = {
        availableDays: expert.availableDays ? JSON.parse(expert.availableDays) : defaultDays,
        availableTimeSlots: expert.availableTimeSlots ? JSON.parse(expert.availableTimeSlots) : defaultTimeSlots
      };

      // Générer les créneaux selon l'intervalle configuré
      const timeSlots = [];
      availability.availableTimeSlots.forEach(slot => {
        let [startH, startM] = slot.start.split(':').map(Number);
        const [endH, endM] = slot.end.split(':').map(Number);
        const endMinutes = endH * 60 + endM;

        while (startH * 60 + startM < endMinutes) {
          const time = `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`;
          timeSlots.push(time);
          startM += interval;
          if (startM >= 60) {
            startH += Math.floor(startM / 60);
            startM = startM % 60;
          }
        }
      });

      return ApiResponse.success(res, {
        availableDays: availability.availableDays,
        availableTimeSlots: availability.availableTimeSlots,
        vacationDays: vacationDays,
        appointmentInterval: interval,
        timeSlots: timeSlots.sort()
      });
    } catch (error) {
      console.error('Get expert availability error:', error);
      return ApiResponse.error(res, 'Erreur lors de la récupération de la disponibilité');
    }
  }

  // ==========================================
  // PHASE 2 - VALIDATION KYC
  // ==========================================

  /**
   * PHASE 2 - Récupérer le statut de vérification KYC de l'expert connecté
   * @route GET /api/experts/verification/status
   * @access Private (Expert only)
   */
  static async getMyVerificationStatus(req, res) {
    try {
      const expert = await prisma.expert.findUnique({
        where: { userId: req.user.id },
        select: {
          id: true,
          name: true,
          verified: true,
          verificationStatus: true,
          submittedAt: true,
          reviewedAt: true,
          rejectionReason: true,
          diplomaUrl: true,
          identityDocumentUrl: true
        }
      });

      if (!expert) {
        return ApiResponse.notFound(res, 'Profil expert non trouvé');
      }

      // Déterminer le statut lisible
      const statusMessages = {
        NOT_SUBMITTED: {
          title: 'Vérification non soumise',
          message: 'Vous n\'avez pas encore soumis de demande de vérification. Complétez votre profil et soumettez vos documents pour obtenir le badge vérifié.',
          canResubmit: true
        },
        PENDING: {
          title: 'Vérification en cours',
          message: 'Votre demande de vérification est en cours d\'examen par notre équipe. Vous recevrez une notification dès qu\'une décision sera prise.',
          canResubmit: false
        },
        APPROVED: {
          title: 'Vérification approuvée ✓',
          message: 'Félicitations ! Votre profil est vérifié. Vous bénéficiez du badge vérifié qui renforce votre crédibilité.',
          canResubmit: false
        },
        REJECTED: {
          title: 'Vérification refusée',
          message: expert.rejectionReason || 'Votre demande de vérification a été refusée. Veuillez corriger les informations et soumettre à nouveau.',
          canResubmit: true
        },
        EXPIRED: {
          title: 'Vérification expirée',
          message: 'Votre vérification a expiré. Veuillez soumettre à nouveau vos documents pour renouveler votre badge vérifié.',
          canResubmit: true
        }
      };

      const statusInfo = statusMessages[expert.verificationStatus] || statusMessages.NOT_SUBMITTED;

      return ApiResponse.success(res, {
        expertId: expert.id,
        expertName: expert.name,
        verified: expert.verified,
        verificationStatus: expert.verificationStatus,
        submittedAt: expert.submittedAt,
        reviewedAt: expert.reviewedAt,
        rejectionReason: expert.rejectionReason,
        hasDocuments: !!(expert.diplomaUrl || expert.identityDocumentUrl),
        statusInfo
      });
    } catch (error) {
      console.error('Get verification status error:', error);
      return ApiResponse.error(res, 'Erreur lors de la récupération du statut de vérification');
    }
  }

  /**
   * PHASE 2 - Créer une exception horaire (jour indisponible ou heures personnalisées)
   * @route POST /api/experts/schedule-exception
   * @access Private (Expert only)
   */
  static async createScheduleException(req, res) {
    try {
      const expert = req.expert || (await prisma.expert.findUnique({ where: { userId: req.user.id } }));
      if (!expert) {
        return ApiResponse.forbidden(res, 'Seuls les experts peuvent gérer leurs exceptions horaires');
      }

      const { date, type, customSlots, reason } = req.body;

      // Validation
      if (!date || !type) {
        return ApiResponse.badRequest(res, 'Date et type sont requis');
      }

      if (!['UNAVAILABLE', 'CUSTOM_HOURS'].includes(type)) {
        return ApiResponse.badRequest(res, 'Type invalide. Valeurs acceptées: UNAVAILABLE, CUSTOM_HOURS');
      }

      if (type === 'CUSTOM_HOURS' && !customSlots) {
        return ApiResponse.badRequest(res, 'customSlots est requis pour le type CUSTOM_HOURS');
      }

      if (type === 'CUSTOM_HOURS') {
        if (!Array.isArray(customSlots) || customSlots.length === 0) {
          return ApiResponse.badRequest(res, 'customSlots doit etre une liste non vide');
        }

        const hasInvalidSlot = customSlots.some(slot => {
          return !slot || typeof slot.start !== 'string' || typeof slot.end !== 'string' || slot.start >= slot.end;
        });

        if (hasInvalidSlot) {
          return ApiResponse.badRequest(res, 'Chaque creneau doit contenir start/end valides');
        }
      }

      // Vérifier qu'il n'y a pas déjà une exception pour cette date
      const existing = await prisma.expertScheduleException.findFirst({
        where: {
          expertId: expert.id,
          date: new Date(date)
        }
      });

      if (existing) {
        return ApiResponse.badRequest(res, 'Une exception existe déjà pour cette date');
      }

      // Créer l'exception
      const exception = await prisma.expertScheduleException.create({
        data: {
          expertId: expert.id,
          date: new Date(date),
          type,
          customSlots: type === 'CUSTOM_HOURS' ? JSON.stringify(customSlots) : null,
          reason
        }
      });

      return ApiResponse.created(res, exception, 'Exception horaire créée avec succès');
    } catch (error) {
      console.error('Create schedule exception error:', error);
      return ApiResponse.error(res, 'Erreur lors de la création de l\'exception horaire');
    }
  }

  /**
   * PHASE 2 - Lister les exceptions horaires de l'expert connecté
   * @route GET /api/experts/schedule-exceptions
   * @access Private (Expert only)
   */
  static async listScheduleExceptions(req, res) {
    try {
      const expert = req.expert || (await prisma.expert.findUnique({ where: { userId: req.user.id } }));
      if (!expert) {
        return ApiResponse.forbidden(res, 'Seuls les experts peuvent voir leurs exceptions horaires');
      }

      const { startDate, endDate } = req.query;

      const where = { expertId: expert.id };

      // Filtrer par plage de dates si fournie
      if (startDate || endDate) {
        where.date = {};
        if (startDate) {
          where.date.gte = new Date(startDate);
        }
        if (endDate) {
          where.date.lte = new Date(endDate);
        }
      }

      const exceptions = await prisma.expertScheduleException.findMany({
        where,
        orderBy: { date: 'asc' }
      });

      // Parser les customSlots JSON
      const formatted = exceptions.map(exc => {
        let parsedCustomSlots = null;

        if (exc.customSlots) {
          if (typeof exc.customSlots === 'string') {
            try {
              parsedCustomSlots = JSON.parse(exc.customSlots);
            } catch (parseError) {
              console.warn(`Invalid customSlots JSON for schedule exception ${exc.id}:`, parseError);
            }
          } else {
            parsedCustomSlots = exc.customSlots;
          }
        }

        return {
          ...exc,
          customSlots: parsedCustomSlots
        };
      });

      return ApiResponse.success(res, formatted);
    } catch (error) {
      console.error('List schedule exceptions error:', error);
      return ApiResponse.error(res, 'Erreur lors de la récupération des exceptions horaires');
    }
  }

  /**
   * PHASE 2 - Supprimer une exception horaire
   * @route DELETE /api/experts/schedule-exception/:id
   * @access Private (Expert only)
   */
  static async deleteScheduleException(req, res) {
    try {
      const expert = req.expert || (await prisma.expert.findUnique({ where: { userId: req.user.id } }));
      if (!expert) {
        return ApiResponse.forbidden(res, 'Seuls les experts peuvent supprimer leurs exceptions horaires');
      }

      const exceptionId = parseInt(req.params.id);

      // Vérifier que l'exception existe et appartient à l'expert
      const exception = await prisma.expertScheduleException.findUnique({
        where: { id: exceptionId }
      });

      if (!exception) {
        return ApiResponse.notFound(res, 'Exception horaire non trouvée');
      }

      if (exception.expertId !== expert.id) {
        return ApiResponse.forbidden(res, 'Vous ne pouvez supprimer que vos propres exceptions horaires');
      }

      // Supprimer l'exception
      await prisma.expertScheduleException.delete({
        where: { id: exceptionId }
      });

      return ApiResponse.success(res, null, 'Exception horaire supprimée avec succès');
    } catch (error) {
      console.error('Delete schedule exception error:', error);
      return ApiResponse.error(res, 'Erreur lors de la suppression de l\'exception horaire');
    }
  }
}

module.exports = ExpertController;
