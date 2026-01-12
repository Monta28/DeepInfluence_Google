'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { Expert } from '../services/api';

export default function ExpertCard({ expert, favorited, onToggleFavorite }: { expert: Expert, favorited?: boolean, onToggleFavorite?: () => void }) {
  const { expertIds, toggleExpert } = useFavorites();
  const [isLiked, setIsLiked] = useState<boolean>(favorited ?? expertIds.has(expert.id));
  const { user } = useAuth();
  const router = useRouter();

  const handleActionClick = (path: string) => {
    if (!user) {
      sessionStorage.setItem('returnUrl', path);
      router.push('/signin');
    } else {
      router.push(path);
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(expert.name)}&size=300&background=3B82F6&color=ffffff`;
  };

  const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, '') : '');
  const buildImageUrl = (raw?: string) => {
    if (!raw) return undefined;
    const norm = raw.replace(/\\/g, '/');
    if (/^(https?:)?\/\//i.test(norm) || norm.startsWith('data:')) return norm;
    if (backendBase) {
      if (norm.startsWith('/')) return `${backendBase}${norm}`;
      return `${backendBase}/${norm}`;
    }
    return norm;
  };

  // Candidates: API asset by expert id, static images by id, then provided avatar/image, then ui-avatars
  const candidates = useMemo(() => {
    const list: string[] = [];
    const ids = Array.from(new Set([expert?.id, (expert as any)?.userId].filter(Boolean))) as number[];
    if (backendBase && ids.length) {
      ids.forEach(id => {
        list.push(`${backendBase}/api/assets/experts/${id}`);
        ['jpg','jpeg','png','webp'].forEach(ext => list.push(`${backendBase}/images/experts/${id}.${ext}`));
      });
    }
    const fromUser = buildImageUrl(expert.user?.avatar);
    const fromExpert = buildImageUrl(expert.image);
    if (fromUser) list.push(fromUser);
    if (fromExpert) list.push(fromExpert);
    list.push(`https://ui-avatars.com/api/?name=${encodeURIComponent(expert.name)}&size=300&background=3B82F6&color=ffffff`);
    return Array.from(new Set(list));
  }, [backendBase, expert?.id, expert?.user?.avatar, expert?.image, expert?.name]);
  const [imgIdx, setImgIdx] = useState(0);
  const imageUrl = candidates[Math.min(imgIdx, candidates.length - 1)];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group border border-gray-200 dark:border-gray-700">
      <div className="relative">
        <img
          src={imageUrl}
          alt={expert.name}
          onError={() => setImgIdx(i => i + 1)}
          className="w-full h-48 object-cover object-top group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-4 right-4 flex items-center space-x-2">
          {user && (
            <button
              onClick={async () => { try { if (onToggleFavorite) { await onToggleFavorite(); } else { await toggleExpert(expert.id); } setIsLiked(v=>!v); } catch {} }}
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
        <div className="absolute top-4 left-4">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            expert.isOnline
              ? 'bg-blue-500 text-white'
              : 'bg-gray-500 text-white'
          }`}>
            {expert.isOnline ? 'En ligne' : 'Hors ligne'}
          </span>
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {expert.name}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          {expert.specialty}
        </p>
        
        <div className="flex items-center mb-3">
            <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                <i
                    key={i}
                    className={`ri-star-${i < Math.floor(expert.rating) ? 'fill' : 'line'} text-yellow-400 text-sm`}
                ></i>
                ))}
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                {expert.rating} ({expert.reviews} avis)
            </span>
        </div>

        {Array.isArray(expert.tags) && expert.tags.length > 0 && (
          <div className="min-h-[4rem]">
            <div className="flex flex-wrap gap-1 mb-4">
              {expert.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
              {expert.tags.length > 3 && (
                <span className="px-2 py-1 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                  +{expert.tags.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center mb-1">
              <i className="ri-user-line mr-1"></i>
              <span>{expert.sessions} sessions</span>
            </div>
            {expert.responseTime && (
              <div className="flex items-center">
                <i className="ri-time-line mr-1"></i>
                <span>Répond en {expert.responseTime}</span>
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {expert.hourlyRate}€/h
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {expert.pricePerMessage}€/msg
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handleActionClick(`/experts/${expert.id}`)}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-center text-sm font-medium whitespace-nowrap"
          >
            Voir le profil
          </button>
          <button
            onClick={() => handleActionClick(`/experts/${expert.id}/contact`)}
            className="flex-1 border border-blue-600 text-blue-600 dark:text-blue-400 py-2 px-4 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors text-center text-sm font-medium"
          >
            Contacter
          </button>
        </div>
      </div>
    </div>
  );
}
