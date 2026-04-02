'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';

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
  duration: string;
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
  };
  createdAt: string;
}

export default function ReelsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [reels, setReels] = useState<Reel[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<{ [key: number]: HTMLVideoElement }>({});
  const reelElementsRef = useRef<{ [key: number]: HTMLDivElement }>({});

  // Charger les Reels initiaux
  useEffect(() => {
    loadReels();
  }, []);

  const loadReels = async (cursor?: number) => {
    try {
      const params: any = { limit: 10 };
      if (cursor) params.cursor = cursor;

      const response = await api.get('/reels/feed', { params });
      const data = response.data.data;

      setReels(prev => cursor ? [...prev, ...data.reels] : data.reels);
      setNextCursor(data.pagination.nextCursor);
      setHasMore(data.pagination.hasNextPage);
      setLoading(false);
    } catch (error) {
      console.error('Erreur chargement Reels:', error);
      setLoading(false);
    }
  };

  // IntersectionObserver pour détecter le reel visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute('data-index'));
            if (!isNaN(idx)) {
              setCurrentIndex(idx);
            }
          }
        });
      },
      { threshold: 0.6 }
    );

    Object.values(reelElementsRef.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [reels]);

  // Charger plus quand on approche de la fin
  useEffect(() => {
    if (currentIndex >= reels.length - 3 && hasMore && !loading && nextCursor) {
      loadReels(nextCursor);
    }
  }, [currentIndex, reels.length, hasMore, loading, nextCursor]);

  // Gérer les touches du clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const newIdx = Math.min(currentIndex + 1, reels.length - 1);
        const el = reelElementsRef.current[newIdx];
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const newIdx = Math.max(currentIndex - 1, 0);
        const el = reelElementsRef.current[newIdx];
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, reels.length]);

  // Auto-play/pause vidéos selon l'index actuel
  useEffect(() => {
    Object.entries(videoRefs.current).forEach(([index, video]) => {
      const idx = parseInt(index);
      const reel = reels[idx];
      const isLocked = reel && reel.accessType === 'PAID' && !reel.isUnlocked;

      if (idx === currentIndex && !isLocked) {
        video?.play().catch(() => {});
      } else {
        video?.pause();
      }
    });
  }, [currentIndex, reels]);

  // Like un Reel
  const handleLike = async (reelId: number) => {
    if (!user) {
      sessionStorage.setItem('returnUrl', '/reels');
      router.push('/signin');
      return;
    }
    try {
      await api.post(`/videos/${reelId}/like`);
      setReels(prev => prev.map(reel =>
        reel.id === reelId
          ? {
              ...reel,
              isLiked: !reel.isLiked,
              likes: reel.isLiked ? reel.likes - 1 : reel.likes + 1
            }
          : reel
      ));
    } catch (error) {
      console.error('Erreur like:', error);
    }
  };

  // Acheter un Reel payant
  const handleUnlock = (reelId: number, price: number) => {
    if (!user) {
      sessionStorage.setItem('returnUrl', '/reels');
      router.push('/signin');
      return;
    }
    router.push(`/reels/${reelId}`);
  };

  if (loading && reels.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!loading && reels.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-black text-white px-6">
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div className="w-24 h-24 bg-purple-500/20 rounded-full flex items-center justify-center mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-3">Aucun Reel disponible</h2>
        <p className="text-gray-400 text-center max-w-sm mb-8">
          Il n&apos;y a pas encore de Reels publiés. Revenez bientôt pour découvrir du contenu !
        </p>
        <button
          onClick={() => router.push('/')}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl text-white font-medium transition"
        >
          Retour à l&apos;accueil
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-screen bg-black overflow-hidden">
      {/* Container de Reels */}
      <div
        ref={containerRef}
        className="h-full overflow-y-auto snap-y snap-mandatory scrollbar-hide"
        style={{ scrollSnapType: 'y mandatory' }}
      >
        {reels.map((reel, index) => {
          const isLocked = reel.accessType === 'PAID' && !reel.isUnlocked;

          return (
            <div
              key={reel.id}
              data-index={index}
              ref={el => { if (el) reelElementsRef.current[index] = el; }}
              className="relative h-screen w-full snap-start snap-always flex items-center justify-center"
            >
              {/* Conteneur portrait 9:16 centré */}
              <div className="relative h-full w-full max-w-[calc(100vh*9/16)] mx-auto overflow-hidden rounded-none sm:rounded-2xl">
                {/* Vidéo / Image de fond */}
                {isLocked ? (
                  /* Reel payant verrouillé : miniature floutée */
                  <div className="w-full h-full relative">
                    <img
                      src={getAssetUrl(reel.thumbnail)}
                      alt={reel.title}
                      className="w-full h-full object-cover blur-xl scale-110"
                    />
                    {/* Overlay sombre */}
                    <div className="absolute inset-0 bg-black/50" />
                  </div>
                ) : (
                  /* Reel gratuit ou débloqué : vidéo */
                  <video
                    ref={el => { if (el) videoRefs.current[index] = el; }}
                    src={getAssetUrl(reel.videoUrl)}
                    className="w-full h-full object-cover"
                    loop
                    playsInline
                    muted={isMuted}
                    autoPlay={index === 0}
                    poster={getAssetUrl(reel.thumbnail)}
                    onClick={() => {
                      const video = videoRefs.current[index];
                      if (video?.paused) {
                        video.play().catch(() => {});
                      } else {
                        video?.pause();
                      }
                    }}
                  />
                )}

                {/* Overlay gradient (seulement si pas verrouillé) */}
                {!isLocked && (
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 pointer-events-none" />
                )}

                {/* Overlay payant verrouillé */}
                {isLocked && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-20 px-6">
                    {/* Icône cadenas */}
                    <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mb-5 border border-white/20">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>

                    {/* Prix */}
                    <div className="flex items-center gap-2 mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6c.304 0 .792.193 1.264.979a1 1 0 001.715-1.029C12.279 4.784 11.232 4 10 4s-2.279.784-2.979 1.95c-.285.475-.507 1-.67 1.55H6a1 1 0 000 2h.013a9.358 9.358 0 000 1H6a1 1 0 100 2h.351c.163.55.385 1.075.67 1.55C7.721 15.216 8.768 16 10 16s2.279-.784 2.979-1.95a1 1 0 10-1.715-1.029c-.472.786-.96.979-1.264.979-.304 0-.792-.193-1.264-.979a5.95 5.95 0 01-.4-.821h1.988a1 1 0 000-2H8.002a7.365 7.365 0 010-1h2.322a1 1 0 000-2H8.336c.12-.29.26-.562.4-.821z" />
                      </svg>
                      <span className="text-3xl font-bold text-white">{reel.price}</span>
                      <span className="text-lg text-gray-300">coins</span>
                    </div>

                    <p className="text-sm text-gray-300 text-center mb-5 max-w-xs">
                      Ce Reel est premium. Débloquez-le pour le visionner.
                    </p>

                    {/* Bouton débloquer */}
                    <button
                      onClick={() => handleUnlock(reel.id, reel.price)}
                      className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-full transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-2 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                      </svg>
                      Débloquer
                    </button>
                  </div>
                )}

                {/* Header */}
                <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-30">
                  <button
                    onClick={() => router.back()}
                    className="p-2 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 transition"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsMuted(prev => !prev)}
                      className="p-2 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 transition"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {isMuted ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        )}
                      </svg>
                    </button>
                    {isLocked && (
                      <span className="px-3 py-1 bg-yellow-500/80 backdrop-blur-sm rounded-full text-white text-xs font-semibold">
                        Premium
                      </span>
                    )}
                    <span className="px-3 py-1 bg-purple-500/80 backdrop-blur-sm rounded-full text-white text-sm font-medium">
                      Reels
                    </span>
                  </div>
                </div>

                {/* Informations du Reel (en bas) */}
                <div className="absolute bottom-6 left-0 right-16 p-4 text-white z-10">
                  {/* Expert info */}
                  <div className="flex items-center gap-3 mb-3">
                    <button onClick={() => router.push(`/experts/${reel.expert.id}`)}>
                      <img
                        src={getAssetUrl(reel.expert.profilePicture || '/default-avatar.png')}
                        alt={reel.expert.name}
                        className="w-10 h-10 rounded-full border-2 border-white object-cover"
                      />
                    </button>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-sm">{reel.expert.name}</span>
                        {reel.expert.verified && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className="text-xs text-gray-300">{reel.category}</span>
                    </div>
                  </div>

                  {/* Titre */}
                  <p className="font-semibold text-sm mb-1">{reel.title}</p>

                  {/* Description */}
                  {reel.description && (
                    <p className="text-xs text-gray-200 line-clamp-2 mb-2">{reel.description}</p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-gray-300">
                    <span className="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      {reel.views}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      {reel.comments}
                    </span>
                  </div>
                </div>

                {/* Actions côté droit */}
                <div className="absolute right-3 bottom-24 flex flex-col gap-5 z-10">
                  {/* Like */}
                  <button
                    onClick={() => handleLike(reel.id)}
                    className="flex flex-col items-center gap-1 group"
                  >
                    <div className={`p-2.5 rounded-full ${reel.isLiked ? 'bg-red-500' : 'bg-black/30 backdrop-blur-sm'} group-hover:scale-110 transition`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill={reel.isLiked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <span className="text-white text-xs font-medium">{reel.likes}</span>
                  </button>

                  {/* Commentaires */}
                  <button
                    onClick={() => router.push(`/reels/${reel.id}`)}
                    className="flex flex-col items-center gap-1 group"
                  >
                    <div className="p-2.5 rounded-full bg-black/30 backdrop-blur-sm group-hover:scale-110 transition">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <span className="text-white text-xs font-medium">{reel.comments}</span>
                  </button>

                  {/* Partager */}
                  <button className="flex flex-col items-center gap-1 group">
                    <div className="p-2.5 rounded-full bg-black/30 backdrop-blur-sm group-hover:scale-110 transition">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                    </div>
                  </button>

                  {/* Expert profile */}
                  <button
                    onClick={() => router.push(`/experts/${reel.expert.id}`)}
                    className="flex flex-col items-center gap-1"
                  >
                    <img
                      src={getAssetUrl(reel.expert.profilePicture || '/default-avatar.png')}
                      alt={reel.expert.name}
                      className="w-9 h-9 rounded-full border-2 border-white object-cover"
                    />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
