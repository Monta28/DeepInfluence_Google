'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import VideoCard from '@/components/VideoCard';
import { useAuth } from '../../../contexts/AuthContext';
import ApiService, { Video } from '../../../services/api';
import Link from 'next/link';

// Composant réutilisable pour les cartes de statistiques
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

export default function VideosPage() {
    const [videos, setVideos] = useState<Video[]>([]);
    const [createdVideos, setCreatedVideos] = useState<Video[]>([]);
    const [unlockedVideos, setUnlockedVideos] = useState<Video[]>([]);
    const [statsData, setStatsData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'free', 'premium'
    const [expertTab, setExpertTab] = useState<'created'|'unlocked'>('created');
    const [searchTerm, setSearchTerm] = useState('');

    const { user, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isAuthLoading) {
            if (!user) {
                router.push('/signin');
            } else {
                loadPageData();
            }
        }
    }, [user, isAuthLoading, router]);

    const loadPageData = async () => {
        if (!user) return;
        setLoading(true);
        setError('');
        try {
            // Videos: experts need both created and unlocked; users get unlocked/free
            const createdPromise = user.userType === 'expert' ? ApiService.getExpertVideos() : null;
            const unlockedPromise = user.userType === 'expert' ? ApiService.getMyUnlockedVideos() : ApiService.getMyUnlockedVideos();

            const statsPromise = user.userType === 'expert'
                ? ApiService.getExpertDashboardStats()
                : ApiService.getUserStats();

            const [statsResponse, createdResp, unlockedResp] = await Promise.all([
                statsPromise,
                createdPromise ?? Promise.resolve({ success: false }),
                unlockedPromise
            ]);

            if (statsResponse.success && statsResponse.data){
                setStatsData(statsResponse.data);
            }

            if (user.userType === 'expert') {
                const createdList = (createdResp && (createdResp as any).success && Array.isArray((createdResp as any).data?.videos)) ? (createdResp as any).data.videos : [];
                const unlockedList = (unlockedResp && (unlockedResp as any).success && Array.isArray((unlockedResp as any).data?.videos)) ? (unlockedResp as any).data.videos : [];
                // Exclure les vidéos créées de la liste débloquée/gratuite
                const createdIds = new Set(createdList.map((v: any) => v.id));
                const unlockedFiltered = unlockedList.filter((v: any) => !createdIds.has(v.id));
                setCreatedVideos(createdList);
                setUnlockedVideos(unlockedFiltered);
                // Pour compat: ancienne variable
                setVideos(createdList);
            } else {
                if ((unlockedResp as any).success && Array.isArray((unlockedResp as any).data?.videos)) {
                    setVideos((unlockedResp as any).data.videos);
                } else {
                    setVideos([]);
                }
            }

        } catch (err) {
            setError("Une erreur est survenue lors du chargement des données.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    
    const currentList = user?.userType === 'expert' ? (expertTab === 'created' ? createdVideos : unlockedVideos) : videos;
    const filteredVideos = currentList.filter((video: any) => {
        const matchesFilter = activeTab === 'all' || video.type === activeTab;
        const matchesSearch = !searchTerm || video.title.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    if (isAuthLoading || !user) {
        return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div></div>;
    }

    // Vue pour les Experts
    if (user.userType === 'expert') {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <AppHeader />
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mes Vidéos</h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">Gérez toutes les vidéos que vous avez publiées.</p>
                        </div>
                        <Link href="/dashboard/videos/create" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                            <i className="ri-add-line mr-2"></i>Ajouter une vidéo
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <StatCard icon="ri-eye-line" color="blue" label="Vues totales" value={statsData?.totalViews ?? 0} />
                        <StatCard icon="ri-heart-line" color="pink" label="Likes totaux" value={statsData?.totalLikes ?? 0} />
                        <StatCard icon="ri-money-euro-circle-line" color="yellow" label="Revenus (Vidéos)" value={`${statsData?.videoRevenue ?? 0}€`} />
                        <StatCard icon="ri-film-line" color="purple" label="Vidéos publiées" value={videos.length} />
                    </div>

                    <div className="mb-8">
                        <div className="inline-flex bg-gray-200 dark:bg-gray-700 p-1 rounded-lg mb-3">
                            <button onClick={() => setExpertTab('created')} className={`px-4 py-2 rounded-md text-sm font-medium ${expertTab === 'created' ? 'bg-white dark:bg-gray-800 shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}>Mes vidéos</button>
                            <button onClick={() => setExpertTab('unlocked')} className={`px-4 py-2 rounded-md text-sm font-medium ${expertTab === 'unlocked' ? 'bg-white dark:bg-gray-800 shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}>Vidéos débloquées</button>
                        </div>
                        <div className="flex flex-col md:flex-row items-center gap-4">
                            <div className="relative flex-1 w-full md:w-auto">
                                <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                                <input 
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Rechercher par titre..."
                                    className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-800"
                                />
                            </div>
                            <div className="flex space-x-1 bg-gray-200 dark:bg-gray-700 p-1 rounded-lg">
                                <button onClick={() => setActiveTab('all')} className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${activeTab === 'all' ? 'bg-white dark:bg-gray-800 shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}>Toutes</button>
                                <button onClick={() => setActiveTab('free')} className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${activeTab === 'free' ? 'bg-white dark:bg-gray-800 shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}>Gratuites</button>
                                <button onClick={() => setActiveTab('premium')} className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${activeTab === 'premium' ? 'bg-white dark:bg-gray-800 shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}>Premium</button>
                            </div>
                        </div>
                    </div>

                    {loading ? <p>Chargement de vos vidéos...</p> : error ? <p className="text-red-500">{error}</p> : (
                        filteredVideos.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {filteredVideos.map((v: any) => <VideoCard key={v.id} video={v} />)}
                            </div>
                        ) : (
                            <div className="text-center py-16"><p className="text-gray-500">Aucune vidéo ne correspond à vos filtres.</p></div>
                        )
                    )}
                </main>
            </div>
        );
    }

    // Vue pour les Utilisateurs Standards
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <AppHeader />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Mes Vidéos</h1>
                    <p className="text-xl text-gray-600 mt-4 max-w-3xl mx-auto">Retrouvez ici toutes les vidéos gratuites et celles que vous avez débloquées.</p>
                </div>
                
                <div className="mb-8">
                    <div className="flex space-x-1 bg-gray-200 dark:bg-gray-700 p-1 rounded-lg max-w-sm mx-auto">
                        <button onClick={() => setActiveTab('all')} className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${activeTab === 'all' ? 'bg-white dark:bg-gray-800 shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}>Toutes</button>
                        <button onClick={() => setActiveTab('free')} className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${activeTab === 'free' ? 'bg-white dark:bg-gray-800 shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}>Gratuites</button>
                        <button onClick={() => setActiveTab('premium')} className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${activeTab === 'premium' ? 'bg-white dark:bg-gray-800 shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}>Premium</button>
                    </div>
                </div>

                {loading ? <p className="text-center">Chargement de votre bibliothèque...</p> : error ? <p className="text-red-500 text-center">{error}</p> : (
                    filteredVideos.length > 0 ? (
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {filteredVideos.map((v: any) => <VideoCard key={v.id} video={v} />)}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <p className="text-gray-500">{activeTab === 'all' ? "Vous n'avez aucune vidéo dans votre bibliothèque." : `Vous n'avez aucune vidéo ${activeTab === 'premium' ? 'premium' : 'gratuite'}.`}</p>
                            <Link href="/videos" className="mt-4 inline-block text-blue-600 font-semibold">
                                Parcourir le catalogue de vidéos →
                            </Link>
                        </div>
                    )
                )}
            </main>
        </div>
    );
}
