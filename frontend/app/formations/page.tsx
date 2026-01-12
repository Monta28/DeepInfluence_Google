'use client';

import { useState, useEffect, useCallback } from 'react';
import AppHeader from '@/components/AppHeader';
import Footer from '@/components/Footer';
import FormationCard from '@/components/FormationCard';
import ApiService, { Formation, PublicStats } from '../../services/api';

export default function FormationsPage() {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [stats, setStats] = useState<PublicStats | null>(null);

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all'|'enrolled'>('all');
  const [levelFilter, setLevelFilter] = useState<'all'|'Débutant'|'Intermédiaire'|'Avancé'>('all');
  const [typeFilter, setTypeFilter] = useState<'all'|'live'|'presentiel'>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [showEnrolledOnly, setShowEnrolledOnly] = useState(false);

  const categories = [
    { id: 'all', name: 'Toutes', icon: 'ri-apps-line' },
    { id: 'business', name: 'Business', icon: 'ri-briefcase-line' },
    { id: 'marketing', name: 'Marketing', icon: 'ri-megaphone-line' },
    { id: 'tech', name: 'Technologie', icon: 'ri-computer-line' },
    { id: 'wellness', name: 'Bien-être', icon: 'ri-heart-line' },
    { id: 'finance', name: 'Finance', icon: 'ri-money-dollar-circle-line' },
    { id: 'developpement', name: 'Développement personnel', icon: 'ri-user-star-line' },
  ];

  const loadFormations = useCallback(async (pageNum = 1, reset = false) => {
    setLoading(true);
    if (reset) {
        setFormations([]);
        setError('');
    }
    try {
      const response = await ApiService.getFormations({
        page: pageNum,
        limit: 12,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        search: searchTerm || undefined,
        level: levelFilter !== 'all' ? levelFilter : undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined
      });

      if (response.success && response.data?.formations) {
        // Client-side filter for date and enrolled tab if needed
        let items: Formation[] = response.data.formations;
        if (dateFrom) {
          const from = new Date(dateFrom);
          items = items.filter((f: any) => f.nextSession ? (new Date(f.nextSession) >= from) : true);
        }
        if (activeTab === 'enrolled') {
          items = items.filter((f: any) => (f as any).isEnrolled === true);
        }
        setFormations(prev => reset ? items : [...prev, ...items]);
        setHasMore(response.data.pagination.page < response.data.pagination.pages);
        setPage(pageNum);
         if (reset && response.data.formations.length === 0) {
          setError('Aucune formation ne correspond à vos critères.');
        }
      } else {
        if (reset) setFormations([]);
        setHasMore(false);
        setError('Aucune formation trouvée.');
      }
    } catch (err: any) {
      setError('Erreur de connexion au serveur. Veuillez réessayer.');
      console.error('Erreur API formations:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchTerm, levelFilter, typeFilter, dateFrom, activeTab]);

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
    
    const debounce = setTimeout(() => {
      loadFormations(1, true);
    }, 300);
    return () => clearTimeout(debounce);
  }, [loadFormations]);

  const statsCards = [
    { label: 'Formations disponibles', value: stats ? `${stats.totalFormations}+` : '...', icon: 'ri-book-line' },
    { label: 'Étudiants actifs', value: stats ? `${stats.totalStudents}+` : '...', icon: 'ri-user-line' },
    { label: 'Taux de réussite', value: stats ? `${stats.successRate}%` : '...', icon: 'ri-trophy-line' },
    { label: 'Certificats délivrés', value: stats ? `${stats.certificatesIssued}+` : '...', icon: 'ri-award-line' }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <AppHeader />
      
      <section className="relative bg-gradient-to-br from-green-600 via-blue-600 to-purple-700 py-20 overflow-hidden">
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
              Formations
              <span className="block bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                Professionnelles
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 leading-relaxed">
              Développez vos compétences avec nos formations certifiantes animées par des experts reconnus
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={() => document.getElementById('formations-section')?.scrollIntoView({ behavior: 'smooth' })} className="bg-white text-blue-600 px-8 py-4 rounded-full font-semibold hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
                <i className="ri-search-line mr-2"></i>
                Parcourir le catalogue
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
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <i className={`${stat.icon} text-white text-2xl`}></i>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{stat.value}</div>
                <div className="text-gray-600 dark:text-gray-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <main id="formations-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
            <div className="relative max-w-lg mx-auto mb-4">
                <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Rechercher une formation..." className="w-full pl-12 pr-4 py-3 border rounded-full"/>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mb-4">
                {categories.map((cat) => (
                    <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`px-4 py-2 rounded-full text-sm font-medium ${selectedCategory === cat.id ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                        {cat.name}
                    </button>
                ))}
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                <button onClick={() => { setActiveTab('all'); loadFormations(1, true); }} className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'all' ? 'bg-white shadow-sm' : ''}`}>Toutes</button>
                <button onClick={() => { setActiveTab('enrolled'); loadFormations(1, true); }} className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'enrolled' ? 'bg-white shadow-sm' : ''}`}>Inscrites</button>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Niveau</label>
                  <select value={levelFilter} onChange={(e)=>{ setLevelFilter(e.target.value as any); }} className="border rounded-lg px-3 py-2">
                    <option value="all">Tous</option>
                    <option value="Débutant">Débutant</option>
                    <option value="Intermédiaire">Intermédiaire</option>
                    <option value="Avancé">Avancé</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Type</label>
                  <select value={typeFilter} onChange={(e)=>{ setTypeFilter(e.target.value as any); }} className="border rounded-lg px-3 py-2">
                    <option value="all">Tous</option>
                    <option value="live">En direct</option>
                    <option value="presentiel">Présentiel</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">À partir du</label>
                  <input type="date" value={dateFrom} onChange={(e)=>{ setDateFrom(e.target.value); }} className="border rounded-lg px-3 py-2" />
                </div>
              </div>
            </div>
        </div>

        {loading && formations.length === 0 && <div className="text-center py-16"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div></div>}
        {error && !loading && <div className="text-center py-16"><p className="text-red-500">{error}</p></div>}
        
        <div className="flex items-center justify-between mb-6">
          <div></div>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" checked={showEnrolledOnly} onChange={(e)=>setShowEnrolledOnly(e.target.checked)} />
            Inscrites uniquement
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {formations.map((formation) => (
            <FormationCard key={formation.id} formation={formation} />
          ))}
        </div>

        {hasMore && (
          <div className="text-center">
            <button onClick={() => loadFormations(page + 1, false)} disabled={loading} className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Chargement...' : 'Charger plus'}
            </button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
