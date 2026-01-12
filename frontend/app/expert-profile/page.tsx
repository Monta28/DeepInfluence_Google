'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import { useAuth } from '../../contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import ApiService from '../../services/api';

export default function ExpertProfilePage() {
  const { formatPrice } = useCurrency();
  const [activeTab, setActiveTab] = useState('overview');
  // Etats dynamiques
  const [expertStats, setExpertStats] = useState<any>(null);
  const [myExpert, setMyExpert] = useState<any>(null);
  const [myVideosCount, setMyVideosCount] = useState<number>(0);
  const [myFormationsCount, setMyFormationsCount] = useState<number>(0);
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<{ months: string[]; revenueVideo: number[]; revenueFormation: number[]; createdVideos: number[]; createdFormations: number[] } | null>(null);
  const [topContent, setTopContent] = useState<{ topVideosByRevenue: any[]; topVideosByViews: any[]; topFormationsByStudents: any[] } | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/signin');
      return;
    }

    if (user.userType !== 'expert') {
      router.push('/dashboard');
      return;
    }

    loadExpertData();
  }, [user, router]);

  const loadExpertData = async () => {
    try {
      setLoading(true);
      setError('');
      const [stats, me, vids, forms, appts, an, top] = await Promise.all([
        ApiService.getExpertDashboardStats().catch(() => ({ success: false })),
        ApiService.getMyExpert().catch(() => ({ success: false })),
        ApiService.getExpertVideos({ limit: 200 }).catch(() => ({ success: false })),
        ApiService.getExpertFormations({ limit: 200 }).catch(() => ({ success: false })),
        ApiService.getExpertAppointments().catch(() => ({ success: false })),
        ApiService.getExpertAnalytics().catch(() => ({ success: false })),
        ApiService.getExpertTopContent().catch(() => ({ success: false }))
      ]);
      if ((stats as any)?.success) setExpertStats((stats as any).data || null);
      if ((me as any)?.success) setMyExpert((me as any).data || null);
      if ((vids as any)?.success) setMyVideosCount((((vids as any).data?.videos) || []).length);
      if ((forms as any)?.success) setMyFormationsCount((((forms as any).data?.formations) || (forms as any).data || []).length || 0);
      if ((appts as any)?.success) {
        const list = ((appts as any).data || []) as any[];
        const now = new Date();
        const parseDT = (a: any) => new Date(`${a.date}T${(a.time || '00:00')}:00`);
        const future = list.filter((a: any) => {
          const dt = parseDT(a);
          return dt.getTime() > now.getTime() && a.status !== 'cancelled' && a.status !== 'completed';
        }).sort((a, b) => parseDT(a).getTime() - parseDT(b).getTime());
        setUpcoming(future.slice(0, 2));
      }
      if ((an as any)?.success) setAnalytics((an as any).data || null);
      if ((top as any)?.success) setTopContent((top as any).data || null);
    } catch (err: any) {
      setError(err?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFormation = () => router.push('/dashboard/formations/create');
  const handleCreateVideo = () => router.push('/dashboard/videos/create');
  const handleWithdraw = () => router.push('/dashboard/coins');

  if (!user || user.userType !== 'expert') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <AppHeader />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Chargement du profil expert...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Expert */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-8 text-white mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 bg-white rounded-full overflow-hidden flex items-center justify-center">
                {myExpert?.image ? (
                  <img src={myExpert.image} alt={myExpert.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-purple-700">
                    {user.firstName?.[0]?.toUpperCase()}{user.lastName?.[0]?.toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold">{myExpert?.name || 'Profil Expert'}</h1>
                <p className="text-xl opacity-90">{user.firstName} {user.lastName}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center">
                    <i className="ri-star-fill text-yellow-400 mr-1"></i>
                    <span className="font-semibold">{(Number(expertStats?.averageRating || 0)).toFixed(1)}</span>
                    <span className="opacity-75 ml-1">({expertStats?.reviewCount || 0} avis)</span>
                  </div>
                  <div className="flex items-center">
                    <i className="ri-group-line mr-1"></i>
                    <span>{Number(expertStats?.totalStudents || 0)} étudiants</span>
                  </div>
                  {myExpert?.responseTime && (
                    <div className="flex items-center">
                      <i className="ri-time-line mr-1"></i>
                      <span>Répond en {myExpert.responseTime}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-white/20 rounded-lg p-4">
                <p className="text-sm opacity-75">Revenus cumulés (estimés)</p>
                <p className="text-3xl font-bold">
                  {formatPrice(Number(expertStats?.formationRevenue || 0) + Number(expertStats?.videoRevenue || 0))}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Messages d'erreur */}
        {error && (
          <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-8">
            <div className="flex items-center">
              <i className="ri-information-line text-yellow-600 dark:text-yellow-400 text-xl mr-3"></i>
              <p className="text-yellow-800 dark:text-yellow-200">{error}</p>
            </div>
          </div>
        )}

        {/* Statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Revenus totaux</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatPrice(Number((expertStats?.formationRevenue || 0) + (expertStats?.videoRevenue || 0)))}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <i className="ri-money-euro-circle-line text-green-600 dark:text-green-400 text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Sessions totales</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {myExpert?.sessions || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <i className="ri-calendar-check-line text-blue-600 dark:text-blue-400 text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Formations publiées</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{myFormationsCount}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <i className="ri-graduation-cap-line text-purple-600 dark:text-purple-400 text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Vidéos publiées</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{myVideosCount}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <i className="ri-play-circle-line text-red-600 dark:text-red-400 text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Vue d'ensemble
              </button>
              <button
                onClick={() => setActiveTab('earnings')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'earnings'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Revenus
              </button>
              <button
                onClick={() => setActiveTab('content')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'content'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Contenu
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'analytics'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Analytiques
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Vue d'ensemble</h2>
                
                {/* Actions rapides */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <button
                    onClick={handleCreateFormation}
                    className="p-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 text-left"
                  >
                    <i className="ri-graduation-cap-line text-2xl mb-3 block"></i>
                    <h3 className="font-semibold mb-2">Créer une formation</h3>
                    <p className="text-sm opacity-90">Partagez votre expertise avec une nouvelle formation</p>
                  </button>

                  <button
                    onClick={handleCreateVideo}
                    className="p-6 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg hover:from-red-600 hover:to-pink-700 transition-all duration-200 text-left"
                  >
                    <i className="ri-video-add-line text-2xl mb-3 block"></i>
                    <h3 className="font-semibold mb-2">Publier une vidéo</h3>
                    <p className="text-sm opacity-90">Créez du contenu vidéo pour vos étudiants</p>
                  </button>

                  <button
                    onClick={handleWithdraw}
                    className="p-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 text-left"
                  >
                    <i className="ri-bank-card-line text-2xl mb-3 block"></i>
                    <h3 className="font-semibold mb-2">Retirer des fonds</h3>
                    <p className="text-sm opacity-90">Disponible: {formatPrice(expertStats?.availableBalance || 8300)}</p>
                  </button>
                </div>

                {/* Prochains rendez-vous */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Prochains rendez-vous
                  </h3>
                  <div className="space-y-3">
                    {upcoming.length > 0 ? upcoming.map((a) => (
                      <div key={a.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                            <i className="ri-user-line text-blue-600 dark:text-blue-400"></i>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{a.expert || 'Rendez-vous'}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{a.category || a.type}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{a.date} {a.time}</p>
                          {a.duration && <p className="text-xs text-gray-500 dark:text-gray-400">{a.duration}</p>}
                        </div>
                      </div>
                    )) : (
                      <p className="text-gray-600 dark:text-gray-300">Aucun rendez-vous à venir.</p>
                    )}
                  </div>
                  
                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {upcoming.length} rendez-vous programmés (prochainement)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'earnings' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Revenus</h2>
                  <button
                    onClick={handleWithdraw}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <i className="ri-bank-card-line mr-2"></i>
                    Retirer des fonds
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Revenus Formations</p>
                        <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                          {formatPrice(Number(expertStats?.formationRevenue || 0))}
                        </p>
                      </div>
                      <i className="ri-graduation-cap-line text-purple-600 dark:text-purple-400 text-3xl"></i>
                    </div>
                  </div>

                  <div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-red-600 dark:text-red-400">Revenus Vidéos</p>
                        <p className="text-3xl font-bold text-red-900 dark:text-red-100">
                          {formatPrice(Number(expertStats?.videoRevenue || 0))}
                        </p>
                      </div>
                      <i className="ri-play-circle-line text-red-600 dark:text-red-400 text-3xl"></i>
                    </div>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-600 dark:text-green-400">Total gagné</p>
                        <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                          {formatPrice(Number((expertStats?.formationRevenue || 0) + (expertStats?.videoRevenue || 0)))}
                        </p>
                      </div>
                      <i className="ri-money-euro-circle-line text-green-600 dark:text-green-400 text-3xl"></i>
                    </div>
                  </div>
                </div>

                {/* Synthèse supprimée comme demandé */}
              </div>
            )}

            {activeTab === 'content' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Gestion du contenu</h2>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleCreateFormation}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <i className="ri-graduation-cap-line mr-2"></i>
                      Nouvelle formation
                    </button>
                    <button
                      onClick={handleCreateVideo}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <i className="ri-video-add-line mr-2"></i>
                      Nouvelle vidéo
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Formations */}
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Mes formations ({myFormationsCount})
                    </h3>
                    <div className="space-y-3">
                      {myExpert?.formations && myExpert.formations.length > 0 ? (
                        myExpert.formations.slice(0,5).map((f:any)=> (
                          <div key={f.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-600 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{f.title}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{(f.students||0)} inscrits • {f.type}</p>
                            </div>
                            <a href={`/formations/${f.id}`} className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                              <i className="ri-external-link-line"></i>
                            </a>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-600 dark:text-gray-300">Aucune formation publiée.</p>
                      )}
                    </div>
                  </div>

                  {/* Vidéos */}
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Mes vidéos ({myVideosCount})
                    </h3>
                    <div className="space-y-3">
                      {myExpert?.videos && myExpert.videos.length > 0 ? (
                        myExpert.videos.slice(0,5).map((v:any)=> (
                          <div key={v.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-600 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{v.title}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{(v.views||0).toLocaleString()} vues • {v.type === 'premium' ? 'Premium' : 'Gratuit'}</p>
                            </div>
                            <a href={`/videos/${v.id}`} className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                              <i className="ri-external-link-line"></i>
                            </a>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-600 dark:text-gray-300">Aucune vidéo publiée.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Analytiques</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Vues vidéos</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{Number(expertStats?.totalViews || 0).toLocaleString()}</p>
                      </div>
                      <i className="ri-eye-line text-blue-600 dark:text-blue-400 text-2xl"></i>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-700 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Likes totaux</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{Number(expertStats?.totalLikes || 0).toLocaleString()}</p>
                      </div>
                      <i className="ri-thumb-up-line text-green-600 dark:text-green-400 text-2xl"></i>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-700 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Étudiants</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{Number(expertStats?.totalStudents || 0).toLocaleString()}</p>
                      </div>
                      <i className="ri-user-line text-purple-600 dark:text-purple-400 text-2xl"></i>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-700 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Contenu publié</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{myFormationsCount + myVideosCount}</p>
                      </div>
                      <i className="ri-folder-3-line text-yellow-600 dark:text-yellow-400 text-2xl"></i>
                    </div>
                  </div>
                </div>

                {/* Graphique des performances (SVG) */}
                <div className="bg-white dark:bg-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Graphique des performances</h3>
                  {analytics ? (
                    <div className="w-full overflow-x-auto">
                      <svg viewBox="0 0 600 220" className="w-full h-56">
                        <defs>
                          <linearGradient id="gradForm" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                          </linearGradient>
                          <linearGradient id="gradVid" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <line x1="40" y1="10" x2="40" y2="190" stroke="#e5e7eb" />
                        <line x1="40" y1="190" x2="580" y2="190" stroke="#e5e7eb" />
                        {analytics.months.map((m, i) => (
                          <text key={m} x={40 + (i * (540/(analytics.months.length-1)))} y="210" fontSize="10" fill="#6b7280" textAnchor="middle">{m}</text>
                        ))}
                        {(() => {
                          const maxVal = Math.max(1, ...analytics.revenueFormation, ...analytics.revenueVideo);
                          const X = (i:number) => 40 + (i * (540/(analytics.months.length-1)));
                          const Y = (v:number) => 190 - (v / maxVal) * 160;
                          const path = (arr:number[]) => arr.map((v,i)=> `${i===0? 'M':'L'} ${X(i)} ${Y(v)}`).join(' ');
                          const areaPath = (arr:number[]) => `${path(arr)} L ${X(arr.length-1)} 190 L 40 190 Z`;
                          return (
                            <g>
                              <path d={areaPath(analytics.revenueFormation)} fill="url(#gradForm)" />
                              <path d={path(analytics.revenueFormation)} fill="none" stroke="#8b5cf6" strokeWidth="2" />
                              <path d={areaPath(analytics.revenueVideo)} fill="url(#gradVid)" />
                              <path d={path(analytics.revenueVideo)} fill="none" stroke="#ef4444" strokeWidth="2" />
                            </g>
                          );
                        })()}
                      </svg>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="inline-flex items-center"><span className="w-3 h-3 bg-purple-500 inline-block rounded mr-2"></span>Revenus Formations</span>
                        <span className="inline-flex items-center"><span className="w-3 h-3 bg-red-500 inline-block rounded mr-2"></span>Revenus Vidéos</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-600 dark:text-gray-300">Chargement des analytiques…</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals retirés: redirections directes utilisées pour les actions */}
    </div>
  );
}
