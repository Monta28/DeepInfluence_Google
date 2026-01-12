'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import ExpertCard from '@/components/ExpertCard';
import FormationCard from '@/components/FormationCard';
import VideoCard from '@/components/VideoCard';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import ApiService, { Expert, Formation, Video } from '../../services/api';

// Composant pour les cartes de statistiques
const StatCard = ({ icon, color, label, value }: { icon: string, color: string, label: string, value: string | number }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
      <div className={`w-12 h-12 bg-${color}-100 dark:bg-${color}-900/30 rounded-lg flex items-center justify-center`}>
        <i className={`${icon} text-${color}-600 dark:text-${color}-400 text-xl`}></i>
      </div>
    </div>
  </div>
);

export default function Dashboard() {
  const [experts, setExperts] = useState<Expert[]>([]);
  const [formations, setFormations] = useState<Formation[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { user, isLoading: isAuthLoading } = useAuth();
  const { formatPrice } = useCurrency();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthLoading) {
      if (!user) {
        router.push('/signin');
      } else {
        loadDashboardData();
      }
    }
  }, [user, isAuthLoading, router]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // L'appel aux formations et videos dépend maintenant du type d'utilisateur
      const formationPromise = user?.userType === 'expert'
        ? ApiService.getExpertFormations({ limit: 3 })
        : ApiService.getFormations({ limit: 3 });

      const videoPromise = user?.userType === 'expert'
        ? ApiService.getExpertVideos({ limit: 3 })
        : ApiService.getVideos({ limit: 3 });

      // Ajout de l'appel pour les vidéos
      const [statsResponse, expertsResponse, formationsResponse, videosResponse] = await Promise.all([
        ApiService.getUserStats(),
        ApiService.getExperts({ limit: 3 }),
        formationPromise,
        videoPromise 
      ]);

      if (statsResponse.success && statsResponse.data){
        setDashboardData(statsResponse.data);
      } else {
        setError(statsResponse.message || 'Impossible de charger les statistiques.');
      }

      // CORRECTION : Extraire le tableau .experts
      if (expertsResponse.success && Array.isArray(expertsResponse.data.experts)) {
        setExperts(expertsResponse.data.experts);
      } else {
        console.warn('Aucun expert trouvé dans la réponse API.');
      }

      // CORRECTION : Extraire le tableau .formations
      if (formationsResponse.success && Array.isArray(formationsResponse.data.formations)) {
        setFormations(formationsResponse.data.formations);
      } else {
        console.warn('Aucune formation trouvée dans la réponse API.');
      }
        
      // CORRECTION : Extraire le tableau .videos
      if (videosResponse.success && Array.isArray(videosResponse.data.videos)) {
        setVideos(videosResponse.data.videos);
      } else {
        console.warn('Aucune vidéo trouvée dans la réponse API.');
      }

    } catch (err: any) {
      console.error('Erreur lors du chargement du dashboard:', err);
      setError('Une erreur de communication avec le serveur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  if (isAuthLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Chargement de votre tableau de bord...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-8 text-center">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        ) : (
          <>
            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {user?.userType === 'expert' ? (
                <>
                  <StatCard icon="ri-calendar-check-line" color="blue" label="Sessions terminées" value={dashboardData?.sessionsCompleted ?? 0} />
                  <StatCard icon="ri-group-line" color="green" label="Étudiants actifs" value={dashboardData?.totalStudents ?? 0} />
                  <StatCard icon="ri-money-euro-circle-line" color="yellow" label="Revenus (est.)" value={formatPrice(dashboardData?.totalRevenue ?? 0)} />
                  <StatCard icon="ri-star-line" color="purple" label="Note moyenne" value={`${dashboardData?.averageRating ?? 0}/5`} />
                </>
              ) : (
                <>
                  <StatCard icon="ri-calendar-check-line" color="blue" label="Sessions terminées" value={dashboardData?.sessionsCompleted ?? 0} />
                  <StatCard icon="ri-book-open-line" color="green" label="Formations suivies" value={dashboardData?.formationsFollowed ?? 0} />
                  <StatCard icon="ri-time-line" color="yellow" label="Heures d'apprentissage" value={`${dashboardData?.learningHours ?? 0}h`} />
                  <StatCard icon="ri-user-star-line" color="purple" label="Experts suivis" value={dashboardData?.expertsFollowed ?? 0} />
                </>
              )}
            </div>

            {/* Actions rapides */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Actions rapides</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link href="/dashboard/formations" className="flex flex-col items-center p-4 bg-green-50 dark:bg-green-900/30 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors">
                  <i className="ri-graduation-cap-line text-green-600 dark:text-green-400 text-2xl mb-2"></i>
                  <span className="text-sm font-medium text-green-900 dark:text-green-100 text-center">Mes formations</span>
                </Link>
                <Link href="/dashboard/videos" className="flex flex-col items-center p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/50 transition-colors">
                  <i className="ri-play-circle-line text-yellow-600 dark:text-yellow-400 text-2xl mb-2"></i>
                  <span className="text-sm font-medium text-yellow-900 dark:text-yellow-100 text-center">Mes videos</span>
                </Link>
                <Link href="/dashboard/appointments" className="flex flex-col items-center p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors">
                  <i className="ri-calendar-line text-purple-600 dark:text-purple-400 text-2xl mb-2"></i>
                  <span className="text-sm font-medium text-purple-900 dark:text-purple-100 text-center">Mes rendez-vous</span>
                </Link>
                <Link href="/dashboard/chat" className="flex flex-col items-center p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                  <i className="ri-message-line text-blue-600 dark:text-blue-400 text-2xl mb-2"></i>
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-100 text-center">Mes Messages</span>
                </Link>
              </div>
            </div>

            {/* Experts recommandés */}
            {user?.userType !== 'expert' && experts.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Experts recommandés</h2>
                  <Link href="/experts" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium">Voir tous les experts→</Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {experts.filter((e: any) => e.verified !== false).map((expert) => <ExpertCard key={expert.id} expert={expert} />)}
                </div>
              </div>
            )}

            {/* Formations recommandées */}
            {formations.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {user.userType === 'expert' ? 'Vos formations populaires' : 'Formations recommandées'}
                  </h2>
                  <Link href="/formations" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium">Voir toutes les formations→</Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {formations.map((formation) => <FormationCard key={formation.id} formation={formation} />)}
                </div>
              </div>
            )}            

            {/* Vidéos recommandées */}
            {videos.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {user.userType === 'expert' ? 'Vos vidéos populaires' : 'Vidéos recommandées'}
                  </h2>
                  <Link href="/videos" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium">Voir toutes les videos→</Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {videos.map((video) => <VideoCard key={video.id} video={video} />)}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
