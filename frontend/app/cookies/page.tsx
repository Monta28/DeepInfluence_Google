'use client';

import AppHeader from '@/components/AppHeader';
import Footer from '@/components/Footer';
import { useState } from 'react';

export default function CookiesPage() {
  const [preferences, setPreferences] = useState({
    essential: true,
    analytics: true,
    marketing: false,
    personalization: true,
  });

  const cookieTypes = [
    {
      name: 'Cookies essentiels',
      key: 'essential',
      description: 'Ces cookies sont nécessaires au fonctionnement du site. Ils permettent l\'authentification, la sécurité et les fonctionnalités de base.',
      required: true,
      examples: ['Session utilisateur', 'Panier d\'achat', 'Authentification', 'Sécurité CSRF'],
      duration: 'Session / 1 an',
    },
    {
      name: 'Cookies analytiques',
      key: 'analytics',
      description: 'Ces cookies nous aident à comprendre comment les visiteurs utilisent notre site pour améliorer l\'expérience utilisateur.',
      required: false,
      examples: ['Google Analytics', 'Suivi des pages visitées', 'Temps passé sur le site', 'Taux de rebond'],
      duration: '2 ans',
    },
    {
      name: 'Cookies marketing',
      key: 'marketing',
      description: 'Ces cookies sont utilisés pour afficher des publicités personnalisées et mesurer l\'efficacité de nos campagnes.',
      required: false,
      examples: ['Facebook Pixel', 'Google Ads', 'Retargeting', 'Conversion tracking'],
      duration: '1 an',
    },
    {
      name: 'Cookies de personnalisation',
      key: 'personalization',
      description: 'Ces cookies mémorisent vos préférences pour offrir une expérience personnalisée.',
      required: false,
      examples: ['Langue préférée', 'Thème (clair/sombre)', 'Paramètres d\'affichage', 'Favoris'],
      duration: '6 mois',
    },
  ];

  const handleToggle = (key: string) => {
    if (key !== 'essential') {
      setPreferences(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
    }
  };

  const acceptAll = () => {
    setPreferences({
      essential: true,
      analytics: true,
      marketing: true,
      personalization: true,
    });
    alert('Tous les cookies ont été acceptés');
  };

  const refuseOptional = () => {
    setPreferences({
      essential: true,
      analytics: false,
      marketing: false,
      personalization: false,
    });
    alert('Seuls les cookies essentiels sont activés');
  };

  const savePreferences = () => {
    // Save to localStorage
    localStorage.setItem('cookiePreferences', JSON.stringify(preferences));
    alert('Vos préférences ont été sauvegardées');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Politique de Cookies</h1>

        <div className="bg-white rounded-2xl shadow-sm p-8 mb-8 space-y-6">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Qu'est-ce qu'un cookie ?</h2>
            <div className="text-gray-700 space-y-3">
              <p>
                Un cookie est un petit fichier texte déposé sur votre ordinateur ou appareil mobile lors de votre visite sur notre site. Les cookies permettent de reconnaître votre navigateur et de mémoriser certaines informations.
              </p>
              <p>
                Nous utilisons des cookies pour améliorer votre expérience sur DeepInfluence, sécuriser votre compte et analyser l'utilisation de notre plateforme.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Types de cookies utilisés</h2>
            <div className="space-y-6">
              {cookieTypes.map((type, index) => (
                <div key={index} className="border border-gray-200 rounded-xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{type.name}</h3>
                      {type.required && (
                        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full mb-2">
                          Requis
                        </span>
                      )}
                      <p className="text-gray-600">{type.description}</p>
                    </div>
                    <button
                      onClick={() => handleToggle(type.key)}
                      disabled={type.required}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                        preferences[type.key as keyof typeof preferences]
                          ? 'bg-green-500'
                          : 'bg-gray-300'
                      } ${type.required ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                          preferences[type.key as keyof typeof preferences] ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="mt-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Exemples :</p>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                      {type.examples.map((example, idx) => (
                        <li key={idx}>{example}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 text-sm text-gray-500">
                    <strong>Durée de conservation :</strong> {type.duration}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="pt-6 border-t border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Gérer vos préférences</h2>
            <div className="text-gray-700 space-y-3 mb-6">
              <p>
                Vous pouvez à tout moment modifier vos préférences de cookies en utilisant les boutons ci-dessous ou depuis les paramètres de votre navigateur.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={acceptAll}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all font-semibold shadow-lg"
              >
                Tout accepter
              </button>
              <button
                onClick={savePreferences}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-semibold shadow-lg"
              >
                Enregistrer mes préférences
              </button>
              <button
                onClick={refuseOptional}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-semibold"
              >
                Refuser les cookies optionnels
              </button>
            </div>
          </section>

          <section className="pt-6 border-t border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Gérer via votre navigateur</h2>
            <div className="text-gray-700 space-y-3">
              <p>
                Vous pouvez également configurer votre navigateur pour refuser tous les cookies ou pour être informé lorsqu'un cookie est déposé :
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Chrome :</strong> Paramètres → Confidentialité et sécurité → Cookies</li>
                <li><strong>Firefox :</strong> Options → Vie privée et sécurité → Cookies</li>
                <li><strong>Safari :</strong> Préférences → Confidentialité → Cookies</li>
                <li><strong>Edge :</strong> Paramètres → Confidentialité → Cookies</li>
              </ul>
              <p className="mt-4">
                ⚠️ Attention : Bloquer tous les cookies peut affecter le fonctionnement de certaines fonctionnalités de notre site.
              </p>
            </div>
          </section>

          <section className="pt-6 border-t border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Cookies tiers</h2>
            <div className="text-gray-700 space-y-3">
              <p>
                Certains cookies sont déposés par des services tiers (Google Analytics, Facebook, etc.). Nous n'avons pas de contrôle sur ces cookies. Nous vous invitons à consulter les politiques de confidentialité de ces services :
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">Google Analytics</a></li>
                <li><a href="https://www.facebook.com/privacy/explanation" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">Facebook</a></li>
                <li><a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">Stripe</a></li>
              </ul>
            </div>
          </section>

          <section className="pt-6 border-t border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact</h2>
            <div className="text-gray-700">
              <p>
                Pour toute question concernant notre utilisation des cookies, contactez-nous à : <strong className="text-purple-600">dpo@deepinfluence.com</strong>
              </p>
            </div>
          </section>

          <div className="text-center text-gray-500 text-sm pt-8 border-t border-gray-200">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
