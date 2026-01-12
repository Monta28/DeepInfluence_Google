'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { Formation } from '../services/api';

export default function FormationCard({ formation, ownerActions = false, favorited, onToggleFavorite }: { formation: Formation, ownerActions?: boolean, favorited?: boolean, onToggleFavorite?: () => void }) {
  const { formationIds, toggleFormation } = useFavorites();
  const [isLiked, setIsLiked] = useState<boolean>(favorited ?? formationIds.has(formation.id));
  const { user } = useAuth();
  const router = useRouter();
  const downloadCsv = async (id: number) => {
    try {
      const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api');
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const resp = await fetch(`${base}/formations/${id}/enrollments/export.csv`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
      if (!resp.ok) throw new Error('Export impossible');
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `formation_${id}_inscrits.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e?.message || 'Erreur export CSV');
    }
  };

  const handleActionClick = (path: string) => {
    if (!user) {
      sessionStorage.setItem('returnUrl', path);
      router.push('/signin');
    } else {
      router.push(path);
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(formation.title)}&size=300&background=10B981&color=ffffff`;
  };

  const availablePlaces = formation.maxPlaces && formation.currentPlaces 
    ? formation.maxPlaces - formation.currentPlaces 
    : 0;
  const placesPercentage = formation.maxPlaces && formation.currentPlaces 
    ? (formation.currentPlaces / formation.maxPlaces) * 100 
    : 0;

  const enrolled = (formation as any).isEnrolled === true;
  const isOwner = (formation as any).isOwner === true;
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group border border-gray-200 dark:border-gray-700">
      <div className="relative">
        <img
          src={formation.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(formation.title)}&size=300&background=10B981&color=ffffff`}
          alt={formation.title}
          onError={handleImageError} // Ajout du fallback
          className="w-full h-48 object-cover object-top group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-4 right-4 flex items-center space-x-2">
          {user && (
            <button
              onClick={async () => { try { if (onToggleFavorite) { await onToggleFavorite(); } else { await toggleFormation(formation.id); } setIsLiked(v=>!v); } catch {} }}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                isLiked
                  ? 'bg-red-500 text-white'
                  : 'bg-white/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/30'
              }`}
            >
              <i className={`ri-heart-${isLiked ? 'fill' : 'line'} text-sm`}></i>
            </button>
          )}
        </div>
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            formation.type === 'live'
              ? 'bg-red-500 text-white'
              : 'bg-blue-500 text-white'
          }`}>
            {formation.type === 'live' ? 'En direct' : 'Présentiel'}
          </span>
          {isOwner && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-600 text-white">Propriétaire</span>
          )}
          {enrolled && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-600 text-white">Inscrit</span>
          )}
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
              {formation.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Par {formation.instructor}
            </p>
          </div>
        </div>

        <div className="flex items-center mb-3">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <i
                key={i}
                className={`ri-star-${i < Math.floor(formation.rating) ? 'fill' : 'line'} text-yellow-400 text-sm`}
              ></i>
            ))}
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
            {formation.rating} ({formation.students} étudiants)
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">{Math.max(0, (formation.maxPlaces || 0) - (formation.currentPlaces || 0))} places dispo</span>
        </div>

        {formation.tags && formation.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {formation.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
            {formation.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                +{formation.tags.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <i className="ri-time-line mr-1"></i>
              <span>{formation.duration}</span>
            </div>
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <i className="ri-bar-chart-line mr-1"></i>
              <span>{formation.level}</span>
            </div>
          </div>

          {formation.location && (
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <i className="ri-map-pin-line mr-1"></i>
              <span>{formation.location}</span>
            </div>
          )}

          {formation.nextSession && (
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <i className="ri-calendar-line mr-1"></i>
              <span>Prochaine session: {new Date(formation.nextSession).toLocaleDateString('fr-FR')}</span>
            </div>
          )}
        </div>

        {formation.maxPlaces && formation.currentPlaces && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-400">Places disponibles</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {availablePlaces}/{formation.maxPlaces}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  placesPercentage > 80 ? 'bg-red-500' : placesPercentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${placesPercentage}%` }}
              ></div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {typeof formation.price === 'number' ? `${formation.price}€` : formation.price}
          </div>
          {formation.schedule && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {formation.schedule}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handleActionClick(`/formations/${formation.id}`)}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-center text-sm font-medium"
          >
            Voir détails
          </button>
          {!isOwner && (
            <button
              onClick={() => handleActionClick(enrolled ? `/dashboard/formations` : `/formations/${formation.id}/reserve`)}
              disabled={enrolled}
              className={`flex-1 py-2 px-4 rounded-lg transition-colors text-center text-sm font-medium ${
                enrolled
                  ? 'border border-gray-300 text-gray-400 cursor-not-allowed'
                  : 'border border-green-600 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30'
              }`}
            >
              {enrolled ? 'Déjà inscrit' : 'Réserver'}
            </button>
          )}
          {ownerActions && (
            <button
              onClick={() => downloadCsv(Number(formation.id))}
              className="py-2 px-3 rounded-lg border text-sm border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors"
              title="Exporter les inscrits"
            >
              Export inscrits
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
