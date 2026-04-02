'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/services/api';

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [verifying, setVerifying] = useState(true);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const paymentId = searchParams.get('payment_id');
    if (paymentId) {
      verifyPayment(paymentId);
    } else {
      setError(true);
      setVerifying(false);
    }
  }, [searchParams]);

  const verifyPayment = async (paymentId: string) => {
    try {
      // Attendre 2 secondes pour laisser le temps au webhook de traiter
      await new Promise(resolve => setTimeout(resolve, 2000));

      const response = await api.get(`/payments/${paymentId}/verify`);
      const data = response.data?.data || response.data;

      if (data.status === 'COMPLETED') {
        setPaymentData(data);
        setVerifying(false);
      } else if (data.status === 'PENDING') {
        // Réessayer après 3 secondes
        setTimeout(() => verifyPayment(paymentId), 3000);
      } else {
        setError(true);
        setVerifying(false);
      }
    } catch (err) {
      console.error('Erreur vérification:', err);
      setError(true);
      setVerifying(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white dark:bg-gray-800 rounded-full shadow-xl mb-6">
            <svg className="animate-spin h-12 w-12 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Vérification du paiement...
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Veuillez patienter quelques instants
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Erreur de vérification
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Nous n'avons pas pu vérifier votre paiement. Veuillez contacter le support si le problème persiste.
          </p>

          <button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-3 rounded-lg font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition"
          >
            Retour au tableau de bord
          </button>
        </div>
      </div>
    );
  }

  const isCoursePayment = paymentData?.type === 'COURSE_PURCHASE';
  const isVideoPayment = paymentData?.type === 'VIDEO_PURCHASE';

  const getSubtitle = () => {
    if (isCoursePayment) return 'Votre inscription au cours est confirmée';
    if (isVideoPayment) return 'La vidéo a été débloquée';
    return 'Vos coins ont été crédités';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Header avec animation */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-4 animate-bounce">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Paiement réussi !
            </h1>
            <p className="text-green-100">{getSubtitle()}</p>
          </div>

          {/* Confetti animation */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-white rounded-full animate-ping"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${1 + Math.random()}s`
                }}
              />
            ))}
          </div>
        </div>

        {/* Contenu */}
        <div className="p-8">
          {isCoursePayment ? (
            /* Inscription cours réussie */
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Inscrit au cours</p>
                  <p className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
                    {paymentData?.courseTitle || 'Cours'}
                  </p>
                </div>
              </div>
            </div>
          ) : isVideoPayment ? (
            /* Vidéo débloquée */
            <div className="bg-gradient-to-br from-pink-50 to-red-50 dark:from-pink-900/20 dark:to-red-900/20 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-red-500 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Vidéo débloquée</p>
                  <p className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-red-600">
                    {paymentData?.videoTitle || 'Vidéo'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Coins reçus */
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Vous avez reçu</p>
                  <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600">
                    +{paymentData?.coins} coins
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {isCoursePayment ? (
              <>
                <button
                  onClick={() => router.push(`/courses/${paymentData?.courseId}/learn`)}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition"
                >
                  Commencer le cours
                </button>
                <button
                  onClick={() => router.push('/dashboard/my-courses')}
                  className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white py-3 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                >
                  Mes cours
                </button>
              </>
            ) : isVideoPayment ? (
              <>
                <button
                  onClick={() => router.push(`/videos/${paymentData?.videoId}`)}
                  className="w-full bg-gradient-to-r from-pink-600 to-red-600 text-white py-3 rounded-lg font-semibold hover:from-pink-700 hover:to-red-700 transition"
                >
                  Regarder la vidéo
                </button>
                <button
                  onClick={() => router.push('/videos')}
                  className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white py-3 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                >
                  Découvrir d'autres vidéos
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition"
                >
                  Retour au tableau de bord
                </button>
                <button
                  onClick={() => router.push('/courses')}
                  className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white py-3 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                >
                  Découvrir des cours
                </button>
              </>
            )}
          </div>

          {/* Message */}
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            {isCoursePayment
              ? 'Vous pouvez maintenant accéder à tout le contenu du cours'
              : isVideoPayment
              ? 'Vous pouvez maintenant regarder cette vidéo autant que vous voulez'
              : 'Vous pouvez maintenant utiliser vos coins pour débloquer du contenu premium'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
