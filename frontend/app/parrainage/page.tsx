'use client';

import AppHeader from '@/components/AppHeader';
import Footer from '@/components/Footer';
import { useState } from 'react';

export default function ParrainagePage() {
  const [email, setEmail] = useState('');
  const [copied, setCopied] = useState(false);

  const referralCode = "DEEPINF2025";
  const referralLink = `https://deepinfluence.com/signup?ref=${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const rewards = [
    { amount: 100, description: "Pour chaque ami qui s'inscrit", icon: "ri-user-add-line" },
    { amount: 500, description: "Quand votre filleul effectue son premier achat", icon: "ri-shopping-cart-line" },
    { amount: 1000, description: "Bonus spécial après 5 parrainages réussis", icon: "ri-gift-line" },
  ];

  const steps = [
    { title: "Partagez votre lien", description: "Envoyez votre lien de parrainage à vos amis", icon: "ri-share-line" },
    { title: "Vos amis s'inscrivent", description: "Ils créent un compte via votre lien unique", icon: "ri-user-add-line" },
    { title: "Gagnez des coins", description: "Recevez vos récompenses automatiquement", icon: "ri-coins-line" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <AppHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Programme de
            <span className="block bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Parrainage
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Partagez DeepInfluence avec vos amis et gagnez des coins à chaque inscription réussie
          </p>
        </div>

        {/* Referral Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-12 border border-purple-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Votre lien de parrainage</h2>

          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <input
              type="text"
              value={referralLink}
              readOnly
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
            />
            <button
              onClick={handleCopy}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-semibold whitespace-nowrap"
            >
              <i className={`ri-${copied ? 'check' : 'file-copy'}-line mr-2`}></i>
              {copied ? 'Copié !' : 'Copier le lien'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
              <i className="ri-mail-line text-xl"></i>
              <span>Par email</span>
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-3 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors">
              <i className="ri-whatsapp-line text-xl"></i>
              <span>WhatsApp</span>
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors">
              <i className="ri-facebook-circle-line text-xl"></i>
              <span>Facebook</span>
            </button>
          </div>
        </div>

        {/* Rewards */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Vos récompenses</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {rewards.map((reward, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-6 text-center border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className={`${reward.icon} text-white text-3xl`}></i>
                </div>
                <h3 className="text-4xl font-bold text-purple-600 mb-2">{reward.amount} <span className="text-xl">coins</span></h3>
                <p className="text-gray-600">{reward.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Comment ça marche ?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
                    <i className={`${step.icon} text-white text-4xl`}></i>
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                    {index + 1}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl shadow-xl p-8 text-white text-center">
          <h2 className="text-3xl font-bold mb-6">Vos statistiques de parrainage</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="text-5xl font-bold mb-2">0</div>
              <div className="text-purple-100">Amis invités</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">0</div>
              <div className="text-purple-100">Inscriptions</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">0</div>
              <div className="text-purple-100">Coins gagnés</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">0%</div>
              <div className="text-purple-100">Taux de conversion</div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
