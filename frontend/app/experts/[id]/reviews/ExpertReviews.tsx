'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import Footer from '@/components/Footer';
import ApiService, { Expert, Review } from '../../../../services/api';
import { useAuth } from '../../../../contexts/AuthContext';

interface ExpertReviewsProps {
  expertId: string;
}

export default function ExpertReviews({ expertId }: ExpertReviewsProps) {
  const [expert, setExpert] = useState<Expert | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const { user } = useAuth();
  const router = useRouter();
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

  const buildReviewerCandidates = (u: any) => {
    const list: string[] = [];
    const name = `${u?.firstName || ''} ${u?.lastName || ''}`.trim();
    if (backendBase && u?.id) {
      list.push(`${backendBase}/api/assets/users/${u.id}`);
      ['jpg','jpeg','png','webp'].forEach(ext => list.push(`${backendBase}/images/users/${u.id}.${ext}`));
    }
    if (u?.avatar) {
      const raw = String(u.avatar).replace(/\\/g, '/');
      if (/^(https?:)?\/\//i.test(raw) || raw.startsWith('data:')) list.push(raw);
      else if (backendBase) list.push(raw.startsWith('/') ? `${backendBase}${raw}` : `${backendBase}/${raw}`);
      else list.push(raw);
    }
    list.push(`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=48`);
    return Array.from(new Set(list));
  };

  useEffect(() => {
    const loadExpertData = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await ApiService.getExpert(parseInt(expertId));

        if (response.success && response.data) {
          setExpert(response.data);
          // Utiliser reviewList pour la liste des avis
          setReviews(response.data.reviewList || []);
        } else {
          setError('Expert non trouvé');
        }
      } catch (err: any) {
        console.error("Erreur lors du chargement des avis de l'expert:", err);
        setError(err.message || "Erreur lors du chargement des avis");
      } finally {
        setLoading(false);
      }
    };

    loadExpertData();
  }, [expertId]);

  const renderStars = (ratingValue: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <i
        key={i}
        className={`ri-star-${i < ratingValue ? 'fill' : 'line'} text-yellow-400`}
      />
    ));
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push('/signin');
      return;
    }
    if (!comment.trim()) {
      setSubmitError('Veuillez écrire un commentaire.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      const response = await ApiService.createReview({
        expertId: parseInt(expertId),
        rating: rating,
        comment: comment,
      });

      if (response.success) {
        // **MODIFICATION : Redirection vers le profil avec l'onglet avis**
        router.push(`/experts/${expertId}?tab=reviews`);
      } else {
        throw new Error(response.message || 'Une erreur est survenue.');
      }
    } catch (err: any) {
        setSubmitError(err.message || 'Impossible de soumettre votre avis.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <AppHeader />
        <div className="flex justify-center items-center py-32">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-gray-600">Chargement des avis...</span>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !expert) {
    return (
        <div className="min-h-screen bg-white">
          <AppHeader />
          <div className="text-center py-32">
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Erreur</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">{error}</p>
            <Link
              href="/experts"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Retour aux experts
            </Link>
          </div>
          <Footer />
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link
            href={`/experts/${expertId}`}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
          >
            <i className="ri-arrow-left-line mr-2"></i>
            Retour au profil de {expert.name}
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 rounded-2xl text-white mb-8 flex items-center gap-6">
            <div className="relative">
              <img
                src={expertImgCandidates[Math.min(expertImgIdx, expertImgCandidates.length - 1)]}
                alt={expert.name}
                onError={() => setExpertImgIdx(i => i + 1)}
                className="w-24 h-24 rounded-full border-4 border-white/20 object-cover"
              />
              <div
                className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center ${
                  expert.isOnline ? 'bg-green-500' : 'bg-gray-500'
                }`}
              >
                <i
                  className={`ri-${expert.isOnline ? 'check' : 'time'}-line text-white text-sm`}
                ></i>
              </div>
            </div>

            <div className="flex-1">
              <h1 className="text-3xl font-bold">{expert.name}</h1>
              <p className="text-blue-100 text-lg mb-2">{expert.specialty}</p>

              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center text-yellow-300">
                  <i className="ri-star-fill mr-1"></i>
                  <span>
                    {expert.rating} ({expert.reviews} avis)
                  </span>
                </div>
                <div className="flex items-center text-blue-100">
                  <i className="ri-time-line mr-1"></i>
                  <span>Répond en {expert.responseTime || '-'}</span>
                </div>
                <div className="flex items-center">
                  <i
                    className={`ri-circle-fill mr-1 ${
                      expert.isOnline ? 'text-green-400' : 'text-gray-400'
                    }`}
                  ></i>
                  <span>{expert.isOnline ? 'En ligne' : 'Hors ligne'}</span>
                </div>
              </div>
            </div>
          </div>
          <p className="text-gray-600 mb-6">
            Découvrez ce que les autres utilisateurs pensent de cet expert.
          </p>

          {/* Leave a Review Form */}
          <div className="mb-8 border-b pb-8">
            <h2 className="text-xl font-semibold mb-4">Laisser un avis</h2>
            <form onSubmit={handleSubmitReview}>
              <div className="flex items-center gap-2 mb-3">
                <span className="font-medium">Votre note :</span>
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setRating(val)}
                    className={`text-2xl transition-transform transform hover:scale-125 ${
                      val <= rating ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  >
                    <i className="ri-star-fill"></i>
                  </button>
                ))}
              </div>
              <textarea
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Partagez votre expérience avec cet expert..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              {submitError && <p className="text-red-600 text-sm mt-1">{submitError}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="mt-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                  {submitting ? 'Envoi...' : 'Soumettre'}
              </button>
            </form>
          </div>

          {/* Reviews List */}
          <div className="space-y-6">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <div key={review.id} className="border-b pb-6 last:border-b-0">
                  <div className="flex items-start">
                    {(() => {
                      const cand = buildReviewerCandidates(review.user);
                      const first = cand[0];
                      const fallback = cand[cand.length - 1];
                      return (
                        <img
                          src={first}
                          alt={review.user.firstName}
                          className="w-12 h-12 rounded-full mr-4"
                          data-cand={cand.join('|')}
                          data-idx={0}
                          onError={(ev)=>{
                            const t=ev.currentTarget as HTMLImageElement;
                            const c=(t.getAttribute('data-cand')||'').split('|').filter(Boolean);
                            let i=parseInt(t.getAttribute('data-idx')||'0',10)||0;
                            if (i < c.length - 1) { i+=1; t.setAttribute('data-idx', String(i)); t.src=c[i]; }
                            else { t.onerror=null; t.src=fallback; }
                          }}
                        />
                      );
                    })()}
                    <div>
                      <div className="flex items-center mb-1">
                        <p className="font-semibold">
                          {review.user.firstName} {review.user.lastName}
                        </p>
                        <div className="flex items-center ml-4">
                          {renderStars(review.rating)}
                        </div>
                      </div>
                      <p className="text-gray-700">{review.comment}</p>
                      <p className="text-sm text-gray-500 mt-2">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500">
                Aucun avis pour cet expert pour le moment.
              </p>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
