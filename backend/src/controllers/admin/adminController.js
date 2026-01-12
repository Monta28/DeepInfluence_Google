const prisma = require('../../services/database');
const ApiResponse = require('../../utils/response');

class AdminController {
  static async overview(req, res) {
    try {
      const [totalUsers, totalExperts, verifiedExperts, pendingExperts, formations, videos, reviews, appointments] = await prisma.$transaction([
        prisma.user.count(),
        prisma.expert.count(),
        prisma.expert.count({ where: { verified: true } }),
        prisma.expert.count({ where: { verificationStatus: 'PENDING' } }),
        prisma.formation.count(),
        prisma.video.count(),
        prisma.review.count(),
        prisma.appointment.groupBy({ by: ['status'], _count: { status: true } })
      ]);
      const apptByStatus = appointments.reduce((acc, a) => { acc[a.status] = a._count.status; return acc; }, {});
      return ApiResponse.success(res, {
        users: totalUsers,
        experts: { total: totalExperts, verified: verifiedExperts, pending: pendingExperts },
        formations,
        videos,
        reviews,
        appointments: apptByStatus
      });
    } catch (e) {
      console.error('Admin overview error:', e);
      return ApiResponse.error(res, 'Erreur lors du chargement du tableau de bord admin');
    }
  }

  static async listExperts(req, res) {
    try {
      const { status = 'all', search = '', page = 1, limit = 20 } = req.query;
      const where = {};
      if (status === 'pending') where.verificationStatus = 'PENDING';
      if (status === 'verified') where.verified = true;
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { specialty: { contains: search, mode: 'insensitive' } },
          { user: { email: { contains: search, mode: 'insensitive' } } }
        ];
      }
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const [items, total] = await Promise.all([
        prisma.expert.findMany({
          where,
          include: {
            user: { select: { id: true, email: true, firstName: true, lastName: true, avatar: true } }
          },
          orderBy: { updatedAt: 'desc' },
          skip,
          take: parseInt(limit)
        }),
        prisma.expert.count({ where })
      ]);
      return ApiResponse.success(res, { items, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
    } catch (e) {
      console.error('Admin list experts error:', e);
      return ApiResponse.error(res, 'Erreur lors de la récupération des experts');
    }
  }

  static async verifyExpert(req, res) {
    try {
      const id = parseInt(req.params.id);
      const { action = 'approve', reason } = req.body || {};
      const expert = await prisma.expert.findUnique({ where: { id } });
      if (!expert) return ApiResponse.notFound(res, 'Expert non trouvé');
      let data;
      if (action === 'approve') {
        data = { verified: true, verificationStatus: 'APPROVED' };
      } else if (action === 'reject') {
        data = { verified: false, verificationStatus: 'REJECTED' };
      } else {
        return ApiResponse.badRequest(res, 'Action invalide');
      }
      const updated = await prisma.expert.update({ where: { id }, data });
      // Emit socket event to update clients in real-time
      try {
        const io = req.app.get('io');
        const onlineUsers = req.app.get('onlineUsers');
        if (io) {
          io.emit('expertVerificationChanged', { expertId: id, verified: updated.verified, verificationStatus: updated.verificationStatus });
          const sockId = onlineUsers?.get(expert.userId);
          if (sockId) io.to(sockId).emit('expertVerificationChanged', { expertId: id, verified: updated.verified, verificationStatus: updated.verificationStatus });
        }
      } catch {}
      // Créer une notification pour l'expert
      try {
        await prisma.notification.create({
          data: {
            userId: expert.userId,
            title: action === 'approve' ? 'Vérification validée' : 'Vérification refusée',
            message: action === 'approve' ? 'Votre profil expert a été vérifié.' : `Votre vérification a été refusée${reason ? `: ${reason}` : ''}.`,
            type: 'verification',
            actionUrl: '/dashboard/profile'
          }
        });
      } catch {}
      return ApiResponse.success(res, updated, 'Statut de vérification mis à jour');
    } catch (e) {
      console.error('Admin verify expert error:', e);
      return ApiResponse.error(res, 'Erreur de mise à jour de la vérification');
    }
  }

