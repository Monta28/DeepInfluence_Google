'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppHeader from '@/components/AppHeader';
import Footer from '@/components/Footer';
import ApiService, { Expert } from '../../../../services/api';
import { useAuth } from '../../../../contexts/AuthContext';

interface ContactExpertFormProps {
  expertId: string;
}

export default function ContactExpertForm({ expertId }: { expertId: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [expert, setExpert] = useState<Expert | null>(null);
  const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, '') : '');
  const expertImgCandidates = useMemo(() => {
    const list: string[] = [];
    if (backendBase && expert) {
      const ids = Array.from(new Set([expert.id, (expert as any)?.userId].filter(Boolean))) as number[];
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
  }, [backendBase, expert?.id, (expert as any)?.userId, expert?.image, expert?.name]);
  const [expertImgIdx, setExpertImgIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [messageType, setMessageType] = useState<'text' | 'video'>('text');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchExpert = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await ApiService.getExpert(Number(expertId));
        if (res.success && res.data) {
          setExpert(res.data);
        } else {
          setError(res.message || 'Expert introuvable');
        }
      } catch (e: any) {
        setError(e.message || 'Erreur lors du chargement de l’expert');
      } finally {
        setLoading(false);
      }
    };
    fetchExpert();
  }, [expertId]);

  const handleContact = async () => {
    if (!user) {
      router.push('/signin');
      return;
    }
    if (!message.trim() || !expert) {
      setError('Veuillez écrire un message.');
      return;
    }
    if (!hasEnoughCoins()) {
      setError("Vous n'avez pas assez de coins.");
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // Utilise l'ID de l'utilisateur associé à l'expert comme destinataire
      const response = await ApiService.initiateConversation(expert.userId, message);

      if (response.success && response.data?.conversationId) {
        router.push(`/dashboard/chat/${response.data.conversationId}`);
      } else {
        throw new Error(response.message || "Impossible d'envoyer le message.");
      }
    } catch (err: any) {
      console.error("Erreur d'envoi:", err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getCost = () => {
    if (!expert) return 0;
    return messageType === 'video' ? expert.pricePerMessage * 2 : expert.pricePerMessage;
  };

  const getCostText = () => `${getCost()} coins`;

  const getIcon = () => {
    return messageType === 'video' ? 'ri-video-line' : 'ri-message-line';
  };

  const hasEnoughCoins = () => {
    if (!expert) return false;
    return (user?.coins || 0) >= getCost();
  };

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-gray-600">Chargement des informations de l'expert...</p>
      </div>
    );
  }

  if (error && !expert) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <i className="ri-error-warning-line text-red-600 text-3xl"></i>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">Erreur</h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">{error}</p>
        <Link
          href="/experts"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
        >
          Retour aux experts
        </Link>
      </div>
    );
  }

  // Type guard: if expert is still null, don't render
  if (!expert) {
    return null;
  }

  return (
    <div>
      <AppHeader /> 
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="mb-8">
          <Link 
            href={`/experts/${expert.id}`}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            <i className="ri-arrow-left-line mr-2"></i>
            Retour au profil
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <img
                  src={expertImgCandidates[Math.min(expertImgIdx, expertImgCandidates.length - 1)]}
                  alt={expert?.name || ''}
                  onError={() => setExpertImgIdx(i => i + 1)}
                  className="w-24 h-24 rounded-full border-4 border-white/20 object-cover"
                />
                <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center ${
                  expert.isOnline ? 'bg-green-500' : 'bg-gray-500'
                }`}>
                  <i className={`ri-${expert.isOnline ? 'check' : 'time'}-line text-white text-sm`}></i>
                </div>
              </div>
              
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{expert.name}</h1>
                <p className="text-blue-100 text-lg mb-3">{expert.specialty}</p>
                
                <div className="flex items-center space-x-6 text-sm">
                  <div className="flex items-center">
                    <i className="ri-star-fill text-yellow-400 mr-1"></i>
                    <span>{expert.rating} ({expert.reviews} avis)</span>
                  </div>
                  <div className="flex items-center">
                    <i className="ri-time-line mr-1"></i>
                    <span>Répond en {expert.responseTime}</span>
                  </div>
                  <div className="flex items-center">
                    <i className={`ri-circle-fill mr-1 ${expert.isOnline ? 'text-green-400' : 'text-gray-400'}`}></i>
                    <span>{expert.isOnline ? 'En ligne' : 'Hors ligne'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Contacter {expert.name}
            </h2>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Type de message</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                      onClick={() => setMessageType('text')}
                      className={`p-4 rounded-xl border-2 transition-all ${messageType === 'text' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                      <div className="flex items-center space-x-3">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${messageType === 'text' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                              <i className="ri-message-line text-xl"></i>
                          </div>
                          <div className="text-left">
                              <h3 className="font-semibold">Message texte</h3>
                              <p className="text-sm text-gray-600">{expert.pricePerMessage} coins</p>
                          </div>
                      </div>
                  </button>
                  <button
                      onClick={() => setMessageType('video')}
                      className={`p-4 rounded-xl border-2 transition-all ${messageType === 'video' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                      <div className="flex items-center space-x-3">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${messageType === 'video' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                              <i className="ri-video-line text-xl"></i>
                          </div>
                          <div className="text-left">
                              <h3 className="font-semibold">Message vidéo</h3>
                              <p className="text-sm text-gray-600">{expert.pricePerMessage * 2} coins</p>
                          </div>
                      </div>
                  </button>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Votre message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`Décrivez votre question ou problématique pour ${expert.name}...`}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                    <i className="ri-coin-line text-white"></i>
                  </div>
                  <div>
                    <h3 className="font-semibold">Coût du message</h3>
                    <p className="text-sm text-gray-600">Vos coins: {user?.coins || 0} • Coût: {getCostText()}</p>
                  </div>
                </div>
                {!hasEnoughCoins() && (
                  <Link href="/dashboard/coins" className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 text-sm font-medium">
                    Acheter des coins
                  </Link>
                )}
              </div>
            </div>
            
            {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleContact}
                disabled={!message.trim() || !hasEnoughCoins() || submitting}
                className={`flex-1 flex items-center justify-center space-x-3 py-4 px-6 rounded-xl font-semibold transition-all ${
                  !message.trim() || !hasEnoughCoins() || submitting
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                }`}
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Envoi en cours...</span>
                  </>
                ) : (
                  <>
                    <i className={`${getIcon()} text-xl`}></i>
                    <span>Envoyer ({getCostText()})</span>
                  </>
                )}
              </button>

              <Link
                href={`/experts/${expert.id}/book`}
                className="flex-1 flex items-center justify-center space-x-3 py-4 px-6 bg-white border-2 border-blue-600 text-blue-600 rounded-xl font-semibold hover:bg-blue-50"
              >
                <i className="ri-calendar-line text-xl"></i>
                <span>Réserver une consultation</span>
              </Link>
            </div>
          </div>
        </div>      
      </div>
      <Footer />
    </div>
  );
}
