// backend/src/services/socketService.js
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

function initSocket(server, corsOptions) {
  const io = new Server(server, { cors: corsOptions });
  const onlineUsers = new Map();
  const roomParticipants = new Map();

  io.on('connection', (socket) => {
    console.log(`🔌 Un utilisateur s'est connecté: ${socket.id}`);

    socket.on('authenticate', (token) => {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = Number(decoded.userId);
        if (!Number.isFinite(userId)) {
          console.log("❌ Échec de l'authentification du socket: userId invalide dans le token.");
          return;
        }
        onlineUsers.set(userId, socket.id);
        console.log(`✅ Utilisateur authentifié: UserID ${userId}`);
      } catch {
        console.log("❌ Échec de l'authentification du socket.");
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Déconnexion socket: ${socket.id}`);

      // Retirer de la liste des utilisateurs en ligne
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          console.log(`🔌 Utilisateur déconnecté: UserID ${userId}`);
          break;
        }
      }

      // Nettoyer les sessions vidéo si nécessaire
      if (socket.sessionData) {
        const { sessionId, userId } = socket.sessionData;
        const room = `session:${sessionId}`;
        const set = roomParticipants.get(room);

        if (set && userId) {
          set.delete(Number(userId));
          console.log(`🎥 Utilisateur ${userId} retiré de la session ${sessionId}`);

          // Notifier les autres participants de la déconnexion
          socket.to(room).emit('session:participant-left', { userId });

          // Supprimer la room si vide
          if (set.size === 0) {
            roomParticipants.delete(room);
            console.log(`🗑️ Session ${sessionId} supprimée (vide)`);
          }
        }
      }
    });

    // --- Vidéo: rejoindre/quitter une salle pour MAJ en temps réel ---
    socket.on('video:join', ({ videoId }) => {
      try {
        if (!videoId) return;
        const room = `video:${Number(videoId)}`;
        socket.join(room);
      } catch {}
    });
    socket.on('video:leave', ({ videoId }) => {
      try {
        if (!videoId) return;
        const room = `video:${Number(videoId)}`;
        socket.leave(room);
      } catch {}
    });

    // --- Video session signaling (WebRTC) ---
    socket.on('joinSession', ({ sessionId, userId, role }) => {
      try {
        if (!sessionId) {
          console.log('❌ joinSession: sessionId manquant');
          return;
        }

        const room = `session:${sessionId}`;
        socket.join(room);

        // Stocker les métadonnées de session
        socket.sessionData = { sessionId, userId, role, joinTime: Date.now() };

        let set = roomParticipants.get(room);
        if (!set) {
          set = new Set();
          roomParticipants.set(room, set);
        }

        if (Number.isFinite(Number(userId))) {
          set.add(Number(userId));
        }

        const peers = Array.from(set).filter((id) => Number(id) !== Number(userId));

        console.log(`🎥 Utilisateur ${userId} rejoint session ${sessionId} (${peers.length} pairs)`);

        // Envoyer la liste des pairs au nouveau participant
        socket.emit('session:peers', { peers });

        // Notifier les autres participants
        socket.to(room).emit('session:participant-joined', {
          userId,
          role,
          socketId: socket.id,
          joinTime: Date.now()
        });

        // Logs de débogage
        console.log(`📊 Session ${sessionId}: ${set.size} participants totaux`);

      } catch (e) {
        console.log('❌ joinSession error:', e?.message || e);
      }
    });

    socket.on('session:getPeers', ({ sessionId }) => {
      try {
        if (!sessionId) {
          console.log('❌ session:getPeers: sessionId manquant');
          return;
        }

        const room = `session:${sessionId}`;
        const set = roomParticipants.get(room) || new Set();
        const userId = socket.sessionData?.userId;

        // Envoyer tous les participants (incluant soi-même dans le compte total)
        const allParticipants = Array.from(set);
        console.log(`📊 getPeers pour session ${sessionId}: ${allParticipants.length} participants totaux`);

        socket.emit('session:peers', { peers: allParticipants });

      } catch (e) {
        console.log('❌ session:getPeers error:', e?.message || e);
      }
    });

    socket.on('webrtc:offer', ({ sessionId, offer }) => {
      try {
        if (!sessionId || !offer) {
          console.log('❌ webrtc:offer: paramètres manquants');
          return;
        }

        const room = `session:${sessionId}`;
        console.log(`📡 Relai offre WebRTC pour session ${sessionId}`);
        socket.to(room).emit('webrtc:offer', { offer, from: socket.sessionData?.userId });

      } catch (e) {
        console.log('❌ webrtc:offer error:', e?.message || e);
      }
    });

    socket.on('webrtc:answer', ({ sessionId, answer }) => {
      try {
        if (!sessionId || !answer) {
          console.log('❌ webrtc:answer: paramètres manquants');
          return;
        }

        const room = `session:${sessionId}`;
        console.log(`📡 Relai réponse WebRTC pour session ${sessionId}`);
        socket.to(room).emit('webrtc:answer', { answer, from: socket.sessionData?.userId });

      } catch (e) {
        console.log('❌ webrtc:answer error:', e?.message || e);
      }
    });

    socket.on('webrtc:ice-candidate', ({ sessionId, candidate }) => {
      try {
        if (!sessionId || !candidate) {
          console.log('❌ webrtc:ice-candidate: paramètres manquants');
          return;
        }

        const room = `session:${sessionId}`;
        console.log(`🧊 Relai candidat ICE pour session ${sessionId}`);
        socket.to(room).emit('webrtc:ice-candidate', { candidate, from: socket.sessionData?.userId });

      } catch (e) {
        console.log('❌ webrtc:ice-candidate error:', e?.message || e);
      }
    });

    socket.on('session:chat', ({ sessionId, message }) => {
      try {
        if (!sessionId || !message) {
          console.log('❌ session:chat: paramètres manquants');
          return;
        }

        const room = `session:${sessionId}`;
        console.log(`💬 Message chat session ${sessionId}:`, message.message?.substring(0, 50));
        io.to(room).emit('session:chat', { ...message, timestamp: Date.now() });

      } catch (e) {
        console.log('❌ session:chat error:', e?.message || e);
      }
    });

    socket.on('session:sendMessage', async ({ sessionId, message }) => {
      try {
        if (!sessionId || !message) {
          console.log('❌ session:sendMessage: paramètres manquants');
          return;
        }

        const room = `session:${sessionId}`;
        const userId = socket.sessionData?.userId;

        if (!userId) {
          console.log('❌ session:sendMessage: utilisateur non authentifié');
          return;
        }

        // Récupérer le nom d'utilisateur depuis la base de données
        const prisma = require('../services/database');
        let userName = `User ${userId}`;

        try {
          const user = await prisma.user.findUnique({
            where: { id: Number(userId) },
            select: { firstName: true, lastName: true }
          });
          if (user) {
            userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || userName;
          }
        } catch (dbErr) {
          console.log('⚠️ Erreur récupération utilisateur:', dbErr?.message);
        }

        const messageData = {
          userId,
          userName,
          message,
          timestamp: new Date().toISOString()
        };

        console.log(`💬 Message de ${userName} dans session ${sessionId}:`, message.substring(0, 50));

        // Enregistrer le message dans la base de données
        try {
          await prisma.sessionMessage.create({
            data: {
              sessionId: sessionId,
              userId: Number(userId),
              userName: userName,
              message: message,
              timestamp: new Date()
            }
          });
          console.log(`✅ Message enregistré en BDD pour session ${sessionId}`);
        } catch (dbErr) {
          console.log('⚠️ Erreur enregistrement message:', dbErr?.message);
        }

        // Émettre à tous les participants de la room, y compris l'expéditeur
        io.to(room).emit('session:message', messageData);

      } catch (e) {
        console.log('❌ session:sendMessage error:', e?.message || e);
      }
    });

    socket.on('session:end', ({ sessionId }) => {
      try {
        if (!sessionId) {
          console.log('❌ session:end: sessionId manquant');
          return;
        }

        const room = `session:${sessionId}`;
        console.log(`🔚 Fin de session ${sessionId}`);

        // Notifier tous les participants
        io.to(room).emit('session:ended', { endedBy: socket.sessionData?.userId });

        // Nettoyer les participants de cette session
        const set = roomParticipants.get(room);
        if (set && socket.sessionData?.userId) {
          set.delete(Number(socket.sessionData.userId));
          if (set.size === 0) {
            roomParticipants.delete(room);
          }
        }

      } catch (e) {
        console.log('❌ session:end error:', e?.message || e);
      }
    });

    // --- VERSION SIMPLIFIÉE POUR DEBUGGING ---
    socket.on('join-video-session', ({ sessionId, userId, role }) => {
      try {
        const room = `video-${sessionId}`;
        socket.join(room);
        console.log(`🎬 ${userId} rejoint session vidéo simple ${sessionId}`);

        // Notifier les autres utilisateurs
        socket.to(room).emit('user-joined', { userId, role });

      } catch (e) {
        console.log('❌ join-video-session error:', e?.message || e);
      }
    });

    socket.on('offer', ({ sessionId, offer, to, from }) => {
      try {
        const room = `video-${sessionId}`;
        console.log(`📤 Offre de ${from} vers ${to}`);
        io.to(room).emit('offer', { offer, from });
      } catch (e) {
        console.log('❌ offer error:', e?.message || e);
      }
    });

    socket.on('answer', ({ sessionId, answer, to, from }) => {
      try {
        const room = `video-${sessionId}`;
        console.log(`📥 Réponse de ${from} vers ${to}`);
        io.to(room).emit('answer', { answer, from });
      } catch (e) {
        console.log('❌ answer error:', e?.message || e);
      }
    });

    socket.on('ice-candidate', ({ sessionId, candidate, from }) => {
      try {
        const room = `video-${sessionId}`;
        io.to(room).emit('ice-candidate', { candidate, from });
      } catch (e) {
        console.log('❌ ice-candidate error:', e?.message || e);
      }
    });
  });

  // Expose participants map for other modules (via app.set)
  return { io, onlineUsers, roomParticipants };
}

module.exports = { initSocket };
