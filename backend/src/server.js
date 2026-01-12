// backend/src/server.js
const express = require('express');
const path = require('path');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const passport = require('passport');
require('dotenv').config();

const { initSocket } = require('./services/socketService');
const corsOptions = require('./config/cors');
const rateLimiter = require('./config/rateLimiter');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const expertRoutes = require('./routes/experts');
const messageRoutes = require('./routes/messages');
const formationRoutes = require('./routes/formations');
const videoRoutes = require('./routes/videos');
const appointmentRoutes = require('./routes/appointments');
const statsRoutes = require('./routes/stats'); 
const reviewRoutes = require('./routes/reviews');
const uploadRoutes = require('./routes/upload');
const notificationRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/admin');
const favoritesRoutes = require('./routes/favorites');
const assetsRoutes = require('./routes/assets');
const videoSessionRoutes = require('./routes/videoSessions');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);

// Initialiser Socket.io via un service dédié
const { io, onlineUsers, roomParticipants } = initSocket(server, corsOptions);
app.set('io', io);
app.set('onlineUsers', onlineUsers);
app.set('roomParticipants', roomParticipants);

// Middlewares globaux
// Derrière un proxy (Render), faire confiance aux en-têtes X-Forwarded-For pour l'IP réelle
app.set('trust proxy', 1);
app.use(cors(corsOptions));
// Autoriser le chargement cross-origin des images/ressources statiques
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(passport.initialize());
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}
// Limiteur de requêtes appliqué uniquement en production
if (process.env.NODE_ENV === 'production') {
  app.use('/api/', rateLimiter);
}

// Fichiers statiques (images, uploads)
const publicDir = path.join(__dirname, '..', 'public');
app.use('/images', express.static(path.join(publicDir, 'images')));
app.use('/uploads', express.static(path.join(publicDir, 'uploads')));

// Rappels de rendez-vous (jour J)
const prisma = require('./services/database');
const remindedAppointments = new Set();
async function checkAppointmentReminders() {
  try {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = `${now.getMonth() + 1}`.padStart(2, '0');
    const dd = `${now.getDate()}`.padStart(2, '0');
    const today = `${yyyy}-${mm}-${dd}`;
    const upcoming = await prisma.appointment.findMany({
      where: { date: today, status: 'confirmed' },
      include: { expertRel: { select: { userId: true, name: true } } }
    });
    const io = app.get('io');
    const onlineUsers = app.get('onlineUsers');
    for (const appt of upcoming) {
      const start = new Date(`${appt.date}T${appt.time}:00`);
      const diffMin = Math.round((start.getTime() - now.getTime()) / 60000);
      if (diffMin <= 15 && diffMin >= 0 && !remindedAppointments.has(appt.id)) {
        remindedAppointments.add(appt.id);
        // Créer notifications
        await prisma.notification.createMany({
          data: [
            {
              userId: appt.userId,
              title: 'Rappel rendez-vous',
              message: `Votre rendez-vous avec ${appt.expert} est à ${appt.time}.`,
              type: 'appointment',
              actionUrl: '/dashboard/appointments'
            },
            {
              userId: appt.expertRel.userId,
              title: 'Rappel rendez-vous',
              message: `Rendez-vous avec un client à ${appt.time}.`,
              type: 'appointment',
              actionUrl: '/dashboard/appointments'
            }
          ]
        });
        // Emit temps réel
        const userSock = onlineUsers.get(appt.userId);
        if (userSock) io.to(userSock).emit('appointmentReminder', { appointmentId: appt.id, time: appt.time });
        const expertSock = onlineUsers.get(appt.expertRel.userId);
        if (expertSock) io.to(expertSock).emit('appointmentReminder', { appointmentId: appt.id, time: appt.time });
      }
    }
  } catch (e) {
    console.log('Reminder check error:', e?.message || e);
  }
}
setInterval(checkAppointmentReminders, 60 * 1000);

// Rappels formations (30 minutes avant)
const remindedFormations = new Set(); // key: `${formationId}:${date}`
async function checkFormationReminders() {
  try {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = `${now.getMonth() + 1}`.padStart(2, '0');
    const dd = `${now.getDate()}`.padStart(2, '0');
    const today = `${yyyy}-${mm}-${dd}`;
    // Récupérer formations du jour avec inscriptions
    const forms = await prisma.formation.findMany({
      where: { nextSession: today },
      include: { enrollments: { select: { userId: true } } }
    });
    const io = app.get('io');
    const onlineUsers = app.get('onlineUsers');
    for (const f of forms) {
      // Essayer d'extraire une heure de début depuis schedule (e.g., "Mardi 18h - 20h")
      const s = f.schedule || '';
      const m = s.match(/(\d{1,2})\s*h\s*(\d{0,2})?/i);
      if (!m) continue;
      const h = String(parseInt(m[1] || '0', 10)).padStart(2, '0');
      const min = String(parseInt(m[2] || '0', 10)).padStart(2, '0');
      const start = new Date(`${today}T${h}:${min}:00`);
      const diffMin = Math.round((start.getTime() - now.getTime()) / 60000);
      const key = `${f.id}:${today}`;
      if (diffMin <= 30 && diffMin >= 0 && !remindedFormations.has(key)) {
        remindedFormations.add(key);
        try {
          // Créer notifications pour les inscrits
          const notifData = f.enrollments.map(e => ({
            userId: e.userId,
            title: 'Rappel formation',
            message: `Votre formation "${f.title}" commence à ${h}h${min !== '00' ? min : ''}.`,
            type: 'formation',
            actionUrl: '/dashboard/formations'
          }));
          if (notifData.length > 0) await prisma.notification.createMany({ data: notifData });
          // Emit socket aux inscrits
          for (const e of f.enrollments) {
            const sockId = onlineUsers?.get(e.userId);
            if (sockId) io.to(sockId).emit('formationReminder', { formationId: f.id, time: `${h}:${min}` });
          }
        } catch {}
      }
    }
  } catch (e) {
    console.log('Formation reminder check error:', e?.message || e);
  }
}
setInterval(checkFormationReminders, 60 * 1000);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/experts', expertRoutes);
app.use('/api/formations', formationRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/stats', statsRoutes); 
app.use('/api/reviews', reviewRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/assets', assetsRoutes);
app.use('/api/video', videoSessionRoutes);

// Gestion des erreurs
app.use(errorHandler);
app.use('*', (req, res) =>
  res.status(404).json({ success: false, message: 'Route non trouvée' })
);

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📊 Environnement : ${process.env.NODE_ENV}`);
});
