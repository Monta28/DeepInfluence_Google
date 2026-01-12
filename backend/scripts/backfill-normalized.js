// Backfill normalized (accent-insensitive, lowercase) columns for search
// Usage: node scripts/backfill-normalized.js

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const normalize = (s) => (s ? s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase() : s);

async function backfillExperts() {
  const rows = await prisma.expert.findMany({ select: { id: true, name: true, specialty: true, nameNormalized: true, specialtyNormalized: true } });
  const updates = [];
  for (const r of rows) {
    const nameN = normalize(r.name);
    const specN = normalize(r.specialty);
    if (r.nameNormalized !== nameN || r.specialtyNormalized !== specN) {
      updates.push(
        prisma.expert.update({ where: { id: r.id }, data: { nameNormalized: nameN, specialtyNormalized: specN } })
      );
    }
  }
  if (updates.length) await prisma.$transaction(updates);
  return updates.length;
}

async function backfillFormations() {
  const rows = await prisma.formation.findMany({
    select: { id: true, title: true, instructor: true, description: true, titleNormalized: true, instructorNormalized: true, descriptionNormalized: true },
  });
  const updates = [];
  for (const r of rows) {
    const titleN = normalize(r.title);
    const instrN = normalize(r.instructor);
    const descN = normalize(r.description);
    if (r.titleNormalized !== titleN || r.instructorNormalized !== instrN || r.descriptionNormalized !== descN) {
      updates.push(
        prisma.formation.update({ where: { id: r.id }, data: { titleNormalized: titleN, instructorNormalized: instrN, descriptionNormalized: descN } })
      );
    }
  }
  if (updates.length) await prisma.$transaction(updates);
  return updates.length;
}

async function backfillVideos() {
  const rows = await prisma.video.findMany({
    select: { id: true, title: true, expert: true, titleNormalized: true, expertNormalized: true },
  });
  const updates = [];
  for (const r of rows) {
    const titleN = normalize(r.title);
    const expertN = normalize(r.expert);
    if (r.titleNormalized !== titleN || r.expertNormalized !== expertN) {
      updates.push(prisma.video.update({ where: { id: r.id }, data: { titleNormalized: titleN, expertNormalized: expertN } }));
    }
  }
  if (updates.length) await prisma.$transaction(updates);
  return updates.length;
}

async function main() {
  console.log('🔎 Backfilling normalized search columns...');
  const [e, f, v] = await Promise.all([backfillExperts(), backfillFormations(), backfillVideos()]);
  console.log(`✅ Done. Updated: experts=${e}, formations=${f}, videos=${v}`);
}

main()
  .catch((e) => {
    console.error('❌ Backfill failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
