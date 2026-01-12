require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateExistingRecordings() {
  console.log('🔄 Migration des enregistrements existants...\n');

  // Récupérer tous les appointments
  const appointments = await prisma.appointment.findMany({
    orderBy: { id: 'desc' },
    take: 20 // Les 20 derniers appointments
  });

  console.log(`📊 ${appointments.length} appointments trouvés\n`);

  // Meeting IDs depuis la plateforme VideoSDK
  const videoSDKRoomIds = [
    'nkmf-qaq9-9pwg',
    '2wbb-cnl4-szis'
  ];

  console.log(`📹 ${videoSDKRoomIds.length} enregistrements VideoSDK à associer\n`);

  // Demander à l'utilisateur d'associer manuellement
  console.log('Pour associer les enregistrements, veuillez exécuter les commandes SQL suivantes :\n');

  for (let i = 0; i < Math.min(appointments.length, videoSDKRoomIds.length); i++) {
    const appt = appointments[i];
    const roomId = videoSDKRoomIds[i];
    const sessionId = `session-${appt.id}`;

    console.log(`-- Appointment ${appt.id} (${appt.expert}, ${appt.date})`);
    console.log(`INSERT INTO video_rooms (sessionId, appointmentId, videoSDKRoomId, createdAt) VALUES ('${sessionId}', ${appt.id}, '${roomId}', datetime('now')) ON CONFLICT(sessionId) DO UPDATE SET videoSDKRoomId='${roomId}';\n`);
  }

  console.log('\n💡 Ou utilisez ce script pour associer automatiquement :');
  console.log('node migrate-existing-recordings.js --auto');

  await prisma.$disconnect();
}

// Version automatique
async function migrateAuto() {
  console.log('🔄 Migration automatique...\n');

  const videoSDKRoomIds = {
    'nkmf-qaq9-9pwg': 14, // Appointment le plus récent
    '2wbb-cnl4-szis': 13  // Appointment précédent
  };

  for (const [roomId, appointmentId] of Object.entries(videoSDKRoomIds)) {
    const sessionId = `session-${appointmentId}`;

    try {
      await prisma.videoRoom.upsert({
        where: { sessionId },
        update: { videoSDKRoomId: roomId },
        create: {
          sessionId,
          appointmentId,
          videoSDKRoomId: roomId
        }
      });
      console.log(`✅ ${sessionId} -> ${roomId}`);
    } catch (err) {
      console.log(`❌ Erreur pour ${sessionId}:`, err.message);
    }
  }

  console.log('\n✅ Migration terminée !');
  await prisma.$disconnect();
}

if (process.argv.includes('--auto')) {
  migrateAuto();
} else {
  migrateExistingRecordings();
}