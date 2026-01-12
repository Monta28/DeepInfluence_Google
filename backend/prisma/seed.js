const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Fonction utilitaire pour normaliser le texte (recherche)
function normalize(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// Données réalistes pour le seeding
const expertData = [
  {
    firstName: 'Sarah',
    lastName: 'Martin',
    email: 'sarah.martin@email.com',
    name: 'Dr. Sarah Martin',
    specialty: 'Psychologue clinique',
    category: 'wellness',
    hourlyRate: 150,
    pricePerMessage: 50,
    tags: ['Anxiété', 'Dépression', 'Thérapie de couple'],
    languages: ['Français', 'Anglais'],
    description: 'Psychologue clinique avec plus de 15 ans d\'expérience dans l\'accompagnement thérapeutique.',
    verified: true,
    isOnline: true,
    nextAvailable: 'Disponible maintenant',
    responseTime: '2 minutes',
    sessions: 450,
    followers: 12500,
    rating: 4.9,
    reviews: 234
  },
  {
    firstName: 'Marc',
    lastName: 'Dubois',
    email: 'marc.dubois@email.com',
    name: 'Marc Dubois',
    specialty: 'Coach en Business',
    category: 'business',
    hourlyRate: 120,
    pricePerMessage: 75,
    tags: ['Startups', 'Stratégie', 'Leadership'],
    languages: ['Français', 'Anglais'],
    description: 'Expert en stratégie d\'entreprise et accompagnement de startups.',
    verified: true,
    isOnline: false,
    nextAvailable: 'Disponible dans 2h',
    responseTime: '15 minutes',
    sessions: 680,
    followers: 8900,
    rating: 4.8,
    reviews: 189
  },
  {
    firstName: 'Sophie',
    lastName: 'Laurent',
    email: 'sophie.laurent@email.com',
    name: 'Sophie Laurent',
    specialty: 'Coach en Développement Personnel',
    category: 'wellness',
    hourlyRate: 100,
    pricePerMessage: 40,
    tags: ['Confiance en soi', 'Motivation', 'Objectifs'],
    languages: ['Français'],
    description: 'Coach certifiée en développement personnel et bien-être.',
    verified: true,
    isOnline: true,
    nextAvailable: 'Disponible maintenant',
    responseTime: '5 minutes',
    sessions: 320,
    followers: 15600,
    rating: 4.9,
    reviews: 312
  },
  {
    firstName: 'Ahmed',
    lastName: 'Hassan',
    email: 'ahmed.hassan@email.com',
    name: 'Ahmed Hassan',
    specialty: 'Expert en Marketing Digital',
    category: 'marketing',
    hourlyRate: 90,
    pricePerMessage: 60,
    tags: ['SEO', 'Social Media', 'Publicité'],
    languages: ['Français', 'Arabe', 'Anglais'],
    description: 'Spécialiste en marketing digital avec une expertise en SEO et réseaux sociaux.',
    verified: true,
    isOnline: true,
    nextAvailable: 'Disponible maintenant',
    responseTime: '3 minutes',
    sessions: 520,
    followers: 22100,
    rating: 4.7,
    reviews: 156
  },
  {
    firstName: 'Claire',
    lastName: 'Rousseau',
    email: 'claire.rousseau@email.com',
    name: 'Claire Rousseau',
    specialty: 'Développeuse Full Stack',
    category: 'tech',
    hourlyRate: 110,
    pricePerMessage: 100,
    tags: ['React', 'Node.js', 'MongoDB'],
    languages: ['Français', 'Anglais'],
    description: 'Développeuse full stack avec 8 ans d\'expérience en technologies web modernes.',
    verified: true,
    isOnline: false,
    nextAvailable: 'Disponible demain',
    responseTime: '3h',
    sessions: 350,
    followers: 8900,
    rating: 4.8,
    reviews: 124
  },
  {
    firstName: 'Thomas',
    lastName: 'Bernard',
    email: 'thomas.bernard@email.com',
    name: 'Thomas Bernard',
    specialty: 'Conseiller Financier',
    category: 'finance',
    hourlyRate: 140,
    pricePerMessage: 110,
    tags: ['Investissement', 'Épargne', 'Retraite'],
    languages: ['Français'],
    description: 'Conseiller financier certifié avec une expertise en gestion de patrimoine.',
    verified: true,
    isOnline: true,
    nextAvailable: 'Disponible maintenant',
    responseTime: '1h',
    sessions: 450,
    followers: 12000,
    rating: 4.9,
    reviews: 178
  },
  {
    firstName: 'Emma',
    lastName: 'Wilson',
    email: 'emma.wilson@email.com',
    name: 'Emma Wilson',
    specialty: 'Nutritionniste',
    category: 'wellness',
    hourlyRate: 80,
    pricePerMessage: 35,
    tags: ['Perte de poids', 'Nutrition sportive', 'Santé'],
    languages: ['Français', 'Anglais'],
    description: 'Nutritionniste diplômée spécialisée en nutrition sportive et bien-être.',
    verified: true,
    isOnline: true,
    nextAvailable: 'Disponible maintenant',
    responseTime: '10 minutes',
    sessions: 280,
    followers: 9500,
    rating: 4.6,
    reviews: 145
  },
  {
    firstName: 'Julie',
    lastName: 'Lambert',
    email: 'julie.lambert@email.com',
    name: 'Julie Lambert',
    specialty: 'Coach Fitness',
    category: 'wellness',
    hourlyRate: 70,
    pricePerMessage: 30,
    tags: ['Musculation', 'Cardio', 'Flexibilité'],
    languages: ['Français'],
    description: 'Coach fitness certifiée avec une approche holistique du bien-être physique.',
    verified: true,
    isOnline: false,
    nextAvailable: 'Disponible dans 1h',
    responseTime: '20 minutes',
    sessions: 380,
    followers: 11200,
    rating: 4.7,
    reviews: 203
  }
];

const formationData = [
  {
    title: 'Maîtrise du Leadership Moderne',
    duration: '8 semaines',
    level: 'Intermédiaire',
    price: 299,
    type: 'live',
    maxPlaces: 30,
    currentPlaces: 18,
    location: 'En ligne',
    tags: ['Leadership', 'Management', 'Communication'],
    nextSession: '2024-02-15',
    description: 'Développez vos compétences en leadership et apprenez à inspirer votre équipe vers l\'excellence.',
    schedule: 'Tous les mardis et jeudis',
    modules: ['Communication efficace', 'Gestion d\'équipe', 'Prise de décision', 'Motivation'],
    category: 'business',
    rating: 4.9,
    students: 245
  },
  {
    title: 'Développement Personnel et Confiance',
    duration: '6 semaines',
    level: 'Débutant',
    price: 199,
    type: 'presentiel',
    maxPlaces: 25,
    currentPlaces: 12,
    location: 'Paris, France',
    tags: ['Confiance', 'Estime de soi', 'Motivation'],
    nextSession: '2024-02-20',
    description: 'Renforcez votre confiance en vous et découvrez votre potentiel personnel unique.',
    schedule: 'Tous les lundis',
    modules: ['Confiance en soi', 'Gestion des émotions', 'Objectifs personnels'],
    category: 'wellness',
    rating: 4.8,
    students: 189
  },
  {
    title: 'Marketing Digital Avancé',
    duration: '10 semaines',
    level: 'Avancé',
    price: 399,
    type: 'live',
    maxPlaces: 40,
    currentPlaces: 28,
    location: 'En ligne',
    tags: ['SEO', 'Social Media', 'Analytics'],
    nextSession: '2024-02-22',
    description: 'Maîtrisez les stratégies de marketing digital les plus efficaces pour booster votre business.',
    schedule: 'Tous les mercredis',
    modules: ['SEO avancé', 'Publicité en ligne', 'Analytics', 'Stratégie de contenu'],
    category: 'marketing',
    rating: 4.7,
    students: 156
  },
  {
    title: 'Développement Web Full Stack',
    duration: '16 semaines',
    level: 'Débutant',
    price: 599,
    type: 'live',
    maxPlaces: 35,
    currentPlaces: 22,
    location: 'En ligne',
    tags: ['React', 'Node.js', 'MongoDB'],
    nextSession: '2024-02-28',
    description: 'Devenez développeur full stack et créez des applications web complètes de A à Z.',
    schedule: 'Tous les vendredis',
    modules: ['HTML/CSS', 'JavaScript', 'React', 'Node.js', 'Bases de données'],
    category: 'tech',
    rating: 4.8,
    students: 98
  },
  {
    title: 'Investissement et Finance Personnelle',
    duration: '12 semaines',
    level: 'Intermédiaire',
    price: 449,
    type: 'presentiel',
    maxPlaces: 20,
    currentPlaces: 15,
    location: 'Lyon, France',
    tags: ['Investissement', 'Épargne', 'Bourse'],
    nextSession: '2024-02-25',
    description: 'Apprenez à gérer et faire fructifier votre argent avec des stratégies d\'investissement éprouvées.',
    schedule: 'Tous les samedis',
    modules: ['Analyse financière', 'Investissement boursier', 'Immobilier', 'Épargne'],
    category: 'finance',
    rating: 4.9,
    students: 234
  }
];

const videoData = [
  {
    title: 'Les 5 clés du leadership efficace',
    duration: '08:45',
    views: 12500,
    likes: 856,
    category: 'business',
    type: 'free',
    price: 0,
    description: 'Découvrez les techniques fondamentales pour développer votre leadership et inspirer vos équipes.',
    publishedAt: new Date('2024-01-15')
  },
  {
    title: 'Stratégies de marketing digital 2024',
    duration: '12:30',
    views: 8900,
    likes: 647,
    category: 'marketing',
    type: 'premium',
    price: 25,
    description: 'Les dernières tendances et stratégies pour réussir votre marketing digital en 2024.',
    publishedAt: new Date('2024-01-14')
  },
  {
    title: 'Méditation et gestion du stress',
    duration: '15:20',
    views: 15600,
    likes: 1234,
    category: 'wellness',
    type: 'free',
    price: 0,
    description: 'Apprenez des techniques de méditation efficaces pour gérer le stress quotidien.',
    publishedAt: new Date('2024-01-13')
  },
  {
    title: 'Créer une startup rentable',
    duration: '18:45',
    views: 7200,
    likes: 523,
    category: 'business',
    type: 'premium',
    price: 35,
    description: 'Guide complet pour créer et développer une startup profitable en 2024.',
    publishedAt: new Date('2024-01-12')
  },
  {
    title: 'Développement web moderne',
    duration: '22:15',
    views: 6800,
    likes: 445,
    category: 'tech',
    type: 'premium',
    price: 30,
    description: 'Les technologies et frameworks incontournables pour le développement web moderne.',
    publishedAt: new Date('2024-01-11')
  },
  {
    title: 'Nutrition et performance',
    duration: '14:30',
    views: 11200,
    likes: 789,
    category: 'wellness',
    type: 'free',
    price: 0,
    description: 'Optimisez votre nutrition pour améliorer vos performances physiques et mentales.',
    publishedAt: new Date('2024-01-10')
  }
];

async function main() {
  console.log('🌱 Début du seeding...');
  try {
    // Nettoyer la base de données
    await prisma.transaction.deleteMany({});
    await prisma.review.deleteMany({});
    await prisma.userVideo.deleteMany({});
    await prisma.userFormation.deleteMany({});
    await prisma.appointment.deleteMany({});
    await prisma.video.deleteMany({});
    await prisma.formation.deleteMany({});
    await prisma.expert.deleteMany({});
    await prisma.user.deleteMany({});

    // Créer un compte administrateur
    const adminPassword = await bcrypt.hash('password123', 12);
    await prisma.user.create({
      data: {
        firstName: 'Admin',
        lastName: 'DeepInfluence',
        email: 'admin@deepinfluent.local',
        password: adminPassword,
        userType: 'admin',
        isVerified: true,
        coins: 0,
        avatar: '/images/users/1.jpg'
      }
    });

    // Créer des utilisateurs normaux
    const normalUsers = [];
    for (let i = 1; i <= 10; i++) {
      const hashedPassword = await bcrypt.hash('password123', 12);
      const user = await prisma.user.create({
        data: {
          firstName: `Utilisateur${i}`,
          lastName: `Test${i}`,
          email: `user${i}@email.com`,
          password: hashedPassword,
          userType: 'user',
          avatar: `/images/users/user-${i}.jpg`,
          coins: 500,
        }
      });
      normalUsers.push(user);
    }

    // Créer les experts
    const experts = [];
    for (const expertInfo of expertData) {
      const hashedPassword = await bcrypt.hash('password123', 12);
      const imageName = `/images/experts/${expertInfo.firstName.toLowerCase()}-${expertInfo.lastName.toLowerCase()}.jpg`;
      
      const user = await prisma.user.create({
        data: {
          firstName: expertInfo.firstName,
          lastName: expertInfo.lastName,
          email: expertInfo.email,
          password: hashedPassword,
          userType: 'expert',
          avatar: imageName,
          profileCompleted: true
        }
      });

      const normalize = (s) => s ? s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase() : s;
      const expert = await prisma.expert.create({
        data: {
          userId: user.id,
          name: expertInfo.name,
          nameNormalized: normalize(expertInfo.name),
          specialty: expertInfo.specialty,
          specialtyNormalized: normalize(expertInfo.specialty),
          category: expertInfo.category,
          hourlyRate: expertInfo.hourlyRate,
          pricePerMessage: expertInfo.pricePerMessage,
          tags: JSON.stringify(expertInfo.tags),
          languages: JSON.stringify(expertInfo.languages),
          description: expertInfo.description,
          verified: expertInfo.verified,
        }
      });
      experts.push(expert);
    }

    // Créer les formations
    const formations = [];
    for (let i = 0; i < formationData.length; i++) {
      const formationInfo = formationData[i];
      const expert = experts[i % experts.length];
      const imageName = `formation-${i + 1}.jpg`;
      
      const formation = await prisma.formation.create({
        data: {
          ...formationInfo,
          titleNormalized: normalize(formationInfo.title),
          instructorId: expert.id,
          instructor: expert.name,
          instructorNormalized: normalize(expert.name),
          tags: JSON.stringify(formationInfo.tags),
          modules: JSON.stringify(formationInfo.modules),
          image: `/images/formations/${imageName}`
        }
      });
      formations.push(formation);
    }

    // Créer les vidéos
    for (let i = 0; i < videoData.length; i++) {
      const videoInfo = videoData[i];
      const expert = experts[i % experts.length];
      const expertUser = await prisma.user.findUnique({ where: { id: expert.userId } });
      const imageName = `video-${i + 1}.jpg`;
      
      await prisma.video.create({
        data: {
          ...videoInfo,
          titleNormalized: normalize(videoInfo.title),
          expertId: expert.id,
          expert: expert.name,
          expertNormalized: normalize(expert.name),
          expertImage: expertUser?.avatar,
          thumbnail: `/images/videos/${imageName}`,
          videoUrl: `/videos/placeholder.mp4`
        }
      });
    }
    
    console.log('✅ Seeding terminé avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
