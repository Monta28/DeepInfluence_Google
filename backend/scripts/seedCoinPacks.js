/**
 * SCRIPT DE SEED - COIN PACKS
 *
 * Crée les packs de coins par défaut pour le système de paiement Flouci
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const defaultCoinPacks = [
  {
    name: 'Starter',
    coins: 100,
    priceTND: 5.000,  // 5 TND
    bonus: 0,
    popular: false,
    active: true
  },
  {
    name: 'Basic',
    coins: 250,
    priceTND: 12.000,  // 12 TND
    bonus: 10,  // +10 coins bonus
    popular: false,
    active: true
  },
  {
    name: 'Pro',
    coins: 500,
    priceTND: 20.000,  // 20 TND
    bonus: 50,  // +50 coins bonus
    popular: true,  // Pack recommandé
    active: true
  },
  {
    name: 'Premium',
    coins: 1000,
    priceTND: 35.000,  // 35 TND
    bonus: 150,  // +150 coins bonus
    popular: false,
    active: true
  },
  {
    name: 'Ultimate',
    coins: 2500,
    priceTND: 80.000,  // 80 TND
    bonus: 500,  // +500 coins bonus
    popular: false,
    active: true
  }
];

async function seedCoinPacks() {
  console.log('🪙  Début du seed des Coin Packs...\n');

  try {
    // Supprimer les anciens packs (optionnel - commenter si vous voulez garder)
    await prisma.coinPack.deleteMany({});
    console.log('🗑️  Anciens packs supprimés\n');

    // Créer les nouveaux packs
    for (const pack of defaultCoinPacks) {
      await prisma.coinPack.create({
        data: pack
      });
      console.log(`✓ Pack "${pack.name}" créé : ${pack.coins} coins + ${pack.bonus} bonus = ${pack.coins + pack.bonus} total → ${pack.priceTND} TND`);
    }

    console.log(`\n✅ ${defaultCoinPacks.length} Coin Packs créés avec succès !`);

  } catch (error) {
    console.error('❌ Erreur lors du seed :', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedCoinPacks()
  .then(() => {
    console.log('\n🎉 Seed des Coin Packs terminé !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Le seed a échoué :', error);
    process.exit(1);
  });
