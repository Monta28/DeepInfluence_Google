const express = require('express');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { verifyToken } = require('../middleware/auth');
const prisma = require('../services/database');

const router = express.Router();

// ============================================
// JaaS (Jitsi as a Service) JWT Token Generator
// ============================================
function generateJaasJwt(user, roomName, isModerator = false) {
  const appId = process.env.JAAS_APP_ID;
  const keyId = process.env.JAAS_KEY_ID;
  const privateKey = process.env.JAAS_API_KEY?.replace(/\\n/g, '\n');

  if (!appId || !privateKey || !keyId) {
    throw new Error('JAAS_APP_ID, JAAS_KEY_ID et JAAS_API_KEY doivent être configurés');
  }

  const now = Math.floor(Date.now() / 1000);
  const exp = now + 3600; // Token valide 1 heure

  const payload = {
    aud: 'jitsi',
    iss: 'chat',
    sub: appId,
    room: '*', // Wildcard pour autoriser toutes les rooms
    exp: exp,
    nbf: now,
    context: {
      user: {
        id: String(user.id),
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Participant',
        email: user.email || '',
        avatar: user.profilePhoto || '',
        moderator: isModerator // Seul l'expert est modérateur
      },
      features: {
        livestreaming: false,
        recording: true,
        transcription: false,
        'outbound-call': false
      }
    }
  };

  return jwt.sign(payload, privateKey, {
    algorithm: 'RS256',
    header: {
      alg: 'RS256',
      typ: 'JWT',
      kid: `${appId}/${keyId}`
    }
  });
}

// Stream (getstream.io): server-side token generator for current user
const { StreamChat } = require('stream-chat');
let streamServer = null;
function getStreamServer() {
  const key = process.env.STREAM_API_KEY || '';
  const secret = process.env.STREAM_API_SECRET || '';
  if (!key || !secret) return null;
  if (!streamServer) {
    streamServer = StreamChat.getInstance(key, secret);
  }
  return streamServer;
}
function generateStreamUserToken(userId) {
  const srv = getStreamServer();
  if (!srv) throw new Error('STREAM_API_KEY et STREAM_API_SECRET doivent être configurés');
  if (!userId) throw new Error('userId requis pour générer un token Stream');
  return srv.createToken(String(userId));
}

/**
 * @route POST /api/video/create-room
 * @desc Créer une room JaaS (Jitsi as a Service) pour session vidéo
 * @access Private
 */
router.post('/create-room', verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.body;
    const user = req.user;
    const displayName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User';
    console.log(`📨 Demande création room JaaS: sessionId=${sessionId}, userId=${user?.id}, displayName=${displayName}`);

    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'sessionId requis' });
    }

    const appId = process.env.JAAS_APP_ID;
    if (!appId) {
      return res.status(500).json({ success: false, message: 'JaaS non configuré sur le serveur (JAAS_APP_ID manquant)' });
    }

    // Vérifier si l'utilisateur est l'expert pour cette session
    let isModerator = false;
    let hourlyRate = 0;
    const appointmentId = parseAppointmentId(sessionId);

    if (Number.isFinite(appointmentId)) {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { expertRel: { select: { userId: true, hourlyRate: true } } }
      });

      if (appointment && appointment.expertRel) {
        isModerator = appointment.expertRel.userId === user.id;
        hourlyRate = appointment.expertRel.hourlyRate || 0;
      }

      // Enregistrer la room
      await prisma.videoRoom.upsert({
        where: { sessionId },
        update: { videoSDKRoomId: `deepinfluence-${sessionId}` },
        create: { sessionId, appointmentId, videoSDKRoomId: `deepinfluence-${sessionId}` }
      }).catch(() => {});
    }

    // Si pas de rendez-vous trouvé, vérifier si l'utilisateur est expert
    if (!isModerator && user.userType === 'expert') {
      isModerator = true;
    }

    const perMinute = Math.max(1, Math.ceil(hourlyRate / 60));
    const roomName = `deepinfluence-${sessionId}`;

    // Générer le token JWT JaaS
    const token = generateJaasJwt(user, roomName, isModerator);

    console.log(`📹 Room JaaS créée: user=${user.id}, room=${roomName}, moderator=${isModerator}, rate=${hourlyRate}/h (${perMinute}/min)`);

    return res.json({
      success: true,
      provider: 'jaas',
      token,
      roomName,
      roomId: roomName,
      appId,
      domain: '8x8.vc',
      isModerator,
      hourlyRate,
      perMinute,
      displayName
    });
  } catch (error) {
    console.error('Erreur création room JaaS:', error);
    return res.status(500).json({ success: false, message: 'Erreur création room JaaS', error: error?.message || String(error) });
  }
});

