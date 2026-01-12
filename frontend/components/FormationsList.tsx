'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import FormationCard from './FormationCard';
import ApiService, { Formation } from '../services/api';

export default function FormationsList() {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadFormations();
  }, []);

  const handleViewMore = () => {
    const path = '/formations';
    if (!user) {
      sessionStorage.setItem('returnUrl', path);
      router.push('/signin');
    } else {
      router.push(path);
    }
  };

  const loadFormations = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await ApiService.getFormations({ limit: 3 });
      
      if (response.success && response.data.formations) {
        setFormations(response.data.formations);
      } else {
        setError('Erreur lors du chargement des formations.');
      }
    } catch (err: any) {
        console.error('Erreur lors du chargement des formations:', err);
        setError('Impossible de se connecter au serveur pour charger les formations.');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
        <section className="py-20 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-16">Formations Populaires</h2>
              <div className="inline-flex items-center space-x-2">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-600 dark:text-gray-300">Chargement des formations...</span>
              </div>
          </div>
        </section>
      );
  }

  return (
    <section className="py-20 bg-white dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Formations Populaires
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Développez vos compétences avec nos formations certifiées animées par des experts reconnus
          </p>
        </div>

        {error && (
            <div className="text-center mb-8 p-4 bg-red-100 text-red-700 rounded-lg">
                <p>{error}</p>
                <button onClick={loadFormations} className="mt-2 underline font-semibold">Réessayer</button>
            </div>
        )}

        {formations.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {formations.map((formation) => (
                <FormationCard key={formation.id} formation={formation} />
              ))}
            </div>

            <div className="text-center">
              <button
                onClick={handleViewMore}
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-green-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <span>Voir toutes les formations</span>
                <i className="ri-arrow-right-line ml-2 text-lg"></i>
              </button>
            </div>
          </>
        ) : !error && (
            <div className="text-center py-12">
                <p className="text-gray-500">Aucune formation à afficher pour le moment.</p>
            </div>
        )}
      </div>
    </section>
  );
}