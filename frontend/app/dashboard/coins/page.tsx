
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import Footer from '@/components/Footer';
import api from '@/services/api';
import ApiService from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

interface CoinPack {
  id: number;
  name: string;
  coins: number;
  priceTND: number;
  bonus: number;
  popular: boolean;
  active: boolean;
}

export default function CoinsPage() {
  const { user, updateUser, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [packs, setPacks] = useState<CoinPack[]>([]);
  const [loadingPacks, setLoadingPacks] = useState(true);
  const [purchasing, setPurchasing] = useState<number | null>(null);
  const [userCoins, setUserCoins] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Rediriger si non connecté
  useEffect(() => {
    if (!authLoading && !user) {
      sessionStorage.setItem('returnUrl', '/dashboard/coins');
      router.push('/signin');
    }
  }, [authLoading, user, router]);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [referralStats, setReferralStats] = useState({
    totalReferrals: 0,
    activeReferrals: 0,
    totalEarnings: 0,
    userReferrals: 0,
    expertReferrals: 0,
    userEarnings: 0,
    expertEarnings: 0,
  });
  const [loadingReferral, setLoadingReferral] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);

  const transactionHistory = useMemo(() => transactions.map((t: any) => ({
    ...t,
    date: t?.createdAt ? new Date(t.createdAt).toLocaleDateString() : t?.date,
  })), [transactions]);

  // Charger les packs de coins depuis l'API (vrais packs de la BDD)
  useEffect(() => {
    const loadPacks = async () => {
      try {
        const response = await api.get('/payments/coin-packs');
        const data = response.data?.data || response.data || [];
        setPacks(Array.isArray(data) ? data : []);
      } catch (e: any) {
        console.error('Erreur chargement packs:', e);
      } finally {
        setLoadingPacks(false);
      }
    };
    loadPacks();
  }, []);

  // Charger le solde et l'historique des transactions (seulement si connecté)
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const [coinsRes, txRes] = await Promise.all([
          ApiService.getCoins(),
          ApiService.getTransactions({ limit: 50 })
        ]);
        if (!mounted) return;
        setUserCoins(coinsRes.data?.balance ?? 0);
        setTransactions(txRes.data || []);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || 'Erreur de chargement');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [user]);

  // Charger les stats de parrainage depuis l'API
  useEffect(() => {
    if (!user) return;
    let mounted = true;
    (async () => {
      try {
        setLoadingReferral(true);
        const res = await ApiService.getReferralStats();
        if (!mounted) return;
        const data = res.data || {};
        setReferralStats({
          totalReferrals: data.totalReferrals ?? 0,
          activeReferrals: data.activeReferrals ?? 0,
          totalEarnings: data.totalEarnings ?? 0,
          userReferrals: data.userReferrals ?? 0,
          expertReferrals: data.expertReferrals ?? 0,
          userEarnings: data.userEarnings ?? 0,
          expertEarnings: data.expertEarnings ?? 0,
        });
      } catch (e: any) {
        console.error('Erreur chargement stats parrainage:', e);
      } finally {
        if (mounted) setLoadingReferral(false);
      }
    })();
    return () => { mounted = false; };
  }, [user]);

  // Acheter un pack via Flouci (paiement réel)
  const handlePurchase = async (packId: number) => {
    setPurchasing(packId);
    try {
      const response = await api.post('/payments/buy-coins', { coinPackId: packId });
      const data = response.data?.data || response.data;
      const { flouciPaymentUrl } = data;

      if (flouciPaymentUrl) {
        // Rediriger vers Flouci pour le paiement réel
        window.location.href = flouciPaymentUrl;
      } else {
        alert('Erreur lors de la génération du lien de paiement');
        setPurchasing(null);
      }
    } catch (e: any) {
      console.error('Erreur achat:', e);
      alert(e.response?.data?.message || e?.message || 'Erreur lors de l\'achat');
      setPurchasing(null);
    }
  };

  const handleTransfer = () => {
    setShowTransferModal(true);
  };

  const confirmTransfer = async () => {
    const coinsToTransfer = parseInt(transferAmount);
    if (!coinsToTransfer || coinsToTransfer < 10) return;
    if (coinsToTransfer > userCoins) { alert('Solde insuffisant'); return; }
    try {
      const res = await ApiService.transferCoins({ coins: coinsToTransfer, cardNumber, expiryDate, cvv, cardName });
      const newBalance = res.data?.balance ?? (userCoins - coinsToTransfer);
      setUserCoins(newBalance);
      updateUser({ coins: newBalance });
      if (res.data?.transaction) setTransactions((prev) => [res.data.transaction, ...prev]);
      setShowTransferModal(false);
      setTransferAmount(''); setCardNumber(''); setExpiryDate(''); setCvv(''); setCardName('');
    } catch (e: any) {
      alert(e?.message || 'Erreur lors du transfert');
    }
  };

  const generateReferralCode = async () => {
    setGeneratingCode(true);
    try {
      const res = await ApiService.generateReferralCode();
      const code = res.data?.referralCode || '';
      setReferralCode(code);
      setShowReferralModal(true);
    } catch (e: any) {
      console.error('Erreur génération code parrainage:', e);
      alert(e?.message || 'Erreur lors de la génération du code de parrainage');
    } finally {
      setGeneratingCode(false);
    }
  };

  const getTransferFee = (amount: string | number) => {
    const coinsAmount = typeof amount === 'string' ? parseInt(amount) : amount;
    if (coinsAmount <= 0 || isNaN(coinsAmount)) return 0;
    return Math.max(5, Math.floor(coinsAmount * 0.02));
  };

  // Ne pas afficher la page si auth en cours ou non connecté
  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <AppHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-4">Chargement...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-3 text-red-700">
            {error}
          </div>
        )}
        {loading && (
          <div className="mb-6 rounded-md border border-blue-200 bg-blue-50 p-3 text-blue-700">
            Chargement des données...
          </div>
        )}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Mes Coins
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gérez vos coins et effectuez vos achats
          </p>
        </div>

        {/* Current Balance */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <i className="ri-coins-line text-2xl"></i>
              </div>
              <div>
                <h3 className="text-3xl font-bold">{userCoins}</h3>
                <p className="text-blue-100">Coins disponibles</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                <i className="ri-money-dollar-circle-line text-green-600 text-2xl"></i>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{(userCoins * 0.5).toFixed(3)}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Valeur TND</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                <i className="ri-gift-line text-orange-600 text-2xl"></i>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{referralStats.totalEarnings}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Gains parrainage</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                <i className="ri-user-add-line text-purple-600 text-2xl"></i>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{referralStats.activeReferrals}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Parrainages actifs</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coin Packages - Real Flouci */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Acheter des Coins
                </h2>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <i className="ri-shield-check-line text-green-500"></i>
                  Paiement sécurisé via Flouci
                </div>
              </div>

              {loadingPacks ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-500 dark:text-gray-400">Chargement des offres...</p>
                </div>
              ) : packs.length === 0 ? (
                <div className="text-center py-12">
                  <i className="ri-coin-line text-4xl text-gray-400 mb-4"></i>
                  <p className="text-gray-500 dark:text-gray-400">Aucun pack disponible pour le moment</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {packs.map((pkg) => (
                    <div
                      key={pkg.id}
                      className={`relative p-6 rounded-2xl border-2 transition-all duration-300 hover:shadow-lg cursor-pointer ${
                        pkg.popular
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-purple-300'
                      }`}
                      onClick={() => !purchasing && handlePurchase(pkg.id)}
                    >
                      {pkg.popular && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                            Populaire
                          </span>
                        </div>
                      )}

                      <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <i className="ri-coins-line text-white text-2xl"></i>
                        </div>

                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                          {pkg.name}
                        </h3>

                        <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600 mb-2">
                          {pkg.coins} Coins
                        </div>

                        {pkg.bonus > 0 && (
                          <div className="inline-block bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 px-3 py-1 rounded-full text-sm font-medium mb-3">
                            +{pkg.bonus} Bonus gratuit
                          </div>
                        )}

                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                          {Number(pkg.priceTND || 0).toFixed(3)} TND
                        </div>

                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                          Total: {Number(pkg.coins || 0) + Number(pkg.bonus || 0)} coins
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePurchase(pkg.id);
                          }}
                          disabled={purchasing === pkg.id}
                          className={`w-full py-3 px-6 rounded-xl font-semibold transition-all whitespace-nowrap ${
                            pkg.popular
                              ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
                              : 'bg-purple-600 text-white hover:bg-purple-700'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {purchasing === pkg.id ? (
                            <span className="flex items-center justify-center gap-2">
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Redirection vers Flouci...
                            </span>
                          ) : (
                            <span className="flex items-center justify-center gap-2">
                              <i className="ri-bank-card-line"></i>
                              Acheter via Flouci
                            </span>
                          )}
                        </button>

                        {/* Avantages */}
                        <div className="mt-4 space-y-1 text-left">
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <i className="ri-check-line text-green-500"></i>
                            Paiement sécurisé
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <i className="ri-check-line text-green-500"></i>
                            Crédit instantané
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <i className="ri-check-line text-green-500"></i>
                            Pas d'expiration
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Transfer to Bank Card */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 mt-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Transfert vers Carte Bancaire
              </h2>

              <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-2xl p-6 text-white mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                    <i className="ri-bank-card-line text-2xl"></i>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Convertissez vos coins</h3>
                    <p className="text-green-100 mb-3">
                      Transférez votre solde directement vers votre carte bancaire
                    </p>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="bg-white/20 px-3 py-1 rounded-full">
                        Minimum: 10 coins
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Votre solde actuel</h4>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                    {userCoins} coins
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Frais de transfert</h4>
                  <div className="text-lg font-bold text-orange-600 dark:text-orange-400 mb-1">
                    2% (min. 5 coins)
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Traitement sous 2-3 jours ouvrables
                  </div>
                </div>
              </div>

              <button
                onClick={handleTransfer}
                disabled={userCoins < 10}
                className="w-full bg-green-600 text-white py-3 px-6 rounded-xl hover:bg-green-700 transition-colors font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed whitespace-nowrap"
              >
                Effectuer un transfert
              </button>
            </div>
          </div>

          {/* Referral System */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Système de Parrainage
              </h3>

              {loadingReferral ? (
                <div className="text-center py-6">
                  <div className="w-6 h-6 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Chargement...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Commission rates info */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <i className="ri-information-line text-blue-600 text-lg"></i>
                      <span className="font-semibold text-blue-900 dark:text-blue-300 text-sm">Commissions</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start space-x-2 text-gray-700 dark:text-gray-300">
                        <i className="ri-user-line text-purple-500 mt-0.5"></i>
                        <span>5% pour chaque achat de vos filleuls utilisateurs</span>
                      </div>
                      <div className="flex items-start space-x-2 text-gray-700 dark:text-gray-300">
                        <i className="ri-vip-crown-line text-green-500 mt-0.5"></i>
                        <span>2.5% pour les transactions de vos filleuls experts</span>
                      </div>
                      <div className="flex items-start space-x-2 text-gray-700 dark:text-gray-300">
                        <i className="ri-time-line text-orange-500 mt-0.5"></i>
                        <span>Valable pendant 6 mois</span>
                      </div>
                    </div>
                  </div>

                  {/* Referral code display */}
                  {referralCode && (
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-4 text-white">
                      <p className="text-sm text-blue-100 mb-2">Votre code de parrainage</p>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold tracking-wider">{referralCode}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(referralCode);
                          }}
                          className="bg-white/20 hover:bg-white/30 transition-colors rounded-lg px-3 py-2 text-sm font-medium flex items-center gap-1"
                        >
                          <i className="ri-file-copy-line"></i>
                          Copier
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Parrainages utilisateurs */}
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-4 text-white">
                    <div className="flex items-center space-x-3 mb-3">
                      <i className="ri-user-add-line text-xl"></i>
                      <span className="font-semibold">Parrainages utilisateurs</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold">{referralStats.userReferrals}</div>
                        <p className="text-sm text-purple-100">filleuls</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{referralStats.userEarnings}</div>
                        <p className="text-sm text-purple-100">coins gagnés</p>
                      </div>
                    </div>
                  </div>

                  {/* Parrainages experts */}
                  <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-xl p-4 text-white">
                    <div className="flex items-center space-x-3 mb-3">
                      <i className="ri-vip-crown-line text-xl"></i>
                      <span className="font-semibold">Parrainages experts</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold">{referralStats.expertReferrals}</div>
                        <p className="text-sm text-green-100">filleuls</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{referralStats.expertEarnings}</div>
                        <p className="text-sm text-green-100">coins gagnés</p>
                      </div>
                    </div>
                  </div>

                  {/* Total earnings summary */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Total parrainages actifs</div>
                      <div className="font-bold text-gray-900 dark:text-white">{referralStats.activeReferrals}</div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Total gains</div>
                      <div className="font-bold text-green-600 dark:text-green-400">{referralStats.totalEarnings} coins</div>
                    </div>
                  </div>

                  <button
                    onClick={generateReferralCode}
                    disabled={generatingCode}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-semibold whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {generatingCode ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Génération en cours...
                      </span>
                    ) : referralCode ? (
                      'Régénérer un code de parrainage'
                    ) : (
                      'Générer un code de parrainage'
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Transaction History */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Historique des Transactions
              </h3>

              <div className="space-y-3">
                {transactionHistory.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">Aucune transaction</p>
                ) : transactionHistory.slice(0, 5).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        transaction.type === 'purchase' || transaction.type === 'coin_purchase_flouci' ? 'bg-green-100 text-green-600' :
                        transaction.type === 'expense' || transaction.type === 'spend' ? 'bg-red-100 text-red-600' :
                        transaction.type === 'refund' ? 'bg-blue-100 text-blue-600' :
                        transaction.type === 'transfer' ? 'bg-purple-100 text-purple-600' :
                        'bg-purple-100 text-purple-600'
                      }`}>
                        <i className={`text-sm ${
                          transaction.type === 'purchase' || transaction.type === 'coin_purchase_flouci' ? 'ri-add-line' :
                          transaction.type === 'expense' || transaction.type === 'spend' ? 'ri-subtract-line' :
                          transaction.type === 'refund' ? 'ri-refund-line' :
                          transaction.type === 'transfer' ? 'ri-bank-card-line' :
                          'ri-gift-line'
                        }`}></i>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {transaction.description}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(transaction.date).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <div className={`font-semibold ${
                      (transaction.coins || transaction.amount || 0) > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {(transaction.coins || transaction.amount || 0) > 0 ? '+' : ''}{transaction.coins || transaction.amount}c
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              Transfert vers Carte Bancaire
            </h3>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 mb-6">
              <div className="flex items-center space-x-3 mb-3">
                <i className="ri-information-line text-blue-600 text-xl"></i>
                <h4 className="font-semibold text-blue-900 dark:text-blue-300">Information importante</h4>
              </div>
              <p className="text-blue-800 dark:text-blue-300 text-sm">
                Les transferts sont traités sous 2-3 jours ouvrables. Un minimum de 10 coins est requis.
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Montant à transférer (coins)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    placeholder="Minimum 10 coins"
                    min="10"
                    max={userCoins}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                    coins
                  </div>
                </div>
              </div>

              {transferAmount && parseInt(transferAmount) >= 10 && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Récapitulatif</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Montant demandé:</span>
                      <span className="text-gray-900 dark:text-white">{transferAmount} coins</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Frais de transfert:</span>
                      <span className="text-orange-600">-{getTransferFee(transferAmount)} coins</span>
                    </div>
                    <div className="border-t dark:border-gray-600 pt-2">
                      <div className="flex justify-between font-semibold">
                        <span className="text-gray-900 dark:text-white">Vous recevrez:</span>
                        <span className="text-green-600">
                          {((parseInt(transferAmount) - getTransferFee(transferAmount)) * 0.5).toFixed(3)} TND
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nom du titulaire de la carte
                </label>
                <input
                  type="text"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="Nom complet"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Numéro de carte
                </label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date d'expiration
                  </label>
                  <input
                    type="text"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    placeholder="MM/AA"
                    maxLength={5}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    CVV
                  </label>
                  <input
                    type="text"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    placeholder="123"
                    maxLength={3}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setShowTransferModal(false);
                  setTransferAmount('');
                  setCardNumber('');
                  setExpiryDate('');
                  setCvv('');
                  setCardName('');
                }}
                className="flex-1 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white py-3 px-6 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors whitespace-nowrap"
              >
                Annuler
              </button>
              <button
                onClick={confirmTransfer}
                disabled={!transferAmount || parseInt(transferAmount) < 10 || parseInt(transferAmount) > userCoins || !cardName || !cardNumber || !expiryDate || !cvv}
                className="flex-1 bg-green-600 text-white py-3 px-6 rounded-xl hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed whitespace-nowrap"
              >
                Confirmer le transfert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Referral Code Modal */}
      {showReferralModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              Code de Parrainage
            </h3>

            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white text-center mb-6">
              <div className="text-3xl font-bold mb-2">
                {referralCode}
              </div>
              <p className="text-blue-100">
                Partagez ce code avec vos amis
              </p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
                <i className="ri-user-line text-blue-600"></i>
                <span>5% pour chaque achat de vos filleuls utilisateurs</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
                <i className="ri-vip-crown-line text-green-600"></i>
                <span>2.5% pour les transactions de vos filleuls experts</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
                <i className="ri-time-line text-orange-600"></i>
                <span>Valable pendant 6 mois</span>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setShowReferralModal(false)}
                className="flex-1 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white py-3 px-6 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors whitespace-nowrap"
              >
                Fermer
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(referralCode);
                  setShowReferralModal(false);
                }}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-xl hover:bg-blue-700 transition-colors whitespace-nowrap"
              >
                Copier le code
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