/**
 * @route POST /api/video/jaas-token
 * @desc Générer un token JWT pour JaaS (Jitsi as a Service)
 * @access Private
 */
router.post('/jaas-token', verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.body;
    const user = req.user;

    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'sessionId requis' });
    }

    const appId = process.env.JAAS_APP_ID;
    if (!appId) {
      return res.status(500).json({ success: false, message: 'JaaS non configuré sur le serveur' });
    }

    // Vérifier si l'utilisateur est l'expert pour cette session
    let isModerator = false;
    let hourlyRate = 0;
    const appointmentId = parseAppointmentId(sessionId);

    if (Number.isFinite(appointmentId)) {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { expertRel: { select: { userId: true, hourlyRate: true } } }
      });

      if (appointment && appointment.expertRel) {
        // L'expert est modérateur
        isModerator = appointment.expertRel.userId === user.id;
        // Récupérer le tarif horaire
        hourlyRate = appointment.expertRel.hourlyRate || 0;
      }
    }

    // Si pas de rendez-vous trouvé, vérifier si l'utilisateur est expert (rôle EXPERT)
    if (!isModerator && user.role === 'EXPERT') {
      isModerator = true;
    }

    // Calculer le tarif par minute
    const perMinute = Math.max(1, Math.ceil(hourlyRate / 60));

    // Nom de la room basé sur sessionId
    const roomName = `deepinfluence-${sessionId}`;

    // Générer le token JWT avec le statut modérateur
    const token = generateJaasJwt(user, roomName, isModerator);

    console.log(`📹 Token JaaS généré pour user=${user.id}, room=${roomName}, moderator=${isModerator}, rate=${hourlyRate}/h (${perMinute}/min)`);

    return res.json({
      success: true,
      provider: 'jaas',
      token,
      roomName,
      appId,
      domain: '8x8.vc',
      isModerator,
      hourlyRate,
      perMinute
    });
  } catch (error) {
    console.error('Erreur génération token JaaS:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur génération token JaaS',
      error: error?.message || String(error)
    });
  }
});

function parseAppointmentId(sessionId) {
  const m = String(sessionId || '').match(/(\d+)/);
  return m ? parseInt(m[1], 10) : NaN;
}

/**
 * @route POST /api/video/formation-token
 * @desc Générer un token JWT JaaS pour rejoindre une formation
 * @access Private (inscrit à la formation ou propriétaire)
 */
router.post('/formation-token', verifyToken, async (req, res) => {
  try {
    const { formationId } = req.body;
    const user = req.user;

    if (!formationId) {
      return res.status(400).json({ success: false, message: 'formationId requis' });
    }

    const appId = process.env.JAAS_APP_ID;
    if (!appId) {
      return res.status(500).json({ success: false, message: 'JaaS non configuré sur le serveur' });
    }

    // Récupérer la formation avec ses enrollments
    const formation = await prisma.formation.findUnique({
      where: { id: parseInt(formationId) },
      include: {
        expert: { select: { userId: true } },
        enrollments: { select: { userId: true } }
      }
    });

    if (!formation) {
      return res.status(404).json({ success: false, message: 'Formation non trouvée' });
    }

    // Vérifier si l'utilisateur est inscrit ou est le propriétaire
    const isOwner = formation.expert && formation.expert.userId === user.id;
    const isEnrolled = formation.enrollments.some(e => e.userId === user.id);

    if (!isOwner && !isEnrolled) {
      return res.status(403).json({ success: false, message: 'Vous devez être inscrit à cette formation pour accéder à la vidéoconférence' });
    }

    // Le propriétaire (expert) est modérateur
    const isModerator = isOwner;

    // Utiliser le roomId stocké dans videoConferenceLink
    const roomName = `deepinfluence-${formation.videoConferenceLink || 'formation-' + formationId}`;

    // Générer le token JWT avec le statut modérateur
    const token = generateJaasJwt(user, roomName, isModerator);

    console.log(`📹 Token JaaS formation généré pour user=${user.id}, formation=${formationId}, room=${roomName}, moderator=${isModerator}`);

    return res.json({
      success: true,
      provider: 'jaas',
      token,
      roomName,
      appId,
      domain: '8x8.vc',
      isModerator,
      formationTitle: formation.title
    });
  } catch (error) {
    console.error('Erreur génération token JaaS formation:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur génération token JaaS',
      error: error?.message || String(error)
    });
  }
});

