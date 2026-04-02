const prisma = require('../../services/database');
const ApiResponse = require('../../utils/response');

/**
 * PHASE 2 - Contrôleur pour la gestion des modules et leçons E-Learning
 */
class LessonController {
  // ==========================================
  // GESTION DES MODULES
  // ==========================================

  /**
   * PHASE 2 - Ajouter un module à un cours (Expert)
   * @route POST /api/courses/:courseId/modules
   * @access Private (Expert only)
   */
  static async addModule(req, res) {
    try {
      const { courseId } = req.params;
      const { title, description } = req.body;

      if (!title) {
        return ApiResponse.badRequest(res, 'Le titre du module est obligatoire');
      }

      const expert = req.expert || (await prisma.expert.findUnique({ where: { userId: req.user.id } }));
      if (!expert) {
        return ApiResponse.forbidden(res, 'Seuls les experts peuvent ajouter des modules');
      }

      // Vérifier que le cours appartient à l'expert
      const course = await prisma.course.findUnique({
        where: { id: parseInt(courseId) },
        select: { expertId: true }
      });

      if (!course) {
        return ApiResponse.notFound(res, 'Cours non trouvé');
      }

      if (course.expertId !== expert.id) {
        return ApiResponse.forbidden(res, 'Vous ne pouvez ajouter des modules qu\'à vos propres cours');
      }

      // Déterminer l'ordre du nouveau module (dernier)
      const lastModule = await prisma.courseModule.findFirst({
        where: { courseId: parseInt(courseId) },
        orderBy: { order: 'desc' }
      });

      const order = lastModule ? lastModule.order + 1 : 1;

      const module = await prisma.courseModule.create({
        data: {
          title,
          description,
          order,
          courseId: parseInt(courseId)
        },
        include: {
          lessons: {
            orderBy: { order: 'asc' }
          }
        }
      });

      return ApiResponse.created(res, module, 'Module ajouté avec succès');
    } catch (error) {
      console.error('Add module error:', error);
      return ApiResponse.error(res, 'Erreur lors de l\'ajout du module');
    }
  }

  /**
   * PHASE 2 - Mettre à jour un module (Expert)
   * @route PUT /api/modules/:id
   * @access Private (Expert only)
   */
  static async updateModule(req, res) {
    try {
      const { id } = req.params;
      const { title, description, order } = req.body;

      const expert = req.expert || (await prisma.expert.findUnique({ where: { userId: req.user.id } }));
      if (!expert) {
        return ApiResponse.forbidden(res, 'Seuls les experts peuvent modifier des modules');
      }

      // Vérifier que le module existe et appartient à un cours de l'expert
      const module = await prisma.courseModule.findUnique({
        where: { id: parseInt(id) },
        include: {
          course: {
            select: { expertId: true }
          }
        }
      });

      if (!module) {
        return ApiResponse.notFound(res, 'Module non trouvé');
      }

      if (module.course.expertId !== expert.id) {
        return ApiResponse.forbidden(res, 'Vous ne pouvez modifier que les modules de vos propres cours');
      }

      const updateData = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (order !== undefined) updateData.order = parseInt(order);

      const updated = await prisma.courseModule.update({
        where: { id: parseInt(id) },
        data: updateData,
        include: {
          lessons: {
            orderBy: { order: 'asc' }
          }
        }
      });

      return ApiResponse.success(res, updated, 'Module mis à jour avec succès');
    } catch (error) {
      console.error('Update module error:', error);
      return ApiResponse.error(res, 'Erreur lors de la mise à jour du module');
    }
  }

  /**
   * PHASE 2 - Supprimer un module (Expert)
   * @route DELETE /api/modules/:id
   * @access Private (Expert only)
   */
  static async deleteModule(req, res) {
    try {
      const { id } = req.params;

      const expert = req.expert || (await prisma.expert.findUnique({ where: { userId: req.user.id } }));
      if (!expert) {
        return ApiResponse.forbidden(res, 'Seuls les experts peuvent supprimer des modules');
      }

      // Vérifier que le module existe et appartient à un cours de l'expert
      const module = await prisma.courseModule.findUnique({
        where: { id: parseInt(id) },
        include: {
          course: {
            select: { expertId: true }
          }
        }
      });

      if (!module) {
        return ApiResponse.notFound(res, 'Module non trouvé');
      }

      if (module.course.expertId !== expert.id) {
        return ApiResponse.forbidden(res, 'Vous ne pouvez supprimer que les modules de vos propres cours');
      }

      // Suppression cascade : lessons → quizzes
      await prisma.courseModule.delete({
        where: { id: parseInt(id) }
      });

      return ApiResponse.success(res, null, 'Module supprimé avec succès');
    } catch (error) {
      console.error('Delete module error:', error);
      return ApiResponse.error(res, 'Erreur lors de la suppression du module');
    }
  }

