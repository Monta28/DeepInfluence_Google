'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import ExpertCard from './ExpertCard';
import ApiService, { Expert } from '../services/api';

export default function ExpertsList() {
  const [experts, setExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetchExperts();
  }, []);
  
  const handleViewMore = () => {
    const path = '/experts';
    if (!user) {
      sessionStorage.setItem('returnUrl', path);
      router.push('/signin');
    } else {
      router.push(path);
    }
  };

  const fetchExperts = async () => {
    try {
      setLoading(true);
      setError(null);
      // On récupère 4 experts pour la page d'accueil
      const response = await ApiService.getExperts({ limit: 4 });
      if (response.success && response.data.experts) {
        setExperts(response.data.experts);
      } else {
        setError('Erreur lors du chargement des experts.');
      }
    } catch (error) {
      console.error('Error fetching experts:', error);
      setError('Impossible de se connecter au serveur pour charger les experts.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-16">Connectez-vous avec nos experts</h2>
            <div className="inline-flex items-center space-x-2">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-600 dark:text-gray-300">Chargement des experts...</span>
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
            Connectez-vous avec nos experts
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Trouvez l'expert parfait pour vos besoins parmi nos professionnels vérifiés
          </p>
        </div>

        {error && (
            <div className="text-center mb-8 p-4 bg-red-100 text-red-700 rounded-lg">
                <p>{error}</p>
                <button onClick={fetchExperts} className="mt-2 underline font-semibold">Réessayer</button>
            </div>
        )}

        {experts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {experts.map((expert) => (
                <ExpertCard key={expert.id} expert={expert} />
              ))}
            </div>

            <div className="text-center mt-12">
              <button
                onClick={handleViewMore}
                className="inline-flex items-center bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 whitespace-nowrap"
              >
                <span className="mr-2">Voir plus d'experts</span>
                <i className="ri-arrow-right-line"></i>
              </button>
            </div>
          </>
        ) : !error && (
            <div className="text-center py-12">
                <p className="text-gray-500">Aucun expert à afficher pour le moment.</p>
            </div>
        )}
      </div>
    </section>
  );
}