const prisma = require('../../services/database');
const ApiResponse = require('../../utils/response');
const CertificateService = require('../../services/certificateService');

/**
 * PHASE 2 - Contrôleur pour la gestion des inscriptions E-Learning
 */
class EnrollmentController {
  /**
   * PHASE 2 - S'inscrire à un cours
   * @route POST /api/courses/:courseId/enroll
   * @access Private
   */
  static async enroll(req, res) {
    try {
      const { courseId } = req.params;
      const userId = req.user.id;

      // Vérifier que le cours existe et est publié
      const course = await prisma.course.findUnique({
        where: { id: parseInt(courseId) },
        select: {
          id: true,
          title: true,
          status: true,
          price: true,
          priceCoins: true,
          expertId: true,
          expert: {
            select: {
              name: true,
              userId: true
            }
          }
        }
      });

      if (!course) {
        return ApiResponse.notFound(res, 'Cours non trouvé');
      }

      if (course.status !== 'PUBLISHED') {
        return ApiResponse.badRequest(res, 'Ce cours n\'est pas disponible pour l\'inscription');
      }

      // Vérifier que l'utilisateur n'est pas déjà inscrit
      const existing = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId: parseInt(courseId)
          }
        }
      });

      if (existing) {
        return ApiResponse.badRequest(res, 'Vous êtes déjà inscrit à ce cours');
      }

      // Si le cours est payant, vérifier le paiement en coins
      if (course.price || course.priceCoins) {
        // Calculer le prix en coins : utiliser priceCoins, ou convertir le prix TND
        const requiredCoins = course.priceCoins || Math.ceil(parseFloat(course.price || 0) * 2);

        if (requiredCoins > 0) {
          if ((req.user.coins || 0) < requiredCoins) {
            // Solde insuffisant : retourner les infos pour rediriger vers l'achat de coins
            return ApiResponse.success(res, {
              insufficientCoins: true,
              currentBalance: req.user.coins || 0,
              requiredCoins: requiredCoins,
              courseId: course.id,
              courseTitle: course.title
            }, 'Solde de coins insuffisant. Veuillez recharger votre solde.');
          }

          // Transaction : débiter les coins et créer l'inscription
          await prisma.$transaction(async (tx) => {
            // Débiter les coins
            await tx.user.update({
              where: { id: userId },
              data: { coins: { decrement: requiredCoins } }
            });

            // Créer l'inscription
            await tx.enrollment.create({
              data: {
                userId,
                courseId: parseInt(courseId),
                status: 'ACTIVE',
                enrolledAt: new Date()
              }
            });

            // Enregistrer la transaction
            await tx.transaction.create({
              data: {
                userId,
                type: 'spend',
                amount: 0, // Pas de TND, uniquement coins
                coins: requiredCoins,
                description: `Inscription au cours: ${course.title}`,
                relatedId: parseInt(courseId)
              }
            });
          });

          // Émettre une mise à jour des coins au client connecté (temps réel)
          try {
            const io = req.app.get('io');
            const onlineUsers = req.app.get('onlineUsers');
            const sockId = onlineUsers?.get(userId);
            if (io && sockId) {
              io.to(sockId).emit('coinUpdate', { reason: 'courseEnrollment', courseId: parseInt(courseId) });
            }
          } catch (e) {
            console.error('Socket coin update error:', e);
          }

          // Notifier l'expert
          try {
            if (course.expert?.userId) {
              await prisma.notification.create({
                data: {
                  userId: course.expert.userId,
                  title: 'Nouvelle inscription',
                  message: `${req.user.firstName} ${req.user.lastName} s'est inscrit à votre cours "${course.title}"`,
                  type: 'course_enrollment',
                  actionUrl: `/dashboard/courses/${courseId}/students`
                }
              });
            }
          } catch (e) {
            console.error('Notification error:', e);
          }

          return ApiResponse.created(res, null, 'Inscription réussie');
        }
      }

      // Cours gratuit : inscription directe
      const enrollment = await prisma.enrollment.create({
        data: {
          userId,
          courseId: parseInt(courseId),
          status: 'ACTIVE',
          enrolledAt: new Date()
        }
      });

      // Notifier l'expert
      try {
        if (course.expert?.userId) {
          await prisma.notification.create({
            data: {
              userId: course.expert.userId,
              title: 'Nouvelle inscription',
              message: `${req.user.firstName} ${req.user.lastName} s'est inscrit à votre cours gratuit "${course.title}"`,
              type: 'course_enrollment',
              actionUrl: `/dashboard/courses/${courseId}/students`
            }
          });
        }
      } catch (e) {
        console.error('Notification error:', e);
      }

      return ApiResponse.created(res, enrollment, 'Inscription réussie au cours gratuit');
    } catch (error) {
      console.error('Enroll error:', error);
      return ApiResponse.error(res, 'Erreur lors de l\'inscription au cours');
    }
  }

  /**
   * PHASE 2 - Récupérer mes inscriptions
   * @route GET /api/enrollments/my
   * @access Private
   */
  static async getMyEnrollments(req, res) {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where = { userId: req.user.id };
      if (status) {
        where.status = status;
      }

      const [enrollments, total] = await Promise.all([
        prisma.enrollment.findMany({
          where,
          orderBy: { enrolledAt: 'desc' },
          skip,
          take: parseInt(limit),
          include: {
            course: {
              select: {
                id: true,
                title: true,
                description: true,
                thumbnail: true,
                level: true,
                category: true,
                certificateEnabled: true,
                expert: {
                  select: {
                    id: true,
                    name: true,
                    verified: true
                  }
                },
                _count: {
                  select: {
                    modules: true
                  }
                }
              }
            }
          }
        }),
        prisma.enrollment.count({ where })
      ]);

      return ApiResponse.success(res, {
        enrollments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      console.error('Get my enrollments error:', error);
      return ApiResponse.error(res, 'Erreur lors de la récupération de vos inscriptions');
    }
  }

  /**
   * PHASE 2 - Récupérer la progression d'un cours
   * @route GET /api/courses/:courseId/progress
   * @access Private
   */
  static async getProgress(req, res) {
    try {
      const { courseId } = req.params;
      const userId = req.user.id;

      // Vérifier l'inscription
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId: parseInt(courseId)
          }
        },
        include: {
          lessonProgress: {
            include: {
              lesson: {
                select: {
                  id: true,
                  title: true,
                  contentType: true,
                  duration: true,
                  order: true,
                  moduleId: true
                }
              }
            },
            orderBy: {
              lesson: {
                order: 'asc'
              }
            }
          }
        }
      });

      if (!enrollment) {
        return ApiResponse.notFound(res, 'Vous n\'êtes pas inscrit à ce cours');
      }

      // Récupérer la structure complète du cours
      const course = await prisma.course.findUnique({
        where: { id: parseInt(courseId) },
        select: {
          id: true,
          title: true,
          modules: {
            orderBy: { order: 'asc' },
            select: {
              id: true,
              title: true,
              order: true,
              lessons: {
                orderBy: { order: 'asc' },
                select: {
                  id: true,
                  title: true,
                  contentType: true,
                  duration: true,
                  order: true
                }
              }
            }
          }
        }
      });

      // Mapper la progression sur la structure du cours
      const progressMap = new Map();
      enrollment.lessonProgress.forEach(p => {
        progressMap.set(p.lessonId, {
          status: p.status,
          completedAt: p.completedAt
        });
      });

      const modulesWithProgress = course.modules.map(module => ({
        ...module,
        lessons: module.lessons.map(lesson => ({
          ...lesson,
          progress: progressMap.get(lesson.id) || { status: 'NOT_STARTED', completedAt: null }
        }))
      }));

      return ApiResponse.success(res, {
        courseId: course.id,
        courseTitle: course.title,
        enrollmentStatus: enrollment.status,
        overallProgress: enrollment.progress,
        enrolledAt: enrollment.enrolledAt,
        completedAt: enrollment.completedAt,
        modules: modulesWithProgress
      });
    } catch (error) {
      console.error('Get progress error:', error);
      return ApiResponse.error(res, 'Erreur lors de la récupération de la progression');
    }
  }

  /**
   * PHASE 2 - Récupérer les étudiants inscrits à un cours (Expert)
   * @route GET /api/courses/:courseId/students
   * @access Private (Expert only)
   */
  static async getEnrollments(req, res) {
    try {
      const { courseId } = req.params;
      const { status, page = 1, limit = 20 } = req.query;

      const expert = req.expert || (await prisma.expert.findUnique({ where: { userId: req.user.id } }));
      if (!expert) {
        return ApiResponse.forbidden(res, 'Seuls les experts peuvent accéder à cette fonctionnalité');
      }

      // Vérifier que le cours appartient à l'expert
      const course = await prisma.course.findUnique({
        where: { id: parseInt(courseId) },
        select: { expertId: true, title: true }
      });

      if (!course) {
        return ApiResponse.notFound(res, 'Cours non trouvé');
      }

      if (course.expertId !== expert.id) {
        return ApiResponse.forbidden(res, 'Vous ne pouvez voir que les étudiants de vos propres cours');
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const where = { courseId: parseInt(courseId) };
      if (status) {
        where.status = status;
      }

      const [enrollments, total] = await Promise.all([
        prisma.enrollment.findMany({
          where,
          orderBy: { enrolledAt: 'desc' },
          skip,
          take: parseInt(limit),
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true
              }
            }
          }
        }),
        prisma.enrollment.count({ where })
      ]);

      return ApiResponse.success(res, {
        courseTitle: course.title,
        enrollments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      console.error('Get enrollments error:', error);
      return ApiResponse.error(res, 'Erreur lors de la récupération des inscriptions');
    }
  }

  /**
   * PHASE 2 - Générer un certificat de complétion
   * @route POST /api/courses/:courseId/certificate
   * @access Private
   */
  static async generateCertificate(req, res) {
    try {
      const { courseId } = req.params;
      const userId = req.user.id;

      // Vérifier l'inscription
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId: parseInt(courseId)
          }
        },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              certificateEnabled: true,
              expert: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      });

      if (!enrollment) {
        return ApiResponse.notFound(res, 'Vous n\'êtes pas inscrit à ce cours');
      }

      // Vérifier que le cours est complété
      if (enrollment.status !== 'COMPLETED') {
        return ApiResponse.badRequest(res, 'Vous devez terminer le cours pour obtenir le certificat');
      }

      // Vérifier que les certificats sont activés
      if (!enrollment.course.certificateEnabled) {
        return ApiResponse.badRequest(res, 'Ce cours ne délivre pas de certificat');
      }

      // Si certificat déjà généré, le retourner
      if (enrollment.certificateUrl) {
        return ApiResponse.success(res, {
          certificateUrl: enrollment.certificateUrl
        }, 'Certificat déjà généré');
      }

      // Générer le certificat avec le service dédié
      const certificateId = `CERT-${enrollment.id}-${Date.now()}`;

      const certificateUrl = await CertificateService.generateCertificate({
        studentName: `${req.user.firstName} ${req.user.lastName}`,
        courseTitle: enrollment.course.title,
        expertName: enrollment.course.expert.name,
        completedAt: enrollment.completedAt,
        certificateId
      });

      // Mettre à jour l'enrollment avec l'URL du certificat
      const updated = await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: {
          certificateUrl
        }
      });

      return ApiResponse.success(res, {
        certificateUrl: updated.certificateUrl
      }, 'Certificat généré avec succès');
    } catch (error) {
      console.error('Generate certificate error:', error);
      return ApiResponse.error(res, 'Erreur lors de la génération du certificat');
    }
  }

  /**
   * PHASE 2 - Abandonner/Suspendre un cours
   * @route POST /api/courses/:courseId/leave
   * @access Private
   */
  static async leaveCourse(req, res) {
    try {
      const { courseId } = req.params;
      const userId = req.user.id;

      // Vérifier l'inscription
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId: parseInt(courseId)
          }
        }
      });

      if (!enrollment) {
        return ApiResponse.notFound(res, 'Vous n\'êtes pas inscrit à ce cours');
      }

      // Marquer comme abandonné (ne pas supprimer pour garder l'historique)
      const updated = await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: {
          status: 'CANCELLED'
        }
      });

      return ApiResponse.success(res, updated, 'Inscription annulée');
    } catch (error) {
      console.error('Leave course error:', error);
      return ApiResponse.error(res, 'Erreur lors de l\'annulation de l\'inscription');
    }
  }
}

module.exports = EnrollmentController;
