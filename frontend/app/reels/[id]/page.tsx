'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import ApiService from '@/services/api';

const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, '') : '');
const getAssetUrl = (path: string) => {
  if (!path || path.startsWith('http')) return path;
  return `${backendBase}${path}`;
};

interface Reel {
  id: number;
  title: string;
  description: string;
  videoUrl: string;
  thumbnail: string;
  duration: string | number;
  category: string;
  views: number;
  likes: number;
  comments: number;
  accessType: 'FREE' | 'PAID';
  price: number;
  isUnlocked: boolean;
  isLiked: boolean;
  expert: {
    id: number;
    name: string;
    profilePicture: string;
    verified: boolean;
    category: string;
  } | null;
  createdAt: string;
  publishedAt: string;
}

export default function ReelDetailPage() {
  const router = useRouter();
  const params = useParams();
  const reelId = params.id as string;
  const { user } = useAuth();
  const { addToast } = useToast();

  const [reel, setReel] = useState<Reel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [showDescription, setShowDescription] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (reelId) loadReel();
  }, [reelId]);

  const loadReel = async () => {
    try {
      setLoading(true);
      const response = await ApiService.get(`/reels/${reelId}`);
      const data = response.data;
      if (data.success && data.data) {
        setReel(data.data);
        setIsLiked(data.data.isLiked);
        setLikesCount(data.data.likes);
      } else {
        setError('Reel non trouvé');
      }
    } catch (err) {
      console.error('Error loading reel:', err);
      setError('Erreur lors du chargement du Reel');
    } finally {
      setLoading(false);
    }
  };

  // Track view
  useEffect(() => {
    if (reel && reelId) {
      ApiService.post(`/videos/${reelId}/view`).catch(() => {});
    }
  }, [reel, reelId]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleLike = async () => {
    if (!user) {
      sessionStorage.setItem('returnUrl', `/reels/${reelId}`);
      router.push('/signin');
      return;
    }
    try {
      await ApiService.post(`/videos/${reelId}/like`);
      setIsLiked(prev => !prev);
      setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    } catch (err) {
      console.error('Like error:', err);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/reels/${reelId}`;
    try {
      await navigator.clipboard.writeText(url);
      addToast('Lien copié !', 'success');
    } catch {
      addToast('Impossible de copier le lien', 'error');
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error || !reel) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-black text-white px-6">
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
        >
          <i className="ri-arrow-left-line text-xl text-white"></i>
        </button>
        <i className="ri-error-warning-line text-5xl text-red-400 mb-4"></i>
        <h2 className="text-xl font-bold mb-2">{error || 'Reel non trouvé'}</h2>
        <button
          onClick={() => router.push('/reels')}
          className="mt-4 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl text-white font-medium transition"
        >
          Voir tous les Reels
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-screen bg-black overflow-hidden">
      {/* Video */}
      <video
        ref={videoRef}
        src={getAssetUrl(reel.videoUrl)}
        className="w-full h-full object-contain"
        loop
        autoPlay
        playsInline
        poster={getAssetUrl(reel.thumbnail)}
        onClick={togglePlay}
      />

      {/* Play/Pause overlay */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-20 h-20 bg-black/40 rounded-full flex items-center justify-center backdrop-blur-sm">
            <i className="ri-play-fill text-4xl text-white ml-1"></i>
          </div>
        </div>
      )}

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60 pointer-events-none" />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 transition"
        >
          <i className="ri-arrow-left-line text-xl text-white"></i>
        </button>
        <span className="px-3 py-1 bg-purple-500/80 backdrop-blur-sm rounded-full text-white text-sm font-medium">
          Reel
        </span>
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-6 left-0 right-16 p-6 z-10">
        {/* Expert info */}
        {reel.expert && (
          <button
            onClick={() => router.push(`/experts/${reel.expert!.id}`)}
            className="flex items-center gap-3 mb-4"
          >
            <img
              src={getAssetUrl(reel.expert.profilePicture || '/default-avatar.png')}
              alt={reel.expert.name}
              className="w-11 h-11 rounded-full border-2 border-white object-cover"
            />
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-white text-sm">{reel.expert.name}</span>
                {reel.expert.verified && (
                  <i className="ri-verified-badge-fill text-blue-400"></i>
                )}
              </div>
              <span className="text-xs text-gray-300">{reel.category}</span>
            </div>
          </button>
        )}

        {/* Title & Description */}
        <h3 className="text-white font-semibold text-base mb-1">{reel.title}</h3>
        {reel.description && (
          <div>
            <p className={`text-sm text-gray-200 ${showDescription ? '' : 'line-clamp-2'}`}>
              {reel.description}
            </p>
            {reel.description.length > 100 && (
              <button
                onClick={() => setShowDescription(!showDescription)}
                className="text-xs text-gray-400 mt-1"
              >
                {showDescription ? 'Voir moins' : 'Voir plus'}
              </button>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-gray-300 mt-3">
          <span className="flex items-center gap-1">
            <i className="ri-eye-line"></i>
            {formatNumber(reel.views)} vues
          </span>
          <span className="flex items-center gap-1">
            <i className="ri-time-line"></i>
            {new Date(reel.createdAt).toLocaleDateString('fr-FR')}
          </span>
        </div>
      </div>

      {/* Right side actions */}
      <div className="absolute right-3 bottom-24 flex flex-col gap-5 z-10">
        {/* Like */}
        <button onClick={handleLike} className="flex flex-col items-center gap-1">
          <div className={`p-3 rounded-full ${isLiked ? 'bg-red-500' : 'bg-black/30 backdrop-blur-sm'} hover:scale-110 transition`}>
            <i className={`ri-heart-${isLiked ? 'fill' : 'line'} text-2xl text-white`}></i>
          </div>
          <span className="text-white text-xs font-medium">{formatNumber(likesCount)}</span>
        </button>

        {/* Comments */}
        <button className="flex flex-col items-center gap-1">
          <div className="p-3 rounded-full bg-black/30 backdrop-blur-sm hover:scale-110 transition">
            <i className="ri-chat-3-line text-2xl text-white"></i>
          </div>
          <span className="text-white text-xs font-medium">{formatNumber(reel.comments)}</span>
        </button>

        {/* Share */}
        <button onClick={handleShare} className="flex flex-col items-center gap-1">
          <div className="p-3 rounded-full bg-black/30 backdrop-blur-sm hover:scale-110 transition">
            <i className="ri-share-forward-line text-2xl text-white"></i>
          </div>
        </button>

        {/* Expert profile */}
        {reel.expert && (
          <button
            onClick={() => router.push(`/experts/${reel.expert!.id}`)}
            className="flex flex-col items-center gap-1"
          >
            <img
              src={getAssetUrl(reel.expert.profilePicture || '/default-avatar.png')}
              alt={reel.expert.name}
              className="w-10 h-10 rounded-full border-2 border-white object-cover"
            />
          </button>
        )}
      </div>
    </div>
  );
}
