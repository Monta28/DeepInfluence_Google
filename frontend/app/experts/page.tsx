'use client';

import { useState, useEffect, useCallback } from 'react';
import AppHeader from '@/components/AppHeader';
import Footer from '@/components/Footer';
import ExpertCard from '@/components/ExpertCard';
import ExpertFilters from '@/components/ExpertFilters';
import ApiService, { Expert, PublicStats } from '../../services/api';
import { useSocket } from '@/contexts/SocketContext';

export default function ExpertsPage() {
  const socket = useSocket();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [experts, setExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [stats, setStats] = useState<PublicStats | null>(null);

  const loadExperts = useCallback(async (pageNum = 1, reset = false) => {
    setLoading(true);
    if (reset) {
      setExperts([]);
      setError('');
    }
    
    try {
      const response = await ApiService.getExperts({
        page: pageNum,
        limit: 12,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        search: searchTerm || undefined,
      });

      if (response.success && response.data?.experts) {
        const verifiedOnly = (response.data.experts as Expert[]).filter((e) => e.verified);
        setExperts(prev => reset ? verifiedOnly : [...prev, ...verifiedOnly]);
        setHasMore(response.data.pagination.page < response.data.pagination.pages);
        setPage(pageNum);
        if (reset && verifiedOnly.length === 0) {
          setError('Aucun expert ne correspond à vos critères de recherche.');
        }
      } else {
        if (reset) setExperts([]);
        setHasMore(false);
        setError('Aucun expert trouvé.');
      }
    } catch (err: any) {
      setError('Erreur de connexion au serveur. Veuillez réessayer plus tard.');
      console.error('Erreur API experts:', err);
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
    loadExperts(1, true);
  }, [loadExperts]);

  // Refresh list in real-time when an expert verification changes
  useEffect(() => {
    if (!socket) return;
    const handler = (_: any) => { loadExperts(1, true); };
    socket.on('expertVerificationChanged', handler);
    return () => { socket.off('expertVerificationChanged', handler); };
  }, [socket, loadExperts]);

  const statsCards = [
    { label: 'Experts vérifiés', value: stats ? `${stats.totalExperts}+` : '...', icon: 'ri-shield-check-line' },
    { label: 'Clients satisfaits', value: stats ? `${stats.happyClients}` : '...', icon: 'ri-emotion-happy-line' },
    { label: 'Taux de réussite', value: stats ? `${stats.successRate}%` : '...', icon: 'ri-trophy-line' },
    { label: 'Domaines d\'expertise', value: stats ? `${stats.totalCategories}+` : '...', icon: 'ri-graduation-cap-line' }
  ];

  const categories = [
    { id: 'all', name: 'Toutes', icon: 'ri-apps-line' },
    { id: 'business', name: 'Business', icon: 'ri-briefcase-line' },
    { id: 'marketing', name: 'Marketing', icon: 'ri-megaphone-line' },
    { id: 'tech', name: 'Technologie', icon: 'ri-computer-line' },
    { id: 'wellness', name: 'Bien-être', icon: 'ri-heart-line' },
    { id: 'finance', name: 'Finance', icon: 'ri-money-dollar-circle-line' },
    { id: 'developpement', name: 'Développement personnel', icon: 'ri-user-star-line' },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <AppHeader />
      
      <section className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 py-20 overflow-hidden">
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
              Connectez-vous avec les
              <span className="block bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                Meilleurs Experts
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 leading-relaxed">
              Découvrez notre communauté d'experts certifiés prêts à vous accompagner dans votre développement personnel et professionnel
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={() => document.getElementById('experts-section')?.scrollIntoView({ behavior: 'smooth' })} className="bg-white text-blue-600 px-8 py-4 rounded-full font-semibold hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 whitespace-nowrap">
                <i className="ri-search-line mr-2"></i>
                Trouver un expert
              </button>
            </div>
          </div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-16 h-16 bg-yellow-400/20 rounded-full animate-bounce"></div>
        <div className="absolute top-1/2 left-1/4 w-4 h-4 bg-white/30 rounded-full animate-ping"></div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {statsCards.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <i className={`${stat.icon} text-white text-2xl`}></i>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{stat.value}</div>
                <div className="text-gray-600 dark:text-gray-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div id="experts-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
            <div className="relative max-w-lg mx-auto mb-4">
                <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Rechercher une vidéo..." className="w-full pl-12 pr-4 py-3 border rounded-full"/>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
                {categories.map((category) => (
                    <button key={category.id} onClick={() => setSelectedCategory(category.id)} className={`px-4 py-2 rounded-full text-sm font-medium ${selectedCategory === category.id ? 'bg-purple-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                        {category.name}
                    </button>
                ))}
            </div>
        </div>

        {loading && experts.length === 0 && (
          <div className="text-center py-16"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div></div>
        )}

        {error && !loading && (
          <div className="text-center py-16"><p className="text-red-500">{error}</p></div>
        )}
        
        {!loading && experts.length === 0 && error && (
            <div className="text-center py-16">
                <h3 className="text-2xl font-bold">Aucun expert trouvé</h3>
                <p className="text-gray-600 mt-2">Essayez d'ajuster vos filtres de recherche.</p>
            </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {experts.map((expert) => (
            <ExpertCard key={expert.id} expert={expert} />
          ))}
        </div>

        {hasMore && (
          <div className="text-center">
            <button 
              onClick={() => loadExperts(page + 1, false)}
              disabled={loading}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Chargement...' : 'Charger plus'}
            </button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
