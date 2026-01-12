
"use client";

import { useEffect, useMemo, useState } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import AppHeader from '@/components/AppHeader';
import Link from 'next/link';

interface ExpertProfileProps {
  expertId: string;
}

export default function ExpertProfile({ expertId }: ExpertProfileProps) {
  const [activeTab, setActiveTab] = useState('about');
  const [isFavorite, setIsFavorite] = useState(false);
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [consultationDuration, setConsultationDuration] = useState('10');
  const [consultationNote, setConsultationNote] = useState('');
  const [videoFilter, setVideoFilter] = useState('all');

  const expertsData = {
    '1': {
      id: '1',
      name: 'Dr. Marie Dubois',
      specialty: 'Développement Personnel',
      category: 'Bien-être & Développement Personnel',
      rating: 4.9,
      reviews: 147,
      sessions: 450,
      followers: 12500,
      languages: ['Français', 'Anglais'],
      isOnline: true,
      isVerified: true,
      responseTime: '2 minutes',
      image: 'https://readdy.ai/api/search-image?query=Professional%20female%20personal%20development%20coach%20with%20warm%20confident%20smile%2C%20modern%20coaching%20office%20background%2C%20professional%20attire%2C%20trustworthy%20and%20approachable%20appearance%2C%20high%20quality%20portrait&width=400&height=400&seq=expert-marie-1&orientation=squarish',
      bio: 'Dr. Marie Dubois est une coach certifiée en développement personnel avec plus de 12 ans d\'expérience. Elle accompagne ses clients vers l\'épanouissement personnel et professionnel grâce à des méthodes innovantes et personnalisées.',
      education: [
        'Doctorat en Psychologie - Université de Paris',
        'Master en Coaching Personnel - INSEAD',
        'Certification en PNL - Institut Français de PNL'
      ],
      certifications: [
        'Coach certifiée ICF (International Coach Federation)',
        'Praticienne en PNL',
        'Certification en Mindfulness'
      ],
      pricing: {
        textMessage: 5,
        videoMessage: 15,
        videoCall: 25
      }
    },
    '2': {
      id: '2',
      name: 'Marc Rodriguez',
      specialty: 'Business & Entrepreneuriat',
      category: 'Business & Entrepreneuriat',
      rating: 4.8,
      reviews: 203,
      sessions: 680,
      followers: 8900,
      languages: ['Français', 'Espagnol'],
      isOnline: false,
      isVerified: true,
      responseTime: '15 minutes',
      image: 'https://readdy.ai/api/search-image?query=Professional%20male%20business%20entrepreneur%20in%20elegant%20suit%2C%20confident%20businessman%20portrait%2C%20modern%20corporate%20office%20background%2C%20professional%20headshot%2C%20trustworthy%20appearance%2C%20high%20quality%20portrait&width=400&height=400&seq=expert-marc-2&orientation=squarish',
      bio: 'Marc Rodriguez est un entrepreneur expérimenté et consultant en stratégie d\'entreprise. Il aide les entrepreneurs à développer leurs projets et à optimiser leurs performances commerciales.',
      education: [
        'MBA - HEC Paris',
        'Master en Entrepreneuriat - ESSEC',
        'Diplôme d\'Ingénieur - Polytechnique'
      ],
      certifications: [
        'Consultant senior certifié',
        'Expert en stratégie digitale',
        'Certification en leadership'
      ],
      pricing: {
        textMessage: 8,
        videoMessage: 20,
        videoCall: 35
      }
    },
    '3': {
      id: '3',
      name: 'Sophie Laurent',
      specialty: 'Bien-être & Nutrition',
      category: 'Santé & Bien-être',
      rating: 4.9,
      reviews: 89,
      sessions: 320,
      followers: 15600,
      languages: ['Français'],
      isOnline: true,
      isVerified: true,
      responseTime: '5 minutes',
      image: 'https://readdy.ai/api/search-image?query=Professional%20female%20wellness%20and%20nutrition%20coach%20with%20healthy%20radiant%20appearance%2C%20natural%20wellness%20environment%20background%2C%20professional%20attire%2C%20trustworthy%20and%20caring%20expression%2C%20high%20quality%20portrait&width=400&height=400&seq=expert-sophie-3&orientation=squarish',
      bio: 'Sophie Laurent est une nutritionniste diplômée et coach bien-être. Elle propose des programmes personnalisés pour améliorer la santé et le bien-être global de ses clients.',
      education: [
        'Master en Nutrition - Université de Lyon',
        'Diplôme de Naturopathie - CENATHO',
        'Formation en Coaching Wellness'
      ],
      certifications: [
        'Nutritionniste certifiée',
        'Coach bien-être certifiée',
        'Spécialiste en nutrition sportive'
      ],
      pricing: {
        textMessage: 4,
        videoMessage: 12,
        videoCall: 20
      }
    },
    '4': {
      id: '4',
      name: 'Ahmed Hassan',
      specialty: 'Marketing Digital',
      category: 'Marketing & Communication',
      rating: 4.7,
      reviews: 156,
      sessions: 520,
      followers: 22100,
      languages: ['Français', 'Arabe'],
      isOnline: true,
      isVerified: true,
      responseTime: '3 minutes',
      image: 'https://readdy.ai/api/search-image?query=Professional%20male%20digital%20marketing%20expert%20with%20confident%20expression%2C%20modern%20digital%20office%20background%2C%20contemporary%20business%20attire%2C%20trustworthy%20appearance%2C%20high%20quality%20portrait&width=400&height=400&seq=expert-ahmed-4&orientation=squarish',
      bio: 'Ahmed Hassan est un expert en marketing digital avec plus de 10 ans d\'expérience. Il accompagne les entreprises dans leur transformation digitale et l\'optimisation de leur présence en ligne.',
      education: [
        'Master en Marketing Digital - ESCP',
        'Diplôme d\'Ingénieur - ENSI',
        'Certification Google Ads & Analytics'
      ],
      certifications: [
        'Expert Google Ads certifié',
        'Spécialiste Facebook Ads',
        'Consultant en SEO certifié'
      ],
      pricing: {
        textMessage: 6,
        videoMessage: 18,
        videoCall: 30
      }
    }
  };

  const baseExpert = useMemo(() => expertsData[expertId as keyof typeof expertsData] || expertsData['1'], [expertId]);
  const expert = baseExpert;
  const [isVerified, setIsVerified] = useState<boolean>(!!baseExpert.isVerified);

  const socket = useSocket();
  useEffect(() => {
    if (!socket) return;
    const handler = (e: any) => {
      if (!e || typeof e.expertId !== 'number') return;
      // Match if viewing same expert id
      if (Number(baseExpert.id) === Number(e.expertId)) {
        setIsVerified(!!e.verified);
      }
    };
    socket.on('expertVerificationChanged', handler);
    return () => { socket.off('expertVerificationChanged', handler); };
  }, [socket, baseExpert.id]);

  const reviews = [
    {
      id: 1,
      user: 'Marie D.',
      rating: 5,
      date: '2024-01-10',
      comment: 'Excellente expérience ! Les conseils sont très pratiques et ont vraiment fait la différence.',
      avatar: 'https://readdy.ai/api/search-image?query=Professional%20woman%20headshot%20with%20friendly%20smile%2C%20neutral%20background%2C%20modern%20portrait&width=60&height=60&seq=review-1&orientation=squarish'
    },
    {
      id: 2,
      user: 'Pierre L.',
      rating: 5,
      date: '2024-01-08',
      comment: 'Approche très professionnelle et personnalisée. Je recommande vivement !',
      avatar: 'https://readdy.ai/api/search-image?query=Professional%20man%20headshot%20with%20confident%20smile%2C%20neutral%20background%2C%20modern%20portrait&width=60&height=60&seq=review-2&orientation=squarish'
    },
    {
      id: 3,
      user: 'Sophie R.',
      rating: 4,
      date: '2024-01-05',
      comment: 'Très bonne écoute et conseils pertinents. Résultats visibles rapidement.',
      avatar: 'https://readdy.ai/api/search-image?query=Professional%20woman%20headshot%20with%20warm%20smile%2C%20neutral%20background%2C%20modern%20portrait&width=60&height=60&seq=review-3&orientation=squarish'
    }
  ];

  const getVideosForExpert = (expertId: string) => {
    const videosByExpert = {
      '1': [
        {
          id: 1,
          title: 'Les 5 clés du leadership efficace',
          duration: '08:45',
          views: 12500,
          likes: 856,
          type: 'free',
          price: 0,
          category: 'Leadership',
          publishedAt: '2024-01-15',
          thumbnail: 'https://readdy.ai/api/search-image?query=Professional%20business%20leadership%20presentation%2C%20confident%20female%20coach%20explaining%20leadership%20concepts%2C%20modern%20office%20background%2C%20professional%20setting&width=300&height=200&seq=expert-video-1&orientation=landscape'
        },
        {
          id: 2,
          title: 'Techniques de motivation personnelle',
          duration: '12:30',
          views: 8900,
          likes: 647,
          type: 'premium',
          price: 25,
          category: 'Motivation',
          publishedAt: '2024-01-12',
          thumbnail: 'https://readdy.ai/api/search-image?query=Personal%20motivation%20coaching%20session%2C%20inspiring%20atmosphere%2C%20woman%20explaining%20motivation%20techniques%2C%20professional%20development%20theme&width=300&height=200&seq=expert-video-2&orientation=landscape'
        },
        {
          id: 3,
          title: 'Gérer le stress au quotidien',
          duration: '15:20',
          views: 15600,
          likes: 1234,
          type: 'free',
          price: 0,
          category: 'Stress Management',
          publishedAt: '2024-01-10',
          thumbnail: 'https://readdy.ai/api/search-image?query=Stress%20management%20workshop%2C%20calm%20professional%20environment%2C%20woman%20teaching%20relaxation%20techniques%2C%20wellness%20coaching%20theme&width=300&height=200&seq=expert-video-3&orientation=landscape'
        },
        {
          id: 4,
          title: 'Développer sa confiance en soi',
          duration: '18:45',
          views: 7200,
          likes: 523,
          type: 'premium',
          price: 30,
          category: 'Confiance en Soi',
          publishedAt: '2024-01-08',
          thumbnail: 'https://readdy.ai/api/search-image?query=Self%20confidence%20building%20workshop%2C%20empowering%20atmosphere%2C%20professional%20coach%20explaining%20confidence%20techniques%2C%20positive%20energy&width=300&height=200&seq=expert-video-4&orientation=landscape'
        },
        {
          id: 5,
          title: 'Communication efficace en équipe',
          duration: '14:15',
          views: 9800,
          likes: 789,
          type: 'free',
          price: 0,
          category: 'Communication',
          publishedAt: '2024-01-05',
          thumbnail: 'https://readdy.ai/api/search-image?query=Team%20communication%20workshop%2C%20professional%20meeting%20room%2C%20woman%20facilitating%20communication%20training%2C%20collaborative%20atmosphere&width=300&height=200&seq=expert-video-5&orientation=landscape'
        },
        {
          id: 6,
          title: 'Mindfulness et performance',
          duration: '22:10',
          views: 6500,
          likes: 445,
          type: 'premium',
          price: 35,
          category: 'Mindfulness',
          publishedAt: '2024-01-03',
          thumbnail: 'https://readdy.ai/api/search-image?query=Mindfulness%20meditation%20session%2C%20peaceful%20environment%2C%20woman%20teaching%20mindfulness%20techniques%2C%20serene%20professional%20setting&width=300&height=200&seq=expert-video-6&orientation=landscape'
        }
      ],
      '2': [
        {
          id: 7,
          title: 'Créer une startup rentable',
          duration: '25:30',
          views: 18200,
          likes: 1456,
          type: 'premium',
          price: 50,
          category: 'Entrepreneuriat',
          publishedAt: '2024-01-14',
          thumbnail: 'https://readdy.ai/api/search-image?query=Entrepreneur%20presenting%20startup%20strategies%2C%20modern%20business%20office%2C%20man%20explaining%20business%20concepts%2C%20professional%20entrepreneurship%20setting&width=300&height=200&seq=expert-video-7&orientation=landscape'
        },
        {
          id: 8,
          title: 'Stratégies de croissance d\'entreprise',
          duration: '16:45',
          views: 11300,
          likes: 892,
          type: 'free',
          price: 0,
          category: 'Stratégie',
          publishedAt: '2024-01-11',
          thumbnail: 'https://readdy.ai/api/search-image?query=Business%20growth%20strategy%20presentation%2C%20corporate%20meeting%20room%2C%20businessman%20explaining%20growth%20tactics%2C%20professional%20consulting%20atmosphere&width=300&height=200&seq=expert-video-8&orientation=landscape'
        },
        {
          id: 9,
          title: 'Financement et investisseurs',
          duration: '19:20',
          views: 8900,
          likes: 634,
          type: 'premium',
          price: 40,
          category: 'Finance',
          publishedAt: '2024-01-09',
          thumbnail: 'https://readdy.ai/api/search-image?query=Business%20financing%20presentation%2C%20professional%20office%20setting%2C%20man%20explaining%20investment%20strategies%2C%20financial%20consulting%20theme&width=300&height=200&seq=expert-video-9&orientation=landscape'
        }
      ],
      '3': [
        {
          id: 10,
          title: 'Nutrition et performance sportive',
          duration: '14:30',
          views: 22100,
          likes: 1789,
          type: 'free',
          price: 0,
          category: 'Nutrition Sportive',
          publishedAt: '2024-01-13',
          thumbnail: 'https://readdy.ai/api/search-image?query=Sports%20nutrition%20workshop%2C%20healthy%20food%20setting%2C%20woman%20nutritionist%20explaining%20sports%20nutrition%2C%20wellness%20and%20fitness%20theme&width=300&height=200&seq=expert-video-10&orientation=landscape'
        },
        {
          id: 11,
          title: 'Régimes détox naturels',
          duration: '18:15',
          views: 15600,
          likes: 1234,
          type: 'premium',
          price: 30,
          category: 'Détox',
          publishedAt: '2024-01-10',
          thumbnail: 'https://readdy.ai/api/search-image?query=Natural%20detox%20workshop%2C%20fresh%20vegetables%20and%20fruits%2C%20woman%20explaining%20detox%20methods%2C%20healthy%20lifestyle%20theme&width=300&height=200&seq=expert-video-11&orientation=landscape'
        },
        {
          id: 12,
          title: 'Équilibre alimentaire au quotidien',
          duration: '12:45',
          views: 19800,
          likes: 1567,
          type: 'free',
          price: 0,
          category: 'Nutrition',
          publishedAt: '2024-01-08',
          thumbnail: 'https://readdy.ai/api/search-image?query=Balanced%20nutrition%20presentation%2C%20healthy%20meal%20planning%2C%20woman%20nutritionist%20explaining%20healthy%20eating%2C%20wellness%20coaching%20atmosphere&width=300&height=200&seq=expert-video-12&orientation=landscape'
        }
      ],
      '4': [
        {
          id: 13,
          title: 'SEO et référencement naturel 2024',
          duration: '21:30',
          views: 25400,
          likes: 2134,
          type: 'premium',
          price: 45,
          category: 'SEO',
          publishedAt: '2024-01-15',
          thumbnail: 'https://readdy.ai/api/search-image?query=SEO%20workshop%20presentation%2C%20digital%20marketing%20office%2C%20man%20explaining%20search%20engine%20optimization%2C%20professional%20tech%20setting&width=300&height=200&seq=expert-video-13&orientation=landscape'
        },
        {
          id: 14,
          title: 'Stratégies de marketing digital',
          duration: '16:20',
          views: 18700,
          likes: 1456,
          type: 'free',
          price: 0,
          category: 'Marketing Digital',
          publishedAt: '2024-01-12',
          thumbnail: 'https://readdy.ai/api/search-image?query=Digital%20marketing%20strategy%20presentation%2C%20modern%20tech%20office%2C%20man%20explaining%20digital%20marketing%20concepts%2C%20professional%20consulting%20atmosphere&width=300&height=200&seq=expert-video-14&orientation=landscape'
        },
        {
          id: 15,
          title: 'Publicité Facebook et Instagram',
          duration: '19:45',
          views: 14300,
          likes: 1123,
          type: 'premium',
          price: 35,
          category: 'Publicité',
          publishedAt: '2024-01-09',
          thumbnail: 'https://readdy.ai/api/search-image?query=Social%20media%20advertising%20workshop%2C%20digital%20marketing%20setup%2C%20man%20explaining%20Facebook%20and%20Instagram%20ads%2C%20professional%20digital%20marketing%20theme&width=300&height=200&seq=expert-video-15&orientation=landscape'
        },
        {
          id: 16,
          title: 'Analytics et mesure de performance',
          duration: '23:15',
          views: 11900,
          likes: 889,
          type: 'premium',
          price: 40,
          category: 'Analytics',
          publishedAt: '2024-01-07',
          thumbnail: 'https://readdy.ai/api/search-image?query=Analytics%20dashboard%20presentation%2C%20data%20visualization%2C%20man%20explaining%20performance%20metrics%2C%20professional%20data%20analysis%20setting&width=300&height=200&seq=expert-video-16&orientation=landscape'
        }
      ]
    };

    return videosByExpert[expertId as keyof typeof videosByExpert] || [];
  };

  const expertVideos = getVideosForExpert(expertId);
  const filteredVideos = videoFilter === 'all' 
    ? expertVideos 
    : expertVideos.filter((video: any) => 
        videoFilter === 'free' ? video.type === 'free' : video.type === 'premium'
      );

  const freeVideosCount = expertVideos.filter((video: any) => video.type === 'free').length;
  const premiumVideosCount = expertVideos.filter((video: any) => video.type === 'premium').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Expert Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
            <div className="relative">
              <img
                src={baseExpert.image}
                alt={baseExpert.name}
                className="w-32 h-32 rounded-full object-cover object-top"
              />
              {baseExpert.isOnline && (
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white"></div>
              )}
              {isVerified && (
                <div className="absolute top-0 right-0 w-8 h-8 bg-blue-600 rounded-full border-2 border-white flex items-center justify-center">
                  <i className="ri-check-line text-white text-sm"></i>
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{baseExpert.name}</h1>
                <button
                  onClick={() => setIsFavorite(!isFavorite)}
                  className={`w-8 h-8 flex items-center justify-center rounded-full cursor-pointer ${
                    isFavorite ? 'text-red-500' : 'text-gray-400'
                  }`}
                >
                  <i className={`ri-heart-${isFavorite ? 'fill' : 'line'}`}></i>
                </button>
              </div>

              <p className="text-xl text-gray-600 mb-2">{baseExpert.specialty}</p>
              <p className="text-lg text-blue-600 font-medium mb-4">{baseExpert.category}</p>

              {!isVerified && (
                <div className="mb-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                    <i className="ri-time-line mr-1"></i>
                    Vérification en cours
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 text-yellow-400 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <i key={i} className={`ri-star-${i < Math.floor(baseExpert.rating) ? 'fill' : 'line'}`}></i>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600">{baseExpert.rating} ({baseExpert.reviews} avis)</p>
                </div>

                <div className="text-center">
                  <p className="font-semibold text-gray-900">{baseExpert.sessions}</p>
                  <p className="text-sm text-gray-600">Sessions</p>
                </div>

                <div className="text-center">
                  <p className="font-semibold text-gray-900" suppressHydrationWarning={true}>
                    {baseExpert.followers.toLocaleString('fr-FR')}
                  </p>
                  <p className="text-sm text-gray-600">Abonnés</p>
                </div>

                <div className="text-center">
                  <p className="font-semibold text-gray-900">{baseExpert.responseTime}</p>
                  <p className="text-sm text-gray-600">Temps de réponse</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {baseExpert.languages.map((lang) => (
                  <span key={lang} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                    {lang}
                  </span>
                ))}
                {isVerified && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full flex items-center">
                    <i className="ri-shield-check-line mr-1"></i>
                    Vérifié
                  </span>
                )}
                {baseExpert.isOnline && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                    En ligne
                  </span>
                )}
              </div>

              <div className="flex space-x-4">
                <Link
                  href={`/dashboard/chat/${baseExpert.id}`}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                >
                  Envoyer un message
                </Link>
                <button
                  onClick={() => setShowConsultationModal(true)}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
                >
                  Réserver un rendez-vous en ligne
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-white p-1 rounded-lg max-w-md">
            <button
              onClick={() => setActiveTab('about')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'about'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              À propos
            </button>
            <button
              onClick={() => setActiveTab('pricing')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'pricing'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Tarifs
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'reviews'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Avis ({expert.reviews})
            </button>
            <button
              onClick={() => setActiveTab('videos')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'videos'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Vidéos
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'about' && (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Présentation</h3>
              <p className="text-gray-700 leading-relaxed">{expert.bio}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Formation</h3>
                <ul className="space-y-3">
                  {expert.education.map((edu, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <i className="ri-graduation-cap-line text-blue-600 mt-1"></i>
                      <span className="text-gray-700">{edu}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Certifications</h3>
                <ul className="space-y-3">
                  {expert.certifications.map((cert, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <i className="ri-award-line text-green-600 mt-1"></i>
                      <span className="text-gray-700">{cert}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pricing' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Tarifs et services</h3>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <i className="ri-message-line text-white text-2xl"></i>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">Réponse par message</h4>
                  <p className="text-sm text-gray-600">Format texte</p>
                </div>
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {baseExpert.pricing.textMessage} coins
                  </div>
                  <p className="text-sm text-gray-600">par message</p>
                </div>
                <ul className="text-sm text-gray-600 space-y-2 mb-6">
                  <li>• Réponse détaillée par écrit</li>
                  <li>• Temps de réponse: {baseExpert.responseTime}</li>
                  <li>• Conseils personnalisés</li>
                  <li>• Suivi de conversation</li>
                </ul>
                <Link
                  href={`/dashboard/chat/${baseExpert.id}`}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors text-center block whitespace-nowrap"
                >
                  Envoyer un message
                </Link>
              </div>

              <div className="bg-green-50 rounded-xl p-6 border-2 border-green-200">
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <i className="ri-video-line text-white text-2xl"></i>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">Réponse par message</h4>
                  <p className="text-sm text-gray-600">Format vidéo</p>
                </div>
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    {baseExpert.pricing.videoMessage} coins
                  </div>
                  <p className="text-sm text-gray-600">par message vidéo</p>
                </div>
                <ul className="text-sm text-gray-600 space-y-2 mb-6">
                  <li>• Réponse vidéo personnalisée</li>
                  <li>• Explications détaillées</li>
                  <li>• Connexion plus humaine</li>
                  <li>• Durée: 2-5 minutes</li>
                </ul>
                <Link
                  href={`/dashboard/chat/${expert.id}`}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors text-center block whitespace-nowrap"
                >
                  Demander une vidéo
                </Link>
              </div>

              <div className="bg-purple-50 rounded-xl p-6 border-2 border-purple-200">
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <i className="ri-vidicon-line text-white text-2xl"></i>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">Rendez-vous en ligne</h4>
                  <p className="text-sm text-gray-600">Minimum 10 minutes</p>
                </div>
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-purple-600 mb-1">
                    {baseExpert.pricing.videoCall} coins
                  </div>
                  <p className="text-sm text-gray-600">par minute</p>
                </div>
                <ul className="text-sm text-gray-600 space-y-2 mb-6">
                  <li>• Consultation en temps réel</li>
                  <li>• Échange interactif</li>
                  <li>• Séance personnalisée</li>
                  <li>• Réservation flexible</li>
                </ul>
                <button
                  onClick={() => setShowConsultationModal(true)}
                  className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors whitespace-nowrap"
                >
                  Réserver un rendez-vous
                </button>
              </div>
            </div>

            <div className="mt-8 bg-gray-50 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Informations importantes</h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                <ul className="space-y-2">
                  <li>• Paiement sécurisé en coins</li>
                  <li>• Remboursement possible sous 24h</li>
                  <li>• Expert vérifié et certifié</li>
                </ul>
                <ul className="space-y-2">
                  <li>• Consultation annulable jusqu'à 2h avant</li>
                  <li>• Historique des échanges conservé</li>
                  <li>• Support technique disponible</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                  <div className="flex items-start space-x-4">
                    <img
                      src={review.avatar}
                      alt={review.user}
                      className="w-12 h-12 rounded-full object-cover object-top"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-semibold text-gray-900">{review.user}</h4>
                        <div className="flex items-center space-x-1 text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <i key={i} className={`ri-star-${i < review.rating ? 'fill' : 'line'} text-sm`}></i>
                          ))}
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(review.date).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <p className="text-gray-700">{review.comment}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'videos' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Vidéos de l'expert</h3>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span className="flex items-center">
                    <i className="ri-play-circle-line text-green-600 mr-1"></i>
                    {freeVideosCount} gratuites
                  </span>
                  <span className="flex items-center">
                    <i className="ri-vip-crown-line text-yellow-600 mr-1"></i>
                    {premiumVideosCount} premium
                  </span>
                </div>
                <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setVideoFilter('all')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                      videoFilter === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Toutes
                  </button>
                  <button
                    onClick={() => setVideoFilter('free')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                      videoFilter === 'free'
                        ? 'bg-green-600 text-white'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Gratuites
                  </button>
                  <button
                    onClick={() => setVideoFilter('premium')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                      videoFilter === 'premium'
                        ? 'bg-yellow-600 text-white'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Premium
                  </button>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVideos.map((video) => (
                <div key={video.id} className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
                  <div className="relative">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-2 left-2">
                      {video.type === 'free' ? (
                        <span className="bg-green-500 text-white px-2 py-1 text-xs rounded-full font-medium">
                          Gratuit
                        </span>
                      ) : (
                        <span className="bg-yellow-500 text-white px-2 py-1 text-xs rounded-full font-medium">
                          {video.price} coins
                        </span>
                      )}
                    </div>
                    <div className="absolute bottom-2 right-2">
                      <span className="bg-black/70 text-white px-2 py-1 text-xs rounded">
                        {video.duration}
                      </span>
                    </div>
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <button className="bg-white/90 text-gray-900 rounded-full p-3 hover:bg-white">
                        <i className="ri-play-fill text-2xl"></i>
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="bg-blue-100 text-blue-600 px-2 py-1 text-xs rounded-full font-medium">
                        {video.category}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(video.publishedAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {video.title}
                    </h4>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <i className="ri-eye-line mr-1"></i>
                          {video.views.toLocaleString('fr-FR')}
                        </span>
                        <span className="flex items-center">
                          <i className="ri-thumb-up-line mr-1"></i>
                          {video.likes.toLocaleString('fr-FR')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredVideos.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-video-line text-2xl text-gray-400"></i>
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  Aucune vidéo trouvée
                </h4>
                <p className="text-gray-600">
                  Aucune vidéo ne correspond à votre filtre sélectionné.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Consultation Booking Modal */}
      {showConsultationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                Réserver un rendez-vous en ligne
              </h3>
              <button
                onClick={() => setShowConsultationModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer"
              >
                <i className="ri-close-line text-gray-500"></i>
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                <img
                  src={expert.image}
                  alt={expert.name}
                  className="w-16 h-16 rounded-full object-cover object-top"
                />
                <div>
                  <h4 className="font-semibold text-gray-900">{expert.name}</h4>
                  <p className="text-gray-600">{expert.specialty}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="flex items-center space-x-1 text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <i key={i} className={`ri-star-${i < Math.floor(expert.rating) ? 'fill' : 'line'} text-sm`}></i>
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">{expert.rating}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tarif par minute */}
            <div className="mb-6">
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">Tarif du rendez-vous</h4>
                    <p className="text-sm text-gray-600">Durée minimum : 10 minutes</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">{expert.pricing.videoCall} coins</p>
                    <p className="text-sm text-gray-600">par minute</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Durée en minutes */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">Durée du rendez-vous</h4>
              <div className="flex items-center space-x-4 mb-4">
                <button
                  onClick={() => {
                    const currentDuration = parseInt(consultationDuration);
                    if (currentDuration > 10) {
                      setConsultationDuration((currentDuration - 10).toString());
                    }
                  }}
                  className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
                >
                  <i className="ri-subtract-line"></i>
                </button>

                <div className="flex-1 text-center">
                  <input
                    type="number"
                    value={consultationDuration}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (value >= 10) {
                        setConsultationDuration(value.toString());
                      }
                    }}
                    min="10"
                    className="w-20 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-600 mt-1">minutes</p>
                </div>

                <button
                  onClick={() => {
                    const currentDuration = parseInt(consultationDuration);
                    setConsultationDuration((currentDuration + 10).toString());
                  }}
                  className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
                >
                  <i className="ri-add-line"></i>
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {['15', '30', '45', '60'].map((duration) => (
                  <button
                    key={duration}
                    onClick={() => setConsultationDuration(duration)}
                    className={`px-4 py-2 rounded-lg border-2 transition-all whitespace-nowrap ${
                      consultationDuration === duration
                        ? 'border-blue-500 bg-blue-50 text-blue-600'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {duration} min
                  </button>
                ))}
              </div>
            </div>

            {/* Date */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">Date disponible</h4>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                {[
                  '2024-01-15',
                  '2024-01-16',
                  '2024-01-17',
                  '2024-01-18',
                  '2024-01-19',
                ].map((date) => (
                  <button
                    key={date}
                    onClick={() => {
                      setSelectedDate(date);
                      setSelectedTime('');
                    }}
                    className={`p-3 rounded-lg border-2 transition-all text-center ${
                      selectedDate === date
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-sm font-medium">
                      {new Date(date).toLocaleDateString('fr-FR', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Créneaux horaires */}
            {selectedDate && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Heures disponibles</h4>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                  {[
                    '09:00',
                    '10:30',
                    '14:00',
                    '15:30',
                    '16:30',
                  ].map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`p-3 rounded-lg border-2 transition-all text-center ${
                        selectedTime === time
                          ? 'border-green-500 bg-green-50 text-green-600'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Note */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">Note pour l'expert (optionnel)</h4>
              <textarea
                value={consultationNote}
                onChange={(e) => setConsultationNote(e.target.value)}
                placeholder="Décrivez brièvement le sujet que vous aimeriez aborder..."
                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
              />
            </div>

            {/* Récapitulatif */}
            {selectedDate && selectedTime && (
              <div className="bg-blue-50 rounded-xl p-6 mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Récapitulatif du rendez-vous</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span className="font-medium">{new Date(selectedDate).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Heure:</span>
                    <span className="font-medium">{selectedTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Durée:</span>
                    <span className="font-medium">{consultationDuration} minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tarif:</span>
                    <span className="font-medium">{expert.pricing.videoCall} coins/min</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-semibold text-lg text-blue-600">
                      <span>Total:</span>
                      <span>{expert.pricing.videoCall * parseInt(consultationDuration)} coins</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex space-x-4">
              <button
                onClick={() => setShowConsultationModal(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-xl hover:bg-gray-300 transition-colors whitespace-nowrap"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  alert(`Consultation réservée avec succès !\n\nExpert: ${expert.name}\nDate: ${new Date(selectedDate).toLocaleDateString('fr-FR')}\nHeure: ${selectedTime}\nDurée: ${consultationDuration} min\nTarif: ${expert.pricing.videoCall} coins/min\nTotal: ${expert.pricing.videoCall * parseInt(consultationDuration)} coins`);
                  setShowConsultationModal(false);
                  setSelectedDate('');
                  setSelectedTime('');
                  setConsultationNote('');
                }}
                disabled={!selectedDate || !selectedTime}
                className="flex-1 bg-green-600 text-white py-3 px-6 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                Confirmer le rendez-vous
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
