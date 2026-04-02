'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';

interface CoinPack {
  id: number;
  name: string;
  coins: number;
  priceTND: number;
  bonus: number;
  popular: boolean;
  active: boolean;
}

export default function CoinShopPage() {
  const router = useRouter();
  const [packs, setPacks] = useState<CoinPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<number | null>(null);
  const [userCoins, setUserCoins] = useState(0);

  useEffect(() => {
    loadCoinPacks();
    loadUserCoins();
  }, []);

  const loadCoinPacks = async () => {
    try {
      const response = await api.get('/payments/coin-packs');
      setPacks(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Erreur chargement packs:', error);
      setLoading(false);
    }
  };

  const loadUserCoins = async () => {
    try {
      const response = await api.get('/users/me');
      setUserCoins(response.data.data.coins || 0);
    } catch (error) {
      console.error('Erreur chargement coins:', error);
    }
  };

  const handlePurchase = async (packId: number) => {
    setPurchasing(packId);
    try {
      const response = await api.post('/payments/buy-coins', { coinPackId: packId });
      const { flouciPaymentUrl } = response.data.data;

      // Rediriger vers Flouci
      window.location.href = flouciPaymentUrl;
    } catch (error: any) {
      console.error('Erreur achat:', error);
      alert(error.response?.data?.message || 'Erreur lors de l\'achat');
      setPurchasing(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour
          </button>

          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-6 shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h1 className="text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
            Boutique de Coins
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Rechargez vos coins pour débloquer du contenu premium, des formations exclusives et bien plus encore
          </p>

          {/* Solde actuel */}
          <div className="mt-8 inline-flex items-center gap-3 bg-white dark:bg-gray-800 px-6 py-3 rounded-full shadow-lg">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-sm text-gray-500 dark:text-gray-400">Votre solde</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{userCoins} coins</p>
            </div>
          </div>
        </div>

        {/* Packs de coins */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {packs.map((pack) => (
            <div
              key={pack.id}
              className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                pack.popular ? 'ring-4 ring-purple-500' : ''
              }`}
            >
              {/* Badge populaire */}
              {pack.popular && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-bl-lg text-sm font-semibold">
                  ⭐ POPULAIRE
                </div>
              )}

              <div className="p-8">
                {/* Nom du pack */}
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {pack.name}
                </h3>

                {/* Coins */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-500">
                      {pack.coins}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">coins</span>
                  </div>
                  {pack.bonus > 0 && (
                    <div className="mt-2 inline-flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-sm font-medium">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      {pack.bonus} bonus
                    </div>
                  )}
                </div>

                {/* Prix */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                      {pack.priceTND.toFixed(3)}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">TND</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Total: {pack.coins + pack.bonus} coins
                  </p>
                </div>

                {/* Bouton achat */}
                <button
                  onClick={() => handlePurchase(pack.id)}
                  disabled={purchasing === pack.id}
                  className={`w-full py-3 rounded-lg font-semibold transition ${
                    pack.popular
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
                      : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {purchasing === pack.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Redirection...
                    </span>
                  ) : (
                    'Acheter maintenant'
                  )}
                </button>

                {/* Avantages */}
                <div className="mt-6 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Paiement sécurisé Flouci
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Crédit instantané
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Pas d'expiration
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Questions fréquentes
          </h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                À quoi servent les coins ?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Les coins vous permettent de débloquer des vidéos premium, des formations exclusives,
                et d'accéder à du contenu payant créé par nos experts.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Comment fonctionne le paiement ?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Nous utilisons Flouci, une plateforme de paiement tunisienne sécurisée. Vous serez
                redirigé vers Flouci pour finaliser votre achat en toute sécurité.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Les coins expirent-ils ?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Non, vos coins n'expirent jamais. Vous pouvez les utiliser quand vous voulez.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Puis-je obtenir un remboursement ?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Les achats de coins sont finaux et non remboursables. Assurez-vous de choisir
                le bon pack avant d'acheter.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
