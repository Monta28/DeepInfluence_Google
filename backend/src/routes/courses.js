const express = require('express');
const CourseController = require('../controllers/elearning/courseController');
const LessonController = require('../controllers/elearning/lessonController');
const EnrollmentController = require('../controllers/elearning/enrollmentController');
const { verifyToken, optionalAuth, requireExpert } = require('../middleware/auth');

const router = express.Router();

/**
 * PHASE 2 - Routes pour le module E-Learning
 */

// ==========================================
// ROUTES COURS (COURSE)
// ==========================================

/**
 * @route GET /api/courses
 * @desc Récupérer tous les cours (catalogue public)
 * @access Public (optionalAuth)
 */
router.get('/', optionalAuth, CourseController.getAllCourses);

/**
 * @route GET /api/courses/my
 * @desc Récupérer les cours de l'expert connecté
 * @access Private (Expert only)
 */
router.get('/my', verifyToken, requireExpert, CourseController.getMyCourses);

/**
 * @route GET /api/courses/:id
 * @desc Récupérer un cours par ID avec ses modules
 * @access Public (optionalAuth)
 */
router.get('/:id', optionalAuth, CourseController.getCourseById);

/**
 * @route POST /api/courses
 * @desc Créer un cours (Expert)
 * @access Private (Expert only)
 */
router.post('/', verifyToken, requireExpert, CourseController.createCourse);

/**
 * @route PUT /api/courses/:id
 * @desc Mettre à jour un cours (Expert)
 * @access Private (Expert only)
 */
router.put('/:id', verifyToken, requireExpert, CourseController.updateCourse);

/**
 * @route DELETE /api/courses/:id
 * @desc Supprimer un cours (Expert)
 * @access Private (Expert only)
 */
router.delete('/:id', verifyToken, requireExpert, CourseController.deleteCourse);

/**
 * @route GET /api/courses/:id/stats
 * @desc Récupérer les statistiques d'un cours (Expert)
 * @access Private (Expert only)
 */
router.get('/:id/stats', verifyToken, requireExpert, CourseController.getCourseStats);

// ==========================================
// ROUTES MODULES
// ==========================================

/**
 * @route POST /api/courses/:courseId/modules
 * @desc Ajouter un module à un cours (Expert)
 * @access Private (Expert only)
 */
router.post('/:courseId/modules', verifyToken, requireExpert, LessonController.addModule);

/**
 * @route PUT /api/modules/:id
 * @desc Mettre à jour un module (Expert)
 * @access Private (Expert only)
 */
router.put('/modules/:id', verifyToken, requireExpert, LessonController.updateModule);

/**
 * @route DELETE /api/modules/:id
 * @desc Supprimer un module (Expert)
 * @access Private (Expert only)
 */
router.delete('/modules/:id', verifyToken, requireExpert, LessonController.deleteModule);

// ==========================================
// ROUTES LEÇONS (LESSONS)
// ==========================================

/**
 * @route POST /api/modules/:moduleId/lessons
 * @desc Ajouter une leçon à un module (Expert)
 * @access Private (Expert only)
 */
router.post('/modules/:moduleId/lessons', verifyToken, requireExpert, LessonController.addLesson);

/**
 * @route GET /api/lessons/:id
 * @desc Récupérer une leçon par ID
 * @access Private
 */
router.get('/lessons/:id', verifyToken, LessonController.getLessonById);

/**
 * @route PUT /api/lessons/:id
 * @desc Mettre à jour une leçon (Expert)
 * @access Private (Expert only)
 */
router.put('/lessons/:id', verifyToken, requireExpert, LessonController.updateLesson);

/**
 * @route DELETE /api/lessons/:id
 * @desc Supprimer une leçon (Expert)
 * @access Private (Expert only)
 */
router.delete('/lessons/:id', verifyToken, requireExpert, LessonController.deleteLesson);

/**
 * @route POST /api/lessons/:id/complete
 * @desc Marquer une leçon comme complétée (Étudiant)
 * @access Private
 */
router.post('/lessons/:id/complete', verifyToken, LessonController.markComplete);

/**
 * @route POST /api/lessons/:id/quiz-submit
 * @desc Soumettre un quiz et obtenir le score
 * @access Private
 */
router.post('/lessons/:id/quiz-submit', verifyToken, LessonController.submitQuiz);

// ==========================================
// ROUTES INSCRIPTIONS (ENROLLMENTS)
// ==========================================

/**
 * @route POST /api/courses/:courseId/enroll
 * @desc S'inscrire à un cours
 * @access Private
 */
router.post('/:courseId/enroll', verifyToken, EnrollmentController.enroll);

/**
 * @route GET /api/enrollments/my
 * @desc Récupérer mes inscriptions
 * @access Private
 */
router.get('/enrollments/my', verifyToken, EnrollmentController.getMyEnrollments);

/**
 * @route GET /api/courses/:courseId/progress
 * @desc Récupérer la progression d'un cours
 * @access Private
 */
router.get('/:courseId/progress', verifyToken, EnrollmentController.getProgress);

/**
 * @route GET /api/courses/:courseId/students
 * @desc Récupérer les étudiants inscrits à un cours (Expert)
 * @access Private (Expert only)
 */
router.get('/:courseId/students', verifyToken, requireExpert, EnrollmentController.getEnrollments);

/**
 * @route POST /api/courses/:courseId/certificate
 * @desc Générer un certificat de complétion
 * @access Private
 */
router.post('/:courseId/certificate', verifyToken, EnrollmentController.generateCertificate);

/**
 * @route POST /api/courses/:courseId/leave
 * @desc Abandonner/Suspendre un cours
 * @access Private
 */
router.post('/:courseId/leave', verifyToken, EnrollmentController.leaveCourse);

module.exports = router;
