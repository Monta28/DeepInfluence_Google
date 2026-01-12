
'use client';

import { useState } from 'react';
import AppHeader from '@/components/AppHeader';
import VideoCard from '@/components/VideoCard';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function ExplorerPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [displayedVideos, setDisplayedVideos] = useState(8);
  const router = useRouter();
  const { user } = useAuth();

  const categories = [
    { id: 'all', name: 'Toutes', count: 24 },
    { id: 'business', name: 'Business', count: 8 },
    { id: 'wellness', name: 'Bien-être', count: 6 },
    { id: 'tech', name: 'Tech', count: 5 },
    { id: 'marketing', name: 'Marketing', count: 5 }
  ];

  const videos = [
    {
      id: 1,
      title: 'Les 5 clés du leadership efficace',
      expert: 'Dr. Marie Dubois',
      duration: '08:45',
      views: 12500,
      likes: 856,
      category: 'business',
      type: 'free',
      price: 0,
      thumbnail: 'https://readdy.ai/api/search-image?query=Professional%20business%20woman%20presenting%20leadership%20concepts%2C%20modern%20office%20background%2C%20confident%20posture%2C%20professional%20attire%2C%20engaging%20presentation&width=400&height=250&seq=video-leadership&orientation=landscape',
      expertImage: 'https://readdy.ai/api/search-image?query=Professional%20female%20personal%20development%20coach%20with%20warm%20confident%20smile%2C%20modern%20coaching%20office%20background%2C%20professional%20attire%2C%20trustworthy%20and%20approachable%20appearance%2C%20high%20quality%20portrait&width=60&height=60&seq=expert-marie-1&orientation=squarish',
      publishedAt: '2024-01-15',
      description: 'Découvrez les techniques fondamentales pour développer votre leadership et inspirer vos équipes.'
    },
    {
      id: 2,
      title: 'Stratégies de marketing digital 2024',
      expert: 'Ahmed Hassan',
      duration: '12:30',
      views: 8900,
      likes: 647,
      category: 'marketing',
      type: 'premium',
      price: 25,
      thumbnail: 'https://readdy.ai/api/search-image?query=Digital%20marketing%20strategy%20presentation%20with%20charts%2C%20graphs%2C%20social%20media%20icons%2C%20modern%20technology%20theme%2C%20professional%20setting&width=400&height=250&seq=video-marketing&orientation=landscape',
      expertImage: 'https://readdy.ai/api/search-image?query=Professional%20male%20digital%20marketing%20expert%20with%20confident%20expression%2C%20modern%20digital%20office%20background%2C%20contemporary%20business%20attire%2C%20trustworthy%20appearance%2C%20high%20quality%20portrait&width=60&height=60&seq=expert-ahmed-4&orientation=squarish',
      publishedAt: '2024-01-14',
      description: 'Les dernières tendances et stratégies pour réussir votre marketing digital en 2024.'
    },
    {
      id: 3,
      title: 'Méditation et gestion du stress',
      expert: 'Sophie Laurent',
      duration: '15:20',
      views: 15600,
      likes: 1234,
      category: 'wellness',
      type: 'free',
      price: 0,
      thumbnail: 'https://readdy.ai/api/search-image?query=Peaceful%20meditation%20session%20with%20woman%20in%20serene%20environment%2C%20calming%20nature%20background%2C%20wellness%20theme%2C%20relaxing%20atmosphere&width=400&height=250&seq=video-meditation&orientation=landscape',
      expertImage: 'https://readdy.ai/api/search-image?query=Professional%20female%20wellness%20and%20nutrition%20coach%20with%20healthy%20radiant%20appearance%2C%20natural%20wellness%20environment%20background%2C%20professional%20attire%2C%20trustworthy%20and%20caring%20expression%2C%20high%20quality%20portrait&width=60&height=60&seq=expert-sophie-3&orientation=squarish',
      publishedAt: '2024-01-13',
      description: 'Apprenez des techniques de méditation efficaces pour gérer le stress quotidien.'
    },
    {
      id: 4,
      title: 'Créer une startup rentable',
      expert: 'Marc Rodriguez',
      duration: '18:45',
      views: 7200,
      likes: 523,
      category: 'business',
      type: 'premium',
      price: 35,
      thumbnail: 'https://readdy.ai/api/search-image?query=Entrepreneur%20presenting%20startup%20ideas%2C%20modern%20coworking%20space%2C%20business%20planning%2C%20innovative%20atmosphere%2C%20professional%20setting&width=400&height=250&seq=video-startup&orientation=landscape',
      expertImage: 'https://readdy.ai/api/search-image?query=Professional%20male%20business%20entrepreneur%20in%20elegant%20suit%2C%20confident%20businessman%20portrait%2C%20modern%20corporate%20office%20background%2C%20professional%20headshot%2C%20trustworthy%20appearance%2C%20high%20quality%20portrait&width=60&height=60&seq=expert-marc-2&orientation=squarish',
      publishedAt: '2024-01-12',
      description: 'Guide complet pour créer et développer une startup profitable en 2024.'
    },
    {
      id: 5,
      title: 'Développement web moderne',
      expert: 'Claire Rousseau',
      duration: '22:15',
      views: 6800,
      likes: 445,
      category: 'tech',
      type: 'premium',
      price: 30,
      thumbnail: 'https://readdy.ai/api/search-image?query=Female%20developer%20coding%20on%20modern%20setup%2C%20multiple%20screens%2C%20programming%20environment%2C%20tech%20workspace%2C%20professional%20coding%20atmosphere&width=400&height=250&seq=video-coding&orientation=landscape',
      expertImage: 'https://readdy.ai/api/search-image?query=Professional%20female%20software%20developer%20with%20confident%20smile%2C%20modern%20tech%20office%20background%2C%20casual%20professional%20attire%2C%20high%20quality%20portrait&width=60&height=60&seq=expert-claire-5&orientation=squarish',
      publishedAt: '2024-01-11',
      description: 'Les technologies et frameworks incontournables pour le développement web moderne.'
    },
    {
      id: 6,
      title: 'Nutrition et performance',
      expert: 'Sophie Laurent',
      duration: '14:30',
      views: 11200,
      likes: 789,
      category: 'wellness',
      type: 'free',
      price: 0,
      thumbnail: 'https://readdy.ai/api/search-image?query=Healthy%20nutrition%20setup%20with%20fresh%20vegetables%2C%20fruits%2C%20nutritionist%20explaining%20healthy%20eating%2C%20wellness%20theme%2C%20bright%20natural%20lighting&width=400&height=250&seq=video-nutrition&orientation=landscape',
      expertImage: 'https://readdy.ai/api/search-image?query=Professional%20female%20wellness%20and%20nutrition%20coach%20with%20healthy%20radiant%20appearance%2C%20natural%20wellness%20environment%20background%2C%20professional%20attire%2C%20trustworthy%20and%20caring%20expression%2C%20high%20quality%20portrait&width=60&height=60&seq=expert-sophie-3&orientation=squarish',
      publishedAt: '2024-01-10',
      description: 'Optimisez votre nutrition pour améliorer vos performances physiques et mentales.'
    },
    {
      id: 7,
      title: 'Investissement pour débutants',
      expert: 'Thomas Bernard',
      duration: '16:20',
      views: 9500,
      likes: 634,
      category: 'business',
      type: 'premium',
      price: 40,
      thumbnail: 'https://readdy.ai/api/search-image?query=Financial%20advisor%20explaining%20investment%20strategies%2C%20charts%20and%20graphs%2C%20professional%20financial%20setting%2C%20money%20management%20theme&width=400&height=250&seq=video-investment&orientation=landscape',
      expertImage: 'https://readdy.ai/api/search-image?query=Professional%20male%20financial%20advisor%20with%20trustworthy%20smile%2C%20elegant%20office%20background%2C%20business%20suit%2C%20high%20quality%20portrait&width=60&height=60&seq=expert-thomas-6&orientation=squarish',
      publishedAt: '2024-01-09',
      description: 'Guide complet pour commencer à investir intelligemment et en toute sécurité.'
    },
    {
      id: 8,
      title: 'SEO et référencement naturel',
      expert: 'Ahmed Hassan',
      duration: '19:45',
      views: 8200,
      likes: 567,
      category: 'marketing',
      type: 'free',
      price: 0,
      thumbnail: 'https://readdy.ai/api/search-image?query=SEO%20specialist%20showing%20search%20engine%20optimization%20techniques%2C%20analytics%20dashboard%2C%20digital%20marketing%20tools%2C%20professional%20workspace&width=400&height=250&seq=video-seo&orientation=landscape',
      expertImage: 'https://readdy.ai/api/search-image?query=Professional%20male%20digital%20marketing%20expert%20with%20confident%20expression%2C%20modern%20digital%20office%20background%2C%20contemporary%20business%20attire%2C%20trustworthy%20appearance%2C%20high%20quality%20portrait&width=60&height=60&seq=expert-ahmed-4&orientation=squarish',
      publishedAt: '2024-01-08',
      description: 'Maîtrisez les techniques de SEO pour améliorer la visibilité de votre site web.'
    },
    {
      id: 9,
      title: 'Gestion du temps et productivité',
      expert: 'Dr. Marie Dubois',
      duration: '11:30',
      views: 13400,
      likes: 934,
      category: 'business',
      type: 'premium',
      price: 28,
      thumbnail: 'https://readdy.ai/api/search-image?query=Time%20management%20productivity%20expert%20with%20organized%20workspace%2C%20calendar%20and%20planning%20tools%2C%20professional%20efficiency%20concept&width=400&height=250&seq=video-productivity&orientation=landscape',
      expertImage: 'https://readdy.ai/api/search-image?query=Professional%20female%20personal%20development%20coach%20with%20warm%20confident%20smile%2C%20modern%20coaching%20office%20background%2C%20professional%20attire%2C%20trustworthy%20and%20approachable%20appearance%2C%20high%20quality%20portrait&width=60&height=60&seq=expert-marie-1&orientation=squarish',
      publishedAt: '2024-01-07',
      description: 'Techniques avancées pour optimiser votre temps et booster votre productivité.'
    },
    {
      id: 10,
      title: 'Intelligence artificielle et éthique',
      expert: 'Claire Rousseau',
      duration: '25:10',
      views: 5600,
      likes: 412,
      category: 'tech',
      type: 'premium',
      price: 45,
      thumbnail: 'https://readdy.ai/api/search-image?query=AI%20ethics%20technology%20presentation%2C%20futuristic%20tech%20environment%2C%20artificial%20intelligence%20concept%2C%20modern%20technology%20discussion&width=400&height=250&seq=video-ai-ethics&orientation=landscape',
      expertImage: 'https://readdy.ai/api/search-image?query=Professional%20female%20software%20developer%20with%20confident%20smile%2C%20modern%20tech%20office%20background%2C%20casual%20professional%20attire%2C%20high%20quality%20portrait&width=60&height=60&seq=expert-claire-5&orientation=squarish',
      publishedAt: '2024-01-06',
      description: 'Exploration des enjeux éthiques de l\'intelligence artificielle moderne.'
    },
    {
      id: 11,
      title: 'Yoga et flexibilité mentale',
      expert: 'Sophie Laurent',
      duration: '20:45',
      views: 14200,
      likes: 1156,
      category: 'wellness',
      type: 'free',
      price: 0,
      thumbnail: 'https://readdy.ai/api/search-image?query=Yoga%20instructor%20in%20peaceful%20studio%2C%20flexibility%20and%20mindfulness%20practice%2C%20wellness%20and%20meditation%20environment&width=400&height=250&seq=video-yoga&orientation=landscape',
      expertImage: 'https://readdy.ai/api/search-image?query=Professional%20female%20wellness%20and%20nutrition%20coach%20with%20healthy%20radiant%20appearance%2C%20natural%20wellness%20environment%20background%2C%20professional%20attire%2C%20trustworthy%20and%20caring%20expression%2C%20high%20quality%20portrait&width=60&height=60&seq=expert-sophie-3&orientation=squarish',
      publishedAt: '2024-01-05',
      description: 'Développez votre flexibilité physique et mentale avec des techniques de yoga.'
    },
    {
      id: 12,
      title: 'Stratégies de vente B2B',
      expert: 'Marc Rodriguez',
      duration: '17:20',
      views: 6800,
      likes: 478,
      category: 'business',
      type: 'premium',
      price: 32,
      thumbnail: 'https://readdy.ai/api/search-image?query=B2B%20sales%20strategy%20presentation%2C%20business%20meeting%20environment%2C%20professional%20sales%20techniques%2C%20modern%20corporate%20setting&width=400&height=250&seq=video-b2b-sales&orientation=landscape',
      expertImage: 'https://readdy.ai/api/search-image?query=Professional%20male%20business%20entrepreneur%20in%20elegant%20suit%2C%20confident%20businessman%20portrait%2C%20modern%20corporate%20office%20background%2C%20professional%20headshot%2C%20trustworthy%20appearance%2C%20high%20quality%20portrait&width=60&height=60&seq=expert-marc-2&orientation=squarish',
      publishedAt: '2024-01-04',
      description: 'Maîtrisez les techniques de vente pour les entreprises B2B.'
    },
    {
      id: 13,
      title: 'Réseaux sociaux et influence',
      expert: 'Ahmed Hassan',
      duration: '14:15',
      views: 10300,
      likes: 723,
      category: 'marketing',
      type: 'premium',
      price: 27,
      thumbnail: 'https://readdy.ai/api/search-image?query=Social%20media%20influence%20marketing%2C%20digital%20content%20creation%2C%20influencer%20marketing%20workspace%2C%20modern%20social%20media%20strategy&width=400&height=250&seq=video-social-influence&orientation=landscape',
      expertImage: 'https://readdy.ai/api/search-image?query=Professional%20male%20digital%20marketing%20expert%20with%20confident%20expression%2C%20modern%20digital%20office%20background%2C%20contemporary%20business%20attire%2C%20trustworthy%20appearance%2C%20high%20quality%20portrait&width=60&height=60&seq=expert-ahmed-4&orientation=squarish',
      publishedAt: '2024-01-03',
      description: 'Comment construire votre influence sur les réseaux sociaux.'
    },
    {
      id: 14,
      title: 'Gestion financière personnelle',
      expert: 'Thomas Bernard',
      duration: '13:50',
      views: 11700,
      likes: 856,
      category: 'business',
      type: 'free',
      price: 0,
      thumbnail: 'https://readdy.ai/api/search-image?query=Personal%20finance%20management%2C%20budgeting%20and%20financial%20planning%2C%20professional%20financial%20advice%20setting&width=400&height=250&seq=video-personal-finance&orientation=landscape',
      expertImage: 'https://readdy.ai/api/search-image?query=Professional%20male%20financial%20advisor%20with%20trustworthy%20smile%2C%20elegant%20office%20background%2C%20business%20suit%2C%20high%20quality%20portrait&width=60&height=60&seq=expert-thomas-6&orientation=squarish',
      publishedAt: '2024-01-02',
      description: 'Principes essentiels pour gérer efficacement vos finances personnelles.'
    },
    {
      id: 15,
      title: 'Programmation Python avancée',
      expert: 'Claire Rousseau',
      duration: '28:30',
      views: 4900,
      likes: 334,
      category: 'tech',
      type: 'premium',
      price: 38,
      thumbnail: 'https://readdy.ai/api/search-image?query=Python%20programming%20advanced%20tutorial%2C%20coding%20workspace%20with%20multiple%20monitors%2C%20software%20development%20environment&width=400&height=250&seq=video-python-advanced&orientation=landscape',
      expertImage: 'https://readdy.ai/api/search-image?query=Professional%20female%20software%20developer%20with%20confident%20smile%2C%20modern%20tech%20office%20background%2C%20casual%20professional%20attire%2C%20high%20quality%20portrait&width=60&height=60&seq=expert-claire-5&orientation=squarish',
      publishedAt: '2024-01-01',
      description: 'Techniques avancées de programmation Python pour développeurs expérimentés.'
    },
    {
      id: 16,
      title: 'Alimentation intuitive',
      expert: 'Sophie Laurent',
      duration: '18:25',
      views: 9200,
      likes: 687,
      category: 'wellness',
      type: 'premium',
      price: 24,
      thumbnail: 'https://readdy.ai/api/search-image?query=Intuitive%20eating%20nutrition%20coaching%2C%20healthy%20food%20preparation%2C%20wellness%20nutrition%20consultation%20environment&width=400&height=250&seq=video-intuitive-eating&orientation=landscape',
      expertImage: 'https://readdy.ai/api/search-image?query=Professional%20female%20wellness%20and%20nutrition%20coach%20with%20healthy%20radiant%20appearance%2C%20natural%20wellness%20environment%20background%2C%20professional%20attire%2C%20trustworthy%20and%20caring%20expression%2C%20high%20quality%20portrait&width=60&height=60&seq=expert-sophie-3&orientation=squarish',
      publishedAt: '2023-12-31',
      description: 'Apprenez à écouter votre corps pour une alimentation saine et équilibrée.'
    }
  ];

  const filteredVideos = videos.filter((video: any) => {
    const matchesCategory = activeCategory === 'all' || video.category === activeCategory;
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         video.expert.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || video.type === filterType;
    
    return matchesCategory && matchesSearch && matchesType;
  });

  const trendingVideos = videos.filter((video: any) => video.views > 10000).slice(0, 3);

  const handleLoadMore = () => {
    setDisplayedVideos(prev => Math.min(prev + 8, filteredVideos.length));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <AppHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Explorer les Vidéos
            </h1>
            <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-sm">
              <i className="ri-coins-line text-yellow-600"></i>
              <span className="font-semibold text-gray-900 dark:text-white">{user?.coins || 0} coins</span>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Découvrez les vidéos de nos experts et enrichissez vos connaissances
          </p>
        </div>

        {/* Trending Videos */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Tendances du moment
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {trendingVideos.map((video) => (
              <div key={video.id} className="relative">
                <VideoCard video={video} />
                <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                  🔥 Tendance
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-lg">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="ri-search-line text-gray-400"></i>
              </div>
              <input
                type="text"
                placeholder="Rechercher une vidéo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Type Filter */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Type:</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm pr-8 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">Toutes</option>
                <option value="free">Gratuites</option>
                <option value="premium">Premium</option>
              </select>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  activeCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600'
                }`}
              >
                {category.name}
                <span className="ml-2 px-2 py-1 text-xs bg-white/20 dark:bg-gray-600/50 rounded-full">
                  {category.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Video Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredVideos.slice(0, displayedVideos).map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>

        {/* Empty State */}
        {filteredVideos.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-video-line text-4xl text-gray-400"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Aucune vidéo trouvée
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Essayez de modifier vos filtres ou votre recherche
            </p>
          </div>
        )}

        {/* Load More */}
        {filteredVideos.length > displayedVideos && (
          <div className="text-center mt-12">
            <button 
              onClick={handleLoadMore}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold whitespace-nowrap"
            >
              Charger plus de vidéos ({filteredVideos.length - displayedVideos} restantes)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
