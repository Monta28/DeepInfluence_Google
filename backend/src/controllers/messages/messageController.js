// backend/src/controllers/messages/messageController.js
const prisma = require('../../services/database');
const ApiResponse = require('../../utils/response');

class MessageController {
  // Permet à un expert de basculer une conversation entre gratuit et payant
  static async toggleConversationFree(req, res) {
    try {
      const { conversationId } = req.params;
      if (req.user.userType !== 'expert') {
        return ApiResponse.forbidden(res, "Seul un expert peut effectuer cette action.");
      }
      const conversation = await prisma.conversation.findFirst({
        where: {
          id: parseInt(conversationId),
          participants: { some: { userId: req.user.id } }
        }
      });
      if (!conversation) {
        return ApiResponse.notFound(res, "Conversation introuvable ou accès non autorisé.");
      }
      const updatedConversation = await prisma.conversation.update({
        where: { id: parseInt(conversationId) },
        data: { isFree: !conversation.isFree }
      });
      return ApiResponse.success(
        res,
        updatedConversation,
        'Statut de la conversation mis à jour.'
      );
    } catch (error) {
      console.error('Toggle conversation free error:', error);
      return ApiResponse.error(res, 'Erreur lors de la mise à jour.');
    }
  }

  // Transaction de coins entre l'expéditeur et l'expert
  static async handleCoinTransaction(tx, sender, receiverId, conversationIsFree) {
    if (conversationIsFree || sender.userType === 'expert') {
      return;
    }
    const expertProfile = await tx.expert.findUnique({ where: { userId: receiverId } });
    if (expertProfile) {
      const messageCost = expertProfile.pricePerMessage;
      if (sender.coins < messageCost) {
        throw new Error('Solde de coins insuffisant.');
      }
      await tx.user.update({
        where: { id: sender.id },
        data: { coins: { decrement: messageCost } }
      });
      await tx.user.update({
        where: { id: receiverId },
        data: { coins: { increment: messageCost } }
      });
    }
  }

  // Démarre une nouvelle conversation avec transaction de coins
  static async initiateConversation(req, res) {
    try {
      const senderId = req.user.id;
      const { receiverId, content } = req.body;
      if (!receiverId || !content || isNaN(parseInt(receiverId))) {
        return ApiResponse.badRequest(res, 'Le destinataire et le contenu sont requis.');
      }
      const finalReceiverId = parseInt(receiverId);
      const result = await prisma.$transaction(async (tx) => {
        const sender = await tx.user.findUnique({ where: { id: senderId } });
        await MessageController.handleCoinTransaction(tx, sender, finalReceiverId, false);
        let conversation = await tx.conversation.findFirst({
          where: {
            AND: [
              { participants: { some: { userId: senderId } } },
              { participants: { some: { userId: finalReceiverId } } }
            ]
          }
        });
        if (!conversation) {
          conversation = await tx.conversation.create({
            data: {
              participants: {
                create: [{ userId: senderId }, { userId: finalReceiverId }]
              }
            }
          });
        }
        await tx.message.create({
          data: {
            conversationId: conversation.id,
            senderId,
            receiverId: finalReceiverId,
            content
          }
        });
        await tx.conversation.update({
          where: { id: conversation.id },
          data: { lastMessage: content, lastMessageTime: new Date() }
        });
        return { conversationId: conversation.id };
      });
      return ApiResponse.created(res, result, 'Message envoyé.');
    } catch (error) {
      console.error('Initiate conversation error:', error);
      if (error.message === 'Solde de coins insuffisant.') {
        return ApiResponse.paymentRequired(res, error.message);
      }
      return ApiResponse.error(res, "Erreur lors de l'envoi du message.");
    }
  }

