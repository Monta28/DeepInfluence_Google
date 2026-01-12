'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

export default function DashboardHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showCoinsPopup, setShowCoinsPopup] = useState(false);
  const [showFavoritesPopup, setShowFavoritesPopup] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(darkMode);
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, '') : '');
  const buildAvatarUrl = (raw?: string, name?: string, size: number = 32) => {
    if (!raw || raw.trim() === '') {
      const n = name?.trim() || '';
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(n)}&size=${size}`;
    }
    const norm = raw.replace(/\\/g, '/');
    if (/^(https?:)?\/\//i.test(norm) || norm.startsWith('data:')) return norm;
    if (backendBase) {
      if (norm.startsWith('/')) return `${backendBase}${norm}`;
      return `${backendBase}/${norm}`;
    }
    return norm;
  };
  const buildUserIdImage = (id?: number) => {
    if (!id || !backendBase) return '';
    return `${backendBase}/images/users/${id}.jpg`;
  };
  const dedup = (arr: string[]) => Array.from(new Set(arr.filter(Boolean)));
  const buildUserAvatarCandidates = (u: any) => {
    const name = u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : '';
    const ui = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=32`;
    const ext = ['jpg','jpeg','png','webp'];
    const apiAsset = backendBase && u?.id ? `${backendBase}/api/assets/users/${u.id}` : '';
    const idCandidates = backendBase && u?.id ? ext.map(e => `${backendBase}/images/users/${u.id}.${e}`) : [];
    const avatarRaw = u?.avatar as string | undefined;
    const resolvedAvatar = avatarRaw ? buildAvatarUrl(avatarRaw, name, 32) : '';
    return dedup([apiAsset, ...(idCandidates as string[]), resolvedAvatar, ui]);
  };
  const [avatarIdx, setAvatarIdx] = useState(0);
  useEffect(() => { setAvatarIdx(0); }, [user?.id, (user as any)?.avatar, backendBase]);

  const favoriteExperts = [
    {
      id: 1,
      name: 'Dr. Sarah Martin',
      specialty: 'Psychologue clinique',
      rating: 4.9,
      avatar: 'https://ui-avatars.com/api/?name=Sarah+Martin&size=60&background=3B82F6&color=ffffff',
      isOnline: true
    },
    {
      id: 3,
      name: 'Sophie Laurent',
      specialty: 'Coach en Développement Personnel',
      rating: 4.9,
      avatar: 'https://ui-avatars.com/api/?name=Sophie+Laurent&size=60&background=10B981&color=ffffff',
      isOnline: false
    },
    {
      id: 5,
      name: 'Marc Dubois',
      specialty: 'Expert en Investissement',
      rating: 4.8,
      avatar: 'https://ui-avatars.com/api/?name=Marc+Dubois&size=60&background=F59E0B&color=ffffff',
      isOnline: true
    }
  ];

  const notifications = [
    {
      id: 1,
      type: 'message',
      title: 'Nouveau message de Dr. Sarah Martin',
      description: 'Réponse à votre question sur la gestion du stress',
      time: '5 min',
      isRead: false,
      icon: 'ri-message-line',
      color: 'text-blue-600'
    },
    {
      id: 2,
      type: 'appointment',
      title: 'Rappel de rendez-vous',
      description: 'Session avec Marc Dubois dans 30 minutes',
      time: '30 min',
      isRead: false,
      icon: 'ri-calendar-line',
      color: 'text-green-600'
    },
    {
      id: 3,
      type: 'formation',
      title: 'Nouvelle formation disponible',
      description: 'Marketing Digital Avancé par Sophie Laurent',
      time: '2h',
      isRead: true,
      icon: 'ri-graduation-cap-line',
      color: 'text-purple-600'
    }
  ];

  if (!user) {
    return null;
  }

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo et Navigation */}
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-105">
                <span className="text-white font-bold text-lg">D</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hidden sm:block">
                DeepInfluence
              </span>
            </Link>

            {/* Navigation Desktop */}
            <nav className="hidden lg:flex items-center space-x-1">
              <Link
                href="/dashboard"
                className="flex items-center space-x-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
              >
                <i className="ri-dashboard-line"></i>
                <span>Dashboard</span>
              </Link>
              <Link
                href="/experts"
                className="flex items-center space-x-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
              >
                <i className="ri-user-star-line"></i>
                <span>Experts</span>
              </Link>
              <Link
                href="/formations"
                className="flex items-center space-x-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
              >
                <i className="ri-graduation-cap-line"></i>
                <span>Formations</span>
              </Link>
              <Link
                href="/videos"
                className="flex items-center space-x-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
              >
                <i className="ri-play-circle-line"></i>
                <span>Vidéos</span>
              </Link>
            </nav>
          </div>

          {/* Actions à droite */}
          <div className="flex items-center space-x-4">
            {/* Coins */}
            <div className="relative">
              <button
                onClick={() => setShowCoinsPopup(!showCoinsPopup)}
                className="flex items-center space-x-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 px-3 py-2 rounded-lg hover:from-yellow-500 hover:to-orange-500 transition-all duration-200 font-semibold shadow-sm"
              >
                <i className="ri-coin-line"></i>
                <span className="hidden sm:inline">{user.coins || 0}</span>
              </button>

              {showCoinsPopup && (
                <div className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 min-w-[250px] z-50">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Mes Coins</h3>
                  <p className="text-2xl font-bold text-yellow-600 mb-3">{user.coins || 0} coins</p>
                  <Link
                    href="/dashboard/coins"
                    onClick={() => setShowCoinsPopup(false)}
                    className="block w-full bg-yellow-500 text-white py-2 px-4 rounded-lg hover:bg-yellow-600 transition-colors text-center font-medium"
                  >
                    Acheter des coins
                  </Link>
                </div>
              )}
            </div>

            {/* Favoris */}
            <div className="relative hidden md:block">
              <button
                onClick={() => setShowFavoritesPopup(!showFavoritesPopup)}
                className="w-10 h-10 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
              >
                <i className="ri-heart-line text-xl"></i>
              </button>

              {showFavoritesPopup && (
                <div className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 min-w-[300px] z-50">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Experts favoris</h3>
                  <div className="space-y-3">
                    {favoriteExperts.map((expert) => (
                      <div key={expert.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                        <div className="relative">
                          <img
                            src={expert.avatar}
                            alt={expert.name}
                            className="w-10 h-10 rounded-full"
                          />
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${
                            expert.isOnline ? 'bg-green-500' : 'bg-gray-400'
                          }`}></div>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white text-sm">{expert.name}</h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{expert.specialty}</p>
                        </div>
                        <Link
                          href={`/experts/${expert.id}`}
                          onClick={() => setShowFavoritesPopup(false)}
                          className="text-blue-600 hover:text-blue-700 text-sm"
                        >
                          Voir
                        </Link>
                      </div>
                    ))}
                  </div>
                  <Link
                    href="/dashboard/favorites"
                    onClick={() => setShowFavoritesPopup(false)}
                    className="block w-full mt-3 text-center text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Voir tous les favoris
                  </Link>
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative w-10 h-10 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
              >
                <i className="ri-notification-line text-xl"></i>
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {notifications.filter(n => !n.isRead).length}
                  </div>
                )}
              </button>

              {showNotifications && (
                <div className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 min-w-[350px] z-50">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Notifications</h3>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div key={notification.id} className={`p-3 rounded-lg transition-colors ${
                        notification.isRead ? 'bg-gray-50 dark:bg-gray-700' : 'bg-blue-50 dark:bg-blue-900/30'
                      }`}>
                        <div className="flex items-start space-x-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            notification.isRead ? 'bg-gray-200 dark:bg-gray-600' : 'bg-blue-100 dark:bg-blue-800'
                          }`}>
                            <i className={`${notification.icon} ${notification.color} text-sm`}></i>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-white text-sm">{notification.title}</h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{notification.description}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Il y a {notification.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Link
                    href="/dashboard/notifications"
                    onClick={() => setShowNotifications(false)}
                    className="block w-full mt-3 text-center text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Voir toutes les notifications
                  </Link>
                </div>
              )}
            </div>

            {/* Mode sombre */}
            <button
              onClick={toggleDarkMode}
              className="w-10 h-10 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
            >
              <i className={`ri-${isDarkMode ? 'sun' : 'moon'}-line text-xl`}></i>
            </button>

            {/* Profil utilisateur */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg px-3 py-2 transition-all duration-200"
              >
                {(() => {
                  const candidates = buildUserAvatarCandidates(user);
                  const src = candidates[Math.min(avatarIdx, candidates.length - 1)] || candidates[candidates.length - 1];
                  return (
                    <img
                      src={src}
                      alt={`${user.firstName} ${user.lastName}`}
                      className="w-8 h-8 rounded-full"
                      onError={() => setAvatarIdx(i => i + 1)}
                    />
                  );
                })()}
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {user.userType === 'expert' ? 'Expert' : 'Utilisateur'}
                  </p>
                </div>
                <i className={`ri-arrow-down-s-line text-gray-500 transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`}></i>
              </button>

              {showProfileMenu && (
                <div className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 min-w-[200px] z-50">
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {user.email}
                    </p>
                  </div>
                  
                  <Link
                    href="/dashboard/profile"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <i className="ri-user-line"></i>
                    <span>Mon profil</span>
                  </Link>
                  
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <i className="ri-settings-line"></i>
                    <span>Paramètres</span>
                  </Link>

                  {user.userType === 'expert' && (
                    <Link
                      href="/expert-profile"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <i className="ri-user-star-line"></i>
                      <span>Profil Expert</span>
                    </Link>
                  )}

                  {user.userType === 'admin' && (
                    <Link
                      href="/admin"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <i className="ri-admin-line"></i>
                      <span>Administration</span>
                    </Link>
                  )}
                  
                  <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        handleLogout();
                      }}
                      className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <i className="ri-logout-box-line"></i>
                      <span>Déconnexion</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Menu mobile */}
            <button
              className="lg:hidden w-10 h-10 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <i className="ri-menu-line text-xl"></i>
            </button>
          </div>
        </div>

        {/* Menu mobile */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col space-y-2">
              <Link
                href="/dashboard"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center space-x-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
              >
                <i className="ri-dashboard-line"></i>
                <span>Dashboard</span>
              </Link>
              <Link
                href="/experts"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center space-x-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
              >
                <i className="ri-user-star-line"></i>
                <span>Experts</span>
              </Link>
              <Link
                href="/formations"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center space-x-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
              >
                <i className="ri-graduation-cap-line"></i>
                <span>Formations</span>
              </Link>
              <Link
                href="/videos"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center space-x-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
              >
                <i className="ri-play-circle-line"></i>
                <span>Vidéos</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