  // ==========================================
  // GESTION DES LEÇONS
  // ==========================================

  /**
   * PHASE 2 - Ajouter une leçon à un module (Expert)
   * @route POST /api/modules/:moduleId/lessons
   * @access Private (Expert only)
   */
  static async addLesson(req, res) {
    try {
      const { moduleId } = req.params;
      const {
        title,
        contentType, // VIDEO | TEXT | QUIZ | DOCUMENT
        videoUrl,
        textContent,
        attachments, // JSON [{name, url, type}]
        duration,
        isFree = false
      } = req.body;

      if (!title || !contentType) {
        return ApiResponse.badRequest(res, 'Le titre et le type de contenu sont obligatoires');
      }

      if (!['VIDEO', 'TEXT', 'QUIZ', 'DOCUMENT'].includes(contentType)) {
        return ApiResponse.badRequest(res, 'Type de contenu invalide');
      }

      const expert = req.expert || (await prisma.expert.findUnique({ where: { userId: req.user.id } }));
      if (!expert) {
        return ApiResponse.forbidden(res, 'Seuls les experts peuvent ajouter des leçons');
      }

      // Vérifier que le module appartient à un cours de l'expert
      const module = await prisma.courseModule.findUnique({
        where: { id: parseInt(moduleId) },
        include: {
          course: {
            select: { expertId: true }
          }
        }
      });

      if (!module) {
        return ApiResponse.notFound(res, 'Module non trouvé');
      }

      if (module.course.expertId !== expert.id) {
        return ApiResponse.forbidden(res, 'Vous ne pouvez ajouter des leçons qu\'aux modules de vos propres cours');
      }

      // Déterminer l'ordre de la nouvelle leçon (dernière)
      const lastLesson = await prisma.lesson.findFirst({
        where: { moduleId: parseInt(moduleId) },
        orderBy: { order: 'desc' }
      });

      const order = lastLesson ? lastLesson.order + 1 : 1;

      const lesson = await prisma.lesson.create({
        data: {
          title,
          contentType,
          videoUrl,
          textContent,
          attachments: attachments ? (typeof attachments === 'string' ? attachments : JSON.stringify(attachments)) : null,
          duration: duration ? parseInt(duration) : null,
          isFree,
          order,
          moduleId: parseInt(moduleId)
        }
      });

      return ApiResponse.created(res, lesson, 'Leçon ajoutée avec succès');
    } catch (error) {
      console.error('Add lesson error:', error);
      return ApiResponse.error(res, 'Erreur lors de l\'ajout de la leçon');
    }
  }

  /**
   * PHASE 2 - Récupérer une leçon par ID
   * @route GET /api/lessons/:id
   * @access Private (pour étudiants inscrits ou expert propriétaire)
   */
  static async getLessonById(req, res) {
    try {
      const { id } = req.params;
      const lessonId = parseInt(id);

      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: {
          module: {
            include: {
              course: {
                select: {
                  id: true,
                  title: true,
                  expertId: true
                }
              }
            }
          }
        }
      });

      if (!lesson) {
        return ApiResponse.notFound(res, 'Leçon non trouvée');
      }

      // Vérifier les droits d'accès
      const courseId = lesson.module.course.id;
      const expertId = lesson.module.course.expertId;

      // Si c'est l'expert propriétaire, accès total
      const expert = await prisma.expert.findUnique({ where: { userId: req.user.id } });
      if (expert && expert.id === expertId) {
        return ApiResponse.success(res, lesson);
      }

