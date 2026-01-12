"use client";

import { useEffect, useState } from 'react';
import AppHeader from '@/components/AppHeader';
import Link from 'next/link';
import ApiService from '@/services/api';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useSocket } from '@/contexts/SocketContext';

interface VideoPlayerProps {
  videoId: string;
}

export default function VideoPlayer({ videoId }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');

  const { addToast } = useToast();
  const { user, updateUser } = useAuth();
  const { videoIds, toggleVideo, toggleFavoriteVideo, refresh: refreshFavorites } = useFavorites();
  const socket = useSocket();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [video, setVideo] = useState<any | null>(null);
  const [isFav, setIsFav] = useState<boolean>(false);
  const [currentLikes, setCurrentLikes] = useState<number>(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const r = await ApiService.getVideoById(parseInt(videoId));
        if (r.success && mounted) {
          setVideo(r.data);
          try { setIsLiked(!!r.data?.liked); } catch {}
          try { setCurrentLikes(Number(r.data?.likes || 0)); } catch { setCurrentLikes(0); }
          // Charger favoris pour avoir l'état initial
          try { await refreshFavorites(); } catch {}
        } else if (mounted) {
          setError(r.message || 'Vidéo introuvable');
        }
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Erreur de chargement');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [videoId]);

  // Socket: rejoindre/quitter la salle de la vidéo et écouter les MAJ likes
  useEffect(() => {
    if (!socket) return;
    const vid = Number(videoId);
    socket.emit('video:join', { videoId: vid });
    const onLikes = (payload: any) => {
      if (!payload || Number(payload.videoId) !== vid) return;
      if (typeof payload.likes === 'number') setCurrentLikes(payload.likes);
    };
    socket.on('video:likesUpdated', onLikes);
    return () => {
      try { socket.emit('video:leave', { videoId: vid }); } catch {}
      socket.off('video:likesUpdated', onLikes);
    };
  }, [socket, videoId]);

  // Sync état coeur (favori) avec contexte
  useEffect(() => {
    if (video?.id) setIsFav(videoIds.has(video.id));
  }, [video?.id, videoIds]);


  const handlePurchase = async () => {
    if (!user) {
      if (typeof window !== 'undefined') sessionStorage.setItem('returnUrl', `/videos/${videoId}`);
      window.location.href = '/signin';
      return;
    }
    try {
      const r = await ApiService.purchaseVideo(parseInt(videoId));
      if (r.success) {
        addToast('Vidéo débloquée', 'success');
        // Reload video state
        const v = await ApiService.getVideoById(parseInt(videoId));
        if (v.success && v.data) setVideo(v.data);
        // Refresh coins in header
        try {
          const me = await ApiService.getMe();
          if (me.success && me.data) updateUser({ coins: me.data.coins });
        } catch {}
      }
    } catch (e: any) {
      addToast(e?.message || "Achat impossible", 'error');
    }
  };

  // Fallback mock data for UI sections when video not loaded yet
  const videosData = {
    '1': {
      id: '1',
      title: 'Les 5 clés du leadership efficace',
      expert: 'Dr. Marie Dubois',
      duration: '08:45',
      views: 12500,
      likes: 856,
      category: 'business',
      type: 'free',
      price: 0,
      thumbnail: 'https://readdy.ai/api/search-image?query=Professional%20business%20woman%20presenting%20leadership%20concepts%2C%20modern%20office%20background%2C%20confident%20posture%2C%20professional%20attire%2C%20engaging%20presentation&width=800&height=450&seq=video-leadership-full&orientation=landscape',
      expertImage: 'https://readdy.ai/api/search-image?query=Professional%20female%20personal%20development%20coach%20with%20warm%20confident%20smile%2C%20modern%20coaching%20office%20background%2C%20professional%20attire%2C%20trustworthy%20and%20approachable%20appearance%2C%20high%20quality%20portrait&width=60&height=60&seq=expert-marie-1&orientation=squarish',
      publishedAt: '2024-01-15',
      description: 'Découvrez les techniques fondamentales pour développer votre leadership et inspirer vos équipes. Dans cette vidéo, nous explorerons les 5 piliers essentiels du leadership efficace qui vous permettront de guider vos équipes vers le succès.',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      transcript: [
        { time: '00:00', text: 'Bienvenue dans cette formation sur le leadership efficace.' },
        { time: '00:15', text: 'Aujourd\'hui, nous allons explorer les 5 clés fondamentales.' },
        { time: '00:30', text: 'La première clé est la communication claire et transparente.' },
        { time: '01:00', text: 'Un bon leader sait écouter avant de parler.' },
        { time: '01:30', text: 'La deuxième clé concerne l\'inspiration et la motivation.' }
      ]
    },
    '3': {
      id: '3',
      title: 'Méditation et gestion du stress',
      expert: 'Sophie Laurent',
      duration: '15:20',
      views: 15600,
      likes: 1234,
      category: 'wellness',
      type: 'free',
      price: 0,
      thumbnail: 'https://readdy.ai/api/search-image?query=Peaceful%20meditation%20session%20with%20woman%20in%20serene%20environment%2C%20calming%20nature%20background%2C%20wellness%20theme%2C%20relaxing%20atmosphere&width=800&height=450&seq=video-meditation-full&orientation=landscape',
      expertImage: 'https://readdy.ai/api/search-image?query=Professional%20female%20wellness%20and%20nutrition%20coach%20with%20healthy%20radiant%20appearance%2C%20natural%20wellness%20environment%20background%2C%20professional%20attire%2C%20trustworthy%20and%20caring%20expression%2C%20high%20quality%20portrait&width=60&height=60&seq=expert-sophie-3&orientation=squarish',
      publishedAt: '2024-01-13',
      description: 'Apprenez des techniques de méditation efficaces pour gérer le stress quotidien et améliorer votre bien-être général.',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      transcript: [
        { time: '00:00', text: 'Bienvenue dans cette session de méditation anti-stress.' },
        { time: '00:20', text: 'Installez-vous confortablement dans un endroit calme.' },
        { time: '00:45', text: 'Fermez les yeux et concentrez-vous sur votre respiration.' },
        { time: '01:15', text: 'Inspirez profondément par le nez, expirez par la bouche.' }
      ]
    },
    '6': {
      id: '6',
      title: 'Nutrition et performance',
      expert: 'Sophie Laurent',
      duration: '14:30',
      views: 11200,
      likes: 789,
      category: 'wellness',
      type: 'free',
      price: 0,
      thumbnail: 'https://readdy.ai/api/search-image?query=Healthy%20nutrition%20setup%20with%20fresh%20vegetables%2C%20fruits%2C%20nutritionist%20explaining%20healthy%20eating%2C%20wellness%20theme%2C%20bright%20natural%20lighting&width=800&height=450&seq=video-nutrition-full&orientation=landscape',
      expertImage: 'https://readdy.ai/api/search-image?query=Professional%20female%20wellness%20and%20nutrition%20coach%20with%20healthy%20radiant%20appearance%2C%20natural%20wellness%20environment%20background%2C%20professional%20attire%2C%20trustworthy%20and%20caring%20expression%2C%20high%20quality%20portrait&width=60&height=60&seq=expert-sophie-3&orientation=squarish',
      publishedAt: '2024-01-10',
      description: 'Optimisez votre nutrition pour améliorer vos performances physiques et mentales.',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      transcript: [
        { time: '00:00', text: 'La nutrition est la base de toute performance optimale.' },
        { time: '00:25', text: 'Commençons par comprendre les macronutriments essentiels.' },
        { time: '00:50', text: 'Les protéines sont cruciales pour la récupération musculaire.' }
      ]
    },
    '8': {
      id: '8',
      title: 'SEO et référencement naturel',
      expert: 'Ahmed Hassan',
      duration: '19:45',
      views: 8200,
      likes: 567,
      category: 'marketing',
      type: 'free',
      price: 0,
      thumbnail: 'https://readdy.ai/api/search-image?query=SEO%20specialist%20showing%20search%20engine%20optimization%20techniques%2C%20analytics%20dashboard%2C%20digital%20marketing%20tools%2C%20professional%20workspace&width=800&height=450&seq=video-seo-full&orientation=landscape',
      expertImage: 'https://readdy.ai/api/search-image?query=Professional%20male%20digital%20marketing%20expert%20with%20confident%20expression%2C%20modern%20digital%20office%20background%2C%20contemporary%20business%20attire%2C%20trustworthy%20appearance%2C%20high%20quality%20portrait&width=60&height=60&seq=expert-ahmed-4&orientation=squarish',
      publishedAt: '2024-01-08',
      description: 'Maîtrisez les techniques de SEO pour améliorer la visibilité de votre site web.',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      transcript: [
        { time: '00:00', text: 'Le SEO est essentiel pour votre visibilité en ligne.' },
        { time: '00:30', text: 'Commençons par les mots-clés et leur recherche.' },
        { time: '01:00', text: 'L\'optimisation on-page est la première étape.' }
      ]
    },
    '11': {
      id: '11',
      title: 'Yoga et flexibilité mentale',
      expert: 'Sophie Laurent',
      duration: '20:45',
      views: 14200,
      likes: 1156,
      category: 'wellness',
      type: 'free',
      price: 0,
      thumbnail: 'https://readdy.ai/api/search-image?query=Yoga%20instructor%20in%20peaceful%20studio%2C%20flexibility%20and%20mindfulness%20practice%2C%20wellness%20and%20meditation%20environment&width=800&height=450&seq=video-yoga-full&orientation=landscape',
      expertImage: 'https://readdy.ai/api/search-image?query=Professional%20female%20wellness%20and%20nutrition%20coach%20with%20healthy%20radiant%20appearance%2C%20natural%20wellness%20environment%20background%2C%20professional%20attire%2C%20trustworthy%20and%20caring%20expression%2C%20high%20quality%20portrait&width=60&height=60&seq=expert-sophie-3&orientation=squarish',
      publishedAt: '2024-01-05',
      description: 'Développez votre flexibilité physique et mentale avec des techniques de yoga.',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
      transcript: [
        { time: '00:00', text: 'Le yoga unit le corps et l\'esprit.' },
        { time: '00:30', text: 'Commençons par des postures de base.' },
        { time: '01:00', text: 'Respirez profondément et détendez-vous.' }
      ]
    },
    '14': {
      id: '14',
      title: 'Gestion financière personnelle',
      expert: 'Thomas Bernard',
      duration: '13:50',
      views: 11700,
      likes: 856,
      category: 'business',
      type: 'free',
      price: 0,
      thumbnail: 'https://readdy.ai/api/search-image?query=Personal%20finance%20management%2C%20budgeting%20and%20financial%20planning%2C%20professional%20financial%20advice%20setting&width=800&height=450&seq=video-personal-finance-full&orientation=landscape',
      expertImage: 'https://readdy.ai/api/search-image?query=Professional%20male%20financial%20advisor%20with%20trustworthy%20smile%2C%20elegant%20office%20background%2C%20business%20suit%2C%20high%20quality%20portrait&width=60&height=60&seq=expert-thomas-6&orientation=squarish',
      publishedAt: '2024-01-02',
      description: 'Principes essentiels pour gérer efficacement vos finances personnelles.',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
      transcript: [
        { time: '00:00', text: 'La gestion financière personnelle est cruciale.' },
        { time: '00:25', text: 'Établissons d\'abord un budget réaliste.' },
        { time: '00:50', text: 'L\'épargne doit être votre priorité.' }
      ]
    }
  };

  const mockVideo = videosData[videoId as keyof typeof videosData] || videosData['1'];

  const relatedVideos = [
    videosData['1'],
    videosData['3'],
    videosData['6'],
    videosData['8']
  ].filter((v: any) => v.id !== videoId).slice(0, 3);

  const formatTime = (timeInSeconds: number | string) => {
    const time = typeof timeInSeconds === 'string' ? parseFloat(timeInSeconds) : timeInSeconds;
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: any) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    setCurrentTime(newTime);
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    setShowSpeedMenu(false);
  };

  const handleToggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleToggleFavorite = async () => {
    try {
      if (!user) {
        if (typeof window !== 'undefined') sessionStorage.setItem('returnUrl', `/videos/${videoId}`);
        window.location.href = '/signin';
        return;
      }
      if (!video?.id) return;
      await toggleFavoriteVideo(video.id);
      setIsFav(v => !v);
    } catch (e: any) {
      addToast(e?.message || 'Action impossible', 'error');
    }
  };

  const handleLike = async () => {
    try {
      if (!user) {
        if (typeof window !== 'undefined') sessionStorage.setItem('returnUrl', `/videos/${videoId}`);
        window.location.href = '/signin';
        return;
      }
      if (!video?.id) return;
      const next = !isLiked;
      setIsLiked(next);
      setCurrentLikes(prev => Math.max(0, prev + (next ? 1 : -1)));
      await toggleVideo(video.id);
    } catch (e: any) {
      addToast(e?.message || "Action impossible", 'error');
    }
  };

  // (Bouton "Ajouter à la liste" retiré)

  const handleShare = () => {
    setShowShareModal(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setShowShareModal(false);
  };

  // Simuler la progression de la vidéo
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + 1;
          if (newTime >= duration) {
            setIsPlaying(false);
            return duration;
          }
          return newTime;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, duration]);

  // Définir la durée de la vidéo (si chargée)
  useEffect(() => {
    if (!video?.duration) return;
    const durationStr = String(video.duration);
    const parts = durationStr.split(':');
    const totalSeconds = (parseInt(parts[0] || '0') * 60) + parseInt(parts[1] || '0');
    if (Number.isFinite(totalSeconds)) setDuration(totalSeconds);
  }, [video?.duration]);

  // Masquer les contrôles automatiquement
  useEffect(() => {
    let timeout: NodeJS.Timeout | undefined;
    if (isPlaying) {
      timeout = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [isPlaying, showControls]);

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Loading and not-found guards
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 dark:text-gray-300">
        {error || 'Vidéo introuvable'}
      </div>
    );
  }

  // Define thumb early for use in locked video screen
  const thumb = (video as any)?.thumbnail || `https://ui-avatars.com/api/?name=${encodeURIComponent((video as any)?.title || 'Video')}&size=800&background=8B5CF6&color=ffffff`;

  // Gate premium videos that are not unlocked
  if (!loading && video) {
    const locked = !(video.isUnlocked || video.type === 'free' || video.price === 0);
    if (locked) {
      return (
        <div className="min-h-screen bg-gray-50">
          <AppHeader />
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="bg-black rounded-lg overflow-hidden shadow-lg mb-6">
              <div className="relative aspect-video flex items-center justify-center">
                <img src={thumb} alt={video.title} className="absolute inset-0 w-full h-full object-cover opacity-50" />
                <div className="relative z-10 text-center">
                  <div className="text-white text-2xl font-semibold mb-3">Vidéo premium</div>
                  <div className="text-white/90 mb-2">Achetez pour débloquer la lecture.</div>
                  {user && Number(user.coins || 0) < Number(video.price || 0) && (
                    <div className="text-red-200 mb-2">
                      Il vous manque <span className="font-semibold">{Math.max(0, Number(video.price || 0) - Number(user.coins || 0))}</span> coin(s).
                    </div>
                  )}
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={handlePurchase}
                      disabled={!!user && Number(user.coins || 0) < Number(video.price || 0)}
                      className={`px-6 py-3 rounded-lg text-white ${!!user && Number(user.coins || 0) < Number(video.price || 0) ? 'bg-pink-300 cursor-not-allowed' : 'bg-pink-600 hover:bg-pink-700'}`}
                    >
                      Acheter pour {video.price} coins
                    </button>
                    <a href="/dashboard/coins" className="px-4 py-2 rounded-lg bg-yellow-500 text-white hover:bg-yellow-600">Acheter des coins</a>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{video.title}</h1>
              <div className="text-gray-600 mb-4">Catégorie: {video.category}</div>
              <p className="text-gray-700">{video.description}</p>
            </div>
          </div>
        </div>
      );
    }
  }

  // Safe fallbacks for optional fields from API
  const transcript = Array.isArray((video as any)?.transcript) ? (video as any).transcript : [];
  const expertName = (video as any)?.expert || (video as any)?.expertRel?.name || 'Expert';
  const expertId = (video as any)?.expertRel?.id;
  const expertImage =
    (video as any)?.expertImage ||
    (video as any)?.expertRel?.image ||
    (video as any)?.expertRel?.user?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(expertName)}&size=60`;

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lecteur vidéo principal */}
          <div className="lg:col-span-2">
            <div className="bg-black rounded-lg overflow-hidden shadow-lg">
              <div 
                className={`relative ${isFullscreen ? 'fixed inset-0 z-50' : 'aspect-video'}`}
                onMouseMove={() => setShowControls(true)}
                onMouseLeave={() => isPlaying && setShowControls(false)}
              >
                {/* Thumbnail de la vidéo */}
                <img src={thumb} alt={video.title} className="w-full h-full object-cover" />
                
                {/* Overlay de lecture */}
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <button
                    onClick={handlePlayPause}
                    className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <i className={`${isPlaying ? 'ri-pause-fill' : 'ri-play-fill'} text-3xl text-gray-900`}></i>
                  </button>
                </div>

                {/* Contrôles vidéo */}
                <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                  {/* Barre de progression */}
                  <div className="mb-4">
                    <div 
                      className="w-full h-2 bg-white/30 rounded-full cursor-pointer"
                      onClick={handleSeek}
                    >
                      <div 
                        className="h-full bg-blue-500 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Contrôles */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={handlePlayPause}
                        className="text-white hover:text-blue-400 transition-colors"
                      >
                        <i className={`${isPlaying ? 'ri-pause-fill' : 'ri-play-fill'} text-2xl`}></i>
                      </button>
                      
                      <div className="relative">
                        <button
                          onClick={() => setShowVolumeSlider(!showVolumeSlider)}
                          className="text-white hover:text-blue-400 transition-colors"
                        >
                          <i className={`ri-volume-${volume > 0.5 ? 'up' : volume > 0 ? 'down' : 'mute'}-fill text-xl`}></i>
                        </button>
                        
                        {showVolumeSlider && (
                          <div className="absolute bottom-8 left-0 bg-black/80 rounded-lg p-2">
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.1"
                              value={volume}
                              onChange={(e) => setVolume(parseFloat(e.target.value))}
                              className="w-20 h-2 bg-gray-200 rounded-lg appearance-none slider"
                            />
                          </div>
                        )}
                      </div>
                      
                      <span className="text-white text-sm">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <button
                          onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                          className="text-white hover:text-blue-400 transition-colors text-sm"
                        >
                          {playbackSpeed}x
                        </button>
                        
                        {showSpeedMenu && (
                          <div className="absolute bottom-8 right-0 bg-black/80 rounded-lg p-2 min-w-16">
                            {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed: any) => (
                              <button
                                key={speed}
                                onClick={() => handleSpeedChange(speed)}
                                className={`block w-full text-left px-3 py-1 text-sm rounded hover:bg-white/20 transition-colors ${
                                  playbackSpeed === speed ? 'text-blue-400' : 'text-white'
                                }`}
                              >
                                {speed}x
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <button
                        onClick={handleToggleFullscreen}
                        className="text-white hover:text-blue-400 transition-colors"
                      >
                        <i className={`ri-${isFullscreen ? 'fullscreen-exit' : 'fullscreen'}-line text-xl`}></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Informations de la vidéo */}
            <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{video.title}</h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                    <span>{video.views?.toLocaleString?.() || video.views || 0} vues</span>
                    <span>•</span>
                    <span>{video.publishedAt ? new Date(video.publishedAt).toLocaleDateString('fr-FR') : ''}</span>
                    <span>•</span>
                    {video.price > 0 ? (
                      (video.isUnlocked ? (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">Débloquée</span>
                      ) : (
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">Premium</span>
                      ))
                    ) : (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">Gratuit</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleToggleFavorite}
                    className={`w-8 h-8 inline-flex items-center justify-center rounded-full transition-all ${isFav ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-red-50'}`}
                    aria-label={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  >
                    <i className={`ri-heart-${isFav ? 'fill' : 'line'} text-sm leading-none`}></i>
                  </button>
                  <button
                    onClick={handleLike}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      isLiked 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <i className={`ri-thumb-up-${isLiked ? 'fill' : 'line'}`}></i>
                    <span>{currentLikes.toLocaleString()}</span>
                  </button>
                  
                  <button
                    onClick={handleShare}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                  >
                    <i className="ri-share-line"></i>
                    <span>Partager</span>
                  </button>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center space-x-4 mb-4">
                  <img src={expertImage} alt={expertName} className="w-12 h-12 rounded-full object-cover" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{expertName}</h3>
                    <p className="text-sm text-gray-600">Expert vérifié</p>
                  </div>
                  {expertId && (
                    <Link
                      href={`/experts/${expertId}`}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm whitespace-nowrap"
                    >
                      Voir le profil
                    </Link>
                  )}
                  {expertId && (
                    <Link
                      href={`/videos?search=${encodeURIComponent(expertName)}`}
                      className="ml-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm whitespace-nowrap"
                    >
                      Toutes ses vidéos
                    </Link>
                  )}
                </div>
                
                <p className="text-gray-700 leading-relaxed">{video.description}</p>
              </div>
            </div>

            {/* Transcription */}
            <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Transcription</h2>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {transcript.map((item: any, index: number) => (
                  <div key={index} className="flex items-start space-x-3">
                    <span className="text-blue-600 font-mono text-sm min-w-16">{item.time}</span>
                    <p className="text-gray-700">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes personnelles */}
            <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Notes personnelles</h2>
                <button
                  onClick={() => setShowNotes(!showNotes)}
                  className="text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <i className={`ri-${showNotes ? 'eye-off' : 'eye'}-line`}></i>
                </button>
              </div>
              
              {showNotes && (
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ajoutez vos notes sur cette vidéo..."
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Vidéos similaires */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Vidéos similaires</h2>
              <div className="space-y-4">
                {relatedVideos.map((relatedVideo) => (
                  <Link
                    key={relatedVideo.id}
                    href={`/videos/${relatedVideo.id}`}
                    className="block group"
                  >
                    <div className="flex space-x-3">
                      <div className="relative">
                        <img
                          src={relatedVideo.thumbnail}
                          alt={relatedVideo.title}
                          className="w-32 h-20 object-cover rounded-lg group-hover:opacity-80 transition-opacity"
                        />
                        <div className="absolute bottom-1 right-1 bg-black/70 text-white px-1 py-0.5 rounded text-xs">
                          {relatedVideo.duration}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                          {relatedVideo.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">{relatedVideo.expert}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {relatedVideo.views.toLocaleString()} vues
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Actions rapides */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions rapides</h2>
              <div className="space-y-3">
                {expertId && (
                  <Link
                    href={`/experts/${expertId}/contact`}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors text-center block whitespace-nowrap"
                  >
                    <i className="ri-message-line mr-2"></i>
                    Contacter l'expert
                  </Link>
                )}
                
                <Link
                  href="/formations"
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors text-center block whitespace-nowrap"
                >
                  <i className="ri-graduation-cap-line mr-2"></i>
                  Voir les formations
                </Link>
                
                <Link
                  href="/videos"
                  className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors text-center block whitespace-nowrap"
                >
                  <i className="ri-compass-3-line mr-2"></i>
                  Explorer plus de vidéos
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de partage */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Partager cette vidéo
            </h3>
            
            <div className="space-y-3">
              <button
                onClick={() => copyToClipboard(window.location.href)}
                className="w-full flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <i className="ri-link text-blue-600"></i>
                <span>Copier le lien</span>
              </button>
              
              <button
                onClick={() => copyToClipboard(`Regardez cette vidéo : ${video.title} - ${window.location.href}`)}
                className="w-full flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <i className="ri-share-line text-green-600"></i>
                <span>Partager le texte</span>
              </button>
              
              <button
                onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(video.title)}&url=${encodeURIComponent(window.location.href)}`, '_blank')}
                className="w-full flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <i className="ri-twitter-line text-blue-400"></i>
                <span>Partager sur Twitter</span>
              </button>
              
              <button
                onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')}
                className="w-full flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <i className="ri-facebook-line text-blue-600"></i>
                <span>Partager sur Facebook</span>
              </button>
            </div>
            
            <button
              onClick={() => setShowShareModal(false)}
              className="w-full mt-4 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors whitespace-nowrap"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
