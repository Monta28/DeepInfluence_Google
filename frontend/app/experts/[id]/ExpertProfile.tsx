'use client';

// **SOLUTION : Ajouter 'Suspense' à l'import de React**
import { useState, useEffect, Suspense, useMemo } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import Footer from '@/components/Footer';
import ApiService, { Expert } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useToast } from '@/contexts/ToastContext';

interface ExpertProfileProps {
  expertId: string;
}

// Composant interne pour utiliser les hooks clients
function ExpertProfileContent({ expertId }: { expertId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const socket = useSocket();
  const { expertIds, toggleExpert, refresh: refreshFavorites } = useFavorites();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('about');
  const [expert, setExpert] = useState<Expert | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFollowed, setIsFollowed] = useState<boolean>(false);

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl === 'reviews') {
      setActiveTab('reviews');
    }

    const loadExpert = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await ApiService.getExpert(parseInt(expertId));
        if (response.success && response.data){
          setExpert(response.data);
          setIsFollowed(!!response.data?.isFollowed);
        } else {
          setError('Expert non trouvé');
        }
      } catch (err: any) {
        console.error("Erreur:", err);
        setError(err.message || "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    };

    loadExpert();
    // Charger les favoris pour avoir l'état initial correct
    refreshFavorites().catch(() => {});
  }, [expertId, searchParams]);

  // Synchroniser l'état local avec le contexte favoris quand expert ou liste changent
  useEffect(() => {
    if (expert) setIsFavorite(expertIds.has(expert.id));
  }, [expert?.id, expertIds]);

  // Real-time: reflect verification changes
  useEffect(() => {
    if (!socket) return;
    const handler = (e: any) => {
      if (!e || typeof e.expertId !== 'number') return;
      setExpert(prev => {
        if (!prev || prev.id !== e.expertId) return prev;
        return { ...(prev as any), verified: !!e.verified, verificationStatus: e.verificationStatus } as Expert;
      });
    };
    socket.on('expertVerificationChanged', handler);
    return () => { socket.off('expertVerificationChanged', handler); };
  }, [socket]);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <i
        key={i}
        className={`ri-star-${i < Math.floor(rating) ? 'fill' : 'line'} text-yellow-400 text-xl`}
      />
    ));
  };
  
  const handleContact = () => router.push(user ? `/experts/${expertId}/contact` : '/signin');
  const handleBooking = () => router.push(user ? `/experts/${expertId}/book` : '/signin');
  const handleReview = () => router.push(user ? `/experts/${expertId}/reviews` : '/signin');
  const handleFavorite = async () => {
    try {
      if (!user) {
        sessionStorage.setItem('returnUrl', `/experts/${expertId}`);
        router.push('/signin');
        return;
      }
      if (!expert) return;
      await toggleExpert(expert.id);
      // Le contexte émet un event et refresh; on reflète localement pour feedback instantané
      setIsFavorite((v) => !v);
    } catch (e: any) {
      addToast(e?.message || 'Action impossible pour le moment', 'error');
    }
  };
  const handleFollow = async () => {
    try {
      if (!user) {
        sessionStorage.setItem('returnUrl', `/experts/${expertId}`);
        router.push('/signin');
        return;
      }
      const r = await ApiService.toggleFollowExpert(Number(expertId));
      if (r.success) {
        const following = !!r.data?.following;
        setIsFollowed(following);
        setExpert((prev) => prev ? ({
          ...prev,
          followers: Math.max(0, (prev.followers || 0) + (following ? 1 : -1))
        } as Expert) : prev);
      }
    } catch (e) {}
  };

  const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, '') : '');

  const imgCandidates = useMemo(() => {
    const list: string[] = [];
    const ids = expert ? Array.from(new Set([expert.id, (expert as any)?.userId].filter(Boolean))) as number[] : [];
    if (backendBase && ids.length) {
      ids.forEach(id => {
        list.push(`${backendBase}/api/assets/experts/${id}`);
        ['jpg','jpeg','png','webp'].forEach(ext => list.push(`${backendBase}/images/experts/${id}.${ext}`));
      });
    }
    if (expert?.image) {
      const raw = expert.image.replace(/\\/g, '/');
      if (/^(https?:)?\/\//i.test(raw) || raw.startsWith('data:')) list.push(raw);
      else if (backendBase) list.push(raw.startsWith('/') ? `${backendBase}${raw}` : `${backendBase}/${raw}`);
      else list.push(raw);
    }
    list.push(`https://ui-avatars.com/api/?name=${encodeURIComponent(expert?.name || '')}&size=200&background=3B82F6&color=ffffff`);
    return Array.from(new Set(list));
  }, [backendBase, expert?.id, expert?.image, expert?.name]);
  const [profIdx, setProfIdx] = useState(0);

  if (loading) {
    return (
        <div className="flex justify-center items-center py-32">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-gray-600">Chargement du profil...</span>
        </div>
    );
  }

  if (error || !expert) {
    return (
        <div className="text-center py-32">
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Erreur</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">{error}</p>
            <Link href="/experts" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
            Retour aux experts
            </Link>
        </div>
    );
  }

  return (
    <div>
        {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 py-20">
        <div className="absolute inset-0 bg-black/20"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Expert Image and Main Info */}
            <div className="flex-shrink-0">
              <div className="relative">
                <img
                  src={imgCandidates[Math.min(profIdx, imgCandidates.length - 1)]}
                  alt={expert.name}
                  onError={() => setProfIdx(i => i + 1)}
                  className="w-48 h-48 rounded-full object-cover border-4 border-white shadow-xl"
                />
                {expert.isOnline && (
                  <div className="absolute bottom-4 right-4 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  </div>
                )}
                {expert.verified && (
                  <div className="absolute top-4 right-4 w-8 h-8 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
                    <i className="ri-shield-check-line text-white text-sm"></i>
                  </div>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="flex-1 text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
                <h1 className="text-4xl md:text-5xl font-bold text-white">{expert.name}</h1>
                <button
                  onClick={handleFavorite}
                  className={`p-2 rounded-full transition-colors ${
                    isFavorite 
                      ? 'bg-red-500 text-white' 
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  <i className={`ri-heart-${isFavorite ? 'fill' : 'line'}`}></i>
                </button>
              </div>
              
              <p className="text-xl text-blue-100 mb-4">{expert.specialty}</p>
              
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 mb-6">
                <div className="flex items-center text-yellow-400">
                  <i className="ri-star-fill mr-1"></i>
                  <span className="font-semibold">{expert.rating}</span>
                  <span className="text-blue-100 ml-1">({expert.reviews} avis)</span>
                </div>
                <div className="flex items-center text-blue-100">
                  <i className="ri-user-line mr-1"></i>
                  <span>{expert.sessions} sessions</span>
                </div>
                <div className="flex items-center text-blue-100">
                  <i className="ri-heart-line mr-1"></i>
                  <span>{expert.followers} followers</span>
                </div>
                {expert.responseTime && (
                  <div className="flex items-center text-green-300">
                    <i className="ri-time-line mr-1"></i>
                    <span>Répond en {expert.responseTime}</span>
                  </div>
                )}
              </div>

              {/* Verification banner */}
              {!expert.verified && (
                <div className="mb-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    (expert as any).verificationStatus === 'REJECTED'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    <i className={`ri-${(expert as any).verificationStatus === 'REJECTED' ? 'close-circle-line' : 'time-line'} mr-1`}></i>
                    {(expert as any).verificationStatus === 'REJECTED' ? 'Vérification refusée' : 'Vérification en cours'}
                  </span>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-8">
                {expert.languages.map((lang, index) => (
                  <span key={index} className="bg-white/20 text-white px-3 py-1 rounded-full text-sm">
                    {lang}
                  </span>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button
                  onClick={handleContact}
                  className="bg-white text-blue-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors shadow-lg"
                >
                  <i className="ri-message-line mr-2"></i>
                  Contacter ({expert.pricePerMessage} coins/message)
                </button>
                <button
                  onClick={handleBooking}
                  className="bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 px-8 py-3 rounded-full font-semibold hover:from-yellow-500 hover:to-orange-500 transition-colors shadow-lg"
                >
                  <i className="ri-calendar-line mr-2"></i>
                  Réserver ({expert.hourlyRate} coins/heure)
                </button><button
                  onClick={handleReview}
                  className="bg-gradient-to-r from-green-400 to-emerald-400 text-gray-900 px-8 py-3 rounded-full font-semibold hover:from-green-500 hover:to-emerald-500 transition-colors shadow-lg"
                >
                  <i className="ri-star-line mr-2"></i>
                  Avis
                </button>
                <button
                  onClick={handleFollow}
                  className={`${isFollowed ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-blue-600 text-white hover:bg-blue-700'} px-8 py-3 rounded-full font-semibold transition-colors shadow-lg`}
                >
                  <i className={`mr-2 ${isFollowed ? 'ri-user-follow-line' : 'ri-user-add-line'}`}></i>
                  {isFollowed ? 'Suivi' : 'Suivre'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'about', label: 'À propos', icon: 'ri-user-line' },
              { id: 'reviews', label: 'Avis', icon: 'ri-star-line' },
              { id: 'availability', label: 'Disponibilités', icon: 'ri-calendar-line' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <i className={`${tab.icon} mr-2`}></i>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {activeTab === 'about' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main Column */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">À propos de {expert.name}</h2>
                <p className="text-gray-600 leading-relaxed mb-6">
                  {expert.description || `${expert.name} is a renowned expert in ${expert.specialty}. With years of experience, they guide clients toward excellence and success.`}
                </p>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Domaines d'expertise</h3>
                <div className="flex flex-wrap gap-2 mb-6">
                  {expert.tags.map((tag, index) => (
                    <span key={index} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Tarifs</h3>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <i className="ri-message-line text-blue-600 mr-3"></i>
                      <span className="font-medium">Message</span>
                    </div>
                    <span className="font-bold text-blue-600">{expert.pricePerMessage} coins</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <i className="ri-time-line text-green-600 mr-3"></i>
                      <span className="font-medium">Consultation</span>
                    </div>
                    <span className="font-bold text-green-600">{expert.hourlyRate} coins/h</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleContact}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    <i className="ri-message-line mr-2"></i>
                    Envoyer un message
                  </button>
                  <button
                    onClick={handleBooking}
                    className="w-full bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 py-3 px-4 rounded-lg hover:from-yellow-500 hover:to-orange-500 transition-colors font-semibold"
                  >
                    <i className="ri-calendar-line mr-2"></i>
                    Réserver une consultation
                  </button>
                  <button
                    onClick={handleReview}
                    className="w-full bg-gradient-to-r from-green-400 to-emerald-400 text-gray-900 py-3 px-4 rounded-lg hover:from-green-500 hover:to-emerald-500 transition-colors font-semibold"
                  >
                    <i className="ri-star-line mr-2"></i>
                    Ajouter un avis
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="max-w-4xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Avis clients ({expert.reviews})</h2>
            <div className="space-y-6">
              {expert.reviewList && expert.reviewList.length > 0 ? (
                expert.reviewList.map((review) => (
                  <div key={review.id} className="border-b pb-6 last:border-b-0">
                    <div className="flex items-start">
                      <img 
                        src={review.user.avatar || `https://ui-avatars.com/api/?name=${review.user.firstName}+${review.user.lastName}`} 
                        alt={review.user.firstName} 
                        className="w-12 h-12 rounded-full mr-4" 
                      />
                      <div>
                        <div className="flex items-center mb-1">
                          <p className="font-semibold">{review.user.firstName} {review.user.lastName}</p>
                          <div className="flex items-center ml-4">
                            {renderStars(review.rating)}
                          </div>
                        </div>
                        <p className="text-gray-700">{review.comment}</p>
                        <p className="text-sm text-gray-500 mt-2">{new Date(review.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500">Aucun avis pour cet expert pour le moment.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'availability' && (
          <div className="max-w-4xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Disponibilités</h2>
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-calendar-line text-blue-600 text-2xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Calendrier de réservation</h3>
                <p className="text-gray-600 mb-6">Le système de réservation sera bientôt disponible.</p>
                <button
                  onClick={handleBooking}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
  const socket = useSocket();
                  Demander une consultation
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Le composant exporté qui utilise Suspense
export default function ExpertProfile({ expertId }: ExpertProfileProps) {
  return (
    <div className="min-h-screen bg-white">
        <AppHeader />
        <Suspense fallback={
            <div className="flex justify-center items-center py-32">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-3 text-gray-600">Chargement...</span>
            </div>
        }>
            <ExpertProfileContent expertId={expertId} />
        </Suspense>
        <Footer />
    </div>
  );
}
