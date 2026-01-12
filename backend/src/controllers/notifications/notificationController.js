const prisma = require('../../services/database');
const ApiResponse = require('../../utils/response');

class NotificationController {
  static async list(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 20;
      const items = await prisma.notification.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        take: limit
      });
      const unread = await prisma.notification.count({ where: { userId: req.user.id, isRead: false } });
      return ApiResponse.success(res, { items, unread });
    } catch (e) {
      console.error('List notifications error:', e);
      return ApiResponse.error(res, 'Erreur lors de la récupération des notifications');
    }
  }

  static async markRead(req, res) {
    try {
      const id = parseInt(req.params.id);
      await prisma.notification.update({
        where: { id },
        data: { isRead: true }
      });
      return ApiResponse.success(res, null, 'Notification lue');
    } catch (e) {
      console.error('Mark notification read error:', e);
      return ApiResponse.error(res, 'Erreur lors de la mise à jour');
    }
  }

  static async markAllRead(req, res) {
    try {
      await prisma.notification.updateMany({
        where: { userId: req.user.id, isRead: false },
        data: { isRead: true }
      });
      return ApiResponse.success(res, null, 'Toutes les notifications ont été lues');
    } catch (e) {
      console.error('Mark all notifications read error:', e);
      return ApiResponse.error(res, 'Erreur lors de la mise à jour');
    }
  }
}

module.exports = NotificationController;
