
'use client';

import { useState } from 'react';
import AppHeader from '@/components/AppHeader';
import { useCurrency } from '@/contexts/CurrencyContext';

interface FormationDetailProps {
  formationId: string;
}

export default function FormationDetail({ formationId }: FormationDetailProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const { formatPrice } = useCurrency();

  const formation = {
    id: formationId,
    title: 'Marketing Digital Avancé',
    instructor: 'Marc Dubois',
    instructorImage: 'https://readdy.ai/api/search-image?query=Professional%20male%20marketing%20expert%20with%20confident%20smile%2C%20modern%20digital%20office%20background%2C%20business%20casual%20attire%2C%20high%20quality%20portrait&width=80&height=80&seq=expert-2&orientation=squarish',
    duration: '8 semaines',
    level: 'Intermédiaire',
    price: 299,
    originalPrice: 399,
    rating: 4.8,
    students: 1250,
    language: 'Français',
    certificate: true,
    image: 'https://readdy.ai/api/search-image?query=Modern%20digital%20marketing%20training%20session%20with%20laptop%2C%20charts%2C%20and%20social%20media%20icons%2C%20professional%20learning%20environment%2C%20bright%20colors&width=800&height=400&seq=formation-1&orientation=landscape',
    description: 'Maîtrisez les stratégies avancées du marketing digital avec cette formation complète. Apprenez à créer des campagnes performantes, analyser les données et optimiser votre ROI.',
    learningObjectives: [
      'Développer une stratégie marketing digital complète',
      'Maîtriser les outils d\'analyse et de mesure',
      'Optimiser les campagnes publicitaires',
      'Créer du contenu engageant pour les réseaux sociaux',
      'Automatiser les processus marketing'
    ],
    prerequisites: [
      'Connaissances de base en marketing',
      'Familiarité avec les réseaux sociaux',
      'Accès à un ordinateur avec internet'
    ],
    schedule: [
      { date: '2024-02-15', time: '19:00 - 21:00', topic: 'Introduction au marketing digital' },
      { date: '2024-02-22', time: '19:00 - 21:00', topic: 'Stratégies de contenu' },
      { date: '2024-03-01', time: '19:00 - 21:00', topic: 'Publicité en ligne' },
      { date: '2024-03-08', time: '19:00 - 21:00', topic: 'Analytics et mesure' },
      { date: '2024-03-15', time: '19:00 - 21:00', topic: 'Réseaux sociaux avancés' },
      { date: '2024-03-22', time: '19:00 - 21:00', topic: 'Email marketing' },
      { date: '2024-03-29', time: '19:00 - 21:00', topic: 'Automatisation' },
      { date: '2024-04-05', time: '19:00 - 21:00', topic: 'Projet final' }
    ]
  };

  const reviews = [
    {
      id: 1,
      user: 'Alice Martin',
      rating: 5,
      date: '2024-01-10',
      comment: 'Formation excellente ! Marc explique très clairement et les exemples sont concrets.',
      avatar: 'https://readdy.ai/api/search-image?query=Professional%20woman%20headshot%20with%20friendly%20smile%2C%20neutral%20background%2C%20modern%20portrait&width=60&height=60&seq=review-1&orientation=squarish'
    },
    {
      id: 2,
      user: 'Thomas Dubois',
      rating: 5,
      date: '2024-01-08',
      comment: 'J\'ai pu appliquer directement les techniques apprises dans mon entreprise. Très pratique !',
      avatar: 'https://readdy.ai/api/search-image?query=Professional%20man%20headshot%20with%20confident%20smile%2C%20neutral%20background%2C%20modern%20portrait&width=60&height=60&seq=review-2&orientation=squarish'
    },
    {
      id: 3,
      user: 'Sophie Lambert',
      rating: 4,
      date: '2024-01-05',
      comment: 'Contenu riche et bien structuré. Je recommande pour ceux qui veulent approfondir leurs connaissances.',
      avatar: 'https://readdy.ai/api/search-image?query=Professional%20woman%20headshot%20with%20warm%20smile%2C%20neutral%20background%2C%20modern%20portrait&width=60&height=60&seq=review-3&orientation=squarish'
    }
  ];

  const handleEnroll = () => {
    setShowEnrollModal(true);
  };

  const confirmEnrollment = () => {
    setShowEnrollModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
          <img
            src={formation.image}
            alt={formation.title}
            className="w-full h-64 object-cover object-top"
          />
          <div className="p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1 mb-6 lg:mb-0">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                    {formation.level}
                  </span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                    {formation.language}
                  </span>
                  {formation.certificate && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">
                      Certificat inclus
                    </span>
                  )}
                </div>
                
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{formation.title}</h1>
                <p className="text-gray-600 mb-4">{formation.description}</p>
                
                <div className="flex items-center space-x-6 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <i className="ri-time-line"></i>
                    <span>{formation.duration}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <i className="ri-group-line"></i>
                    <span>{formation.students} étudiants</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="flex items-center space-x-1 text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <i key={i} className={`ri-star-${i < Math.floor(formation.rating) ? 'fill' : 'line'}`}></i>
                      ))}
                    </div>
                    <span>{formation.rating}</span>
                  </div>
                </div>
              </div>
              
              <div className="lg:w-80">
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <img
                      src={formation.instructorImage}
                      alt={formation.instructor}
                      className="w-12 h-12 rounded-full object-cover object-top"
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900">{formation.instructor}</h3>
                      <p className="text-sm text-gray-600">Instructeur</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-gray-900">{formatPrice(formation.price)}</span>
                      {formation.originalPrice && (
                        <span className="text-lg text-gray-500 line-through">{formatPrice(formation.originalPrice)}</span>
                      )}
                    </div>
                    {formation.originalPrice && (
                      <p className="text-sm text-green-600">
                        Economisez {formatPrice(formation.originalPrice - formation.price)}
                      </p>
                    )}
                  </div>
                  
                  <button
                    onClick={handleEnroll}
                    className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-semibold whitespace-nowrap cursor-pointer"
                  >
                    S'inscrire maintenant
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex space-x-1 bg-white p-1 rounded-lg max-w-md">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Aperçu
            </button>
            <button
              onClick={() => setActiveTab('program')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'program'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Programme
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'reviews'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Avis
            </button>
          </div>
        </div>

        {activeTab === 'overview' && (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Ce que vous apprendrez
                </h3>
                <ul className="space-y-3">
                  {formation.learningObjectives.map((objective, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <i className="ri-check-line text-green-600 mt-1"></i>
                      <span className="text-gray-700">{objective}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Prérequis
                </h3>
                <ul className="space-y-3">
                  {formation.prerequisites.map((prerequisite, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <i className="ri-information-line text-blue-600 mt-1"></i>
                      <span className="text-gray-700">{prerequisite}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Détails de la formation
              </h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <i className="ri-time-line text-gray-600"></i>
                  <div>
                    <p className="font-medium text-gray-900">Durée</p>
                    <p className="text-sm text-gray-600">{formation.duration}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <i className="ri-bar-chart-line text-gray-600"></i>
                  <div>
                    <p className="font-medium text-gray-900">Niveau</p>
                    <p className="text-sm text-gray-600">{formation.level}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <i className="ri-global-line text-gray-600"></i>
                  <div>
                    <p className="font-medium text-gray-900">Langue</p>
                    <p className="text-sm text-gray-600">{formation.language}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <i className="ri-award-line text-gray-600"></i>
                  <div>
                    <p className="font-medium text-gray-900">Certificat</p>
                    <p className="text-sm text-gray-600">
                      {formation.certificate ? 'Inclus' : 'Non inclus'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'program' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Programme détaillé
            </h3>
            <div className="space-y-4">
              {formation.schedule.map((session, index) => (
                <div key={index} className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">{session.topic}</h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>
                        <i className="ri-calendar-line mr-1"></i>
                        {new Date(session.date).toLocaleDateString('fr-FR')}
                      </span>
                      <span>
                        <i className="ri-time-line mr-1"></i>
                        {session.time}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Avis des étudiants
              </h3>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1 text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <i key={i} className={`ri-star-${i < Math.floor(formation.rating) ? 'fill' : 'line'}`}></i>
                  ))}
                </div>
                <span className="font-semibold text-gray-900">{formation.rating}</span>
                <span className="text-gray-600">({reviews.length} avis)</span>
              </div>
            </div>
            
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                  <div className="flex items-start space-x-4">
                    <img
                      src={review.avatar}
                      alt={review.user}
                      className="w-12 h-12 rounded-full object-cover object-top"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-semibold text-gray-900">{review.user}</h4>
                        <div className="flex items-center space-x-1 text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <i key={i} className={`ri-star-${i < review.rating ? 'fill' : 'line'} text-sm`}></i>
                          ))}
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(review.date).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <p className="text-gray-700">{review.comment}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showEnrollModal && (
        <div className="fixed inset-0 bg-black bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirmer l'inscription
            </h3>
            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-700">Formation:</span>
                <span className="font-medium text-gray-900">{formation.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Instructeur:</span>
                <span className="font-medium text-gray-900">{formation.instructor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Prix:</span>
                <span className="font-medium text-gray-900">{formatPrice(formation.price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Début:</span>
                <span className="font-medium text-gray-900">
                  {new Date(formation.schedule[0].date).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowEnrollModal(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors whitespace-nowrap cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={confirmEnrollment}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap cursor-pointer"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
