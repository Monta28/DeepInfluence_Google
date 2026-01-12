const prisma = require('../../services/database');
const ApiResponse = require('../../utils/response');
const { differenceInMinutes, addMinutes, parseISO } = (() => {
  // Tiny helpers without bringing a library
  const toDate = (dateStr, timeStr) => new Date(`${dateStr}T${timeStr}:00`);
  return {
    differenceInMinutes: (a, b) => Math.round((a.getTime() - b.getTime()) / 60000),
    addMinutes: (date, minutes) => new Date(date.getTime() + minutes * 60000),
    parseISO: (iso) => new Date(iso),
    toDate
  };
})();

/**
 * Contrôleur pour la gestion des rendez-vous
 */
class AppointmentController {
  /**
   * Récupérer tous les rendez-vous de l'utilisateur
   */
  static async getUserAppointments(req, res) {
    try {
      const { status } = req.query;
      
      const where = { userId: req.user.id };
      if (status) {
        where.status = status;
      }

      const appointments = await prisma.appointment.findMany({
        where,
        include: {
          expertRel: {
            select: {
              id: true,
              userId: true,
              name: true,
              verified: true,
              user: { select: { avatar: true } }
            }
          },
          formation: {
            select: {
              id: true,
              title: true,
              image: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return ApiResponse.success(res, appointments);
    } catch (error) {
      console.error('Get user appointments error:', error);
      return ApiResponse.error(res, 'Erreur lors de la récupération des rendez-vous');
    }
  }

  /**
   * Créer un nouveau rendez-vous
   */
  static async createAppointment(req, res) {
    try {
      const {
        expertId,
        type,
        date,
        time,
        duration,
        category,
        formationId
      } = req.body;

      // Vérifier que l'expert existe
      const expert = await prisma.expert.findUnique({
        where: { id: parseInt(expertId) },
        include: { user: { select: { avatar: true } } }
      });

      if (!expert) {
        return ApiResponse.notFound(res, 'Expert non trouvé');
      }

      // Validation du créneau (conflits)
      const durationMinutes = parseInt(duration, 10);
      if (isNaN(durationMinutes) || durationMinutes <= 0) {
        return ApiResponse.badRequest(res, 'Durée invalide');
      }
      const start = new Date(`${date}T${time}:00`);
      const end = new Date(start.getTime() + durationMinutes * 60000);

      // Fetch all same-day appointments to compute precise overlaps
      const sameDay = await prisma.appointment.findMany({
        where: { expertId: parseInt(expertId), date, status: { not: 'cancelled' } },
        select: { time: true, duration: true }
      });
      const hasOverlap = sameDay.some(a => {
        const aStart = new Date(`${date}T${a.time}:00`);
        const aDur = parseInt(a.duration, 10) || 0;
        const aEnd = new Date(aStart.getTime() + aDur * 60000);
        return aStart < end && start < aEnd;
      });
      if (hasOverlap) {
        return ApiResponse.badRequest(res, 'Créneau indisponible');
      }

      // Bloquer les coins de l'utilisateur (escrow) et créer le rendez-vous en PENDING
      const appointment = await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where: { id: req.user.id } });
        const priceCoins = expert.hourlyRate; // simple: tarif horaire
        if (!user || user.coins < priceCoins) {
          throw new Error('Solde de coins insuffisant pour réserver ce rendez-vous');
        }
        await tx.user.update({ where: { id: req.user.id }, data: { coins: { decrement: priceCoins } } });
        // Optionnel: enregistrer une transaction de blocage
        await tx.transaction.create({
          data: {
            userId: req.user.id,
            type: 'spend',
            amount: 0,
            coins: priceCoins,
            description: 'Blocage de coins pour rendez-vous',
            relatedId: null
          }
        });

        const created = await tx.appointment.create({
          data: {
            userId: req.user.id,
            expertId: parseInt(expertId),
            expert: expert.name,
            type,
            date,
            time,
            duration: String(durationMinutes),
            price: expert.hourlyRate,
            coins: expert.hourlyRate,
            status: 'pending',
            category,
            formationId: formationId ? parseInt(formationId) : null,
            image: expert.user?.avatar || null
          },
          include: {
            expertRel: { select: { id: true, name: true, userId: true, user: { select: { avatar: true } } } }
          }
        });
        return created;
      });

      // Notifications + Socket.io
      try {
        const io = req.app.get('io');
        const onlineUsers = req.app.get('onlineUsers');
        // Créer des notifications
        await prisma.notification.createMany({
          data: [
            {
              userId: appointment.expertRel.userId,
              title: 'Nouveau rendez-vous',
              message: `${req.user.firstName || 'Un utilisateur'} a réservé le ${date} à ${time}.`,
              type: 'appointment',
              actionUrl: `/dashboard/appointments`
            },
            {
              userId: req.user.id,
              title: 'Rendez-vous confirmé',
              message: `Rendez-vous avec ${appointment.expert} le ${date} à ${time}.`,
              type: 'appointment',
              actionUrl: `/dashboard/appointments`
            }
          ]
        });
        // Push temps réel
        const expertSocket = onlineUsers.get(appointment.expertRel.userId);
        if (expertSocket) {
          io.to(expertSocket).emit('appointmentBooked', {
            id: appointment.id,
            userId: req.user.id,
            expertId: appointment.expertRel.id,
            date,
            time,
            duration: durationMinutes,
            type
          });
        }
      } catch (e) {
        console.log('Notification socket error:', e?.message || e);
      }

      return ApiResponse.created(res, appointment, 'Rendez-vous créé');
    } catch (error) {
      console.error('Create appointment error:', error);
      return ApiResponse.error(res, 'Erreur lors de la création du rendez-vous');
    }
  }

  /**
   * Récupérer les rendez-vous où l'utilisateur est EXPERT
   */
  static async getExpertAppointments(req, res) {
    try {
      // trouver l'expert lié à cet utilisateur
      const expert = await prisma.expert.findUnique({ where: { userId: req.user.id } });
      if (!expert) return ApiResponse.success(res, []);
      const appointments = await prisma.appointment.findMany({
        where: { expertId: expert.id },
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } }
      });
      return ApiResponse.success(res, appointments);
    } catch (error) {
      console.error('Get expert appointments error:', error);
      return ApiResponse.error(res, 'Erreur lors de la récupération des rendez-vous expert');
    }
  }

  /**
   * L'expert confirme un rendez-vous PENDING
   */
  static async confirmAppointment(req, res) {
    try {
      const id = parseInt(req.params.id);
      const expert = await prisma.expert.findUnique({ where: { userId: req.user.id } });
      if (!expert) return ApiResponse.forbidden(res, 'Accès réservé aux experts');
      const appt = await prisma.appointment.findUnique({ where: { id } });
      if (!appt || appt.expertId !== expert.id) return ApiResponse.notFound(res, 'Rendez-vous introuvable');
      if (appt.status !== 'pending') return ApiResponse.badRequest(res, 'Le rendez-vous n\'est pas en attente');
      const updated = await prisma.appointment.update({ where: { id }, data: { status: 'confirmed' } });

      // Notifications socket
      try {
        const io = req.app.get('io');
        const onlineUsers = req.app.get('onlineUsers');
        const userSock = onlineUsers.get(appt.userId);
        if (userSock) io.to(userSock).emit('appointmentUpdated', { id, status: 'confirmed' });
      } catch {}

      return ApiResponse.success(res, updated, 'Rendez-vous confirmé');
    } catch (error) {
      console.error('Confirm appointment error:', error);
      return ApiResponse.error(res, 'Erreur lors de la confirmation');
    }
  }

  /**
   * Annuler un rendez-vous (expert ou utilisateur) -> remboursement si non complété
   */
  static async cancelAppointment(req, res) {
    try {
      const id = parseInt(req.params.id);
      const appt = await prisma.appointment.findUnique({ where: { id } });
      if (!appt) return ApiResponse.notFound(res, 'Rendez-vous introuvable');
      // Autorisation
      const expert = await prisma.expert.findUnique({ where: { id: appt.expertId } });
      const isActorExpert = expert && expert.userId === req.user.id;
      const isActorUser = appt.userId === req.user.id;
      if (!isActorExpert && !isActorUser) return ApiResponse.forbidden(res, 'Accès refusé');

      if (appt.status === 'completed' || appt.status === 'cancelled') {
        return ApiResponse.badRequest(res, 'Rendez-vous déjà traité');
      }

      const result = await prisma.$transaction(async (tx) => {
        // Rembourser l'utilisateur si des coins ont été bloqués
        if (appt.coins && appt.coins > 0) {
          await tx.user.update({ where: { id: appt.userId }, data: { coins: { increment: appt.coins } } });
          await tx.transaction.create({
            data: {
              userId: appt.userId,
              type: 'refund',
              amount: 0,
              coins: appt.coins,
              description: 'Remboursement suite annulation rendez-vous',
              relatedId: appt.id
            }
          });
        }
        return tx.appointment.update({ where: { id: appt.id }, data: { status: 'cancelled' } });
      });

      // Notifier
      try {
        const io = req.app.get('io');
        const onlineUsers = req.app.get('onlineUsers');
        const userSock = onlineUsers.get(appt.userId);
        if (userSock) io.to(userSock).emit('appointmentUpdated', { id, status: 'cancelled' });
        if (expert) {
          const expertSock = req.app.get('onlineUsers').get(expert.userId);
          if (expertSock) io.to(expertSock).emit('appointmentUpdated', { id, status: 'cancelled' });
        }
      } catch {}

      return ApiResponse.success(res, result, 'Rendez-vous annulé');
    } catch (error) {
      console.error('Cancel appointment error:', error);
      return ApiResponse.error(res, 'Erreur lors de l\'annulation');
    }
  }

  /**
   * Marquer un rendez-vous comme effectué -> créditer l'expert
   */
  static async completeAppointment(req, res) {
    try {
      const id = parseInt(req.params.id);
      const appt = await prisma.appointment.findUnique({ where: { id } });
      if (!appt) return ApiResponse.notFound(res, 'Rendez-vous introuvable');
      // Seuls le user ou l'expert peuvent clôturer
      const expert = await prisma.expert.findUnique({ where: { id: appt.expertId } });
      const isActorExpert = expert && expert.userId === req.user.id;
      const isActorUser = appt.userId === req.user.id;
      if (!isActorExpert && !isActorUser) return ApiResponse.forbidden(res, 'Accès refusé');
      if (appt.status !== 'confirmed') return ApiResponse.badRequest(res, 'Le rendez-vous doit être confirmé');

      // Option: empêcher avant l'heure prévue
      const now = new Date();
      const start = new Date(`${appt.date}T${appt.time}:00`);
      if (now < start) {
        return ApiResponse.badRequest(res, 'Le rendez-vous n\'a pas encore commencé');
      }

      const result = await prisma.$transaction(async (tx) => {
        // Créditer l'expert
        if (appt.coins && appt.coins > 0 && expert) {
          await tx.user.update({ where: { id: expert.userId }, data: { coins: { increment: appt.coins } } });
          await tx.transaction.create({
            data: {
              userId: expert.userId,
              type: 'purchase',
              amount: 0,
              coins: appt.coins,
              description: 'Gains rendez-vous',
              relatedId: appt.id
            }
          });
        }
        return tx.appointment.update({ where: { id: appt.id }, data: { status: 'completed' } });
      });

      // Notifier
      try {
        const io = req.app.get('io');
        const onlineUsers = req.app.get('onlineUsers');
        const userSock = onlineUsers.get(appt.userId);
        if (userSock) io.to(userSock).emit('appointmentUpdated', { id, status: 'completed' });
        if (expert) {
          const expertSock = onlineUsers.get(expert.userId);
          if (expertSock) io.to(expertSock).emit('appointmentUpdated', { id, status: 'completed' });
        }
      } catch {}

      return ApiResponse.success(res, result, 'Rendez-vous complété');
    } catch (error) {
      console.error('Complete appointment error:', error);
      return ApiResponse.error(res, 'Erreur lors de la finalisation');
    }
  }

  /**
   * Obtenir les créneaux occupés d'un expert pour une date (pas annulés)
   */
  static async getOccupiedSlots(req, res) {
    try {
      const expertId = parseInt(req.query.expertId);
      const date = req.query.date;
      if (!expertId || !date) return ApiResponse.badRequest(res, 'expertId et date requis');
      const appts = await prisma.appointment.findMany({
        where: { expertId, date, status: { not: 'cancelled' } },
        select: { time: true, duration: true }
      });
      const slots = new Set();
      appts.forEach(a => {
        const start = new Date(`${date}T${a.time}:00`);
        const dur = parseInt(a.duration, 10) || 0;
        const steps = Math.max(1, Math.ceil(dur / 30));
        for (let i = 0; i < steps; i++) {
          const t = new Date(start.getTime() + i * 30 * 60000);
          const hh = `${t.getHours()}`.padStart(2, '0');
          const mm = `${t.getMinutes()}`.padStart(2, '0');
          slots.add(`${hh}:${mm}`);
        }
      });
      return ApiResponse.success(res, Array.from(slots));
    } catch (error) {
      console.error('Get occupied slots error:', error);
      return ApiResponse.error(res, 'Erreur lors de la récupération des créneaux occupés');
    }
  }
}

module.exports = AppointmentController;
