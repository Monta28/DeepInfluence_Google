'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import { useAuth } from '../../../contexts/AuthContext';
import ApiService from '../../../services/api';
import { useSocket } from '@/contexts/SocketContext';

export default function NotificationsPage() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { user, isLoading } = useAuth();
  const socket = useSocket();
  const router = useRouter();

  useEffect(() => {
    // Attendre que l'état d'auth soit déterminé
    if (isLoading) return;
    if (!user) {
      // Sauvegarder la destination pour y revenir après connexion
      if (typeof window !== 'undefined') sessionStorage.setItem('returnUrl', '/dashboard/notifications');
      router.push('/signin');
      return;
    }
    loadNotifications();
  }, [user, isLoading, router]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError('');
      // Notifications système
      const res = await ApiService.getNotifications(100);
      const notifItems = (res.data?.items || []).map((n: any) => ({
        id: n.id,
        source: 'notif',
        type: n.type,
        title: n.title || 'Notification',
        message: n.message || '',
        time: n.createdAt ? new Date(n.createdAt).toLocaleString() : '',
        read: !!n.isRead,
        category: n.type === 'appointment' ? 'Rendez-vous' : n.type === 'review' ? 'Avis' : 'Autres',
        priority: n.type === 'appointment' ? 'high' : 'low',
        actionUrl: n.actionUrl || null,
        createdAt: n.createdAt
      }));

      // Messages non lus (conversations)
      const convs = await ApiService.getConversations();
      const convItems = (Array.isArray(convs.data) ? convs.data : []).map((c: any) => {
        const count = typeof c.unreadCount === 'number' ? c.unreadCount : parseInt(c.unreadCount || '0', 10) || 0;
        const other = c.participants?.find((p: any) => !user || p.user?.id !== user.id)?.user || c.participants?.[0]?.user;
        const name = other ? `${other.firstName} ${other.lastName}` : `Conversation ${c.id}`;
        const createdAt = c.lastMessageTime || c.updatedAt || c.createdAt;
        return {
          id: `conv-${c.id}`,
          convId: c.id,
          source: 'conv',
          type: 'message',
          title: name,
          message: count > 0 ? `${count} nouveau(x) message(s) • ${c.lastMessage || ''}` : (c.lastMessage || 'Aucun message'),
          time: createdAt ? new Date(createdAt).toLocaleString() : '',
          read: count === 0,
          category: 'Messages',
          priority: count > 0 ? 'medium' : 'low',
          actionUrl: `/dashboard/chat/${c.id}`,
          createdAt
        };
      });

      // Fusionner et trier par date
      const items = [...notifItems, ...convItems].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setNotifications(items);
    } catch (err: any) {
      console.error('Erreur lors du chargement des notifications:', err);
      setError('Erreur lors du chargement des notifications');
    } finally {
      setLoading(false);
    }
  };

  // Live updates via Socket.io
  useEffect(() => {
    if (!socket) return;
    const onAnyRefresh = () => {
      // Recharger la liste pour refléter les changements en temps réel
      loadNotifications();
    };

    socket.on('notification', onAnyRefresh);
    socket.on('newMessage', onAnyRefresh);
    socket.on('messagesRead', onAnyRefresh);
    socket.on('appointmentBooked', onAnyRefresh);
    socket.on('appointmentUpdated', onAnyRefresh);
    socket.on('appointmentReminder', onAnyRefresh);

    return () => {
      socket.off('notification', onAnyRefresh);
      socket.off('newMessage', onAnyRefresh);
      socket.off('messagesRead', onAnyRefresh);
      socket.off('appointmentBooked', onAnyRefresh);
      socket.off('appointmentUpdated', onAnyRefresh);
      socket.off('appointmentReminder', onAnyRefresh);
    };
  }, [socket]);

  const markAsRead = async (notificationId: any) => {
    try {
      const item = notifications.find((n) => n.id === notificationId);
      if (!item) return;
      if (item.source === 'conv' && item.convId) {
        await ApiService.markAllMessagesAsRead(item.convId);
      } else {
        await ApiService.markNotificationRead(Number(notificationId));
      }
      setNotifications(prev => prev.map((notif: any) => notif.id === notificationId ? { ...notif, read: true } : notif));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('notifications:updated'));
      }
    } catch (err) {
      console.error('Erreur lors de la mise à jour de la notification:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await ApiService.markAllNotificationsRead();
      // Marquer toutes les conversations comme lues
      const convIds = notifications.filter((n: any) => n.source === 'conv' && !n.read).map((n: any) => n.convId);
      await Promise.all(convIds.map((id: number) => ApiService.markAllMessagesAsRead(id)));
      setNotifications(prev => prev.map((notif: any) => ({ ...notif, read: true })));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('notifications:updated'));
      }
    } catch (err) {
      console.error('Erreur lors de la mise à jour des notifications:', err);
    }
  };

  const deleteNotification = async (notificationId: any) => {
    try {
      // Simuler l'appel API pour supprimer
      setNotifications(prev => 
        prev.filter((notif: any) => notif.id !== notificationId)
      );
    } catch (err) {
      console.error('Erreur lors de la suppression de la notification:', err);
    }
  };

  const filteredNotifications = notifications.filter((notification: any) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'unread') return !notification.read;
    if (activeFilter === 'read') return notification.read;
    return notification.type === activeFilter;
  });

  const unreadCount = notifications.filter((n: any) => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment': return 'ri-calendar-line';
      case 'message': return 'ri-message-line';
      case 'review': return 'ri-star-smile-line';
      case 'formation': return 'ri-graduation-cap-line';
      case 'payment': return 'ri-money-dollar-circle-line';
      default: return 'ri-notification-line';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 dark:bg-red-900/30';
      case 'medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30';
      case 'low': return 'text-green-600 bg-green-50 dark:bg-green-900/30';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-700';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <AppHeader />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-400">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Chargement…</span>
          </div>
        </div>
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppHeader />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Notifications
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {unreadCount > 0 ? `${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}` : 'Toutes les notifications sont lues'}
              </p>
            </div>
            
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Tout marquer comme lu
              </button>
            )}
          </div>

          {/* Filtres */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'Toutes', count: notifications.length },
              { id: 'unread', label: 'Non lues', count: unreadCount },
              { id: 'read', label: 'Lues', count: notifications.length - unreadCount },
              { id: 'appointment', label: 'Rendez-vous', count: notifications.filter((n: any) => n.type === 'appointment').length },
              { id: 'message', label: 'Messages', count: notifications.filter((n: any) => n.type === 'message').length },
              { id: 'review', label: 'Avis', count: notifications.filter((n: any) => n.type === 'review').length },
              { id: 'formation', label: 'Formations', count: notifications.filter((n: any) => n.type === 'formation').length }
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  activeFilter === filter.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
              >
                {filter.label} ({filter.count})
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-600 dark:text-gray-400">Chargement des notifications...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <i className="ri-error-warning-line text-red-600 dark:text-red-400 text-xl mr-3"></i>
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          </div>
        )}

        {/* Notifications List */}
        {!loading && !error && (
          <div className="space-y-4">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-notification-off-line text-gray-400 text-3xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Aucune notification
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {activeFilter === 'all' 
                    ? 'Vous n\'avez aucune notification pour le moment.'
                    : `Aucune notification ${activeFilter === 'unread' ? 'non lue' : activeFilter === 'read' ? 'lue' : `de type "${activeFilter}"`} trouvée.`
                  }
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`bg-white dark:bg-gray-800 rounded-xl border transition-all duration-200 ${
                    notification.read
                      ? 'border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md'
                      : 'border-blue-400 dark:border-blue-600 bg-blue-50/60 dark:bg-blue-900/20 shadow-[0_0_0_3px_rgba(59,130,246,0.12)] hover:shadow-[0_0_0_4px_rgba(59,130,246,0.18)] border-l-4 border-l-blue-500'
                  }`}
                >
                  <div className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getPriorityColor(notification.priority)}`}>
                        <i className={`${getNotificationIcon(notification.type)} text-xl`}></i>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              {!notification.read && (
                                <span aria-hidden className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
                              )}
                              <h3 className={`font-semibold ${notification.read ? 'text-gray-900 dark:text-white' : 'text-blue-900 dark:text-blue-100'}`}>
                                {notification.title}
                              </h3>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                              {notification.message}
                            </p>
                            <div className="flex items-center space-x-4 mt-3">
                              <span className="text-sm text-gray-500 dark:text-gray-500">
                                Il y a {notification.time}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(notification.priority)}`}>
                                {notification.category}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-4">
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                              >
                                Marquer comme lu
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                            >
                              <i className="ri-delete-bin-line"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