  // Envoie un message dans une conversation existante et diffuse via Socket.io
  static async sendMessage(req, res) {
    try {
      const { conversationId } = req.params;
      const { content, receiverId } = req.body;
      const senderId = req.user.id;

      const result = await prisma.$transaction(async (tx) => {
        // Vérifier la conversation et récupérer ses participants
        const conversation = await tx.conversation.findUnique({
          where: { id: parseInt(conversationId) },
          include: { participants: true }
        });
        if (!conversation) throw new Error('Conversation introuvable.');
        // Transaction de coins
        const sender = await tx.user.findUnique({ where: { id: senderId } });
        await MessageController.handleCoinTransaction(
          tx,
          sender,
          parseInt(receiverId),
          conversation.isFree
        );
        // Création du message
        const message = await tx.message.create({
          data: {
            conversationId: parseInt(conversationId),
            senderId,
            receiverId: parseInt(receiverId),
            content
          }
        });
        // Incrémenter le compteur d'UNREAD pour le destinataire
        const updatedParticipant = await tx.conversationParticipant.update({
          where: {
            conversationId_userId: {
              conversationId: parseInt(conversationId),
              userId: parseInt(receiverId)
            }
          },
          data: { unreadCount: { increment: 1 } }
        });
        // Mise à jour de la conversation
        await tx.conversation.update({
          where: { id: parseInt(conversationId) },
          data: { lastMessage: content, lastMessageTime: new Date() }
        });
        // Récupérer le message avec l'avatar de l'expéditeur
        const messageWithSender = await tx.message.findUnique({
          where: { id: message.id },
          include: { sender: { select: { avatar: true } } }
        });
        return {
          message: messageWithSender,
          participants: conversation.participants,
          unreadForReceiver: updatedParticipant.unreadCount
        };
      });

      // Diffuser le message et les mises à jour de coins via Socket.io
      const io = req.app.get('io');
      const onlineUsers = req.app.get('onlineUsers');
      result.participants.forEach((participant) => {
        const socketId = onlineUsers.get(participant.userId);
        if (socketId) {
          const payload = {
            ...result.message,
            conversationId: parseInt(conversationId)
          };
          io.to(socketId).emit('newMessage', payload);
          io.to(socketId).emit('coinUpdate');
          // Si c'est le destinataire, pousser la mise à jour d'UNREAD
          if (participant.userId === parseInt(receiverId)) {
            io.to(socketId).emit('unreadUpdate', {
              conversationId: parseInt(conversationId),
              unreadCount: result.unreadForReceiver
            });
          }
          // Informer l'expéditeur que le message a été délivré côté serveur
          if (participant.userId === senderId) {
            io.to(socketId).emit('messageDelivered', {
              conversationId: parseInt(conversationId),
              messageId: result.message.id
            });
          }
        }
      });

      return ApiResponse.created(res, result.message, 'Message envoyé.');
    } catch (error) {
      console.error('Send message error:', error);
      if (error.message === 'Solde de coins insuffisant.') {
        return ApiResponse.paymentRequired(res, error.message);
      }
      return ApiResponse.error(res, "Erreur lors de l'envoi du message.");
    }
  }

