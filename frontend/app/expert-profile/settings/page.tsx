'use client';

import { useState } from 'react';
import AppHeader from '@/components/AppHeader';
import Link from 'next/link';

export default function ExpertSettingsPage() {
  const [activeTab, setActiveTab] = useState('notifications');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [expertNotifications, setExpertNotifications] = useState({
    newBookings: true,
    cancellations: true,
    payments: true,
    reviews: true,
    messages: true,
    earnings: true,
    marketing: false,
    systemUpdates: true
  });

  const [privacySettings, setPrivacySettings] = useState({
    onlineStatus: true,
    directBooking: true,
    showEarnings: false,
    showReviews: true,
    profileSearchable: true,
    showAvailability: true
  });

  const [availabilitySettings, setAvailabilitySettings] = useState({
    autoAccept: true,
    maxDailyBookings: 8,
    advanceBookingDays: 30,
    bufferTime: 15,
    emergencyBookings: false,
    weekendAvailable: false
  });

  const [pricingSettings, setPricingSettings] = useState({
    currency: 'EUR',
    autoPriceAdjustment: false,
    seasonalPricing: false,
    bulkDiscounts: true,
    cancellationFee: 50,
    lastMinuteBonus: 20
  });

  const [profileSettings, setProfileSettings] = useState({
    language: 'fr',
    timezone: 'Europe/Paris',
    communicationStyle: 'formal',
    autoResponseEnabled: true,
    vacationMode: false
  });

  const tabs = [
    { id: 'notifications', label: 'Notifications Expert', icon: 'ri-notification-3-line' },
    { id: 'privacy', label: 'Confidentialité', icon: 'ri-shield-user-line' },
    { id: 'availability', label: 'Disponibilités', icon: 'ri-calendar-line' },
    { id: 'pricing', label: 'Tarification', icon: 'ri-price-tag-line' },
    { id: 'profile', label: 'Profil Expert', icon: 'ri-user-star-line' },
    { id: 'danger', label: 'Zone Dangereuse', icon: 'ri-error-warning-line' }
  ];

  const handleNotificationChange = (key: string, value: boolean) => {
    setExpertNotifications(prev => ({ ...prev, [key]: value }));
  };

  const handlePrivacyChange = (key: string, value: boolean) => {
    setPrivacySettings(prev => ({ ...prev, [key]: value }));
  };

  const handleAvailabilityChange = (key: string, value: boolean | number) => {
    setAvailabilitySettings(prev => ({ ...prev, [key]: value }));
  };

  const handlePricingChange = (key: string, value: boolean | string | number) => {
    setPricingSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleProfileChange = (key: string, value: boolean | string) => {
    setProfileSettings(prev => ({ ...prev, [key]: value }));
  };

  const exportExpertData = () => {
    const data = {
      expert: 'Dr. Sarah Martin',
      specialty: 'Psychologue clinique',
      joinDate: '2023-03-15',
      totalSessions: 234,
      totalEarnings: 15680,
      rating: 4.9,
      students: 1847,
      formations: 12,
      videos: 45
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mes-donnees-expert-deepinfluence.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppHeader />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/expert-profile" className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
              <i className="ri-arrow-left-line text-gray-600 dark:text-gray-300"></i>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Paramètres Expert</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">Configuration avancée de votre profil expert</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="border-b border-gray-200 dark:border-gray-700 p-6">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap cursor-pointer flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <i className={`${tab.icon} text-lg`}></i>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notifications d'activité</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-medium text-gray-900 dark:text-white">Nouvelles réservations</label>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Être notifié des nouvelles demandes de consultation</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={expertNotifications.newBookings}
                          onChange={(e) => handleNotificationChange('newBookings', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-medium text-gray-900 dark:text-white">Annulations</label>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Notifications d'annulation de rendez-vous</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={expertNotifications.cancellations}
                          onChange={(e) => handleNotificationChange('cancellations', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-medium text-gray-900 dark:text-white">Paiements</label>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Confirmations de paiement et virements</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={expertNotifications.payments}
                          onChange={(e) => handleNotificationChange('payments', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-medium text-gray-900 dark:text-white">Avis clients</label>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Nouveaux avis et évaluations</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={expertNotifications.reviews}
                          onChange={(e) => handleNotificationChange('reviews', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-medium text-gray-900 dark:text-white">Messages</label>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Nouveaux messages de clients</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={expertNotifications.messages}
                          onChange={(e) => handleNotificationChange('messages', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notifications financières</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-medium text-gray-900 dark:text-white">Gains et revenus</label>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Récapitulatifs de gains et statistiques</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={expertNotifications.earnings}
                          onChange={(e) => handleNotificationChange('earnings', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-medium text-gray-900 dark:text-white">Marketing et promotions</label>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Opportunités de promotion et conseils marketing</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={expertNotifications.marketing}
                          onChange={(e) => handleNotificationChange('marketing', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-medium text-gray-900 dark:text-white">Mises à jour système</label>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Nouvelles fonctionnalités et améliorations</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={expertNotifications.systemUpdates}
                          onChange={(e) => handleNotificationChange('systemUpdates', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Visibilité du profil</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-medium text-gray-900 dark:text-white">Statut en ligne</label>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Afficher votre statut en ligne aux clients</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={privacySettings.onlineStatus}
                          onChange={(e) => handlePrivacyChange('onlineStatus', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-medium text-gray-900 dark:text-white">Réservation directe</label>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Permettre aux clients de réserver sans approbation</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={privacySettings.directBooking}
                          onChange={(e) => handlePrivacyChange('directBooking', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-medium text-gray-900 dark:text-white">Afficher les gains</label>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Rendre vos statistiques de gains publiques</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={privacySettings.showEarnings}
                          onChange={(e) => handlePrivacyChange('showEarnings', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-medium text-gray-900 dark:text-white">Afficher les avis</label>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Permettre l'affichage public des avis clients</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={privacySettings.showReviews}
                          onChange={(e) => handlePrivacyChange('showReviews', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-medium text-gray-900 dark:text-white">Profil recherchable</label>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Apparaître dans les résultats de recherche</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={privacySettings.profileSearchable}
                          onChange={(e) => handlePrivacyChange('profileSearchable', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-medium text-gray-900 dark:text-white">Afficher disponibilités</label>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Montrer vos créneaux disponibles en temps réel</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={privacySettings.showAvailability}
                          onChange={(e) => handlePrivacyChange('showAvailability', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'availability' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Gestion des réservations</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-medium text-gray-900 dark:text-white">Acceptation automatique</label>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Accepter automatiquement les nouvelles réservations</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={availabilitySettings.autoAccept}
                          onChange={(e) => handleAvailabilityChange('autoAccept', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Maximum de réservations par jour</label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={availabilitySettings.maxDailyBookings}
                        onChange={(e) => handleAvailabilityChange('maxDailyBookings', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Réservation à l'avance (jours)</label>
                      <input
                        type="number"
                        min="1"
                        max="90"
                        value={availabilitySettings.advanceBookingDays}
                        onChange={(e) => handleAvailabilityChange('advanceBookingDays', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Temps de pause entre sessions (minutes)</label>
                      <input
                        type="number"
                        min="0"
                        max="60"
                        value={availabilitySettings.bufferTime}
                        onChange={(e) => handleAvailabilityChange('bufferTime', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-medium text-gray-900 dark:text-white">Réservations d'urgence</label>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Permettre les réservations de dernière minute</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={availabilitySettings.emergencyBookings}
                          onChange={(e) => handleAvailabilityChange('emergencyBookings', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-medium text-gray-900 dark:text-white">Disponible le week-end</label>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Accepter les réservations samedi et dimanche</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={availabilitySettings.weekendAvailable}
                          onChange={(e) => handleAvailabilityChange('weekendAvailable', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'pricing' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Configuration des prix</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Devise par défaut</label>
                      <select
                        value={pricingSettings.currency}
                        onChange={(e) => handlePricingChange('currency', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8 bg-white dark:bg-gray-700 dark:text-white"
                      >
                        <option value="EUR">Euro (€)</option>
                        <option value="USD">Dollar US ($)</option>
                        <option value="GBP">Livre Sterling (£)</option>
                        <option value="CHF">Franc Suisse (CHF)</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-medium text-gray-900 dark:text-white">Ajustement automatique des prix</label>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Ajuster les prix selon la demande</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pricingSettings.autoPriceAdjustment}
                          onChange={(e) => handlePricingChange('autoPriceAdjustment', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-medium text-gray-900 dark:text-white">Tarifs saisonniers</label>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Appliquer des tarifs différents selon les saisons</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pricingSettings.seasonalPricing}
                          onChange={(e) => handlePricingChange('seasonalPricing', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-medium text-gray-900 dark:text-white">Remises groupées</label>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Offrir des réductions pour plusieurs sessions</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pricingSettings.bulkDiscounts}
                          onChange={(e) => handlePricingChange('bulkDiscounts', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Frais d'annulation (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={pricingSettings.cancellationFee}
                        onChange={(e) => handlePricingChange('cancellationFee', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Bonus dernière minute (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={pricingSettings.lastMinuteBonus}
                        onChange={(e) => handlePricingChange('lastMinuteBonus', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Configuration du profil</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Langue de communication</label>
                      <select
                        value={profileSettings.language}
                        onChange={(e) => handleProfileChange('language', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8 bg-white dark:bg-gray-700 dark:text-white"
                      >
                        <option value="fr">Français</option>
                        <option value="en">English</option>
                        <option value="es">Español</option>
                        <option value="de">Deutsch</option>
                        <option value="it">Italiano</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Fuseau horaire</label>
                      <select
                        value={profileSettings.timezone}
                        onChange={(e) => handleProfileChange('timezone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8 bg-white dark:bg-gray-700 dark:text-white"
                      >
                        <option value="Europe/Paris">Europe/Paris (CET)</option>
                        <option value="Europe/London">Europe/London (GMT)</option>
                        <option value="America/New_York">America/New_York (EST)</option>
                        <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                        <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Style de communication</label>
                      <select
                        value={profileSettings.communicationStyle}
                        onChange={(e) => handleProfileChange('communicationStyle', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8 bg-white dark:bg-gray-700 dark:text-white"
                      >
                        <option value="formal">Formel</option>
                        <option value="casual">Décontracté</option>
                        <option value="professional">Professionnel</option>
                        <option value="friendly">Amical</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-medium text-gray-900 dark:text-white">Réponse automatique activée</label>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Envoyer des messages automatiques de confirmation</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={profileSettings.autoResponseEnabled}
                          onChange={(e) => handleProfileChange('autoResponseEnabled', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-medium text-gray-900 dark:text-white">Mode vacances</label>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Suspendre temporairement les nouvelles réservations</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={profileSettings.vacationMode}
                          onChange={(e) => handleProfileChange('vacationMode', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'danger' && (
              <div className="space-y-6">
                <div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-6 border border-red-200 dark:border-red-700">
                  <h3 className="text-lg font-semibold text-red-900 dark:text-red-300 mb-4">Zone Dangereuse</h3>
                  <p className="text-red-700 dark:text-red-400 mb-6">Les actions suivantes sont irréversibles et affecteront votre activité d'expert.</p>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-700">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">Exporter mes données d'expert</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Télécharger toutes vos données d'activité expert</p>
                      </div>
                      <button
                        onClick={exportExpertData}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap cursor-pointer"
                      >
                        Exporter
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-700">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">Suspendre le profil expert</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Désactiver temporairement votre profil expert</p>
                      </div>
                      <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors whitespace-nowrap cursor-pointer">
                        Suspendre
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-700">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">Supprimer le profil expert</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Suppression définitive de votre profil et données d'expert</p>
                      </div>
                      <button
                        onClick={() => setShowDeleteModal(true)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap cursor-pointer"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center">
                <i className="ri-error-warning-line text-red-600 dark:text-red-400 text-xl"></i>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Supprimer le profil expert</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Cette action est irréversible</p>
              </div>
            </div>

            <p className="text-gray-700 dark:text-gray-200 mb-6">
              Êtes-vous sûr de vouloir supprimer définitivement votre profil expert ?
              Toutes vos données d'expert, formations, statistiques et revenus seront perdus.
            </p>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors whitespace-nowrap cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap cursor-pointer"
              >
                Supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}