// Get chat history for a session
router.get('/chat-history/:sessionId', verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'sessionId requis' });
    }

    const messages = await prisma.sessionMessage.findMany({
      where: { sessionId },
      orderBy: { timestamp: 'asc' }
    });

    return res.json({
      success: true,
      messages: messages.map(m => ({
        userId: m.userId,
        userName: m.userName,
        message: m.message,
        timestamp: m.timestamp
      }))
    });
  } catch (e) {
    console.error('Erreur récupération historique chat:', e);
    return res.status(500).json({
      success: false,
      message: 'Erreur récupération historique',
      error: e?.message || String(e)
    });
  }
});

// Start per-minute coin metering
router.post('/meter/start', verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.body || {};
    if (!sessionId) return res.status(400).json({ success: false, message: 'sessionId requis' });
    const apptId = parseAppointmentId(sessionId);
    if (!apptId) return res.status(400).json({ success: false, message: 'sessionId invalide' });

    const appt = await prisma.appointment.findUnique({
      where: { id: apptId },
      include: { expertRel: { select: { id: true, userId: true, hourlyRate: true } } }
    });
    if (!appt) {
      console.log(`❌ Appointment not found: ID ${apptId} from sessionId ${sessionId}`);
      return res.status(404).json({ success: false, message: `Rendez-vous ${apptId} introuvable. Veuillez utiliser un rendez-vous existant.` });
    }
    const isUser = appt.userId === req.user.id;
    const isExpert = appt.expertRel && appt.expertRel.userId === req.user.id;
    if (!isUser && !isExpert) return res.status(403).json({ success: false, message: 'Acces refuse' });
    if (appt.status !== 'confirmed') return res.status(400).json({ success: false, message: 'Rendez-vous non confirme' });

    const perMinute = Math.max(1, Math.ceil(((appt.expertRel && appt.expertRel.hourlyRate) || 0) / 60));
    // If there is an active state, return it instead of resetting
    const last = await prisma.transaction.findFirst({ where: { userId: appt.userId, type: 'meter_state', relatedId: appt.id }, orderBy: { createdAt: 'desc' } });
    if (last) {
      try {
        const s = JSON.parse(last.description || '{}');
        if (s.active && s.sessionId === sessionId) {
          return res.json({ success: true, perMinute: s.perMinute || perMinute, started: true, elapsedSec: s.elapsedSec || 0 });
        }
      } catch {}
    }
    const now = new Date();
    const state = {
      sessionId,
      elapsedSec: 0,
      perMinute,
      lastHeartbeatUser: isUser ? now.toISOString() : null,
      lastHeartbeatExpert: isExpert ? now.toISOString() : null,
      lastTick: now.toISOString(),
      active: true
    };
    await prisma.transaction.create({ data: { userId: appt.userId, type: 'meter_state', amount: 0, coins: 0, description: JSON.stringify(state), relatedId: appt.id } });
    return res.json({ success: true, perMinute, started: true, elapsedSec: 0 });
  } catch (e) {
    console.error('meter/start error:', e);
    return res.status(500).json({ success: false, message: 'Erreur demarrage compteur', error: e?.message || String(e) });
  }
});

