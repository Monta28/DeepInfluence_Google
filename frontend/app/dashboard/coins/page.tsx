
'use client';

import { useEffect, useMemo, useState } from 'react';
import AppHeader from '@/components/AppHeader';
import ApiService from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

export default function CoinsPage() {
  const { user, updateUser } = useAuth();
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [userCoins, setUserCoins] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState('');
  const [showReferralModal, setShowReferralModal] = useState(false);
  const transactionHistory = useMemo(() => transactions.map((t: any) => ({
    ...t,
    date: t?.createdAt ? new Date(t.createdAt).toLocaleDateString() : t?.date,
  })), [transactions]);

  const coinPackages = [
    {
      id: 1,
      coins: 100,
      price: 50,
      bonus: 0,
      popular: false,
      millimes: 50000
    },
    {
      id: 2,
      coins: 250,
      price: 125,
      bonus: 25,
      popular: true,
      millimes: 125000
    },
    {
      id: 3,
      coins: 500,
      price: 250,
      bonus: 100,
      popular: false,
      millimes: 250000
    },
    {
      id: 4,
      coins: 1000,
      price: 500,
      bonus: 250,
      popular: false,
      millimes: 500000
    },
    {
      id: 5,
      coins: 2500,
      price: 1200,
      bonus: 800,
      popular: false,
      millimes: 1200000
    }
  ];

  useEffect(() => {
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
  }, []);

  const referralStats = useMemo(() => {
    const totalEarned = transactions
      .filter((t) => t.type === 'referral')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    return {
      totalEarned,
      activeReferrals: 0,
      userReferrals: 0,
      expertReferrals: 0,
      userCommission: 2.5,
      expertCommission: 5
    };
  }, [transactions]);

  const handlePurchase = (packageInfo: any) => {
    setSelectedPackage(packageInfo);
    setShowPurchaseModal(true);
  };

  const confirmPurchase = async () => {
    if (!selectedPackage) return;
    try {
      const res = await ApiService.purchaseCoins({
        coins: selectedPackage.coins,
        bonus: selectedPackage.bonus,
        priceMillimes: selectedPackage.millimes,
        packageId: selectedPackage.id
      });
      const newBalance = res.data?.balance ?? userCoins;
      setUserCoins(newBalance);
      // Update header balance immediately
      updateUser({ coins: newBalance });
      if (res.data?.transaction) setTransactions((prev) => [res.data.transaction, ...prev]);
      setShowPurchaseModal(false);
      setSelectedPackage(null);
    } catch (e: any) {
      alert(e?.message || "Erreur lors de l'achat");
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
      // Update header balance immediately
      updateUser({ coins: newBalance });
      if (res.data?.transaction) setTransactions((prev) => [res.data.transaction, ...prev]);
      setShowTransferModal(false);
      setTransferAmount(''); setCardNumber(''); setExpiryDate(''); setCvv(''); setCardName('');
    } catch (e: any) {
      alert(e?.message || 'Erreur lors du transfert');
    }
  };

  const generateReferralCode = () => {
    const code = Math.random().toString(36).substr(2, 8).toUpperCase();
    setReferralCode(code);
    setShowReferralModal(true);
  };

  const getTransferFee = (amount: string | number) => {
    const coinsAmount = typeof amount === 'string' ? parseInt(amount) : amount;
    if (coinsAmount <= 0 || isNaN(coinsAmount)) return 0;
    return Math.max(5, Math.floor(coinsAmount * 0.02)); // 2% avec minimum 5 coins
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Mes Coins
          </h1>
          <p className="text-gray-600">
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
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <i className="ri-money-dollar-circle-line text-green-600 text-2xl"></i>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{userCoins * 500}</h3>
                <p className="text-gray-600 text-sm">Millimes</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <i className="ri-gift-line text-orange-600 text-2xl"></i>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{referralStats.totalEarned}</h3>
                <p className="text-gray-600 text-sm">Gains parrainage</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <i className="ri-user-add-line text-purple-600 text-2xl"></i>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{referralStats.activeReferrals}</h3>
                <p className="text-gray-600 text-sm">Parrainages actifs</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coin Packages */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-sm border p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900">
                  Acheter des Coins
                </h2>
                <div className="text-sm text-gray-600">
                  1 coin = 500 millimes
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {coinPackages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className={`relative p-6 rounded-2xl border-2 transition-all duration-300 hover:shadow-lg cursor-pointer ${
                      pkg.popular 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 bg-white hover:border-blue-300'
                    }`}
                    onClick={() => handlePurchase(pkg)}
                  >
                    {pkg.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                          Populaire
                        </span>
                      </div>
                    )}
                    
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <i className="ri-coins-line text-white text-2xl"></i>
                      </div>
                      
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        {pkg.coins} Coins
                      </h3>
                      
                      {pkg.bonus > 0 && (
                        <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium mb-3">
                          +{pkg.bonus} Bonus
                        </div>
                      )}
                      
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        {pkg.price}€
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-4">
                        {pkg.millimes.toLocaleString()} millimes
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePurchase(pkg);
                        }}
                        className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl hover:bg-blue-700 transition-colors font-semibold whitespace-nowrap"
                      >
                        Acheter maintenant
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Transfer to Bank Card */}
            <div className="bg-white rounded-3xl shadow-sm border p-8 mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
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
                        1 coin = 500 millimes
                      </span>
                      <span className="bg-white/20 px-3 py-1 rounded-full">
                        Minimum: 10 coins
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Votre solde actuel</h4>
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {userCoins} coins
                  </div>
                  <div className="text-sm text-gray-600">
                    = {(userCoins * 500).toLocaleString()} millimes
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Frais de transfert</h4>
                  <div className="text-lg font-bold text-orange-600 mb-1">
                    2% (min. 5 coins)
                  </div>
                  <div className="text-sm text-gray-600">
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
            <div className="bg-white rounded-3xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Système de Parrainage
              </h3>
              
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-4 text-white">
                  <div className="flex items-center space-x-3 mb-3">
                    <i className="ri-user-add-line text-xl"></i>
                    <span className="font-semibold">Parrainez des utilisateurs</span>
                  </div>
                  <p className="text-sm text-purple-100 mb-3">
                    Gagnez {referralStats.userCommission}% sur leurs transactions
                  </p>
                  <div className="text-2xl font-bold">
                    {referralStats.userReferrals} actifs
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-xl p-4 text-white">
                  <div className="flex items-center space-x-3 mb-3">
                    <i className="ri-vip-crown-line text-xl"></i>
                    <span className="font-semibold">Parrainez des experts</span>
                  </div>
                  <p className="text-sm text-green-100 mb-3">
                    Gagnez {referralStats.expertCommission}% sur leurs transactions
                  </p>
                  <div className="text-2xl font-bold">
                    {referralStats.expertReferrals} actifs
                  </div>
                </div>
                
                <button
                  onClick={generateReferralCode}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-semibold whitespace-nowrap"
                >
                  Générer un code de parrainage
                </button>
              </div>
            </div>

            {/* Transaction History */}
            <div className="bg-white rounded-3xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Historique des Transactions
              </h3>
              
              <div className="space-y-3">
                {transactionHistory.slice(0, 5).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        transaction.type === 'purchase' ? 'bg-green-100 text-green-600' :
                        transaction.type === 'expense' ? 'bg-red-100 text-red-600' :
                        transaction.type === 'refund' ? 'bg-blue-100 text-blue-600' :
                        transaction.type === 'transfer' ? 'bg-purple-100 text-purple-600' :
                        'bg-purple-100 text-purple-600'
                      }`}>
                        <i className={`text-sm ${
                          transaction.type === 'purchase' ? 'ri-add-line' :
                          transaction.type === 'expense' ? 'ri-subtract-line' :
                          transaction.type === 'refund' ? 'ri-refund-line' :
                          transaction.type === 'transfer' ? 'ri-bank-card-line' :
                          'ri-gift-line'
                        }`}></i>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {transaction.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(transaction.date).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <div className={`font-semibold ${
                      transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.amount > 0 ? '+' : ''}{transaction.amount}c
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Modal */}
      {showPurchaseModal && selectedPackage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Confirmer l'achat
            </h3>
            
            <div className="bg-gray-50 rounded-2xl p-6 mb-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <i className="ri-coins-line text-white text-2xl"></i>
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">
                  {selectedPackage.coins} Coins
                </h4>
                {selectedPackage.bonus > 0 && (
                  <p className="text-green-600 font-medium mb-2">
                    +{selectedPackage.bonus} coins bonus
                  </p>
                )}
                <p className="text-3xl font-bold text-blue-600">
                  {selectedPackage.price}€
                </p>
              </div>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Coins de base:</span>
                <span className="font-medium">{selectedPackage.coins}</span>
              </div>
              {selectedPackage.bonus > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Bonus:</span>
                  <span className="font-medium text-green-600">+{selectedPackage.bonus}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Millimes:</span>
                <span className="font-medium">{selectedPackage.millimes.toLocaleString()}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between font-semibold">
                  <span>Total coins:</span>
                  <span>{selectedPackage.coins + selectedPackage.bonus}</span>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={() => setShowPurchaseModal(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-xl hover:bg-gray-300 transition-colors whitespace-nowrap"
              >
                Annuler
              </button>
              <button
                onClick={confirmPurchase}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-xl hover:bg-blue-700 transition-colors whitespace-nowrap"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Transfert vers Carte Bancaire
            </h3>
            
            <div className="bg-blue-50 rounded-2xl p-4 mb-6">
              <div className="flex items-center space-x-3 mb-3">
                <i className="ri-information-line text-blue-600 text-xl"></i>
                <h4 className="font-semibold text-blue-900">Information importante</h4>
              </div>
              <p className="text-blue-800 text-sm">
                Les transferts sont traités sous 2-3 jours ouvrables. Un minimum de 10 coins est requis.
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                    coins
                  </div>
                </div>
                {transferAmount && (
                  <div className="mt-2 text-sm text-gray-600">
                    = {(parseInt(transferAmount) * 500).toLocaleString()} millimes
                  </div>
                )}
              </div>

              {transferAmount && parseInt(transferAmount) >= 10 && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Récapitulatif</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Montant demandé:</span>
                      <span>{transferAmount} coins</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Frais de transfert:</span>
                      <span className="text-orange-600">-{getTransferFee(transferAmount)} coins</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-semibold">
                        <span>Vous recevrez:</span>
                        <span className="text-green-600">
                          {((parseInt(transferAmount) - getTransferFee(transferAmount)) * 500).toLocaleString()} millimes
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du titulaire de la carte
                </label>
                <input
                  type="text"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="Nom complet"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro de carte
                </label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date d'expiration
                  </label>
                  <input
                    type="text"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    placeholder="MM/AA"
                    maxLength={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CVV
                  </label>
                  <input
                    type="text"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    placeholder="123"
                    maxLength={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-xl hover:bg-gray-300 transition-colors whitespace-nowrap"
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
          <div className="bg-white rounded-3xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
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
              <div className="flex items-center space-x-3 text-sm">
                <i className="ri-user-line text-blue-600"></i>
                <span>Utilisateurs: {referralStats.userCommission}% de commission</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <i className="ri-vip-crown-line text-green-600"></i>
                <span>Experts: {referralStats.expertCommission}% de commission</span>
              </div>
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={() => setShowReferralModal(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-xl hover:bg-gray-300 transition-colors whitespace-nowrap"
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
    </div>
  );
}
