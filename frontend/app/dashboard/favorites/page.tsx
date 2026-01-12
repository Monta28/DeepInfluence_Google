'use client';

import { useEffect, useState } from 'react';
import AppHeader from '@/components/AppHeader';
import ExpertCard from '@/components/ExpertCard';
import FormationCard from '@/components/FormationCard';
import VideoCard from '@/components/VideoCard';
import ApiService from '@/services/api';
import { useToast } from '@/contexts/ToastContext';
import { useFavorites } from '@/contexts/FavoritesContext';

export default function FavoritesPage() {
  const [activeTab, setActiveTab] = useState<'experts'|'formations'|'videos'>('experts');
  const { addToast } = useToast();
  const { experts: favoriteExperts, formations: favoriteFormations, videos: favoriteVideos, toggleExpert, toggleFormation, toggleVideo, refresh } = useFavorites();
  useEffect(() => { refresh().catch(()=>addToast('Erreur de chargement des favoris', 'error')); }, [refresh]);

  // Les listes sont chargées via l'API; aucun mock local ici

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mes Favoris</h1>
            <p className="text-gray-600 mt-2">Retrouvez vos experts, formations et vidéos préférés</p>
          </div>
          <div className="flex items-center space-x-2">
            <i className="ri-heart-fill text-red-500 text-2xl"></i>
            <span className="text-lg font-semibold text-gray-900">
              {favoriteExperts.length + favoriteFormations.length + favoriteVideos.length}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border">
          <div className="border-b p-6">
            <div className="flex space-x-1">
              <button
                onClick={() => setActiveTab('experts')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'experts'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Experts ({favoriteExperts.length})
              </button>
              <button
                onClick={() => setActiveTab('formations')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'formations'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Formations ({favoriteFormations.length})
              </button>
              <button
                onClick={() => setActiveTab('videos')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'videos'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Vidéos ({favoriteVideos.length})
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'experts' && (
              <div>
                {favoriteExperts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {favoriteExperts.map((expert) => (
                      <ExpertCard key={expert.id} expert={expert} favorited onToggleFavorite={async () => { try { await toggleExpert(expert.id); } catch {} }} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="ri-heart-line text-2xl text-gray-400"></i>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun expert favori</h3>
                    <p className="text-gray-500">Commencez à suivre vos experts préférés</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'formations' && (
              <div>
                {favoriteFormations.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {favoriteFormations.map((formation) => (
                      <FormationCard key={formation.id} formation={formation} favorited onToggleFavorite={async () => { try { await toggleFormation(formation.id); } catch {} }} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="ri-heart-line text-2xl text-gray-400"></i>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune formation favorite</h3>
                    <p className="text-gray-500">Sauvegardez vos formations préférées</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'videos' && (
              <div>
                {favoriteVideos.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {favoriteVideos.map((video) => (
                      <VideoCard key={video.id} video={video} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="ri-heart-line text-2xl text-gray-400"></i>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune vidéo likée</h3>
                    <p className="text-gray-500">Likez des vidéos pour les retrouver ici</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