// Heartbeat: persist elapsed seconds periodically (resilient to restarts)
// Includes pause/resume logic and wait timer when user disconnects
router.post('/meter/heartbeat', verifyToken, async (req, res) => {
  try {
    const { sessionId, inJitsiCall, otherParticipantInCall } = req.body || {};
    if (!sessionId) return res.status(400).json({ success: false, message: 'sessionId requis' });
    const apptId = parseAppointmentId(sessionId);
    if (!apptId) return res.status(400).json({ success: false, message: 'sessionId invalide' });
    const appt = await prisma.appointment.findUnique({
      where: { id: apptId },
      include: {
        expertRel: { select: { userId: true, hourlyRate: true } },
        user: { select: { coins: true } }
      }
    });
    if (!appt) {
      console.log(`❌ Appointment not found: ID ${apptId} from sessionId ${sessionId}`);
      return res.status(404).json({ success: false, message: `Rendez-vous ${apptId} introuvable. Veuillez utiliser un rendez-vous existant.` });
    }
    const now = new Date();

    // Read last state
    const last = await prisma.transaction.findFirst({
      where: { userId: appt.userId, type: 'meter_state', relatedId: appt.id },
      orderBy: { createdAt: 'desc' }
    });

    let elapsedSec = 0;
    let perMinute = Math.max(1, Math.ceil(((appt.expertRel && appt.expertRel.hourlyRate) || 0) / 60));
    let lastHeartbeatUser = null;
    let lastHeartbeatExpert = null;
    let lastTick = null;
    let pausedAt = null; // Timestamp when session was paused
    let waitTimerStartedAt = null; // When wait timer started

    if (last) {
      try {
        const s = JSON.parse(last.description || '{}');
        elapsedSec = s.elapsedSec || 0;
        perMinute = s.perMinute || perMinute;
        lastHeartbeatUser = s.lastHeartbeatUser ? new Date(s.lastHeartbeatUser) : null;
        lastHeartbeatExpert = s.lastHeartbeatExpert ? new Date(s.lastHeartbeatExpert) : null;
        lastTick = s.lastTick ? new Date(s.lastTick) : null;
        pausedAt = s.pausedAt ? new Date(s.pausedAt) : null;
        waitTimerStartedAt = s.waitTimerStartedAt ? new Date(s.waitTimerStartedAt) : null;
      } catch {}
    }

    // Update role heartbeat
    const isUser = appt.userId === req.user.id;
    const isExpert = appt.expertRel && appt.expertRel.userId === req.user.id;
    if (isUser) lastHeartbeatUser = now;
    if (isExpert) lastHeartbeatExpert = now;

    // Check presence (15 sec timeout for heartbeat)
    const HEARTBEAT_TIMEOUT = 15000;
    const userHeartbeatOk = lastHeartbeatUser && (now - lastHeartbeatUser) <= HEARTBEAT_TIMEOUT;
    const expertHeartbeatOk = lastHeartbeatExpert && (now - lastHeartbeatExpert) <= HEARTBEAT_TIMEOUT;

    // Déterminer la présence JITSI réelle basée sur les informations du frontend
    // Si le participant qui envoie le heartbeat dit que l'autre n'est pas dans Jitsi,
    // alors l'autre est considéré comme absent même s'il envoie encore des heartbeats
    let userInJitsi = userHeartbeatOk;
    let expertInJitsi = expertHeartbeatOk;

    // Utiliser l'info Jitsi si disponible
    if (inJitsiCall !== undefined) {
      // Le participant qui envoie le heartbeat est dans Jitsi
      if (isUser) {
        userInJitsi = inJitsiCall === true;
      } else if (isExpert) {
        expertInJitsi = inJitsiCall === true;
      }
    }

    if (otherParticipantInCall !== undefined) {
      // Info sur l'autre participant (vue depuis celui qui envoie le heartbeat)
      if (isUser) {
        // User dit si expert est dans Jitsi
        expertInJitsi = otherParticipantInCall === true;
      } else if (isExpert) {
        // Expert dit si user est dans Jitsi
        userInJitsi = otherParticipantInCall === true;
      }
    }

    const userPresent = userInJitsi;
    const expertPresent = expertInJitsi;
    const bothPresent = userPresent && expertPresent;

    console.log(`💓 Heartbeat ${sessionId}: isUser=${isUser}, isExpert=${isExpert}, inJitsi=${inJitsiCall}, otherInCall=${otherParticipantInCall} → user=${userPresent}, expert=${expertPresent}, both=${bothPresent}`);

    // Calculate appointment duration and remaining time
    const appointmentDuration = appt.duration || 30; // Default 30 min if not specified
    const appointmentDurationSec = appointmentDuration * 60;
    const remainingAppointmentSec = Math.max(0, appointmentDurationSec - elapsedSec);

    // Wait timer calculation: MIN(remaining time, 1/3 of appointment duration)
    const maxWaitSec = Math.floor(appointmentDurationSec / 3);
    const waitTimerDuration = Math.min(remainingAppointmentSec, maxWaitSec);

    // State flags
    let isPaused = false;
    let waitTimerActive = false;
    let waitTimerRemainingSec = 0;
    let shouldAutoClose = false;
    let autoCloseReason = null;

    // Track who disconnected for wait timer
    let disconnectedParty = null; // 'user' or 'expert'

    // LOGIC: Timer only runs when BOTH participants are present
    if (bothPresent) {
      // Both present - timer runs normally, clear pause state
      const tickBase = lastTick || now;
      const deltaSec = Math.max(0, Math.min(60, Math.floor((now - tickBase) / 1000)));
      elapsedSec += deltaSec;
      pausedAt = null;
      waitTimerStartedAt = null;
      console.log(`✅ Session ${sessionId}: Both present, timer running (${Math.floor(elapsedSec/60)}m${elapsedSec%60}s)`);
    } else if (expertPresent && !userPresent) {
      // Expert present but user disconnected - PAUSE and start wait timer
      isPaused = true;
      disconnectedParty = 'user';

      if (!waitTimerStartedAt) {
        waitTimerStartedAt = now;
        pausedAt = now;
        console.log(`⏸️ Session ${sessionId}: USER disconnected, timer PAUSED at ${Math.floor(elapsedSec/60)}m${elapsedSec%60}s`);
        console.log(`⏳ Wait timer started: ${Math.floor(waitTimerDuration/60)}m${waitTimerDuration%60}s max`);
      }

      const waitElapsed = Math.floor((now - waitTimerStartedAt) / 1000);
      waitTimerRemainingSec = Math.max(0, waitTimerDuration - waitElapsed);
      waitTimerActive = true;

      if (waitTimerRemainingSec <= 0) {
        shouldAutoClose = true;
        autoCloseReason = 'userWaitTimerExpired';
        console.log(`🛑 Session ${sessionId}: User wait timer expired! Auto-closing session.`);
      }
    } else if (!expertPresent && userPresent) {
      // User present but expert disconnected - PAUSE only (no wait timer, no auto-close)
      // L'expert qui se déconnecte ne doit pas pénaliser le client
      isPaused = true;
      disconnectedParty = 'expert';

      if (!pausedAt) {
        pausedAt = now;
        console.log(`⏸️ Session ${sessionId}: EXPERT disconnected, timer PAUSED at ${Math.floor(elapsedSec/60)}m${elapsedSec%60}s`);
        console.log(`⏳ Waiting for expert to reconnect (no time limit for client)`);
      }
      // PAS de wait timer pour déconnexion expert - le client attend sans limite
      waitTimerActive = false;
      waitTimerRemainingSec = 0;
    } else {
      // Neither present - pause without wait timer (both disconnected)
      isPaused = true;
      if (!pausedAt) pausedAt = now;
      // Reset wait timer when both disconnect
      waitTimerStartedAt = null;
    }

    // Calculate billing info
    const escrowCoins = appt.coins || 0;
    const elapsedMinutes = Math.ceil(elapsedSec / 60);
    const usedCoins = Math.min(perMinute * elapsedMinutes, escrowCoins);
    const remainingCoins = Math.max(0, escrowCoins - usedCoins);
    const remainingMinutes = perMinute > 0 ? Math.floor(remainingCoins / perMinute) : 0;
    const remainingSec = remainingMinutes * 60;

    // Warning levels
    const WARNING_THRESHOLD_MIN = 5;
    const CRITICAL_THRESHOLD_MIN = 2;
    let warning = null;
    let shouldStop = shouldAutoClose;

    if (shouldAutoClose) {
      warning = autoCloseReason;
    } else if (remainingMinutes <= 0 && elapsedSec > 60) {
      warning = 'outOfCoins';
      shouldStop = true;
      console.log(`⚠️ Session ${sessionId}: Client à court de coins! Arrêt forcé.`);
    } else if (remainingMinutes <= CRITICAL_THRESHOLD_MIN && !isPaused) {
      warning = 'critical';
    } else if (remainingMinutes <= WARNING_THRESHOLD_MIN && !isPaused) {
      warning = 'low';
    } else if (isPaused && waitTimerActive && disconnectedParty === 'user') {
      warning = 'userDisconnected';
    } else if (isPaused && waitTimerActive && disconnectedParty === 'expert') {
      warning = 'expertDisconnected';
    }

    const state = {
      sessionId,
      elapsedSec,
      perMinute,
      lastHeartbeatUser: lastHeartbeatUser ? lastHeartbeatUser.toISOString() : null,
      lastHeartbeatExpert: lastHeartbeatExpert ? lastHeartbeatExpert.toISOString() : null,
      lastTick: now.toISOString(),
      pausedAt: pausedAt ? pausedAt.toISOString() : null,
      waitTimerStartedAt: waitTimerStartedAt ? waitTimerStartedAt.toISOString() : null,
      active: !shouldStop
    };
    await prisma.transaction.create({ data: { userId: appt.userId, type: 'meter_state', amount: 0, coins: 0, description: JSON.stringify(state), relatedId: appt.id } });

    return res.json({
      success: true,
      elapsedSec: state.elapsedSec,
      perMinute,
      // Billing info
      escrowCoins,
      usedCoins,
      remainingCoins,
      remainingMinutes,
      remainingSec,
      // Pause/Wait state
      isPaused,
      userPresent,
      expertPresent,
      disconnectedParty,
      waitTimerActive,
      waitTimerRemainingSec,
      waitTimerDuration,
      // Status
      warning,
      shouldStop
    });
  } catch (e) {
    console.error('meter/heartbeat error:', e);
    return res.status(500).json({ success: false, message: 'Erreur heartbeat compteur', error: e?.message || String(e) });
  }
});

