/**
 * SCRIPT DE MIGRATION PHASE 2 - VIDÉOS
 *
 * Ce script migre les anciennes vidéos vers le nouveau format :
 * - type ('free' | 'premium') → videoType (NORMAL|REEL) + accessType (FREE|PAID)
 * - Définit orientation par défaut (LANDSCAPE pour vidéos normales)
 * - Définit status (PUBLISHED par défaut)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateVideos() {
  console.log('🔄 Début de la migration des vidéos Phase 2...\n');

  try {
    // 1. Récupérer toutes les vidéos existantes
    const videos = await prisma.video.findMany({
      where: {
        videoType: null // Vidéos pas encore migrées
      }
    });

    console.log(`📹 ${videos.length} vidéos à migrer\n`);

    if (videos.length === 0) {
      console.log('✅ Aucune vidéo à migrer (déjà fait ou aucune vidéo)');
      return;
    }

    let migrated = 0;

    for (const video of videos) {
      // Convertir ancien type vers nouveau format
      const accessType = video.type === 'premium' ? 'PAID' : 'FREE';

      // Par défaut, toutes les vidéos existantes sont des vidéos NORMALES (pas des Reels)
      const videoType = 'NORMAL';

      // Par défaut, orientation paysage
      const orientation = 'LANDSCAPE';

      // Par défaut, status publié (car elles existent déjà)
      const status = 'PUBLISHED';

      // Mettre à jour la vidéo
      await prisma.video.update({
        where: { id: video.id },
        data: {
          videoType,
          accessType,
          orientation,
          status,
          descriptionNormalized: video.description
            ? video.description
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toLowerCase()
            : null
        }
      });

      migrated++;

      if (migrated % 10 === 0) {
        console.log(`   ✓ ${migrated}/${videos.length} vidéos migrées...`);
      }
    }

    console.log(`\n✅ Migration terminée : ${migrated} vidéos converties\n`);
    console.log('📊 Résumé des conversions :');
    console.log(`   - 'free' → videoType: NORMAL, accessType: FREE`);
    console.log(`   - 'premium' → videoType: NORMAL, accessType: PAID`);
    console.log(`   - orientation: LANDSCAPE (par défaut)`);
    console.log(`   - status: PUBLISHED (par défaut)`);

  } catch (error) {
    console.error('❌ Erreur lors de la migration :', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter la migration
migrateVideos()
  .then(() => {
    console.log('\n🎉 Migration Phase 2 complétée avec succès !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 La migration a échoué :', error);
    process.exit(1);
  });