  // Récupère la liste des conversations de l'utilisateur
  static async getConversations(req, res) {
    try {
      const userId = req.user.id;
      const conversations = await prisma.conversation.findMany({
        where: { participants: { some: { userId: userId } } },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                  expert: { select: { isOnline: true, specialty: true, responseTime: true } }
                }
              }
            }
          }
        },
        orderBy: { lastMessageTime: 'desc' }
      });

      // Calculer dynamiquement un temps de réponse moyen pour l'autre participant
      const formattedConversations = await Promise.all(conversations.map(async (conv) => {
          const otherParticipant = conv.participants.find((p) => p.userId !== userId);
          if (!otherParticipant?.user) return null;
          const participantUser = otherParticipant.user;
          const isOnline = participantUser.expert ? participantUser.expert.isOnline : false;
          const specialty = participantUser.expert ? participantUser.expert.specialty : 'Utilisateur';
          const responseTime = participantUser.expert ? participantUser.expert.responseTime : undefined;
          const finalParticipantUser = {
            id: participantUser.id,
            firstName: participantUser.firstName,
            lastName: participantUser.lastName,
            avatar: participantUser.avatar,
            isOnline: isOnline,
            specialty: specialty,
            responseTime
          };
          // Récupérer le participant courant pour remonter son unreadCount
          const meParticipant = conv.participants.find((p) => p.userId === userId);
          const unreadCount = meParticipant ? meParticipant.unreadCount : 0;

          // Calcul dynamique: moyenne des délais entre un message de l'utilisateur
          // et la réponse suivante de l'autre participant sur les 30 derniers messages
          const lastMessages = await prisma.message.findMany({
            where: { conversationId: conv.id },
            orderBy: { timestamp: 'desc' },
            take: 30,
            select: { senderId: true, timestamp: true }
          });
          const seq = lastMessages.slice().reverse();
          let lastFromMe = null;
          const deltas = [];
          for (const m of seq) {
            if (m.senderId === userId) {
              lastFromMe = m.timestamp;
            } else if (m.senderId === otherParticipant.userId && lastFromMe) {
              const deltaMs = new Date(m.timestamp).getTime() - new Date(lastFromMe).getTime();
              if (deltaMs > 0) deltas.push(deltaMs);
              lastFromMe = null; // reset until next my message
            }
          }
          let responseMinutes = null;
          if (deltas.length > 0) {
            const avgMs = Math.round(deltas.reduce((a, b) => a + b, 0) / deltas.length);
            responseMinutes = Math.max(1, Math.round(avgMs / 60000)); // minutes
          }

          return {
            id: conv.id,
            lastMessage: conv.lastMessage,
            lastMessageTime: conv.lastMessageTime,
            isFree: conv.isFree,
            participants: [{ user: finalParticipantUser }],
            unreadCount,
            responseMinutes
          };
        }))
        .then(list => list.filter(Boolean));

      return ApiResponse.success(res, formattedConversations);
    } catch (error) {
      console.error('Get conversations error:', error);
      return ApiResponse.error(res, 'Erreur lors de la récupération des conversations.');
    }
  }

  // Récupère tous les messages d'une conversation
  static async getMessages(req, res) {
    try {
      const { conversationId } = req.params;
      const messages = await prisma.message.findMany({
        where: { conversationId: parseInt(conversationId) },
        orderBy: { timestamp: 'asc' },
        include: { sender: { select: { id: true, firstName: true, avatar: true } } }
      });
      return ApiResponse.success(res, messages);
    } catch (error) {
      console.error('Get messages error:', error);
      return ApiResponse.error(res, 'Error fetching messages.');
    }
  }

  // Supprime un message spécifique
  static async deleteMessage(req, res) {
    try {
      const { messageId } = req.params;
      await prisma.message.delete({
        where: { id: parseInt(messageId), senderId: req.user.id }
      });
      return ApiResponse.success(res, null, 'Message deleted.');
    } catch (error) {
      console.error('Delete message error:', error);
      return ApiResponse.error(res, 'Error deleting message.');
    }
  }

  // Supprime une conversation entière
  static async deleteConversation(req, res) {
    try {
      const { conversationId } = req.params;
      await prisma.conversation.delete({
        where: { id: parseInt(conversationId) }
      });
      return ApiResponse.success(res, null, 'Conversation deleted.');
    } catch (error) {
      console.error('Delete conversation error:', error);
      return ApiResponse.error(res, 'Error deleting conversation.');
    }
  }

  // Marque un message comme lu
  static async markMessageAsRead(req, res) {
    try {
      const { messageId } = req.params;
      await prisma.message.update({
        where: { id: parseInt(messageId), receiverId: req.user.id },
        data: { isRead: true }
      });
      return ApiResponse.success(res, null, 'Message marked as read.');
    } catch (error) {
      console.error('Mark as read error:', error);
      return ApiResponse.error(res, 'Error marking message as read.');
    }
  }

  // Marque tous les messages d'une conversation comme lus
  static async markAllMessagesAsRead(req, res) {
    try {
      const { conversationId } = req.params;
      await prisma.$transaction(async (tx) => {
        // Marquer les messages destinés à l'utilisateur courant comme lus
        await tx.message.updateMany({
          where: {
            conversationId: parseInt(conversationId),
            receiverId: req.user.id,
            isRead: false
          },
          data: { isRead: true }
        });
        // Remettre à zéro le compteur d'unread
        await tx.conversationParticipant.update({
          where: {
            conversationId_userId: {
              conversationId: parseInt(conversationId),
              userId: req.user.id
            }
          },
          data: { unreadCount: 0 }
        });
      });

      // Émettre l'événement de lecture aux autres participants
      const io = req.app.get('io');
      const onlineUsers = req.app.get('onlineUsers');
      const participants = await prisma.conversationParticipant.findMany({
        where: { conversationId: parseInt(conversationId) }
      });
      participants.forEach((p) => {
        const socketId = onlineUsers.get(p.userId);
        if (socketId) {
          io.to(socketId).emit('messagesRead', {
            conversationId: parseInt(conversationId),
            readerId: req.user.id
          });
          if (p.userId === req.user.id) {
            io.to(socketId).emit('unreadUpdate', {
              conversationId: parseInt(conversationId),
              unreadCount: 0
            });
          }
        }
      });

      return ApiResponse.success(res, null, 'All messages marked as read.');
    } catch (error) {
      console.error('Mark all as read error:', error);
      return ApiResponse.error(res, 'Error marking messages as read.');
    }
  }
}

module.exports = MessageController;