// Stop metering and settle coins
router.post('/meter/stop', verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.body || {};
    if (!sessionId) return res.status(400).json({ success: false, message: 'sessionId requis' });
    const apptId = parseAppointmentId(sessionId);
    const appt = await prisma.appointment.findUnique({ where: { id: apptId }, include: { expertRel: { select: { id: true, userId: true, hourlyRate: true } } } });
    if (!appt) {
      console.log(`❌ Appointment not found: ID ${apptId} from sessionId ${sessionId}`);
      return res.status(404).json({ success: false, message: `Rendez-vous ${apptId} introuvable. Veuillez utiliser un rendez-vous existant.` });
    }

    // Read latest state to compute elapsed
    const last = await prisma.transaction.findFirst({ where: { userId: appt.userId, type: 'meter_state', relatedId: appt.id }, orderBy: { createdAt: 'desc' } });
    let elapsedSec = 0; let perMinute = Math.max(1, Math.ceil(((appt.expertRel && appt.expertRel.hourlyRate) || 0) / 60)); let lastHeartbeatUser = null; let lastHeartbeatExpert = null; let lastTick = null;
    if (last) {
      try {
        const s = JSON.parse(last.description || '{}');
        elapsedSec = s.elapsedSec || 0; perMinute = s.perMinute || perMinute;
        lastHeartbeatUser = s.lastHeartbeatUser ? new Date(s.lastHeartbeatUser) : null;
        lastHeartbeatExpert = s.lastHeartbeatExpert ? new Date(s.lastHeartbeatExpert) : null;
        lastTick = s.lastTick ? new Date(s.lastTick) : null;
      } catch {}
    }
    const now = new Date();
    // Prefer socket presence
    let bothPresentNow = false;
    try {
      const rp = req.app.get('roomParticipants');
      const room = `session:${sessionId}`;
      const set = rp && rp.get(room);
      if (set) bothPresentNow = set.size >= 2;
    } catch {}
    if (!bothPresentNow) {
      bothPresentNow = (lastHeartbeatUser && (now - lastHeartbeatUser) <= 15000) && (lastHeartbeatExpert && (now - lastHeartbeatExpert) <= 15000);
    }
    const tickBase = lastTick || now;
    const deltaSec = Math.max(0, Math.min(60, Math.floor((now - tickBase) / 1000)));
    const totalSec = elapsedSec + (bothPresentNow ? deltaSec : 0);
    // Persist final inactive state
    await prisma.transaction.create({ data: { userId: appt.userId, type: 'meter_state', amount: 0, coins: 0, description: JSON.stringify({ sessionId, elapsedSec: totalSec, perMinute, lastHeartbeatUser: lastHeartbeatUser ? lastHeartbeatUser.toISOString() : null, lastHeartbeatExpert: lastHeartbeatExpert ? lastHeartbeatExpert.toISOString() : null, lastTick: now.toISOString(), active: false }), relatedId: appt.id } });

    // Calculer les minutes facturées (minimum 1 minute si session valide)
    const minutes = totalSec > 0 ? Math.max(1, Math.ceil(totalSec / 60)) : 0;
    const escrow = appt.coins || 0;
    const usedCoins = Math.max(0, Math.min((perMinute || 0) * minutes, escrow));
    const refund = Math.max(0, escrow - usedCoins);

    // Vérifier si les conditions pour marquer comme "completed" sont remplies
    const minDuration = 60; // 60 secondes minimum
    const hadBothParticipants = (lastHeartbeatUser && lastHeartbeatExpert); // Les 2 se sont connectés
    const meetsMinDuration = totalSec >= minDuration;
    const shouldComplete = hadBothParticipants && meetsMinDuration;

    console.log(`📊 Fin session ${sessionId}:`);
    console.log(`   - Durée: ${Math.floor(totalSec / 60)}m ${totalSec % 60}s (${minutes} min facturées)`);
    console.log(`   - Tarif: ${perMinute} coins/min`);
    console.log(`   - Escrow: ${escrow} coins | Utilisés: ${usedCoins} coins | Remboursé: ${refund} coins`);
    console.log(`   - Participants présents: ${!!hadBothParticipants} | Statut: ${shouldComplete ? 'completed' : 'confirmed'}`);

    const result = await prisma.$transaction(async (tx) => {
      // Ne marquer comme 'completed' que si les conditions sont remplies
      const newStatus = shouldComplete ? 'completed' : 'confirmed';
      await tx.appointment.update({ where: { id: appt.id }, data: { coins: usedCoins, status: newStatus } });

      // Rembourser le client si des coins restent
      if (refund > 0) {
        await tx.user.update({ where: { id: appt.userId }, data: { coins: { increment: refund } } });
        await tx.transaction.create({
          data: {
            userId: appt.userId,
            type: 'refund',
            amount: 0,
            coins: refund,
            description: `Remboursement session #${appt.id} (${minutes} min utilisées sur ${Math.ceil(escrow / perMinute)} min réservées)`,
            relatedId: appt.id
          }
        });
        console.log(`💰 Remboursement: ${refund} coins -> Client #${appt.userId}`);
      }

      // Transférer les coins utilisés à l'expert
      if (usedCoins > 0 && appt.expertRel && appt.expertRel.userId) {
        await tx.user.update({ where: { id: appt.expertRel.userId }, data: { coins: { increment: usedCoins } } });
        await tx.transaction.create({
          data: {
            userId: appt.expertRel.userId,
            type: 'bonus', // 'bonus' car c'est un gain pour l'expert
            amount: 0,
            coins: usedCoins,
            description: `Gains session vidéo #${appt.id} (${minutes} min à ${perMinute} coins/min)`,
            relatedId: appt.id
          }
        });
        console.log(`💸 Paiement: ${usedCoins} coins -> Expert #${appt.expertRel.userId}`);
      }

      return { usedCoins, refund, completed: shouldComplete, expertId: appt.expertRel?.userId };
    });

    // Notifier via socket si disponible
    try {
      const io = req.app.get('io');
      if (io) {
        // Notifier le client
        io.to(`user:${appt.userId}`).emit('coinUpdate', { coins: refund, type: 'refund' });
        // Notifier l'expert
        if (result.expertId) {
          io.to(`user:${result.expertId}`).emit('coinUpdate', { coins: usedCoins, type: 'earning' });
        }
      }
    } catch (e) {
      console.log('Socket notification failed:', e.message);
    }

    return res.json({
      success: true,
      settled: true,
      // Détails de la session
      totalSec,
      minutes,
      perMinute,
      // Détails financiers
      escrow,
      usedCoins: result.usedCoins,
      refund: result.refund,
      // Statut
      completed: result.completed
    });
  } catch (e) {
    console.error('meter/stop error:', e);
    return res.status(500).json({ success: false, message: 'Erreur arret compteur', error: e?.message || String(e) });
  }
});

module.exports = router;
