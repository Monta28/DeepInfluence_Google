"use client";

import { useState, useEffect, useCallback, Suspense } from 'react';
import AppHeader from '@/components/AppHeader';
import Footer from '@/components/Footer';
import VideoCard from '@/components/VideoCard';
import ApiService, { Video, PublicStats } from '../../services/api';
import { useSearchParams } from 'next/navigation';

function VideosContent() {
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [stats, setStats] = useState<PublicStats | null>(null);

  const categories = [
    { id: 'all', name: 'Toutes', icon: 'ri-apps-line' },
    { id: 'business', name: 'Business', icon: 'ri-briefcase-line' },
    { id: 'marketing', name: 'Marketing', icon: 'ri-megaphone-line' },
    { id: 'tech', name: 'Technologie', icon: 'ri-computer-line' },
    { id: 'wellness', name: 'Bien-être', icon: 'ri-heart-line' },
    { id: 'finance', name: 'Finance', icon: 'ri-money-dollar-circle-line' },
    { id: 'developpement', name: 'Développement personnel', icon: 'ri-user-star-line' },
  ];

  const loadVideos = useCallback(async (pageNum = 1, reset = false) => {
    setLoading(true);
    if(reset) {
        setVideos([]);
        setError('');
    }
    try {
      const response = await ApiService.getVideos({
        page: pageNum,
        limit: 12,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        search: searchTerm || undefined
      });

      if (response.success && response.data?.videos) {
        setVideos(prev => reset ? response.data.videos : [...prev, ...response.data.videos]);
        setHasMore(response.data.pagination.page < response.data.pagination.pages);
        setPage(pageNum);
        if(reset && response.data.videos.length === 0) {
            setError('Aucune vidéo ne correspond à vos critères.');
        }
      } else {
        if(reset) setVideos([]);
        setHasMore(false);
        setError('Aucune vidéo trouvée.');
      }
    } catch (err: any) {
      setError('Erreur de connexion au serveur. Veuillez réessayer.');
      console.error('Erreur API videos:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchTerm]);
  
  useEffect(() => {
    const fetchStats = async () => {
        try {
            const response = await ApiService.getPublicStats();
            if (response.success && response.data) setStats(response.data);
        } catch (e) {
            console.error("Impossible de charger les statistiques publiques.");
        }
    };
    fetchStats();

    // Appliquer le paramètre de recherche depuis l'URL si présent
    const initialSearch = searchParams.get('search') || '';
    if (initialSearch && initialSearch !== searchTerm) {
      setSearchTerm(initialSearch);
      return; // laisser l'autre rendu relancer l'effet via le nouveau loadVideos
    }

    const debounce = setTimeout(() => {
      loadVideos(1, true);
    }, 300);
    return () => clearTimeout(debounce);
  }, [loadVideos, searchParams]);
  
  const statsCards = [
    { label: 'Vidéos disponibles', value: stats ? `${stats.totalVideos || 0}+` : '...', icon: 'ri-play-circle-line' },
    { label: 'Heures de contenu', value: stats && stats.totalHoursContent ? `${Math.round(stats.totalHoursContent)}+h` : '...', icon: 'ri-time-line' },
    { label: 'Vues totales', value: stats && stats.totalViews ? `${(stats.totalViews / 1000000).toFixed(1)}M+` : '...', icon: 'ri-eye-line' },
    { label: 'Experts contributeurs', value: stats ? `${stats.totalExperts}+` : '...', icon: 'ri-user-star-line' }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <AppHeader />

      <section className="relative bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 py-20 overflow-hidden">
        <div 
          className="absolute inset-0 mix-blend-overlay opacity-30"
          style={{
            backgroundImage: 'url("https://readdy.ai/api/search-image?query=Professional%20expert%20consultation%20meeting%2C%20modern%20business%20environment%2C%20diverse%20group%20of%20professionals%20collaborating%2C%20bright%20modern%20office%20space%2C%20professional%20consultation%20setting%2C%20clean%20minimalist%20background%2C%20high%20quality%20business%20photography&width=1920&height=800&seq=experts-hero-bg-001&orientation=landscape")',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        ></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Bibliothèque
              <span className="block bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                Vidéo
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-purple-100 mb-8 leading-relaxed">
              Accédez à des centaines de vidéos éducatives créées par nos experts pour développer vos compétences
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={() => document.getElementById('videos-section')?.scrollIntoView({ behavior: 'smooth' })} className="bg-white text-purple-600 px-8 py-4 rounded-full font-semibold hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
                <i className="ri-search-line mr-2"></i>
                Explorer la bibliothèque
              </button>
            </div>
          </div>
        </div>
        
        <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-16 h-16 bg-yellow-400/20 rounded-full animate-bounce"></div>
        <div className="absolute top-1/2 left-1/4 w-4 h-4 bg-white/30 rounded-full animate-ping"></div>
      </section>

      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {statsCards.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <i className={`${stat.icon} text-white text-2xl`}></i>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{stat.value}</div>
                <div className="text-gray-600 dark:text-gray-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <main id="videos-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
            <div className="relative max-w-lg mx-auto mb-4">
                <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Rechercher une vidéo..." className="w-full pl-12 pr-4 py-3 border rounded-full"/>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
                {categories.map((category) => (
                    <button key={category.id} onClick={() => setSelectedCategory(category.id)} className={`px-4 py-2 rounded-full text-sm font-medium ${selectedCategory === category.id ? 'bg-pink-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                        {category.name}
                    </button>
                ))}
            </div>
        </div>

        {loading && videos.length === 0 && <div className="text-center py-16"><div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div></div>}
        {error && !loading && <div className="text-center py-16"><p className="text-red-500">{error}</p></div>}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>

        {hasMore && (
          <div className="text-center">
            <button onClick={() => loadVideos(page + 1, false)} disabled={loading} className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50">
              {loading ? 'Chargement...' : 'Charger plus'}
            </button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default function VideosPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <VideosContent />
    </Suspense>
  );
}
