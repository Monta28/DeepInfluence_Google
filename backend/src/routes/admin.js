const express = require('express');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const AdminController = require('../controllers/admin/adminController');

const router = express.Router();

// Guard all admin routes
router.use(verifyToken, requireAdmin);

// Overview KPIs
router.get('/overview', AdminController.overview);

// Experts management
router.get('/experts', AdminController.listExperts);
router.put('/experts/:id/verify', AdminController.verifyExpert);

// Users management
router.get('/users', AdminController.listUsers);
router.post('/users/:id/ban', AdminController.setUserBanned);
router.post('/users/:id/role', AdminController.setUserRole);

// Reviews moderation
router.get('/reviews', AdminController.listReviews);
router.delete('/reviews/:id', AdminController.deleteReview);
router.post('/reviews/bulk-delete', AdminController.bulkDeleteReviews);

// Content management
router.get('/videos', AdminController.listVideos);
router.delete('/videos/:id', AdminController.deleteVideo);
router.get('/formations', AdminController.listFormations);
router.delete('/formations/:id', AdminController.deleteFormation);

// Broadcast notifications
router.post('/notifications/broadcast', AdminController.broadcastNotification);

// Appointments admin
router.get('/appointments', AdminController.listAppointments);
router.put('/appointments/:id', AdminController.updateAppointmentStatus);

// Trends
router.get('/metrics/trends', AdminController.trends);

// Transactions
router.get('/transactions', AdminController.listTransactions);

// Add coins to user
router.post('/users/:id/coins', AdminController.addCoinsToUser);

// Audit logs
router.get('/logs', AdminController.listAuditLogs);

// Exports CSV
router.get('/export/users.csv', AdminController.exportUsers);
router.get('/export/experts.csv', AdminController.exportExperts);
router.get('/export/reviews.csv', AdminController.exportReviews);
router.get('/export/appointments.csv', AdminController.exportAppointments);
router.get('/export/videos.csv', AdminController.exportVideos);
router.get('/export/formations.csv', AdminController.exportFormations);
router.get('/export/logs.csv', AdminController.exportLogs);

module.exports = router;
