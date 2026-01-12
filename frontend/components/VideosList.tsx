'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import VideoCard from './VideoCard';
import ApiService, { Video } from '../services/api';

export default function VideosList() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetchVideos();
  }, []);
  
  const handleViewMore = () => {
    const path = '/videos';
    if (!user) {
      sessionStorage.setItem('returnUrl', path);
      router.push('/signin');
    } else {
      router.push(path);
    }
  };

  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await ApiService.getVideos({ limit: 4 });
      
      // CORRECTION : Accéder à response.data.videos qui contient la liste
      if (response.success && response.data && response.data.videos) {
        setVideos(response.data.videos);
      } else {
        // Si la réponse est réussie mais qu'il n'y a pas de vidéos
        setVideos([]); 
        console.warn('Aucune vidéo trouvée dans la réponse API pour la page d\'accueil.');
      }
    } catch (err: any) {
      console.error('Error fetching videos:', err);
      setError('Impossible de se connecter au serveur pour charger les vidéos.');
      setVideos([]); // Vider les vidéos en cas d'erreur
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-16">Bibliothèque de Vidéos</h2>
          <div className="inline-flex items-center space-x-2">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-600 dark:text-gray-300">Chargement des vidéos...</span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Bibliothèque de Vidéos
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Accédez à une vaste collection de vidéos éducatives créées par nos experts
          </p>
        </div>

        {error && (
            <div className="text-center mb-8 p-4 bg-red-100 text-red-700 rounded-lg">
                <p>{error}</p>
                <button onClick={fetchVideos} className="mt-2 underline font-semibold">Réessayer</button>
            </div>
        )}

        {videos.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {videos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>

            <div className="text-center mt-12">
              <button
                onClick={handleViewMore}
                className="inline-flex items-center bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 whitespace-nowrap"
              >
                <span className="mr-2">Voir plus de vidéos</span>
                <i className="ri-arrow-right-line"></i>
              </button>
            </div>
          </>
        ) : !error && (
            <div className="text-center py-12">
                <p className="text-gray-500">Aucune vidéo à afficher pour le moment.</p>
            </div>
        )}
      </div>
    </section>
  );
}