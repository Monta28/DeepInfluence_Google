'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import { useAuth } from '../../../contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import ApiService from '../../../services/api';
import Link from 'next/link';

const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, '') : '');
const getAssetUrl = (path: string) => {
  if (!path || path.startsWith('http')) return path;
  return `${backendBase}${path}`;
};

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

interface Reel {
    id: number;
    title: string;
    description: string;
    videoUrl: string;
    thumbnail: string;
    duration: number | string;
    category: string;
    views: number;
    likes: number;
    comments: number;
    status: string;
    accessType: string;
    price: number;
    type: string;
    createdAt: string;
    isUnlocked?: boolean;
}

export default function ReelsDashboardPage() {
    const [reels, setReels] = useState<Reel[]>([]);
    const [statsData, setStatsData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [activeTab, setActiveTab] = useState('all'); // 'all', 'free', 'paid'
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteModalReelId, setDeleteModalReelId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);

    const { user, isLoading: isAuthLoading } = useAuth();
    const { formatPrice } = useCurrency();
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
            if (user.userType === 'expert') {
                // Expert: get their own reels
                const [statsResponse, reelsResponse] = await Promise.all([
                    ApiService.getExpertDashboardStats(),
                    ApiService.getExpertVideos()
                ]);

                if (statsResponse.success && statsResponse.data) {
                    setStatsData(statsResponse.data);
                }

                // Filter only REEL type from expert's videos
                const allVideos = (reelsResponse as any)?.success && Array.isArray((reelsResponse as any).data?.videos)
                    ? (reelsResponse as any).data.videos
                    : [];
                const reelsList = allVideos.filter((v: any) => v.videoType === 'REEL');
                setReels(reelsList);
            } else {
                // User: show unlocked reels
                const [statsResponse, unlockedResponse] = await Promise.all([
                    ApiService.getUserStats(),
                    ApiService.getMyUnlockedVideos()
                ]);

                if (statsResponse.success && statsResponse.data) {
                    setStatsData(statsResponse.data);
                }

                const allUnlocked = (unlockedResponse as any)?.success && Array.isArray((unlockedResponse as any).data?.videos)
                    ? (unlockedResponse as any).data.videos
                    : [];
                const reelsList = allUnlocked.filter((v: any) => v.videoType === 'REEL');
                setReels(reelsList);
            }
        } catch (err) {
            setError("Une erreur est survenue lors du chargement des données.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteReel = async () => {
        if (!deleteModalReelId) return;
        setDeleting(true);
        try {
            await ApiService.delete(`/videos/${deleteModalReelId}`);
            setDeleteModalReelId(null);
            loadPageData();
        } catch (error) {
            console.error('Error deleting reel:', error);
            alert('Erreur lors de la suppression du Reel');
        } finally {
            setDeleting(false);
        }
    };

    const filteredReels = reels.filter((reel: any) => {
        const matchesFilter = activeTab === 'all' ||
            (activeTab === 'free' ? (reel.accessType === 'FREE' || (reel.price || 0) === 0) : (reel.accessType === 'PAID' || (reel.price || 0) > 0));
        const matchesSearch = !searchTerm || reel.title.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const formatDuration = (duration: number | string) => {
        if (typeof duration === 'string') return duration;
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const formatNumber = (num: number) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    // Calculer les stats des reels
    const totalViews = reels.reduce((sum, r) => sum + (r.views || 0), 0);
    const totalLikes = reels.reduce((sum, r) => sum + (r.likes || 0), 0);

    if (isAuthLoading || !user) {
        return <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900"><div className="w-16 h-16 border-4 border-pink-600 border-t-transparent rounded-full animate-spin"></div></div>;
    }

    // Vue Expert
    if (user.userType === 'expert') {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <AppHeader />
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mes Reels</h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">Gérez vos vidéos courtes verticales (15s - 3min).</p>
                        </div>
                        <Link href="/dashboard/videos/create?type=reel" className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all shadow-lg">
                            <i className="ri-add-line mr-2"></i>Créer un Reel
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <StatCard icon="ri-movie-2-line" color="pink" label="Total Reels" value={reels.length} />
                        <StatCard icon="ri-eye-line" color="blue" label="Vues totales" value={formatNumber(totalViews)} />
                        <StatCard icon="ri-heart-line" color="red" label="Likes totaux" value={formatNumber(totalLikes)} />
                        <StatCard icon="ri-money-euro-circle-line" color="yellow" label="Revenus (est.)" value={formatPrice(statsData?.videoRevenue ?? 0)} />
                    </div>

                    <div className="mb-8">
                        <div className="flex flex-col md:flex-row items-center gap-4">
                            <div className="relative flex-1 w-full md:w-auto">
                                <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Rechercher par titre..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400"
                                />
                            </div>
                            <div className="flex space-x-1 bg-gray-200 dark:bg-gray-700 p-1 rounded-lg">
                                <button onClick={() => setActiveTab('all')} className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${activeTab === 'all' ? 'bg-white dark:bg-gray-800 shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}>Tous</button>
                                <button onClick={() => setActiveTab('free')} className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${activeTab === 'free' ? 'bg-white dark:bg-gray-800 shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}>Gratuits</button>
                                <button onClick={() => setActiveTab('paid')} className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${activeTab === 'paid' ? 'bg-white dark:bg-gray-800 shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}>Payants</button>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-16">
                            <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                            <p className="mt-4 text-gray-600 dark:text-gray-400">Chargement de vos Reels...</p>
                        </div>
                    ) : error ? (
                        <p className="text-red-500 text-center">{error}</p>
                    ) : filteredReels.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {filteredReels.map(reel => (
                                <div key={reel.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden group">
                                    {/* Thumbnail */}
                                    <div className="relative aspect-[9/16] bg-gray-200 dark:bg-gray-700">
                                        {reel.thumbnail ? (
                                            <img src={getAssetUrl(reel.thumbnail)} alt={reel.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <i className="ri-play-circle-line text-4xl text-gray-400"></i>
                                            </div>
                                        )}

                                        {/* Duration Badge */}
                                        <div className="absolute bottom-2 right-2 bg-black/75 text-white text-xs px-2 py-1 rounded">
                                            {formatDuration(reel.duration)}
                                        </div>

                                        {/* Status Badge */}
                                        {reel.status === 'DRAFT' && (
                                            <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                                                Brouillon
                                            </div>
                                        )}

                                        {/* Price Badge */}
                                        {(reel.price || 0) > 0 && (
                                            <div className="absolute top-2 right-2 bg-purple-600 text-white text-xs px-2 py-1 rounded-full font-semibold">
                                                {reel.price} coins
                                            </div>
                                        )}

                                        {/* Hover Actions */}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                                            <Link
                                                href={`/reels/${reel.id}`}
                                                className="p-2.5 bg-white dark:bg-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-300 transition-colors"
                                                title="Voir"
                                            >
                                                <i className="ri-eye-line text-gray-700 text-lg"></i>
                                            </Link>
                                            <Link
                                                href={`/dashboard/videos/edit/${reel.id}`}
                                                className="p-2.5 bg-blue-500 rounded-full hover:bg-blue-600 transition-colors"
                                                title="Modifier"
                                            >
                                                <i className="ri-pencil-line text-white text-lg"></i>
                                            </Link>
                                            <button
                                                onClick={() => setDeleteModalReelId(reel.id)}
                                                className="p-2.5 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                                                title="Supprimer"
                                            >
                                                <i className="ri-delete-bin-line text-white text-lg"></i>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="p-3">
                                        <h3 className="font-medium text-sm text-gray-900 dark:text-white line-clamp-2 mb-2">
                                            {reel.title}
                                        </h3>
                                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                            <span className="flex items-center gap-1">
                                                <i className="ri-eye-line"></i>
                                                {formatNumber(reel.views || 0)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <i className="ri-heart-fill text-pink-500"></i>
                                                {formatNumber(reel.likes || 0)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <i className="ri-movie-2-line text-5xl text-gray-300 dark:text-gray-600 mb-4 block"></i>
                            <p className="text-gray-500 dark:text-gray-400 mb-4">
                                {searchTerm || activeTab !== 'all'
                                    ? "Aucun Reel ne correspond à vos filtres."
                                    : "Vous n'avez pas encore de Reels."}
                            </p>
                            {!searchTerm && activeTab === 'all' && (
                                <Link href="/dashboard/videos/create?type=reel" className="inline-block px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700 transition-all">
                                    <i className="ri-add-line mr-2"></i>Créer mon premier Reel
                                </Link>
                            )}
                        </div>
                    )}

                    {/* Modal de confirmation de suppression */}
                    {deleteModalReelId && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full shadow-2xl">
                                <div className="flex justify-center mb-4">
                                    <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                                        <i className="ri-delete-bin-line text-2xl text-red-600 dark:text-red-400"></i>
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white text-center mb-2">Confirmer la suppression</h3>
                                <p className="text-gray-600 dark:text-gray-400 text-center mb-6">Cette action est irréversible. Le Reel sera définitivement supprimé.</p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setDeleteModalReelId(null)}
                                        disabled={deleting}
                                        className="flex-1 py-2.5 px-4 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        onClick={handleDeleteReel}
                                        disabled={deleting}
                                        className="flex-1 py-2.5 px-4 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
                                    >
                                        {deleting ? 'Suppression...' : 'Supprimer'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        );
    }

    // Vue Utilisateur Standard
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <AppHeader />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Mes Reels</h1>
                    <p className="text-xl text-gray-600 dark:text-gray-400 mt-4 max-w-3xl mx-auto">Retrouvez ici les Reels que vous avez débloqués.</p>
                </div>

                <div className="mb-8">
                    <div className="flex space-x-1 bg-gray-200 dark:bg-gray-700 p-1 rounded-lg max-w-sm mx-auto">
                        <button onClick={() => setActiveTab('all')} className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${activeTab === 'all' ? 'bg-white dark:bg-gray-800 shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}>Tous</button>
                        <button onClick={() => setActiveTab('free')} className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${activeTab === 'free' ? 'bg-white dark:bg-gray-800 shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}>Gratuits</button>
                        <button onClick={() => setActiveTab('paid')} className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${activeTab === 'paid' ? 'bg-white dark:bg-gray-800 shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}>Payants</button>
                    </div>
                </div>

                {loading ? (
                    <p className="text-center text-gray-600 dark:text-gray-400">Chargement de vos Reels...</p>
                ) : error ? (
                    <p className="text-red-500 text-center">{error}</p>
                ) : filteredReels.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {filteredReels.map(reel => (
                            <Link key={reel.id} href={`/reels/${reel.id}`} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden group hover:shadow-lg transition-shadow">
                                <div className="relative aspect-[9/16] bg-gray-200 dark:bg-gray-700">
                                    {reel.thumbnail ? (
                                        <img src={getAssetUrl(reel.thumbnail)} alt={reel.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <i className="ri-play-circle-line text-4xl text-gray-400"></i>
                                        </div>
                                    )}
                                    <div className="absolute bottom-2 right-2 bg-black/75 text-white text-xs px-2 py-1 rounded">
                                        {formatDuration(reel.duration)}
                                    </div>
                                </div>
                                <div className="p-3">
                                    <h3 className="font-medium text-sm text-gray-900 dark:text-white line-clamp-2 mb-2">{reel.title}</h3>
                                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <i className="ri-eye-line"></i>
                                            {formatNumber(reel.views || 0)}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <i className="ri-heart-fill text-pink-500"></i>
                                            {formatNumber(reel.likes || 0)}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <i className="ri-movie-2-line text-5xl text-gray-300 dark:text-gray-600 mb-4 block"></i>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">Vous n'avez aucun Reel dans votre bibliothèque.</p>
                        <Link href="/reels" className="mt-4 inline-block text-pink-600 font-semibold hover:text-pink-700">
                            Parcourir les Reels →
                        </Link>
                    </div>
                )}
            </main>
        </div>
    );
}
