const prisma = require('../../services/database');
const ApiResponse = require('../../utils/response');
const fs = require('fs');
const path = require('path');

/**
 * PHASE 2 - Contrôleur pour la gestion des cours E-Learning
 */
class CourseController {
  static getBackendBaseUrl(req) {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL;
    if (apiBase) {
      return String(apiBase).replace(/\/api\/?$/, '');
    }

    const forwardedProto = req.headers['x-forwarded-proto'];
    const protocol = forwardedProto ? String(forwardedProto).split(',')[0] : req.protocol;
    return `${protocol}://${req.get('host')}`;
  }

  static resolveExpertProfilePicture(req, expert) {
    const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(expert?.name || 'Expert')}&size=200&background=3B82F6&color=ffffff`;
    if (!expert) return fallback;

    const backendBase = CourseController.getBackendBaseUrl(req);
    const rawAvatar = expert.user?.avatar;

    const toAbsoluteUrl = (raw) => {
      const normalized = String(raw || '').replace(/\\/g, '/');
      if (!normalized) return '';
      if (/^(https?:)?\/\//i.test(normalized) || normalized.startsWith('data:')) return normalized;
      return normalized.startsWith('/') ? `${backendBase}${normalized}` : `${backendBase}/${normalized}`;
    };

    if (rawAvatar) {
      const normalized = String(rawAvatar).replace(/\\/g, '/');
      if (/^(https?:)?\/\//i.test(normalized) || normalized.startsWith('data:')) {
        return normalized;
      }

      const publicDir = path.join(__dirname, '..', '..', '..', 'public');
      const relativePath = normalized.replace(/^\/+/, '');
      const filePath = path.join(publicDir, relativePath);
      if (fs.existsSync(filePath)) {
        return toAbsoluteUrl(normalized);
      }
    }

    if (expert.id) {
      const expertsDir = path.join(__dirname, '..', '..', '..', 'public', 'images', 'experts');
      for (const ext of ['jpg', 'jpeg', 'png', 'webp']) {
        const candidate = path.join(expertsDir, `${expert.id}.${ext}`);
        if (fs.existsSync(candidate)) {
          return `${backendBase}/images/experts/${expert.id}.${ext}`;
        }
      }
    }

    return fallback;
  }

  /**
   * PHASE 2 - Récupérer tous les cours (catalogue public)
   * @route GET /api/courses
   * @access Public (optionalAuth)
   */
  static async getAllCourses(req, res) {
    try {
      const {
        category,
        level, // BEGINNER | INTERMEDIATE | ADVANCED
        status = 'PUBLISHED', // DRAFT | PUBLISHED | ARCHIVED
        expertId,
        search,
        sortBy = 'createdAt',
        order = 'desc',
        page = 1,
        limit = 20
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const where = {};

      // Par défaut, ne montrer que les cours publiés (sauf si filtre status explicite)
      if (status) {
        where.status = status;
      }

      if (category && category !== 'all') {
        where.category = category;
      }

      if (level) {
        where.level = level;
      }

      if (expertId) {
        where.expertId = parseInt(expertId);
      }

      if (search) {
        const term = String(search || '').trim();

        where.OR = [
          { title: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } }
        ];
      }

      const orderByField = sortBy === 'price' ? 'price' : 'createdAt';
      const orderBy = { [orderByField]: order };

      const [courses, total] = await Promise.all([
        prisma.course.findMany({
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
                modules: true,
                enrollments: true
              }
            }
          }
        }),
        prisma.course.count({ where })
      ]);

      // Si utilisateur connecté, vérifier les cours auxquels il est inscrit
      let enrolledSet = new Set();
      if (req.user && courses.length > 0) {
        const courseIds = courses.map(c => c.id);
        const enrollments = await prisma.enrollment.findMany({
          where: {
            userId: req.user.id,
            courseId: { in: courseIds }
          },
          select: { courseId: true }
        });
        enrolledSet = new Set(enrollments.map(e => e.courseId));
      }

      const formattedCourses = courses.map(course => ({
        ...course,
        expert: course.expert
          ? {
              id: course.expert.id,
              name: course.expert.name,
              verified: course.expert.verified,
              category: course.expert.category,
              profilePicture: CourseController.resolveExpertProfilePicture(req, course.expert)
            }
          : null,
        isEnrolled: enrolledSet.has(course.id),
        modulesCount: course._count.modules,
        enrollmentsCount: course._count.enrollments,
        _count: undefined
      }));

      return ApiResponse.success(res, {
        courses: formattedCourses,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      console.error('Get all courses error:', error);
      return ApiResponse.error(res, 'Erreur lors de la récupération des cours');
    }
  }

  /**
   * PHASE 2 - Récupérer un cours par ID avec ses modules
   * @route GET /api/courses/:id
   * @access Public (optionalAuth)
   */
  static async getCourseById(req, res) {
    try {
      const { id } = req.params;
      const courseId = parseInt(id);

      const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
          expert: {
            select: {
              id: true,
              name: true,
              verified: true,
              category: true,
              description: true,
              user: {
                select: {
                  avatar: true
                }
              }
            }
          },
          modules: {
            orderBy: { order: 'asc' },
            include: {
              lessons: {
                orderBy: { order: 'asc' },
                select: {
                  id: true,
                  title: true,
                  duration: true,
                  contentType: true,
                  order: true,
                  isFree: true
                }
              }
            }
          },
          _count: {
            select: {
              enrollments: true
            }
          }
        }
      });

      if (!course) {
        return ApiResponse.notFound(res, 'Cours non trouvé');
      }

      // Si utilisateur connecté, récupérer son inscription et sa progression
      let enrollment = null;
      let progress = 0;

      if (req.user) {
        enrollment = await prisma.enrollment.findUnique({
          where: {
            userId_courseId: {
              userId: req.user.id,
              courseId
            }
          },
          include: {
            lessonProgress: {
              select: {
                lessonId: true,
                status: true,
                completedAt: true
              }
            }
          }
        });

        if (enrollment) {
          progress = parseFloat(enrollment.progress || 0);
        }
      }

      const formatted = {
        ...course,
        expert: course.expert
          ? {
              id: course.expert.id,
              name: course.expert.name,
              verified: course.expert.verified,
              category: course.expert.category,
              bio: course.expert.description,
              profilePicture: CourseController.resolveExpertProfilePicture(req, course.expert)
            }
          : null,
        isEnrolled: !!enrollment,
        enrollmentStatus: enrollment?.status || null,
        progress,
        enrollmentsCount: course._count.enrollments,
        _count: undefined,
        // Masquer le contenu des leçons payantes si pas inscrit
        modules: course.modules.map(module => ({
          ...module,
          lessons: module.lessons.map(lesson => {
            if (lesson.isFree || enrollment) {
              return lesson;
            } else {
              // Leçon payante et pas inscrit : masquer les détails
              return {
                id: lesson.id,
                title: lesson.title,
                duration: lesson.duration,
                contentType: lesson.contentType,
                order: lesson.order,
                isFree: false,
                locked: true
              };
            }
          })
        }))
      };

      return ApiResponse.success(res, formatted);
    } catch (error) {
      console.error('Get course by ID error:', error);
      return ApiResponse.error(res, 'Erreur lors de la récupération du cours');
    }
  }

  /**
   * PHASE 2 - Créer un cours (Expert)
   * @route POST /api/courses
   * @access Private (Expert only)
   */
  static async createCourse(req, res) {
    try {
      const expert = req.expert || (await prisma.expert.findUnique({ where: { userId: req.user.id } }));
      if (!expert) {
        return ApiResponse.forbidden(res, 'Seuls les experts peuvent créer des cours');
      }

      const {
        title,
        description,
        category,
        level: rawLevel = 'BEGINNER',
        price,
        priceCoins,
        thumbnail,
        status: rawStatus = 'DRAFT',
        isPublished,
        certificateEnabled = true
      } = req.body;

      // Validation
      if (!title || !description || !category) {
        return ApiResponse.badRequest(res, 'Champs obligatoires manquants (title, description, category)');
      }

      const normalizeToken = (value) =>
        String(value || '')
          .trim()
          .normalize('NFD')
          .replace(/\p{Diacritic}/gu, '')
          .toUpperCase();

      const levelMap = {
        BEGINNER: 'BEGINNER',
        DEBUTANT: 'BEGINNER',
        INTERMEDIATE: 'INTERMEDIATE',
        INTERMEDIAIRE: 'INTERMEDIATE',
        ADVANCED: 'ADVANCED',
        AVANCE: 'ADVANCED'
      };

      const level = levelMap[normalizeToken(rawLevel)];
      if (!level) {
        return ApiResponse.badRequest(res, 'Le niveau doit être BEGINNER, INTERMEDIATE ou ADVANCED');
      }

      const status = typeof isPublished === 'boolean'
        ? (isPublished ? 'PUBLISHED' : 'DRAFT')
        : normalizeToken(rawStatus);

      if (!['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(status)) {
        return ApiResponse.badRequest(res, 'Le status doit être DRAFT, PUBLISHED ou ARCHIVED');
      }

      const hasPrice = price !== undefined && price !== null && price !== '';
      const hasPriceCoins = priceCoins !== undefined && priceCoins !== null && priceCoins !== '';

      // Le schéma actuel requiert `price` (non-null)
      if (!hasPrice) {
        return ApiResponse.badRequest(res, 'Le prix en TND est requis');
      }

      if (!hasPrice && !hasPriceCoins) {
        return ApiResponse.badRequest(res, 'Vous devez définir un prix en TND ou en coins');
      }

      const parsedPrice = parseFloat(price);
      if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
        return ApiResponse.badRequest(res, 'Le prix TND est invalide');
      }

      const parsedPriceCoins = hasPriceCoins ? parseInt(priceCoins, 10) : null;
      if (hasPriceCoins && (Number.isNaN(parsedPriceCoins) || parsedPriceCoins < 0)) {
        return ApiResponse.badRequest(res, 'Le prix en coins est invalide');
      }

      const course = await prisma.course.create({
        data: {
          title,
          description,
          category,
          level,
          price: parsedPrice,
          priceCoins: parsedPriceCoins,
          thumbnail,
          status,
          certificateEnabled,
          expertId: expert.id
        },
        include: {
          expert: {
            select: {
              id: true,
              name: true,
              verified: true
            }
          }
        }
      });

      return ApiResponse.created(res, course, 'Cours créé avec succès');
    } catch (error) {
      console.error('Create course error:', error);
      return ApiResponse.error(res, 'Erreur lors de la création du cours');
    }
  }

  /**
   * PHASE 2 - Mettre à jour un cours (Expert)
   * @route PUT /api/courses/:id
   * @access Private (Expert only)
   */
  static async updateCourse(req, res) {
    try {
      const { id } = req.params;
      const courseId = parseInt(id);

      const expert = req.expert || (await prisma.expert.findUnique({ where: { userId: req.user.id } }));
      if (!expert) {
        return ApiResponse.forbidden(res, 'Seuls les experts peuvent modifier des cours');
      }

      // Vérifier que le cours appartient à l'expert
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { expertId: true }
      });

      if (!course) {
        return ApiResponse.notFound(res, 'Cours non trouvé');
      }

      if (course.expertId !== expert.id) {
        return ApiResponse.forbidden(res, 'Vous ne pouvez modifier que vos propres cours');
      }

      const {
        title,
        description,
        category,
        level: rawLevel,
        price,
        priceCoins,
        thumbnail,
        status,
        certificateEnabled
      } = req.body;

      const updateData = {};
      if (title !== undefined) {
        updateData.title = title;
      }
      if (description !== undefined) {
        updateData.description = description;
      }
      if (category !== undefined) updateData.category = category;

      if (rawLevel !== undefined) {
        const normalizedLevel = String(rawLevel || '')
          .trim()
          .normalize('NFD')
          .replace(/\p{Diacritic}/gu, '')
          .toUpperCase();

        const levelMap = {
          BEGINNER: 'BEGINNER',
          DEBUTANT: 'BEGINNER',
          INTERMEDIATE: 'INTERMEDIATE',
          INTERMEDIAIRE: 'INTERMEDIATE',
          ADVANCED: 'ADVANCED',
          AVANCE: 'ADVANCED'
        };

        if (!levelMap[normalizedLevel]) {
          return ApiResponse.badRequest(res, 'Le niveau doit être BEGINNER, INTERMEDIATE ou ADVANCED');
        }
        updateData.level = levelMap[normalizedLevel];
      }

      if (price !== undefined) {
        const hasPriceValue = price !== null && price !== '';
        if (!hasPriceValue) {
          return ApiResponse.badRequest(res, 'Le prix TND ne peut pas etre vide');
        }

        const parsedPrice = parseFloat(price);
        if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
          return ApiResponse.badRequest(res, 'Le prix TND est invalide');
        }
        updateData.price = parsedPrice;
      }

      if (priceCoins !== undefined) {
        const hasPriceCoinsValue = priceCoins !== null && priceCoins !== '';
        if (!hasPriceCoinsValue) {
          updateData.priceCoins = null;
        } else {
          const parsedPriceCoins = parseInt(priceCoins, 10);
          if (Number.isNaN(parsedPriceCoins) || parsedPriceCoins < 0) {
            return ApiResponse.badRequest(res, 'Le prix en coins est invalide');
          }
          updateData.priceCoins = parsedPriceCoins;
        }
      }

      if (thumbnail !== undefined) updateData.thumbnail = thumbnail;
      if (status !== undefined) {
        const normalizedStatus = String(status || '')
          .trim()
          .normalize('NFD')
          .replace(/\p{Diacritic}/gu, '')
          .toUpperCase();

        if (!['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(normalizedStatus)) {
          return ApiResponse.badRequest(res, 'Le status doit etre DRAFT, PUBLISHED ou ARCHIVED');
        }
        updateData.status = normalizedStatus;
      }
      if (certificateEnabled !== undefined) updateData.certificateEnabled = certificateEnabled;

      const updated = await prisma.course.update({
        where: { id: courseId },
        data: updateData,
        include: {
          expert: {
            select: {
              id: true,
              name: true,
              verified: true
            }
          },
          _count: {
            select: {
              modules: true,
              enrollments: true
            }
          }
        }
      });

      return ApiResponse.success(res, updated, 'Cours mis à jour avec succès');
    } catch (error) {
      console.error('Update course error:', error);
      return ApiResponse.error(res, 'Erreur lors de la mise à jour du cours');
    }
  }

  /**
   * PHASE 2 - Supprimer un cours (Expert)
   * @route DELETE /api/courses/:id
   * @access Private (Expert only)
   */
  static async deleteCourse(req, res) {
    try {
      const { id } = req.params;
      const courseId = parseInt(id);

      const expert = req.expert || (await prisma.expert.findUnique({ where: { userId: req.user.id } }));
      if (!expert) {
        return ApiResponse.forbidden(res, 'Seuls les experts peuvent supprimer des cours');
      }

      // Vérifier que le cours appartient à l'expert
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { expertId: true },
        include: {
          _count: {
            select: { enrollments: true }
          }
        }
      });

      if (!course) {
        return ApiResponse.notFound(res, 'Cours non trouvé');
      }

      if (course.expertId !== expert.id) {
        return ApiResponse.forbidden(res, 'Vous ne pouvez supprimer que vos propres cours');
      }

      // Empêcher la suppression si des étudiants sont inscrits
      if (course._count.enrollments > 0) {
        return ApiResponse.badRequest(
          res,
          'Impossible de supprimer un cours avec des étudiants inscrits. Archivez-le plutôt.'
        );
      }

      // Suppression cascade : modules → lessons → quizzes
      await prisma.course.delete({
        where: { id: courseId }
      });

      return ApiResponse.success(res, null, 'Cours supprimé avec succès');
    } catch (error) {
      console.error('Delete course error:', error);
      return ApiResponse.error(res, 'Erreur lors de la suppression du cours');
    }
  }

  /**
   * PHASE 2 - Récupérer les cours de l'expert connecté
   * @route GET /api/courses/my
   * @access Private (Expert only)
   */
  static async getMyCourses(req, res) {
    try {
      const expert = req.expert || (await prisma.expert.findUnique({ where: { userId: req.user.id } }));
      if (!expert) {
        return ApiResponse.forbidden(res, 'Seuls les experts peuvent accéder à leurs cours');
      }

      const { status, page = 1, limit = 20 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where = { expertId: expert.id };
      if (status) {
        where.status = status;
      }

      const [courses, total] = await Promise.all([
        prisma.course.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(limit),
          include: {
            expert: {
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
                modules: true,
                enrollments: true
              }
            }
          }
        }),
        prisma.course.count({ where })
      ]);

      const formattedCourses = courses.map(course => ({
        ...course,
        expert: course.expert
          ? {
              id: course.expert.id,
              name: course.expert.name,
              verified: course.expert.verified,
              profilePicture: CourseController.resolveExpertProfilePicture(req, course.expert)
            }
          : null
      }));

      return ApiResponse.success(res, {
        courses: formattedCourses,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      console.error('Get my courses error:', error);
      return ApiResponse.error(res, 'Erreur lors de la récupération de vos cours');
    }
  }

  /**
   * PHASE 2 - Récupérer les statistiques d'un cours (Expert)
   * @route GET /api/courses/:id/stats
   * @access Private (Expert only)
   */
  static async getCourseStats(req, res) {
    try {
      const { id } = req.params;
      const courseId = parseInt(id);

      const expert = req.expert || (await prisma.expert.findUnique({ where: { userId: req.user.id } }));
      if (!expert) {
        return ApiResponse.forbidden(res, 'Seuls les experts peuvent accéder aux statistiques');
      }

      // Vérifier que le cours appartient à l'expert
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { expertId: true, title: true }
      });

      if (!course) {
        return ApiResponse.notFound(res, 'Cours non trouvé');
      }

      if (course.expertId !== expert.id) {
        return ApiResponse.forbidden(res, 'Vous ne pouvez voir que les statistiques de vos propres cours');
      }

      // Statistiques
      const [totalEnrollments, activeEnrollments, completedEnrollments, avgProgress] = await Promise.all([
        // Total inscriptions
        prisma.enrollment.count({ where: { courseId } }),
        // Inscriptions actives
        prisma.enrollment.count({ where: { courseId, status: 'ACTIVE' } }),
        // Inscriptions complétées
        prisma.enrollment.count({ where: { courseId, status: 'COMPLETED' } }),
        // Progression moyenne
        prisma.enrollment.aggregate({
          where: { courseId },
          _avg: { progress: true }
        })
      ]);

      // Évolution des inscriptions (30 derniers jours)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const enrollmentsByDay = await prisma.enrollment.groupBy({
        by: ['enrolledAt'],
        where: {
          courseId,
          enrolledAt: { gte: thirtyDaysAgo }
        },
        _count: true
      });

      return ApiResponse.success(res, {
        courseTitle: course.title,
        stats: {
          totalEnrollments,
          activeEnrollments,
          completedEnrollments,
          averageProgress: avgProgress._avg.progress || 0,
          completionRate: totalEnrollments > 0
            ? ((completedEnrollments / totalEnrollments) * 100).toFixed(2)
            : 0
        },
        enrollmentsByDay
      });
    } catch (error) {
      console.error('Get course stats error:', error);
      return ApiResponse.error(res, 'Erreur lors de la récupération des statistiques');
    }
  }
}

module.exports = CourseController;
