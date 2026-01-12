'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { Video } from '../services/api';
import ApiService from '@/services/api';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';

export default function VideoCard({ video }: { video: Video }) {
  const { videoIds, toggleVideo } = useFavorites();
  const [isLiked, setIsLiked] = useState<boolean>(videoIds.has(video.id));
  const [isUnlocked, setIsUnlocked] = useState<boolean>(!!video.isUnlocked || ((video.price || 0) === 0));
  const [showConfirm, setShowConfirm] = useState(false);
  const { user, updateUser } = useAuth();
  const router = useRouter();
  const { addToast } = useToast();

  const handleWatchClick = (path: string) => {
    if (!user) {
      sessionStorage.setItem('returnUrl', path);
      router.push('/signin');
    } else {
      router.push(path);
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(video.title)}&size=300&background=8B5CF6&color=ffffff`;
  };

  const formatDuration = (duration: number | string) => {
    if (typeof duration === 'string') {
      return duration;
    }
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatViews = (views: number | string) => {
    if (typeof views === 'string') {
      return views;
    }
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  const priceLabel = (video.price || 0) > 0 ? `${video.price}€` : 'Gratuit';
  const insufficient = !!user && (video.price || 0) > 0 && !isUnlocked && (Number(user?.coins || 0) < Number(video.price || 0));
  const missingCoins = insufficient ? Math.max(0, Number(video.price || 0) - Number(user?.coins || 0)) : 0;

  const onPrimaryClick = async () => {
    if ((video.price || 0) > 0 && !isUnlocked) {
      if (!user) {
        sessionStorage.setItem('returnUrl', `/videos/${video.id}`);
        router.push('/signin');
        return;
      }
      setShowConfirm(true);
    } else {
      handleWatchClick(`/videos/${video.id}`);
    }
  };

  const confirmPurchase = async () => {
    try {
      const r = await ApiService.purchaseVideo(video.id);
      if (r.success) {
        setIsUnlocked(true);
        addToast('Vidéo débloquée avec succès', 'success');
        setShowConfirm(false);
        // Rafraîchir le solde de coins en header immédiatement
        try {
          const me = await ApiService.getMe();
          if (me.success && me.data) {
            updateUser({ coins: me.data.coins });
          }
        } catch {}
      }
    } catch (e: any) {
      addToast(e?.message || "Achat impossible", 'error');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group border border-gray-200 dark:border-gray-700">
      <div className="relative">
        <img
          src={video.thumbnail || `https://ui-avatars.com/api/?name=${encodeURIComponent(video.title)}&size=300&background=8B5CF6&color=ffffff`}
          alt={video.title}
          onError={handleImageError} // Ajout du fallback
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
          <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <i className="ri-play-fill text-2xl text-gray-800 ml-1"></i>
          </div>
        </div>
        
        <div className="absolute top-4 right-4 flex items-center space-x-2">
          {user && (
            <button
              onClick={async () => { try { await toggleVideo(video.id); setIsLiked(v=>!v); } catch {} }}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                isLiked
                  ? 'bg-red-500 text-white'
                  : 'bg-white/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/30'
              }`}
            >
              <i className={`ri-heart-${isLiked ? 'fill' : 'line'} text-sm`}></i>
            </button>
          )}
          {(video.isPremium || video.type === 'premium') && (
            <div className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              Premium
            </div>
          )}
          {(video.price || 0) > 0 && isUnlocked && (
            <div className="bg-green-600 text-white px-2 py-1 rounded-full text-xs font-medium">
              Déjà acheté
            </div>
          )}
        </div>
        
        <div className="absolute bottom-4 right-4">
          <span className="bg-black/70 text-white px-2 py-1 rounded text-xs font-medium">
            {formatDuration(video.duration)}
          </span>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-2 min-h-[4rem]">
            {video.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Par {video.instructor || video.expert}
          </p>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center">
              <i className="ri-eye-line mr-1"></i>
              <span>{formatViews(video.views)} vues</span>
            </div>
            <div className="flex items-center">
              <i className="ri-heart-line mr-1"></i>
              <span>{video.likes}</span>
            </div>
          </div>
          {video.publishedAt && <div className="text-xs text-gray-500 dark:text-gray-400">{new Date(video.publishedAt).toLocaleDateString('fr-FR')}</div>}
        </div>

        <div className="mb-4">
          <span className="px-2 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs rounded-full">
            {video.category}
          </span>
        </div>

        {video.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
            {video.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="text-xl font-bold text-gray-900 dark:text-white">{priceLabel}</div>
          <button
            onClick={onPrimaryClick}
            className={`${(video.price || 0) > 0 && !isUnlocked ? 'bg-pink-600 hover:bg-pink-700' : 'bg-purple-600 hover:bg-purple-700'} text-white py-2 px-4 rounded-lg transition-colors text-sm font-medium`}
          >
            {(video.price || 0) > 0 && !isUnlocked ? 'Acheter' : 'Regarder'}
          </button>
        </div>
      </div>
      {showConfirm && (
        <div className="fixed inset-0 z-[9998] bg-black/50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-lg">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Confirmer l'achat</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-3">Voulez-vous acheter « {video.title} » pour {video.price} coins ?</p>
            {user && (
              <div className="mb-4 text-sm text-gray-700 dark:text-gray-200">
                <div>Votre solde: <span className="font-semibold">{user.coins || 0} coins</span></div>
                {insufficient && (
                  <div className="mt-2 text-red-600">
                    Solde insuffisant — il vous manque <span className="font-semibold">{missingCoins}</span> coin(s).
                    {' '}<Link href="/dashboard/coins" className="underline text-yellow-600 hover:text-yellow-700">Acheter des coins</Link>
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowConfirm(false)} className="px-4 py-2 rounded-lg border">Annuler</button>
              <button onClick={confirmPurchase} disabled={insufficient} className={`px-4 py-2 rounded-lg text-white ${insufficient ? 'bg-pink-300 cursor-not-allowed' : 'bg-pink-600 hover:bg-pink-700'}`}>Confirmer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
