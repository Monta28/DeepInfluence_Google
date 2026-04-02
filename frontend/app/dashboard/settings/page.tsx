'use client';

import { useState } from 'react';
import AppHeader from '@/components/AppHeader';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('notifications');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [notificationSettings, setNotificationSettings] = useState({
    messages: true,
    appointments: true,
    formations: true,
    marketing: false,
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false
  });

  const [privacySettings, setPrivacySettings] = useState({
    profileVisible: true,
    onlineStatus: true,
    activityHistory: true,
    searchable: true,
    showEmail: false,
    showPhone: false
  });

  const [preferenceSettings, setPreferenceSettings] = useState({
    autoplayVideos: true,
    videoQuality: 'auto',
    showHistory: true,
    saveProgress: true,
    darkMode: false,
    compactMode: false
  });

  const [accountSettings, setAccountSettings] = useState({
    language: 'fr',
    timezone: 'Europe/Paris',
    currency: 'EUR',
    twoFactorAuth: false,
    expertMode: false
  });

  const tabs = [
    { id: 'notifications', label: 'Notifications', icon: 'ri-notification-3-line' },
    { id: 'privacy', label: 'Confidentialité', icon: 'ri-shield-user-line' },
    { id: 'preferences', label: 'Préférences', icon: 'ri-settings-3-line' },
    { id: 'account', label: 'Compte', icon: 'ri-user-settings-line' },
    { id: 'expert', label: 'Mode Expert', icon: 'ri-vip-crown-line' },
    { id: 'danger', label: 'Zone Dangereuse', icon: 'ri-error-warning-line' }
  ];

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotificationSettings(prev => ({ ...prev, [key]: value }));
  };

  const handlePrivacyChange = (key: string, value: boolean) => {
    setPrivacySettings(prev => ({ ...prev, [key]: value }));
  };

  const handlePreferenceChange = (key: string, value: boolean | string) => {
    setPreferenceSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleAccountChange = (key: string, value: boolean | string) => {
    setAccountSettings(prev => ({ ...prev, [key]: value }));
  };

  const exportData = () => {
    const data = {
      profile: 'Marie Dupont',
      joinDate: '2024-01-15',
      sessions: 24,
      formations: 8,
      messages: 156
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mes-donnees-deepinfluence.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppHeader />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Paramètres</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Gérez vos préférences et la configuration de votre compte</p>
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
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notifications par type</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-medium text-gray-900 dark:text-white">Messages</label>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Recevoir des notifications pour les nouveaux messages</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.messages}
                          onChange={(e) => handleNotificationChange('messages', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-medium text-gray-900 dark:text-white">Rendez-vous</label>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Rappels et notifications de rendez-vous</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.appointments}
                          onChange={(e) => handleNotificationChange('appointments', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-medium text-gray-900 dark:text-white">Formations</label>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Nouvelles formations et mises à jour</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.formations}
                          onChange={(e) => handleNotificationChange('formations', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-medium text-gray-900 dark:text-white">Marketing</label>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Offres spéciales et promotions</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.marketing}
                          onChange={(e) => handleNotificationChange('marketing', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Canaux de notification</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-medium text-gray-900 dark:text-white">Email</label>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Notifications par email</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.emailNotifications}
                          onChange={(e) => handleNotificationChange('emailNotifications', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-medium text-gray-900 dark:text-white">Push</label>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Notifications push sur votre appareil</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.pushNotifications}
                          onChange={(e) => handleNotificationChange('pushNotifications', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-medium text-gray-900 dark:text-white">SMS</label>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Notifications par SMS (urgent uniquement)</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.smsNotifications}
                          onChange={(e) => handleNotificationChange('smsNotifications', e.target.checked)}
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
                        <label className="font-medium text-gray-900 dark:text-white">Profil public</label>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Permettre aux autres de voir votre profil</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={privacySettings.profileVisible}
                          onChange={(e) => handlePrivacyChange('profileVisible', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-medium text-gray-900 dark:text-white">Statut en ligne</label>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Afficher votre statut en ligne aux experts</p>
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
                        <label className="font-medium text-gray-900 dark:text-white">Historique d'activité</label>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Enregistrer votre activité sur la plateforme</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={privacySettings.activityHistory}
                          onChange={(e) => handlePrivacyChange('activityHistory', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-medium text-gray-900 dark:text-white">Recherche publique</label>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Apparaître dans les résultats de recherche</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={privacySettings.searchable}
                          onChange={(e) => handlePrivacyChange('searchable', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informations de contact</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-medium text-gray-900 dark:text-white">Afficher l'email</label>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Permettre aux experts de voir votre email</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={privacySettings.showEmail}
                          onChange={(e) => handlePrivacyChange('showEmail', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-medium text-gray-900 dark:text-white">Afficher le téléphone</label>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Permettre aux experts de voir votre téléphone</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={privacySettings.showPhone}
                          onChange={(e) => handlePrivacyChange('showPhone', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Lecture vidéo</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-medium text-gray-900 dark:text-white">Lecture automatique</label>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Lancer automatiquement les vidéos</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferenceSettings.autoplayVideos}
                          onChange={(e) => handlePreferenceChange('autoplayVideos', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div>
                      <label className="font-medium text-gray-900 dark:text-white mb-2 block">Qualité vidéo</label>
                      <select
                        value={preferenceSettings.videoQuality}
                        onChange={(e) => handlePreferenceChange('videoQuality', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8 bg-white dark:bg-gray-700 dark:text-white"
                      >
                        <option value="auto">Automatique</option>
                        <option value="720p">720p</option>
                        <option value="1080p">1080p</option>
                        <option value="480p">480p</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Historique et données</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-medium text-gray-900 dark:text-white">Afficher l'historique</label>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Conserver l'historique de vos activités</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferenceSettings.showHistory}
                          onChange={(e) => handlePreferenceChange('showHistory', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-medium text-gray-900 dark:text-white">Sauvegarder la progression</label>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Enregistrer votre progression dans les formations</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferenceSettings.saveProgress}
                          onChange={(e) => handlePreferenceChange('saveProgress', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Interface</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-medium text-gray-900 dark:text-white">Mode sombre</label>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Utiliser le thème sombre</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferenceSettings.darkMode}
                          onChange={(e) => handlePreferenceChange('darkMode', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-medium text-gray-900 dark:text-white">Mode compact</label>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Affichage plus dense</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferenceSettings.compactMode}
                          onChange={(e) => handlePreferenceChange('compactMode', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'account' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Paramètres régionaux</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Langue</label>
                      <select
                        value={accountSettings.language}
                        onChange={(e) => handleAccountChange('language', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8 bg-white dark:bg-gray-700 dark:text-white"
                      >
                        <option value="fr">Français</option>
                        <option value="en">English</option>
                        <option value="es">Español</option>
                        <option value="de">Deutsch</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Fuseau horaire</label>
                      <select
                        value={accountSettings.timezone}
                        onChange={(e) => handleAccountChange('timezone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8 bg-white dark:bg-gray-700 dark:text-white"
                      >
                        <option value="Europe/Paris">Europe/Paris</option>
                        <option value="Europe/London">Europe/London</option>
                        <option value="America/New_York">America/New_York</option>
                        <option value="Asia/Tokyo">Asia/Tokyo</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Devise</label>
                      <select
                        value={accountSettings.currency}
                        onChange={(e) => handleAccountChange('currency', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8 bg-white dark:bg-gray-700 dark:text-white"
                      >
                        <option value="EUR">Euro (€)</option>
                        <option value="USD">Dollar US ($)</option>
                        <option value="GBP">Livre Sterling (£)</option>
                        <option value="JPY">Yen (¥)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sécurité</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-medium text-gray-900 dark:text-white">Authentification à deux facteurs</label>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Ajouter une couche de sécurité supplémentaire</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={accountSettings.twoFactorAuth}
                          onChange={(e) => handleAccountChange('twoFactorAuth', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap cursor-pointer">
                          Changer le mot de passe
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'expert' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg p-6 text-white">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <i className="ri-vip-crown-line text-2xl"></i>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Mode Expert</h3>
                      <p className="text-purple-100">Devenez un expert sur notre plateforme</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-medium text-white">Activer le mode expert</label>
                      <p className="text-sm text-purple-100">Accéder aux fonctionnalités d'expert</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={accountSettings.expertMode}
                        onChange={(e) => handleAccountChange('expertMode', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-white/20 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                </div>

                {accountSettings.expertMode && (
                  <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-6 border border-green-200 dark:border-green-700">
                    <h4 className="font-semibold text-green-900 dark:text-green-300 mb-2">Félicitations ! Mode expert activé</h4>
                    <p className="text-green-700 dark:text-green-400 mb-4">Vous avez maintenant accès aux fonctionnalités d'expert :</p>
                    <ul className="space-y-2 text-green-700 dark:text-green-400">
                      <li className="flex items-center space-x-2">
                        <i className="ri-check-line text-green-600 dark:text-green-400"></i>
                        <span>Créer et publier des formations</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <i className="ri-check-line text-green-600 dark:text-green-400"></i>
                        <span>Proposer des consultations</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <i className="ri-check-line text-green-600 dark:text-green-400"></i>
                        <span>Publier des vidéos courtes</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <i className="ri-check-line text-green-600 dark:text-green-400"></i>
                        <span>Gérer vos tarifs et disponibilités</span>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'danger' && (
              <div className="space-y-6">
                <div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-6 border border-red-200 dark:border-red-700">
                  <h3 className="text-lg font-semibold text-red-900 dark:text-red-300 mb-4">Zone Dangereuse</h3>
                  <p className="text-red-700 dark:text-red-400 mb-6">Les actions suivantes sont irréversibles. Procédez avec prudence.</p>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-700">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">Exporter mes données</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Télécharger toutes vos données personnelles</p>
                      </div>
                      <button
                        onClick={exportData}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap cursor-pointer"
                      >
                        Exporter
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-700">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">Supprimer mon compte</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Suppression définitive de votre compte et données</p>
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
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Supprimer le compte</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Cette action est irréversible</p>
              </div>
            </div>

            <p className="text-gray-700 dark:text-gray-200 mb-6">
              Êtes-vous sûr de vouloir supprimer définitivement votre compte ?
              Toutes vos données seront perdues et ne pourront pas être récupérées.
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
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}