  static async listUsers(req, res) {
    try {
      const { query = '', page = 1, limit = 20 } = req.query;
      const where = query ? {
        OR: [
          { email: { contains: query, mode: 'insensitive' } },
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } }
        ]
      } : {};
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const [items, total] = await Promise.all([
        prisma.user.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(limit),
          select: { id: true, email: true, firstName: true, lastName: true, userType: true, coins: true, createdAt: true, banned: true }
        }),
        prisma.user.count({ where })
      ]);
      return ApiResponse.success(res, { items, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
    } catch (e) {
      console.error('Admin list users error:', e);
      return ApiResponse.error(res, 'Erreur lors de la récupération des utilisateurs');
    }
  }

  static async setUserBanned(req, res) {
    try {
      const id = parseInt(req.params.id);
      const { banned } = req.body || {};
      const updated = await prisma.user.update({ where: { id }, data: { banned: !!banned } });
      try {
        const io = req.app.get('io');
        const onlineUsers = req.app.get('onlineUsers');
        if (io) {
          io.emit('userBannedChanged', { userId: updated.id, banned: updated.banned });
          const sockId = onlineUsers?.get(updated.id);
          if (sockId) io.to(sockId).emit('userBannedChanged', { userId: updated.id, banned: updated.banned });
        }
      } catch {}
      return ApiResponse.success(res, { id: updated.id, banned: updated.banned }, updated.banned ? 'Utilisateur banni' : 'Utilisateur débanni');
    } catch (e) {
      console.error('Admin set banned error:', e);
      return ApiResponse.error(res, 'Erreur de mise à jour du statut');
    }
  }

  static async setUserRole(req, res) {
    try {
      const id = parseInt(req.params.id);
      const { userType } = req.body || {};
      if (!['user','admin','expert'].includes(userType)) return ApiResponse.badRequest(res, 'Rôle invalide');
      const updated = await prisma.user.update({ where: { id }, data: { userType } });
      return ApiResponse.success(res, { id: updated.id, userType: updated.userType }, 'Rôle mis à jour');
    } catch (e) {
      console.error('Admin set role error:', e);
      return ApiResponse.error(res, 'Erreur de mise à jour du rôle');
    }
  }

  static async listVideos(req, res) {
    try {
      const { search = '', page = 1, limit = 20 } = req.query;
      const where = search ? {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { expert: { contains: search, mode: 'insensitive' } }
        ]
      } : {};
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const [items, total] = await Promise.all([
        prisma.video.findMany({
          where,
          include: { expertRel: { include: { user: { select: { avatar: true } } } } },
          orderBy: { publishedAt: 'desc' },
          skip,
          take: parseInt(limit)
        }),
        prisma.video.count({ where })
      ]);
      return ApiResponse.success(res, { items, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
    } catch (e) {
      console.error('Admin list videos error:', e);
      return ApiResponse.error(res, 'Erreur de récupération des vidéos');
    }
  }

  static async deleteVideo(req, res) {
    try {
      const id = parseInt(req.params.id);
      await prisma.video.delete({ where: { id } });
      return ApiResponse.success(res, null, 'Vidéo supprimée');
    } catch (e) {
      console.error('Admin delete video error:', e);
      return ApiResponse.error(res, 'Erreur lors de la suppression de la vidéo');
    }
  }

  static async listFormations(req, res) {
    try {
      const { search = '', page = 1, limit = 20 } = req.query;
      const where = search ? {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { instructor: { contains: search, mode: 'insensitive' } }
        ]
      } : {};
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const [items, total] = await Promise.all([
        prisma.formation.findMany({
          where,
          include: { expert: { include: { user: { select: { avatar: true } } } } },
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(limit)
        }),
        prisma.formation.count({ where })
      ]);
      return ApiResponse.success(res, { items, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
    } catch (e) {
      console.error('Admin list formations error:', e);
      return ApiResponse.error(res, 'Erreur de récupération des formations');
    }
  }

  static async deleteFormation(req, res) {
    try {
      const id = parseInt(req.params.id);
      await prisma.formation.delete({ where: { id } });
      return ApiResponse.success(res, null, 'Formation supprimée');
    } catch (e) {
      console.error('Admin delete formation error:', e);
      return ApiResponse.error(res, 'Erreur lors de la suppression de la formation');
    }
  }

  static async broadcastNotification(req, res) {
    try {
      const { target = 'all', title, message, actionUrl } = req.body || {};
      if (!title || !message) return ApiResponse.badRequest(res, 'Titre et message requis');
      const where = target === 'experts' ? { userType: 'expert' } : target === 'users' ? { userType: 'user' } : {};
      const users = await prisma.user.findMany({ where, select: { id: true } });
      const data = users.map(u => ({ userId: u.id, title, message, type: 'broadcast', actionUrl }));
      if (data.length) await prisma.notification.createMany({ data });
      // Socket broadcast best-effort
      try {
        const io = req.app.get('io');
        const onlineUsers = req.app.get('onlineUsers');
        users.forEach(u => {
          const socketId = onlineUsers.get(u.id);
          if (socketId) io.to(socketId).emit('notification', { title, message, type: 'broadcast', actionUrl, createdAt: new Date().toISOString() });
        });
      } catch {}
      return ApiResponse.success(res, { count: users.length }, 'Notification envoyée');
    } catch (e) {
      console.error('Admin broadcast error:', e);
      return ApiResponse.error(res, 'Erreur lors de la diffusion');
    }
  }

  static async bulkDeleteReviews(req, res) {
    try {
      const { ids } = req.body || {};
      if (!Array.isArray(ids) || ids.length === 0) return ApiResponse.badRequest(res, 'Liste d\'IDs requise');
      await prisma.review.deleteMany({ where: { id: { in: ids.map((x) => parseInt(x)) } } });
      return ApiResponse.success(res, { count: ids.length }, 'Avis supprimés');
    } catch (e) {
      console.error('Admin bulk delete reviews error:', e);
      return ApiResponse.error(res, 'Erreur lors de la suppression des avis');
    }
  }

  static async trends(req, res) {
    try {
      const days = Math.max(1, Math.min(90, parseInt(req.query.days || '7')));
      const since = new Date();
      since.setDate(since.getDate() - days + 1);

      const [users, appts, reviews, videos, formations] = await prisma.$transaction([
        prisma.user.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
        prisma.appointment.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true, status: true } }),
        prisma.review.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
        prisma.video.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
        prisma.formation.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } })
      ]);

      const fmt = (d) => {
        const dd = new Date(d);
        const y = dd.getFullYear();
        const m = String(dd.getMonth()+1).padStart(2, '0');
        const da = String(dd.getDate()).padStart(2, '0');
        return `${y}-${m}-${da}`;
      };
      const dates = [];
      for (let i = 0; i < days; i++) {
        const d = new Date(); d.setDate(d.getDate() - (days - 1 - i));
        dates.push(fmt(d));
      }
      const initSeries = dates.reduce((acc, d) => { acc[d] = 0; return acc; }, {});
      const countBy = (arr) => {
        const s = { ...initSeries };
        arr.forEach(x => { const k = fmt(x.createdAt); if (s[k] !== undefined) s[k]++; });
        return s;
      };
      const usersSeries = countBy(users);
      const reviewsSeries = countBy(reviews);
      const videosSeries = countBy(videos);
      const formationsSeries = countBy(formations);
      const apptStatus = ['pending','confirmed','completed','cancelled'];
      const apptSeries = apptStatus.reduce((acc, st) => { acc[st] = { ...initSeries }; return acc; }, {});
      appts.forEach(a => { const k = fmt(a.createdAt); if (apptSeries[a.status] && apptSeries[a.status][k] !== undefined) apptSeries[a.status][k]++; });

      const data = dates.map(d => ({
        date: d,
        users: usersSeries[d],
        reviews: reviewsSeries[d],
        videos: videosSeries[d],
        formations: formationsSeries[d],
        appt_pending: apptSeries['pending'][d],
        appt_confirmed: apptSeries['confirmed'][d],
        appt_completed: apptSeries['completed'][d],
        appt_cancelled: apptSeries['cancelled'][d]
      }));
      return ApiResponse.success(res, { days, data });
    } catch (e) {
      console.error('Admin trends error:', e);
      return ApiResponse.error(res, 'Erreur lors du calcul des tendances');
    }
  }

  static async listReviews(req, res) {
    try {
      const { page = 1, limit = 20, search = '' } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const where = search ? {
        OR: [
          { comment: { contains: search, mode: 'insensitive' } },
          { user: { firstName: { contains: search, mode: 'insensitive' } } },
          { user: { lastName: { contains: search, mode: 'insensitive' } } },
          { expert: { name: { contains: search, mode: 'insensitive' } } }
        ]
      } : {};
      const [items, total] = await Promise.all([
        prisma.review.findMany({
          where,
          include: {
            user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
            expert: { select: { id: true, name: true } },
            formation: { select: { id: true, title: true } }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(limit)
        }),
        prisma.review.count({ where })
      ]);
      return ApiResponse.success(res, { items, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
    } catch (e) {
      console.error('Admin list reviews error:', e);
      return ApiResponse.error(res, 'Erreur lors de la récupération des avis');
    }
  }

  static async deleteReview(req, res) {
    try {
      const id = parseInt(req.params.id);
      await prisma.review.delete({ where: { id } });
      return ApiResponse.success(res, null, 'Avis supprimé');
    } catch (e) {
      console.error('Admin delete review error:', e);
      return ApiResponse.error(res, "Erreur lors de la suppression de l'avis");
    }
  }

  static async listAppointments(req, res) {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const where = status ? { status } : {};
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const [items, total] = await Promise.all([
        prisma.appointment.findMany({
          where,
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
            expertRel: { select: { id: true, name: true } }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(limit)
        }),
        prisma.appointment.count({ where })
      ]);
      return ApiResponse.success(res, { items, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
    } catch (e) {
      console.error('Admin list appointments error:', e);
      return ApiResponse.error(res, 'Erreur de récupération des rendez-vous');
    }
  }

  static async updateAppointmentStatus(req, res) {
    try {
      const id = parseInt(req.params.id);
      const { action } = req.body || {};
      const appt = await prisma.appointment.findUnique({ where: { id } });
      if (!appt) return ApiResponse.notFound(res, 'Rendez-vous introuvable');
      if (action === 'confirm') {
        const updated = await prisma.appointment.update({ where: { id }, data: { status: 'confirmed' } });
        return ApiResponse.success(res, updated, 'Confirmé');
      }
      if (action === 'cancel') {
        const result = await prisma.$transaction(async (tx) => {
          if (appt.coins && appt.coins > 0) {
            await tx.user.update({ where: { id: appt.userId }, data: { coins: { increment: appt.coins } } });
            await tx.transaction.create({ data: { userId: appt.userId, type: 'refund', amount: 0, coins: appt.coins, description: 'Remboursement admin', relatedId: appt.id } });
          }
          return tx.appointment.update({ where: { id: appt.id }, data: { status: 'cancelled' } });
        });
        return ApiResponse.success(res, result, 'Annulé');
      }
        
      if (action === 'complete') {
        const expert = await prisma.expert.findUnique({ where: { id: appt.expertId } });
        const result = await prisma.$transaction(async (tx) => {
          if (appt.coins && appt.coins > 0 && expert) {
            await tx.user.update({ where: { id: expert.userId }, data: { coins: { increment: appt.coins } } });
            await tx.transaction.create({ data: { userId: expert.userId, type: 'purchase', amount: 0, coins: appt.coins, description: 'Gains admin', relatedId: appt.id } });
          }
          return tx.appointment.update({ where: { id: appt.id }, data: { status: 'completed' } });
        });
        return ApiResponse.success(res, result, 'Complété');
      }
      return ApiResponse.badRequest(res, 'Action invalide');
    } catch (e) {
      console.error('Admin update appointment error:', e);
      return ApiResponse.error(res, 'Erreur de mise à jour du rendez-vous');
    }
  }
  static async listAuditLogs(req, res) {
    try {
      const { page = 1, limit = 50, adminId, action, targetType } = req.query;
      const where = {};
      if (adminId) where.adminId = parseInt(adminId);
      if (action) where.action = { contains: String(action), mode: 'insensitive' };
      if (targetType) where.targetType = { contains: String(targetType), mode: 'insensitive' };
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const [items, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          include: { admin: { select: { id: true, email: true, firstName: true, lastName: true } } },
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(limit)
        }),
        prisma.auditLog.count({ where })
      ]);
      return ApiResponse.success(res, { items, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
    } catch (e) {
      console.error('Admin list logs error:', e);
      return ApiResponse.error(res, 'Erreur lors de la récupération des logs');
    }
  }

  /*
  static csv(res, filename, rows) {
    try {
      const headers = Object.keys(rows[0] || {});
      const esc = (v) => {
        if (v === null || v === undefined) return '';
        const s = String(v).replace(/"/g, '""');
        return /[",
]/.test(s) ? `"${s}"` : s;
      };
      const csv = [headers.join(',')].concat(rows.map(r => headers.map(h => esc(r[h])).join(','))).join('
');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(csv);
    } catch (e) {
      return ApiResponse.error(res, 'Erreur export CSV');
    }
  }
  */

  static csv(res, filename, rows) {
    try {
      const headers = Object.keys(rows[0] || {});
      const esc = (v) => {
        if (v === null || v === undefined) return '';
        const s = String(v).replace(/\"/g, '\"\"');
        return /[\",\n]/.test(s) ? `\"${s}\"` : s;
      };
      const csv = [headers.join(',')]
        .concat(rows.map(r => headers.map(h => esc(r[h])).join(',')))
        .join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=\"${filename}\"`);
      return res.send(csv);
    } catch (e) {
      return ApiResponse.error(res, 'Erreur export CSV');
    }
  }

  static async exportUsers(req, res) {
    const users = await prisma.user.findMany({ select: { id: true, email: true, firstName: true, lastName: true, userType: true, coins: true, banned: true, createdAt: true } });
    return this.csv(res, 'users.csv', users.map(u => ({ ...u, createdAt: u.createdAt.toISOString() })));
  }
  static async exportExperts(req, res) {
    const ex = await prisma.expert.findMany({ include: { user: { select: { email: true } } } });
    const rows = ex.map(e => ({ id: e.id, name: e.name, email: e.user?.email, specialty: e.specialty, verified: e.verified, rating: e.rating, reviews: e.reviews, createdAt: e.createdAt.toISOString() }));
    return this.csv(res, 'experts.csv', rows);
  }
  static async exportReviews(req, res) {
    const rev = await prisma.review.findMany({ include: { user: true, expert: true } });
    const rows = rev.map(r => ({ id: r.id, user: `${r.user.firstName} ${r.user.lastName}`, expert: r.expert?.name, rating: r.rating, comment: r.comment, createdAt: r.createdAt.toISOString() }));
    return this.csv(res, 'reviews.csv', rows);
  }
  static async exportAppointments(req, res) {
    const appts = await prisma.appointment.findMany({ include: { user: true, expertRel: true } });
    const rows = appts.map(a => ({ id: a.id, user: `${a.user.firstName} ${a.user.lastName}`, expert: a.expertRel?.name, date: a.date, time: a.time, status: a.status, coins: a.coins, createdAt: a.createdAt.toISOString() }));
    return this.csv(res, 'appointments.csv', rows);
  }
  static async exportVideos(req, res) {
    const vids = await prisma.video.findMany();
    const rows = vids.map(v => ({ id: v.id, title: v.title, expert: v.expert, views: v.views, likes: v.likes, type: v.type, price: v.price, createdAt: v.createdAt.toISOString() }));
    return this.csv(res, 'videos.csv', rows);
  }
  static async exportFormations(req, res) {
    const forms = await prisma.formation.findMany();
    const rows = forms.map(f => ({ id: f.id, title: f.title, instructor: f.instructor, level: f.level, price: f.price, students: f.students, type: f.type, createdAt: f.createdAt.toISOString() }));
    return this.csv(res, 'formations.csv', rows);
  }

  static async exportLogs(req, res) {
    const { adminId, action, targetType } = req.query;
    const where = {};
    if (adminId) where.adminId = parseInt(adminId);
    if (action) where.action = { contains: String(action), mode: 'insensitive' };
    if (targetType) where.targetType = { contains: String(targetType), mode: 'insensitive' };
    const logs = await prisma.auditLog.findMany({ where, include: { admin: true }, orderBy: { createdAt: 'desc' } });
    const rows = logs.map(l => ({ id: l.id, date: l.createdAt.toISOString(), admin: l.admin ? `${l.admin.firstName} ${l.admin.lastName}` : '', email: l.admin?.email, action: l.action, targetType: l.targetType, targetId: l.targetId || '', details: l.details || '' }));
    return this.csv(res, 'logs.csv', rows);
  }

}

module.exports = AdminController;
