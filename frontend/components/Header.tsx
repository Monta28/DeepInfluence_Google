'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

export default function AppHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(darkMode);
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const handleNavClick = (path: string, isPublic: boolean = false) => {
    setIsMenuOpen(false);
    if (isPublic) {
        router.push(path);
        return;
    }

    if (!user) {
      sessionStorage.setItem('returnUrl', path);
      router.push('/signin');
    } else {
      router.push(path);
    }
  };
  
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
      setShowUserMenu(false);
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

  const navLinks = [
    { 
      href: user ? '/dashboard' : '/', 
      label: user ? 'Dashboard' : 'Accueil', 
      icon: user ? 'ri-dashboard-line' : 'ri-home-line',
      isPublic: true // L'accueil est toujours public, le dashboard est protégé par la page elle-même
    },
    { href: '/experts', label: 'Experts', icon: 'ri-user-star-line', isPublic: false },
    { href: '/formations', label: 'Formations', icon: 'ri-graduation-cap-line', isPublic: false },
    { href: '/videos', label: 'Vidéos', icon: 'ri-play-circle-line', isPublic: false },
  ];
  
  const isVideoSessionPage = pathname.includes('/video-session/');
  
  if (isVideoSessionPage) {
    return (
        <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">
                    <i className="ri-arrow-left-line text-xl"></i>
                    </Link>
                    <span className="text-lg font-semibold text-white">Session Vidéo</span>
                </div>
            </div>
        </header>
    );
  }

  return (
    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg shadow-sm border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <Link href={user ? "/dashboard" : "/"} className="flex items-center space-x-3 group">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-105">
              <span className="text-white font-bold text-xl">D</span>
            </div>
            <span className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate" style={{ fontFamily: 'Pacifico, serif' }}>
              DeepInfluence
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-1 bg-gray-50/50 dark:bg-gray-800/50 rounded-full px-2 py-1 backdrop-blur-sm">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => handleNavClick(link.href, link.isPublic)}
                className="flex items-center space-x-2 px-3 lg:px-4 py-2 text-sm lg:text-base text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white/70 dark:hover:bg-gray-700/70 rounded-full transition-all duration-200 whitespace-nowrap"
              >
                <i className={link.icon}></i>
                <span>{link.label}</span>
              </button>
            ))}
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={toggleDarkMode}
              className="w-10 h-10 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all duration-200"
            >
              <i className={`ri-${isDarkMode ? 'sun' : 'moon'}-line text-xl`}></i>
            </button>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full px-4 py-2 transition-all duration-200"
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
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[100px] truncate">
                    {user.firstName}
                  </span>
                  <i className={`ri-arrow-down-s-line text-sm text-gray-500 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`}></i>
                </button>

                {showUserMenu && (
                  <div className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 min-w-[200px] z-50">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                    </div>
                    <Link href="/dashboard/profile" onClick={() => setShowUserMenu(false)} className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <i className="ri-user-line"></i>
                      <span>Mon Profil</span>
                    </Link>
                    <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                      <button onClick={handleLogout} className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        <i className="ri-logout-box-line"></i>
                        <span>Déconnexion</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/signin" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 px-4 py-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 whitespace-nowrap">
                  Se connecter
                </Link>
                <Link href="/signup" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 lg:px-6 py-2 rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 whitespace-nowrap">
                  Commencer
                </Link>
              </>
            )}
          </div>
          
          <button
            className="md:hidden w-10 h-10 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all duration-200"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <i className="ri-menu-line text-xl"></i>
          </button>
        </div>
      </div>
    </header>
  );
}
