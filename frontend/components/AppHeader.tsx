'use client';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import ApiService from '@/services/api';
import { useToast } from '@/contexts/ToastContext';

export default function AppHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCoinsPopup, setShowCoinsPopup] = useState(false);
  const [blockedCoins, setBlockedCoins] = useState(0);
  const [showFavoritesPopup, setShowFavoritesPopup] = useState(false);
  const { user, updateUser, logout, isCompletingProfile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const socket = useSocket();
  const { addToast } = useToast();
  const { experts: favExperts, formations: favFormations, videos: favVideos, refresh: refreshFavorites } = useFavorites();
  const [unreadMap, setUnreadMap] = useState<Record<number, number>>({});
  const messageUnread = Object.values(unreadMap).reduce((a, b) => a + (Number.isFinite(b) ? (b as number) : 0), 0);
  const [apptCount, setApptCount] = useState(0);
  const [apptNotes, setApptNotes] = useState<{ id: number; text: string }[]>([]);
  const [notifItems, setNotifItems] = useState<any[]>([]);
  const [notifUnread, setNotifUnread] = useState(0);
  const [notifLimit, setNotifLimit] = useState(4);
  const [convItems, setConvItems] = useState<any[]>([]);
  const [convLimit, setConvLimit] = useState(4);
  const [rdvItems, setRdvItems] = useState<any[]>([]);
  const [rdvLimit, setRdvLimit] = useState(4);
  const notifContainerRef = useRef<HTMLDivElement | null>(null);
  const coinsContainerRef = useRef<HTMLDivElement | null>(null);
  const favoritesContainerRef = useRef<HTMLDivElement | null>(null);
  const userMenuContainerRef = useRef<HTMLDivElement | null>(null);
  const [favBump, setFavBump] = useState(false);
  const prevFavCountRef = useRef<number>(0);
  const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, '') : '');

  const buildAvatarUrl = (raw?: string, name?: string, size: number = 32) => {
    if (!raw || raw.trim() === '') {
      const n = name?.trim() || '';
      const ui = `https://ui-avatars.com/api/?name=${encodeURIComponent(n)}&size=${size}`;
      return ui;
    }
    const norm = raw.replace(/\\/g, '/');
    // Absolute or data URL
    if (/^(https?:)?\/\//i.test(norm) || norm.startsWith('data:')) return norm;
    // Relative path -> prefix backend base
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
    const apiUser = backendBase && u?.id ? `${backendBase}/api/assets/users/${u.id}` : '';
    const staticUsers = backendBase && u?.id ? ext.map(e => `${backendBase}/images/users/${u.id}.${e}`) : [];
    // If current user is expert or image stored under experts/, try expert paths too
    const apiExpert = backendBase && u?.id ? `${backendBase}/api/assets/experts/${u.id}` : '';
    const staticExperts = backendBase && u?.id ? ext.map(e => `${backendBase}/images/experts/${u.id}.${e}`) : [];
    const avatarRaw = u?.avatar as string | undefined;
    const resolvedAvatar = avatarRaw ? buildAvatarUrl(avatarRaw, name, 32) : '';
    return dedup([apiUser, ...staticUsers, apiExpert, ...staticExperts, resolvedAvatar, ui]);
  };
  const [avatarIdx, setAvatarIdx] = useState(0);
  useEffect(() => { setAvatarIdx(0); }, [user?.id, (user as any)?.avatar, backendBase]);
  const nextBlockedAppt = (() => {
    try {
      const list = Array.isArray(rdvItems) ? rdvItems : [];
      const now = new Date();
      const future = list.filter((a:any) => {
        if (!a?.date) return false;
        const t = a?.time || '00:00';
        const dt = new Date(`${a.date}T${t}:00`);
        return dt.getTime() > now.getTime() && a.status !== 'cancelled' && a.status !== 'completed';
      }).sort((a:any,b:any)=>{
        const da = new Date(`${a.date}T${(a.time||'00:00')}:00`).getTime();
        const db = new Date(`${b.date}T${(b.time||'00:00')}:00`).getTime();
        return da - db;
      });
      return future[0] || null;
    } catch { return null; }
  })();
  const didInitFavRef = useRef<boolean>(false);

  // Rafraîchir les données de la cloche (notifications + conversations)
  const refreshHeaderData = async (limit?: number) => {
    // Only fetch if user is authenticated
    if (!user) return;

    try {
      const res = await ApiService.getNotifications(limit ?? notifLimit);
      if (res.success && res.data) {
        setNotifItems(res.data.items || []);
        setNotifUnread(res.data.unread || 0);
      }
      const convs = await ApiService.getConversations();
      if (convs.success && Array.isArray(convs.data)) {
        const map: Record<number, number> = {};
        convs.data.forEach((cc: any) => {
          const val = typeof cc.unreadCount === 'number' ? cc.unreadCount : parseInt(cc.unreadCount || '0', 10) || 0;
          map[cc.id] = val;
        });
        setUnreadMap(map);
        setConvItems(convs.data);
      }
    } catch {}
  };

  useEffect(() => {
    if (!socket) return;

    const handleCoinUpdate = async () => {
      console.log("Mise à jour des coins reçue !");
      const me = await ApiService.getMe();
      if (me.success) {
        updateUser(me.data);
      }
    };

    socket.on('coinUpdate', handleCoinUpdate);

    const handleUnreadUpdate = (data: { conversationId: number; unreadCount: number }) => {
      setUnreadMap(prev => ({ ...prev, [data.conversationId]: data.unreadCount }));
    };
    socket.on('unreadUpdate', handleUnreadUpdate);

    refreshHeaderData(notifLimit);

    const handleAppointmentBooked = (data: { id: number; date: string; time: string }) => {
      addToast(`Nouveau rendez-vous: ${data.date} ${data.time}`, 'info');
      refreshHeaderData();
    };
    const handleAppointmentUpdated = (data: { id: number; status: string }) => {
      addToast(`Rendez-vous ${data.status}`, data.status === 'cancelled' ? 'warning' : 'success');
      refreshHeaderData();
    };
    const handleAppointmentReminder = (data: { appointmentId: number; time: string }) => {
      addToast(`Rappel rendez-vous à ${data.time}`, 'info');
      refreshHeaderData();
    };

    socket.on('appointmentBooked', handleAppointmentBooked);
    socket.on('appointmentUpdated', handleAppointmentUpdated);
    socket.on('appointmentReminder', handleAppointmentReminder);
    const handleFormationReminder = (data: { formationId: number; time: string }) => {
      addToast(`Rappel formation à ${data.time}`, 'info');
      refreshHeaderData();
    };
    socket.on('formationReminder', handleFormationReminder);

    // Real-time: reflect user banned status changes for current user
    const handleUserBannedChanged = async (e: any) => {
      try {
        if (!e || typeof e.userId !== 'number') return;
        if (user && e.userId === user.id) {
          addToast(e.banned ? 'Votre compte a été banni' : 'Votre compte a été réactivé', e.banned ? 'warning' : 'success');
          if (e.banned) {
            try { await logout(); } catch {}
            router.push('/signin');
          }
        }
      } catch {}
    };
    socket.on('userBannedChanged', handleUserBannedChanged);

    const handleNotification = async (n: any) => {
      if (n?.type === 'review') {
        addToast(n?.message || 'Nouvel avis reçu', 'success');
      } else {
        addToast(n?.title || 'Nouvelle notification', 'info');
      }

      setNotifItems(prev => [{
        id: n?.id ?? Math.random(),
        title: n?.title ?? (n?.type === 'review' ? 'Nouvel avis reçu' : 'Notification'),
        message: n?.message ?? '',
        type: n?.type ?? 'notification',
        actionUrl: n?.actionUrl ?? '/dashboard',
        createdAt: n?.createdAt ?? new Date().toISOString()
      }, ...(prev || [])]);
      setNotifUnread(u => (u || 0) + 1);
      await refreshHeaderData();
    };
    socket.on('notification', handleNotification);

    const handleFavoritesUpdated = () => { refreshFavorites(); };
    if (typeof window !== 'undefined') window.addEventListener('favorites:updated', handleFavoritesUpdated);

    return () => {
      socket.off('coinUpdate', handleCoinUpdate);
      socket.off('unreadUpdate', handleUnreadUpdate);
      socket.off('appointmentBooked', handleAppointmentBooked);
      socket.off('appointmentUpdated', handleAppointmentUpdated);
      socket.off('appointmentReminder', handleAppointmentReminder);
      socket.off('notification', handleNotification);
      socket.off('formationReminder', handleFormationReminder);
      socket.off('userBannedChanged', handleUserBannedChanged);
      if (typeof window !== 'undefined') window.removeEventListener('favorites:updated', handleFavoritesUpdated);
    };
  }, [socket, updateUser]);

  // Fermer les menus/popups au clic hors zone ou sur ESC
  useEffect(() => {
    if (!(showNotifications || showCoinsPopup || showFavoritesPopup || showUserMenu)) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (showNotifications && notifContainerRef.current && !notifContainerRef.current.contains(target)) {
        setShowNotifications(false);
      }
      if (showCoinsPopup && coinsContainerRef.current && !coinsContainerRef.current.contains(target)) {
        setShowCoinsPopup(false);
      }
      if (showFavoritesPopup && favoritesContainerRef.current && !favoritesContainerRef.current.contains(target)) {
        setShowFavoritesPopup(false);
      }
      if (showUserMenu && userMenuContainerRef.current && !userMenuContainerRef.current.contains(target)) {
        setShowUserMenu(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showNotifications) setShowNotifications(false);
        if (showCoinsPopup) setShowCoinsPopup(false);
        if (showFavoritesPopup) setShowFavoritesPopup(false);
        if (showUserMenu) setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showNotifications, showCoinsPopup, showFavoritesPopup, showUserMenu]);

  // Écouter les mises à jour locales (page notifications)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = () => { refreshHeaderData(); };
    window.addEventListener('notifications:updated', handler as any);
    return () => window.removeEventListener('notifications:updated', handler as any);
  }, [notifLimit]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const convs = await ApiService.getConversations();
      if (convs.success && Array.isArray(convs.data)) {
        const map: Record<number, number> = {};
        convs.data.forEach((c: any) => {
          const val = typeof c.unreadCount === 'number' ? c.unreadCount : parseInt(c.unreadCount || '0', 10) || 0;
          map[c.id] = val;
        });
        setUnreadMap(map);
        setConvItems(convs.data);
      }

      const appts = await ApiService.getAppointments();
      if (appts.success && Array.isArray(appts.data)) {
        const blocked = appts.data
          .filter((a: any) => a.status === 'pending' || a.status === 'confirmed')
          .reduce((sum: number, a: any) => sum + (a.coins || 0), 0);
        setBlockedCoins(blocked);
        setRdvItems(appts.data);
      } else {
        setBlockedCoins(0);
      }

      if (user?.userType === 'expert') {
        try {
          const r = await ApiService.getExpertAppointments();
          if (r.success && Array.isArray(r.data)) setRdvItems(r.data);
        } catch { }
      }
    })();
  }, [user]);

  // Bounce animation on favorites badge when count increases
  useEffect(() => {
    const total = (favExperts.length + favFormations.length + favVideos.length);
    const prev = prevFavCountRef.current;
    if (!didInitFavRef.current) {
      // Skip bounce on initial load
      didInitFavRef.current = true;
      prevFavCountRef.current = total;
      return;
    }
    if (total > prev) {
      setFavBump(true);
      const t = setTimeout(() => setFavBump(false), 600);
      prevFavCountRef.current = total;
      return () => clearTimeout(t);
    }
    prevFavCountRef.current = total;
  }, [favExperts.length, favFormations.length, favVideos.length]);

  useEffect(() => {
    if (!socket) return;
    const refreshConversations = async () => {
      const convs = await ApiService.getConversations();
      if (convs.success && Array.isArray(convs.data)) {
        const map: Record<number, number> = {};
        convs.data.forEach((c: any) => {
          const val = typeof c.unreadCount === 'number' ? c.unreadCount : parseInt(c.unreadCount || '0', 10) || 0;
          map[c.id] = val;
        });
        setUnreadMap(map);
        setConvItems(convs.data);
      }
    };
    socket.on('newMessage', refreshConversations);
    socket.on('messagesRead', refreshConversations);

    const refreshRdv = async () => {
      const appts = await ApiService.getAppointments();
      if (appts.success && Array.isArray(appts.data)) setRdvItems(user?.userType === 'expert' ? (await ApiService.getExpertAppointments()).data || appts.data : appts.data);
    };
    socket.on('appointmentBooked', refreshRdv);
    socket.on('appointmentUpdated', refreshRdv);
    socket.on('appointmentReminder', refreshRdv);

    return () => {
      socket.off('newMessage', refreshConversations);
      socket.off('messagesRead', refreshConversations);
      socket.off('appointmentBooked', refreshRdv);
      socket.off('appointmentUpdated', refreshRdv);
      socket.off('appointmentReminder', refreshRdv);
    };
  }, [socket]);

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

    if (isCompletingProfile) {
      router.push('/dashboard/profile');
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
    document.documentElement.classList.toggle('dark', newDarkMode);
  };

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
  };

  const navLinks = [
    { href: '/', label: 'Accueil', icon: 'ri-home-line', isPublic: true },
    ...(user ? [{ href: '/dashboard', label: 'Dashboard', icon: 'ri-dashboard-line', isPublic: false }] : []),
    { href: '/experts', label: 'Experts', icon: 'ri-user-star-line', isPublic: false },
    { href: '/formations', label: 'Formations', icon: 'ri-graduation-cap-line', isPublic: false },
    { href: '/videos', label: 'Vidéos', icon: 'ri-play-circle-line', isPublic: false },
  ];

  // Favorites from context
  const notifIcon = (t?: string) => {
    if (t === 'appointment') return 'calendar-check-line';
    if (t === 'message') return 'message-3-line';
    if (t === 'review') return 'star-smile-line';
    return 'notification-3-line';
  };
  const notifColor = (t?: string) => {
    if (t === 'appointment') return 'text-green-600';
    if (t === 'message') return 'text-blue-600';
    if (t === 'review') return 'text-yellow-600';
    return 'text-purple-600';
  };

  const notifications = (Array.isArray(notifItems) ? notifItems.filter((n: any) => !n.isRead) : []).map((n: any) => ({
    id: n.id,
    type: n.type,
    title: n.title || 'Notification',
    description: n.message || '',
    time: n.createdAt ? new Date(n.createdAt).toLocaleString() : '',
    timeSort: n.createdAt ? new Date(n.createdAt).getTime() : 0,
    isRead: !!n.isRead,
    actionUrl: n.actionUrl,
    icon: `ri-${notifIcon(n.type)}`,
    color: notifColor(n.type),
    source: 'notif'
  }));

  // Messages non lus -> items pour le dropdown
  const messageItems = (convItems || []).reduce((acc: any[], c: any) => {
    const count = (unreadMap[c.id] ?? c.unreadCount ?? 0) as number;
    if (count > 0) {
      const name = c.participants?.[0]?.user
        ? `${c.participants[0].user.firstName} ${c.participants[0].user.lastName}`
        : `Conversation ${c.id}`;
      const time = c.lastMessageTime ? new Date(c.lastMessageTime) : null;
      acc.push({
        id: `c-${c.id}`,
        convId: c.id,
        source: 'conv',
        type: 'message',
        title: name,
        description: `${count} nouveau(x) message(s) • ${c.lastMessage || ''}`,
        time: time ? time.toLocaleString() : '',
        timeSort: time ? time.getTime() : 0,
        icon: 'ri-message-3-line',
        color: 'text-blue-600'
      });
    }
    return acc;
  }, [] as any[]);

  // Dropdown: notifications non lues + messages non lus
  const dropdownItems = [...notifications, ...messageItems].sort((a, b) => (b.timeSort || 0) - (a.timeSort || 0));

  const isVideoSessionPage = pathname.includes('/video-session/');

  if (isVideoSessionPage) {
    return (
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">
              <i className="ri-arrow-left-line text-xl"></i>
            </Link>
            <span className="text-lg font-semibold text-white">Session Vidéo</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg shadow-sm border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden w-12 h-12 flex items-center justify-center text-gray-700 dark:text-gray-300 bg-white/80 dark:bg-gray-800/80 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow transition"
                aria-label="Ouvrir le menu"
              >
                <i className={`ri-${isMenuOpen ? 'close' : 'menu-2'}-line text-2xl`}></i>
              </button>

              <Link href="/" className="flex items-center space-x-2 group">
                <img
                  src="/logo.png"
                  alt="DeepInfluence Logo"
                  className="h-10 w-auto object-contain -mt-6 group-hover:scale-105 transition-transform duration-300"
                />
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hidden sm:block">DeepInfluence</span>
              </Link>
            </div>

            <nav className="hidden lg:flex items-center space-x-1">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => handleNavClick(link.href, link.isPublic)}
                  className="flex items-center space-x-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all"
                >
                  <i className={link.icon}></i>
                  <span>{link.label}</span>
                </button>
              ))}
            </nav>

            <div className="flex items-center space-x-2 md:space-x-4">
              <button
                onClick={toggleDarkMode}
                className="w-10 h-10 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                <i className={`ri-${isDarkMode ? 'sun' : 'moon'}-line text-xl`}></i>
              </button>

              {user ? (
                <>
                  <div className="relative" ref={coinsContainerRef}>
                    <button
                      onClick={() => setShowCoinsPopup(!showCoinsPopup)}
                      className="flex items-center space-x-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 px-3 py-2 rounded-lg font-semibold shadow-sm"
                    >
                      <i className="ri-coin-line"></i>
                      <span className="hidden sm:inline">{user.coins || 0}</span>
                    </button>
                    {showCoinsPopup && (
                      <div className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border p-4 w-max whitespace-nowrap z-50">
                        <h3 className="font-semibold mb-2">Mes Coins</h3>
                        <p className="text-2xl font-bold text-yellow-600 mb-1">{user.coins || 0} coins disponibles</p>
                        {blockedCoins > 0 && (
                          <p
                            className="text-sm text-red-600 mb-3 font-semibold flex items-center"
                            title="Ces coins sont temporairement bloqués pour des réservations confirmées et seront libérés après le rendez-vous."
                          >
                            <i className="ri-error-warning-line mr-2"></i>
                            {blockedCoins} coins bloqués
                          </p>
                        )}
                        {blockedCoins > 0 && nextBlockedAppt && (
                          <div className="text-xs text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                            <i className="ri-calendar-line mr-2 text-gray-500"></i>
                            Prochain RDV: {nextBlockedAppt.date} {nextBlockedAppt.time}{nextBlockedAppt.duration ? ` • ${nextBlockedAppt.duration} min` : ''}
                          </div>
                        )}
                        <Link
                          href="/dashboard/coins"
                          onClick={() => setShowCoinsPopup(false)}
                          className="block w-full bg-yellow-500 text-white py-2 text-center rounded-lg hover:bg-yellow-600"
                        >
                          Acheter des coins
                        </Link>
                      </div>
                    )}
                  </div>

                  <div className="relative hidden md:block" ref={favoritesContainerRef}>
                    <button
                      onClick={async () => { if (!showFavoritesPopup) await refreshFavorites(); setShowFavoritesPopup(!showFavoritesPopup); }}
                      className={`relative w-10 h-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg ${ (favExperts.length+favFormations.length+favVideos.length) > 0 ? 'text-red-500' : 'text-gray-600 dark:text-gray-400' }`}
                    >
                      <i className="ri-heart-line text-xl"></i>
                      {(favExperts.length + favFormations.length + favVideos.length) > 0 && (
                        <span className={`absolute -top-1 -right-1 inline-flex items-center justify-center bg-red-500 text-white rounded-full text-[10px] font-bold min-w-[18px] h-[18px] px-[4px] ${favBump ? 'animate-bounce' : ''}`}>
                          {Math.min(99, (favExperts.length + favFormations.length + favVideos.length))}
                        </span>
                      )}
                    </button>
                    {showFavoritesPopup && (
                      <div className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border p-4 min-w-[300px] z-50">
                        <h3 className="font-semibold mb-2">Mes favoris</h3>
                        <div className="space-y-3 max-h-80 overflow-auto">
                          {favExperts.slice(0,3).map((e:any)=> (
                            <Link key={`fe-${e.id}`} href={`/experts/${e.id}`} className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded">
                              <i className="ri-user-star-line text-blue-600"></i>
                              {(() => {
                                const ext = ['jpg','jpeg','png','webp'];
                                const apiAsset = backendBase && e?.id ? `${backendBase}/api/assets/experts/${e.id}` : '';
                                const staticList = backendBase && e?.id ? ext.map(x => `${backendBase}/images/experts/${e.id}.${x}`) : [];
                                const fromUser = e?.user?.avatar ? buildAvatarUrl(e.user.avatar, e.name, 40) : '';
                                const fromExpert = e?.image ? buildAvatarUrl(e.image, e.name, 40) : '';
                                const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(e.name)}&size=40`;
                                const candidates = Array.from(new Set([apiAsset, ...staticList, fromUser, fromExpert, fallback].filter(Boolean)));
                                const first = candidates[0] || fallback;
                                return (
                                  <img
                                    src={first}
                                    className="w-8 h-8 rounded-full object-cover"
                                    data-cand={candidates.join('|')}
                                    data-idx={0}
                                    onError={(ev)=>{
                                      const t=ev.currentTarget as HTMLImageElement;
                                      const cand=(t.getAttribute('data-cand')||'').split('|').filter(Boolean);
                                      let idx=parseInt(t.getAttribute('data-idx')||'0',10)||0;
                                      if (idx < cand.length - 1) {
                                        idx+=1; t.setAttribute('data-idx', String(idx)); t.src=cand[idx];
                                      } else {
                                        t.onerror=null; t.src=fallback;
                                      }
                                    }}
                                  />
                                );
                              })()}
                              <div className="text-sm">
                                <div className="font-medium text-gray-900 dark:text-white">{e.name}</div>
                                <div className="text-gray-500">Expert</div>
                              </div>
                            </Link>
                          ))}
                          {favFormations.slice(0,3).map((f:any)=> (
                            <Link key={`ff-${f.id}`} href={`/formations/${f.id}`} className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded">
                              <i className="ri-graduation-cap-line text-green-600"></i>
                              <img src={f.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(f.title)}&size=40&background=10B981&color=fff`} className="w-8 h-8 rounded object-cover" />
                              <div className="text-sm">
                                <div className="font-medium text-gray-900 dark:text-white">{f.title}</div>
                                <div className="text-gray-500">Formation</div>
                              </div>
                            </Link>
                          ))}
                          {favVideos.slice(0,3).map((v:any)=> (
                            <Link key={`fv-${v.id}`} href={`/videos/${v.id}`} className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded">
                              <i className="ri-play-circle-line text-purple-600"></i>
                              <img src={v.thumbnail || `https://ui-avatars.com/api/?name=${encodeURIComponent(v.title)}&size=40&background=8B5CF6&color=fff`} className="w-8 h-8 rounded object-cover" />
                              <div className="text-sm">
                                <div className="font-medium text-gray-900 dark:text-white">{v.title}</div>
                                <div className="text-gray-500">Vidéo</div>
                              </div>
                            </Link>
                          ))}
                          {(favExperts.length + favFormations.length + favVideos.length) === 0 && (
                            <p className="text-sm text-gray-500">Aucun favori pour le moment.</p>
                          )}
                          <Link href="/dashboard/favorites" className="block text-center text-blue-600 dark:text-blue-400 hover:text-blue-700">Voir tous les favoris →</Link>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="relative" ref={notifContainerRef}>
                    <button
                      onClick={async () => {
                        if (!showNotifications) {
                          setNotifLimit(5);
                          try {
                            const r = await ApiService.getNotifications(5);
                            if (r.success && r.data) {
                              setNotifItems(r.data.items);
                              setNotifUnread(r.data.unread);
                            }
                          } catch {}
                        }
                        setShowNotifications(!showNotifications);
                      }}
                      className="relative w-10 h-10 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                    >
                      <i className="ri-notification-line text-xl"></i>
                      {(messageUnread + (notifUnread || 0)) > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] leading-none px-1.5 py-0.5 rounded-full">
                          {messageUnread + (notifUnread || 0)}
                        </span>
                      )}
                    </button>
                    {showNotifications && (
                      <div className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border p-4 min-w-[350px] z-50">
                        <div className="space-y-3">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <h3 className=" font-medium">Notifications</h3>
                              <button
                                onClick={async () => {
                                  try {
                                    await ApiService.markAllNotificationsRead();
                                    const ids = (convItems || []).map((c: any) => c.id);
                                    await Promise.all(ids.map((id: number) => ApiService.markAllMessagesAsRead(id)));
                                  } catch {}

                                  try {
                                    const r = await ApiService.getNotifications(notifLimit);
                                    if (r.success && r.data) {
                                      setNotifItems(r.data.items);
                                      setNotifUnread(r.data.unread);
                                    }
                                    const convs = await ApiService.getConversations();
                                    if (convs.success && Array.isArray(convs.data)) {
                                      const map: Record<number, number> = {};
                                      convs.data.forEach((cc: any) => {
                                        const val = typeof cc.unreadCount === 'number'
                                          ? cc.unreadCount
                                          : parseInt(cc.unreadCount || '0', 10) || 0;
                                        map[cc.id] = val;
                                      });
                                      setUnreadMap(map);
                                      setConvItems(convs.data);
                                    }
                                  } catch {}
                                }}
                                className="text-xs text-blue-600 hover:underline"
                              >
                                Tout marquer lu
                              </button>
                            </div>

                            {dropdownItems.length === 0 ? (
                              <p className="text-sm text-gray-500">Aucune notification.</p>
                            ) : (
                              <div
                                className="max-h-56 no-scrollbar overflow-y-auto pr-1"
                                onScroll={(e) => {
                                  const el = e.currentTarget as HTMLDivElement;
                                  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 8) {
                                    setNotifLimit((n) => n + 5);
                                  }
                                }}
                              >
                                <ul className="text-sm text-gray-700 space-y-1">
                                  {dropdownItems.slice(0, notifLimit).map((n: any) => (
                                    <li
                                      key={`u-${n.id}`}
                                      className="flex items-start gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded"
                                      onClick={async () => {
                                        try {
                                          if (n.source === 'conv') {
                                            await ApiService.markAllMessagesAsRead(Number(n.convId));
                                            router.push(`/dashboard/chat/${n.convId}`);
                                          } else {
                                            await ApiService.markNotificationRead(Number(n.id));
                                            if (n.actionUrl) router.push(n.actionUrl);
                                          }
                                        } catch {}
                                        try {
                                          const r = await ApiService.getNotifications(notifLimit);
                                          if (r.success && r.data) {
                                            setNotifItems(r.data.items);
                                            setNotifUnread(r.data.unread);
                                          }
                                        } catch {}
                                      }}
                                    >
                                      <i className={`${n.icon} ${n.color} mt-0.5`}></i>
                                      <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">{n.title}</div>
                                        <div className="text-xs text-gray-500 truncate">{n.description}</div>
                                      </div>
                                      <span className="ml-2 text-[10px] text-gray-400 whitespace-nowrap">{n.time}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>

                          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                            <button
                              onClick={() => { setShowNotifications(false); router.push('/dashboard/notifications'); }}
                              className="w-full text-center text-sm font-semibold text-blue-600 hover:underline py-2"
                            >
                              Ouvrir toutes les notifications
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="relative" ref={userMenuContainerRef}>
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg px-3 py-2 transition-all duration-200"
                    >
                      {(() => {
                        const candidates = buildUserAvatarCandidates(user);
                        const src = candidates[Math.min(avatarIdx, candidates.length - 1)] || candidates[candidates.length - 1];
                        return (
                          <img
                            src={src}
                            alt="Avatar"
                            className="w-8 h-8 rounded-full object-cover"
                            onError={() => setAvatarIdx(i => i + 1)}
                          />
                        );
                      })()}
                      <div className="hidden sm:block text-left">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {user.userType === 'admin' ? 'Administrateur' : user.userType === 'expert' ? 'Expert' : 'Utilisateur'}
                        </p>
                      </div>
                      <i className={`ri-arrow-down-s-line text-gray-500 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`}></i>
                    </button>
                    {showUserMenu && (
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
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <i className="ri-user-line"></i>
                          <span>Mon profil</span>
                        </Link>

                        <Link
                          href="/dashboard/settings"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <i className="ri-settings-line"></i>
                          <span>Paramètres</span>
                        </Link>

                        {user.userType === 'expert' && (
                          <Link
                            href="/expert-profile"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <i className="ri-user-star-line"></i>
                            <span>Profil Expert</span>
                          </Link>
                        )}

                        {user.userType === 'admin' && (
                          <Link
                            href="/admin"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <i className="ri-admin-line"></i>
                            <span>Administration</span>
                          </Link>
                        )}

                        <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                          <button
                            onClick={() => {
                              setShowUserMenu(false);
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
                </>
              ) : (
                <div className="hidden md:flex items-center space-x-2">
                  <Link
                    href="/signin"
                    className="text-gray-700 dark:text-gray-300 hover:text-blue-600 px-4 py-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Se connecter
                  </Link>
                  <Link
                    href="/signup"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full font-semibold shadow-lg"
                  >
                    Commencer
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile dropdown menu */}
          {isMenuOpen && (
            <div className="lg:hidden border-t border-gray-200 dark:border-gray-700 py-2 animate-in fade-in slide-in-from-top-2">
              <div className="flex flex-col space-y-1">
                {navLinks.map((link) => (
                  <button
                    key={`m-${link.label}`}
                    onClick={() => handleNavClick(link.href, link.isPublic)}
                    className="w-full text-left px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                  >
                    <i className={`${link.icon} mr-2`}></i>
                    {link.label}
                  </button>
                ))}

                {!user && (
                  <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 flex flex-col gap-2">
                    <Link
                      href="/signin"
                      onClick={() => setIsMenuOpen(false)}
                      className="w-full text-left px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      Se connecter
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setIsMenuOpen(false)}
                      className="w-full text-left px-3 py-2 rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600"
                    >
                      Commencer
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
