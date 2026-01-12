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
 * @desc Créer une room Stream.io pour session vidéo
 * @access Private
 */
router.post('/create-room', verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.body;
    const displayName = `${req.user?.firstName || ''} ${req.user?.lastName || ''}`.trim() || 'User';
    console.log(`📨 Demande création room Stream: sessionId=${sessionId}, userId=${req.user?.id}, displayName=${displayName}`);

    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'sessionId requis' });
    }

    const callId = `deepinfluence-${sessionId}`;
    const userToken = generateStreamUserToken(req.user.id);
    const appointmentId = parseInt(String(sessionId).replace('session-', ''), 10);

    if (Number.isFinite(appointmentId)) {
      await prisma.videoRoom.upsert({
        where: { sessionId },
        update: { videoSDKRoomId: callId },
        create: { sessionId, appointmentId, videoSDKRoomId: callId }
      }).catch(() => {});
    }

    return res.json({
      success: true,
      provider: 'stream',
      roomId: callId,
      token: userToken,
      apiKey: process.env.STREAM_API_KEY,
      roomName: callId,
      displayName,
    });
  } catch (error) {
    console.error('Erreur création room Stream:', error);
    return res.status(500).json({ success: false, message: 'Erreur création room Stream', error: error?.message || String(error) });
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
router.post('/meter/heartbeat', verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.body || {};
    if (!sessionId) return res.status(400).json({ success: false, message: 'sessionId requis' });
    const apptId = parseAppointmentId(sessionId);
    if (!apptId) return res.status(400).json({ success: false, message: 'sessionId invalide' });
    const appt = await prisma.appointment.findUnique({
      where: { id: apptId },
      include: { expertRel: { select: { userId: true } } }
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
    let elapsedSec = 0; let perMinute = 0; let lastHeartbeatUser = null; let lastHeartbeatExpert = null; let lastTick = null;
    if (last) {
      try {
        const s = JSON.parse(last.description || '{}');
        elapsedSec = s.elapsedSec || 0; perMinute = s.perMinute || 0;
        lastHeartbeatUser = s.lastHeartbeatUser ? new Date(s.lastHeartbeatUser) : null;
        lastHeartbeatExpert = s.lastHeartbeatExpert ? new Date(s.lastHeartbeatExpert) : null;
        lastTick = s.lastTick ? new Date(s.lastTick) : null;
      } catch {}
    }
    // Update role heartbeat
    const isUser = appt.userId === req.user.id;
    const isExpert = appt.expertRel && appt.expertRel.userId === req.user.id;
    if (isUser) lastHeartbeatUser = now; if (isExpert) lastHeartbeatExpert = now;
    // Prefer socket presence when available
    let bothPresentNow = false;
    try {
      const rp = req.app.get('roomParticipants');
      const room = `session:${sessionId}`;
      const set = rp && rp.get(room);
      if (set) bothPresentNow = set.size >= 2;
    } catch {}
    // Fallback to heartbeat if socket presence not available
    if (!bothPresentNow) {
      bothPresentNow = (lastHeartbeatUser && (now - lastHeartbeatUser) <= 15000) && (lastHeartbeatExpert && (now - lastHeartbeatExpert) <= 15000);
    }
    const tickBase = lastTick || now;
    const deltaSec = Math.max(0, Math.min(60, Math.floor((now - tickBase) / 1000)));
    if (bothPresentNow) elapsedSec += deltaSec;
    const state = {
      sessionId,
      elapsedSec,
      perMinute,
      lastHeartbeatUser: lastHeartbeatUser ? lastHeartbeatUser.toISOString() : null,
      lastHeartbeatExpert: lastHeartbeatExpert ? lastHeartbeatExpert.toISOString() : null,
      lastTick: now.toISOString(),
      active: true
    };
    await prisma.transaction.create({ data: { userId: appt.userId, type: 'meter_state', amount: 0, coins: 0, description: JSON.stringify(state), relatedId: appt.id } });
    return res.json({ success: true, elapsedSec: state.elapsedSec, perMinute });
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

    const minutes = Math.max(10, Math.ceil(totalSec / 60));
    const escrow = appt.coins || 0;
    const usedCoins = Math.max(0, Math.min((perMinute || 0) * minutes, escrow));
    const refund = Math.max(0, escrow - usedCoins);

    // Vérifier si les conditions pour marquer comme "completed" sont remplies
    const minDuration = 60; // 60 secondes minimum
    const hadBothParticipants = (lastHeartbeatUser && lastHeartbeatExpert); // Les 2 se sont connectés
    const meetsMinDuration = totalSec >= minDuration;
    const shouldComplete = hadBothParticipants && meetsMinDuration;

    console.log(`📊 Conditions terminaison: totalSec=${totalSec}, hadBothParticipants=${!!hadBothParticipants}, shouldComplete=${shouldComplete}`);

    const result = await prisma.$transaction(async (tx) => {
      // Ne marquer comme 'completed' que si les conditions sont remplies
      const newStatus = shouldComplete ? 'completed' : 'confirmed';
      await tx.appointment.update({ where: { id: appt.id }, data: { coins: usedCoins, status: newStatus } });

      if (refund > 0) {
        await tx.user.update({ where: { id: appt.userId }, data: { coins: { increment: refund } } });
        await tx.transaction.create({ data: { userId: appt.userId, type: 'refund', amount: 0, coins: refund, description: 'Remboursement fin de session', relatedId: appt.id } });
      }
      if (usedCoins > 0 && appt.expertRel && appt.expertRel.userId) {
        await tx.user.update({ where: { id: appt.expertRel.userId }, data: { coins: { increment: usedCoins } } });
        await tx.transaction.create({ data: { userId: appt.expertRel.userId, type: 'purchase', amount: 0, coins: usedCoins, description: 'Gains session video', relatedId: appt.id } });
      }
      return { usedCoins, refund, completed: shouldComplete };
    });

    return res.json({ success: true, settled: true, minutes, perMinute, usedCoins: result.usedCoins, refund: result.refund });
  } catch (e) {
    console.error('meter/stop error:', e);
    return res.status(500).json({ success: false, message: 'Erreur arret compteur', error: e?.message || String(e) });
  }
});

module.exports = router;