      // Sinon, vérifier que l'utilisateur est inscrit au cours
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: req.user.id,
            courseId
          }
        }
      });

      // Si leçon gratuite, accessible à tous
      if (lesson.isFree) {
        return ApiResponse.success(res, lesson);
      }

      // Leçon payante : besoin d'inscription
      if (!enrollment) {
        return ApiResponse.forbidden(res, 'Vous devez être inscrit au cours pour accéder à cette leçon');
      }

      // Récupérer la progression de la leçon
      const progress = await prisma.lessonProgress.findUnique({
        where: {
          enrollmentId_lessonId: {
            enrollmentId: enrollment.id,
            lessonId
          }
        }
      });

      return ApiResponse.success(res, {
        ...lesson,
        progress: progress ? {
          status: progress.status,
          completedAt: progress.completedAt
        } : null
      });
    } catch (error) {
      console.error('Get lesson by ID error:', error);
      return ApiResponse.error(res, 'Erreur lors de la récupération de la leçon');
    }
  }

  /**
   * PHASE 2 - Mettre à jour une leçon (Expert)
   * @route PUT /api/lessons/:id
   * @access Private (Expert only)
   */
  static async updateLesson(req, res) {
    try {
      const { id } = req.params;
      const {
        title,
        contentType,
        videoUrl,
        textContent,
        attachments,
        duration,
        isFree,
        order
      } = req.body;

      const expert = req.expert || (await prisma.expert.findUnique({ where: { userId: req.user.id } }));
      if (!expert) {
        return ApiResponse.forbidden(res, 'Seuls les experts peuvent modifier des leçons');
      }

      // Vérifier que la leçon appartient à un cours de l'expert
      const lesson = await prisma.lesson.findUnique({
        where: { id: parseInt(id) },
        include: {
          module: {
            include: {
              course: {
                select: { expertId: true }
              }
            }
          }
        }
      });

      if (!lesson) {
        return ApiResponse.notFound(res, 'Leçon non trouvée');
      }

      if (lesson.module.course.expertId !== expert.id) {
        return ApiResponse.forbidden(res, 'Vous ne pouvez modifier que les leçons de vos propres cours');
      }

      const updateData = {};
      if (title !== undefined) updateData.title = title;
      if (contentType !== undefined) updateData.contentType = contentType;
      if (videoUrl !== undefined) updateData.videoUrl = videoUrl;
      if (textContent !== undefined) updateData.textContent = textContent;
      if (attachments !== undefined) updateData.attachments = attachments ? (typeof attachments === 'string' ? attachments : JSON.stringify(attachments)) : null;
      if (duration !== undefined) updateData.duration = duration ? parseInt(duration) : null;
      if (isFree !== undefined) updateData.isFree = isFree;
      if (order !== undefined) updateData.order = parseInt(order);

      const updated = await prisma.lesson.update({
        where: { id: parseInt(id) },
        data: updateData
      });

      return ApiResponse.success(res, updated, 'Leçon mise à jour avec succès');
    } catch (error) {
      console.error('Update lesson error:', error);
      return ApiResponse.error(res, 'Erreur lors de la mise à jour de la leçon');
    }
  }

  /**
   * PHASE 2 - Supprimer une leçon (Expert)
   * @route DELETE /api/lessons/:id
   * @access Private (Expert only)
   */
  static async deleteLesson(req, res) {
    try {
      const { id } = req.params;

      const expert = req.expert || (await prisma.expert.findUnique({ where: { userId: req.user.id } }));
      if (!expert) {
        return ApiResponse.forbidden(res, 'Seuls les experts peuvent supprimer des leçons');
      }

      // Vérifier que la leçon appartient à un cours de l'expert
      const lesson = await prisma.lesson.findUnique({
        where: { id: parseInt(id) },
        include: {
          module: {
            include: {
              course: {
                select: { expertId: true }
              }
            }
          }
        }
      });

      if (!lesson) {
        return ApiResponse.notFound(res, 'Leçon non trouvée');
      }

      if (lesson.module.course.expertId !== expert.id) {
        return ApiResponse.forbidden(res, 'Vous ne pouvez supprimer que les leçons de vos propres cours');
      }

      // Suppression cascade : quizzes, lessonProgress
      await prisma.lesson.delete({
        where: { id: parseInt(id) }
      });

      return ApiResponse.success(res, null, 'Leçon supprimée avec succès');
    } catch (error) {
      console.error('Delete lesson error:', error);
      return ApiResponse.error(res, 'Erreur lors de la suppression de la leçon');
    }
  }

  /**
   * PHASE 2 - Marquer une leçon comme complétée (Étudiant)
   * @route POST /api/lessons/:id/complete
   * @access Private
   */
  static async markComplete(req, res) {
    try {
      const { id } = req.params;
      const lessonId = parseInt(id);

      // Récupérer la leçon avec son cours
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: {
          module: {
            select: {
              courseId: true,
              course: {
                select: {
                  id: true
                }
              }
            }
          }
        }
      });

      if (!lesson) {
        return ApiResponse.notFound(res, 'Leçon non trouvée');
      }

      const courseId = lesson.module.courseId;

      // Vérifier que l'utilisateur est inscrit au cours
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: req.user.id,
            courseId
          }
        }
      });

      if (!enrollment) {
        return ApiResponse.forbidden(res, 'Vous devez être inscrit au cours pour marquer cette leçon comme complétée');
      }

      // Créer ou mettre à jour la progression
      const progress = await prisma.lessonProgress.upsert({
        where: {
          enrollmentId_lessonId: {
            enrollmentId: enrollment.id,
            lessonId
          }
        },
        update: {
          status: 'COMPLETED',
          completedAt: new Date()
        },
        create: {
          enrollmentId: enrollment.id,
          lessonId,
          status: 'COMPLETED',
          completedAt: new Date()
        }
      });

      // Recalculer la progression globale du cours
      const totalLessons = await prisma.lesson.count({
        where: {
          module: {
            courseId
          }
        }
      });

      const completedLessons = await prisma.lessonProgress.count({
        where: {
          enrollmentId: enrollment.id,
          status: 'COMPLETED'
        }
      });

      const progressPercentage = totalLessons > 0
        ? ((completedLessons / totalLessons) * 100).toFixed(2)
        : 0;

      // Mettre à jour la progression de l'enrollment
      const updatedEnrollment = await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: {
          progress: parseFloat(progressPercentage),
          // Si progression = 100%, marquer comme COMPLETED
          status: parseFloat(progressPercentage) >= 100 ? 'COMPLETED' : 'ACTIVE',
          completedAt: parseFloat(progressPercentage) >= 100 ? new Date() : null
        }
      });

      return ApiResponse.success(res, {
        lessonProgress: progress,
        courseProgress: updatedEnrollment.progress,
        courseStatus: updatedEnrollment.status
      }, 'Leçon marquée comme complétée');
    } catch (error) {
      console.error('Mark complete error:', error);
      return ApiResponse.error(res, 'Erreur lors de la complétion de la leçon');
    }
  }

  /**
   * PHASE 2 - Soumettre un quiz et obtenir le score
   * @route POST /api/lessons/:id/quiz-submit
   * @access Private
   */
  static async submitQuiz(req, res) {
    try {
      const lessonId = parseInt(req.params.id);
      const { answers } = req.body; // { questionId: answer }
      const userId = req.user.id;

      if (!answers || typeof answers !== 'object') {
        return ApiResponse.badRequest(res, 'Les réponses au quiz sont requises');
      }

      // Récupérer la leçon avec son contenu quiz
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: {
          module: {
            include: {
              course: {
                select: { id: true }
              }
            }
          }
        }
      });

      if (!lesson) {
        return ApiResponse.notFound(res, 'Leçon non trouvée');
      }

      if (lesson.contentType !== 'QUIZ') {
        return ApiResponse.badRequest(res, 'Cette leçon n\'est pas un quiz');
      }

      // Vérifier que l'utilisateur est inscrit au cours
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          userId,
          courseId: lesson.module.course.id,
          status: { in: ['ACTIVE', 'COMPLETED'] }
        }
      });

      if (!enrollment) {
        return ApiResponse.forbidden(res, 'Vous devez être inscrit au cours pour soumettre ce quiz');
      }

      // Parser le contenu du quiz (JSON)
      let quizData;
      try {
        quizData = typeof lesson.textContent === 'string'
          ? JSON.parse(lesson.textContent)
          : lesson.textContent;
      } catch (error) {
        return ApiResponse.error(res, 'Format du quiz invalide');
      }

      if (!quizData || !quizData.questions || !Array.isArray(quizData.questions)) {
        return ApiResponse.error(res, 'Format du quiz invalide');
      }

      // Calculer le score
      let correctAnswers = 0;
      const totalQuestions = quizData.questions.length;
      const results = [];

      quizData.questions.forEach((question, index) => {
        const userAnswer = answers[question.id || index];
        const correctAnswer = question.correctAnswer;
        const isCorrect = userAnswer === correctAnswer;

        if (isCorrect) correctAnswers++;

        results.push({
          questionId: question.id || index,
          question: question.question,
          userAnswer,
          correctAnswer,
          isCorrect,
          explanation: question.explanation || null
        });
      });

      const score = Math.round((correctAnswers / totalQuestions) * 100);

      // Mettre à jour ou créer le progress
      const existingProgress = await prisma.lessonProgress.findFirst({
        where: {
          enrollmentId: enrollment.id,
          lessonId
        }
      });

      const progressData = {
        status: score >= (quizData.passingScore || 70) ? 'COMPLETED' : 'IN_PROGRESS',
        quizScore: score,
        completedAt: score >= (quizData.passingScore || 70) ? new Date() : null
      };

      let progress;
      if (existingProgress) {
        // Ne mettre à jour que si le nouveau score est meilleur
        if (score > (existingProgress.quizScore || 0)) {
          progress = await prisma.lessonProgress.update({
            where: { id: existingProgress.id },
            data: progressData
          });
        } else {
          progress = existingProgress;
        }
      } else {
        progress = await prisma.lessonProgress.create({
          data: {
            enrollmentId: enrollment.id,
            lessonId,
            ...progressData
          }
        });
      }

      return ApiResponse.success(res, {
        score,
        correctAnswers,
        totalQuestions,
        passed: score >= (quizData.passingScore || 70),
        passingScore: quizData.passingScore || 70,
        results,
        progress
      }, 'Quiz soumis avec succès');
    } catch (error) {
      console.error('Submit quiz error:', error);
      return ApiResponse.error(res, 'Erreur lors de la soumission du quiz');
    }
  }
}

module.exports = LessonController;
