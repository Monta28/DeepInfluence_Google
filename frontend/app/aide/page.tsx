'use client';

import AppHeader from '@/components/AppHeader';
import Footer from '@/components/Footer';
import { useState } from 'react';
import Link from 'next/link';

export default function AidePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'Tous', icon: 'ri-apps-line' },
    { id: 'account', name: 'Compte', icon: 'ri-user-line' },
    { id: 'payment', name: 'Paiement', icon: 'ri-money-dollar-circle-line' },
    { id: 'booking', name: 'Réservations', icon: 'ri-calendar-line' },
    { id: 'technical', name: 'Technique', icon: 'ri-settings-line' },
  ];

  const helpArticles = [
    {
      id: 1,
      category: 'account',
      title: 'Comment créer un compte ?',
      description: 'Guide pas à pas pour créer votre compte DeepInfluence',
      icon: 'ri-user-add-line',
    },
    {
      id: 2,
      category: 'account',
      title: 'Réinitialiser mon mot de passe',
      description: 'Procédure de récupération de mot de passe',
      icon: 'ri-lock-password-line',
    },
    {
      id: 3,
      category: 'payment',
      title: 'Comment acheter des coins ?',
      description: 'Guide d\'achat de la monnaie virtuelle',
      icon: 'ri-coins-line',
    },
    {
      id: 4,
      category: 'payment',
      title: 'Méthodes de paiement acceptées',
      description: 'Liste des moyens de paiement disponibles',
      icon: 'ri-bank-card-line',
    },
    {
      id: 5,
      category: 'booking',
      title: 'Réserver une consultation',
      description: 'Comment prendre rendez-vous avec un expert',
      icon: 'ri-calendar-check-line',
    },
    {
      id: 6,
      category: 'booking',
      title: 'Annuler ou modifier un rendez-vous',
      description: 'Politique d\'annulation et de modification',
      icon: 'ri-calendar-close-line',
    },
    {
      id: 7,
      category: 'technical',
      title: 'Problèmes de connexion',
      description: 'Résoudre les problèmes de connexion vidéo',
      icon: 'ri-video-line',
    },
    {
      id: 8,
      category: 'technical',
      title: 'Navigateurs compatibles',
      description: 'Liste des navigateurs pris en charge',
      icon: 'ri-global-line',
    },
  ];

  const filteredArticles = helpArticles.filter(article => {
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const contactMethods = [
    {
      title: 'Chat en direct',
      description: 'Disponible 24/7',
      icon: 'ri-message-3-line',
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Email',
      description: 'support@deepinfluence.com',
      icon: 'ri-mail-line',
      color: 'from-purple-500 to-purple-600',
    },
    {
      title: 'Téléphone',
      description: '+33 1 23 45 67 89',
      icon: 'ri-phone-line',
      color: 'from-green-500 to-green-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-600 py-20 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h1 className="text-5xl md:text-6xl font-bold mb-6">Centre d'Aide</h1>
              <p className="text-xl text-purple-100 mb-8">Comment pouvons-nous vous aider aujourd'hui ?</p>

              <div className="max-w-2xl mx-auto">
                <div className="relative">
                  <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl"></i>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher dans l'aide..."
                    className="w-full pl-12 pr-4 py-4 rounded-full text-gray-900 shadow-lg focus:ring-4 focus:ring-white/20 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Categories */}
          <div className="flex flex-wrap gap-4 justify-center mb-12">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${
                  selectedCategory === category.id
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <i className={`${category.icon} text-xl`}></i>
                <span>{category.name}</span>
              </button>
            ))}
          </div>

          {/* Articles */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {filteredArticles.map((article) => (
              <Link
                key={article.id}
                href={`/aide/${article.id}`}
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-shadow border border-gray-100"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <i className={`${article.icon} text-purple-600 text-2xl`}></i>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{article.title}</h3>
                <p className="text-sm text-gray-600">{article.description}</p>
              </Link>
            ))}
          </div>

          {/* Contact Methods */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Besoin d'aide supplémentaire ?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {contactMethods.map((method, index) => (
                <div key={index} className="text-center">
                  <div className={`w-16 h-16 bg-gradient-to-br ${method.color} rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                    <i className={`${method.icon} text-white text-3xl`}></i>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{method.title}</h3>
                  <p className="text-gray-600">{method.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ Link */}
          <div className="text-center">
            <p className="text-gray-600 mb-4">Vous ne trouvez pas votre réponse ?</p>
            <Link
              href="/faq"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg"
            >
              <i className="ri-question-line"></i>
              Consultez notre FAQ
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
