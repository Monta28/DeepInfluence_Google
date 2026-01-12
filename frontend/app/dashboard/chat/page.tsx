'use client';

import { useState, useEffect, useMemo } from 'react';
import AppHeader from '@/components/AppHeader';
import Link from 'next/link';
import ApiService from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';

// Définition des types pour les données de l'API
interface Participant {
  user: {
    id: number;
    firstName: string;
    lastName: string;
    avatar: string;
    isOnline?: boolean;
    responseTime?: string;
  };
}

interface Conversation {
  id: number;
  lastMessage: string;
  lastMessageTime: string;
  participants: Participant[];
  // Ajoutons des champs pour les filtres (à implémenter côté backend si besoin)
  unreadCount?: number; 
  isOnline?: boolean;
  responseMinutes?: number | null;
}

export default function ChatListPage() {
  const { user } = useAuth();
  const socket = useSocket();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, '') : '');

  const buildUserCandidates = (u?: { id?: number; avatar?: string; firstName?: string; lastName?: string }, size: number = 64) => {
    const list: string[] = [];
    const name = `${u?.firstName||''} ${u?.lastName||''}`.trim();
    if (backendBase && u?.id) {
      list.push(`${backendBase}/api/assets/users/${u.id}`);
      ['jpg','jpeg','png','webp'].forEach(ext => list.push(`${backendBase}/images/users/${u.id}.${ext}`));
      // Also try expert image bucket in case this user is an expert keyed by userId
      list.push(`${backendBase}/api/assets/experts/${u.id}`);
      ;['jpg','jpeg','png','webp'].forEach(ext => list.push(`${backendBase}/images/experts/${u.id}.${ext}`));
    }
    if (u?.avatar) {
      const raw = String(u.avatar).replace(/\\/g, '/');
      if (/^(https?:)?\/\//i.test(raw) || raw.startsWith('data:')) list.push(raw);
      else if (backendBase) list.push(raw.startsWith('/') ? `${backendBase}${raw}` : `${backendBase}/${raw}`);
      else list.push(raw);
    }
    list.push(`https://ui-avatars.com/api/?name=${encodeURIComponent(name||'User')}&size=${size}`);
    return Array.from(new Set(list));
  };

  // Charger les conversations depuis l'API
  useEffect(() => {
    if (!user) return;

    const fetchConversations = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await ApiService.getConversations();
        if (response.success && response.data) {
          // Utiliser les données réelles renvoyées par l'API (inclut unreadCount)
          setConversations(response.data);
        } else {
          throw new Error(response.message || 'Impossible de charger les conversations.');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [user]);

  // Mettre à jour en temps réel les unread depuis le socket
  useEffect(() => {
    if (!socket) return;
    const handleUnread = (data: { conversationId: number; unreadCount: number }) => {
      setConversations(prev => prev.map((c: any) => c.id === data.conversationId ? { ...c, unreadCount: data.unreadCount } : c));
    };
    socket.on('unreadUpdate', handleUnread);
    // Sur nouveau message, rafraîchir pour recalculer temps de réponse dynamiques
    const handleNewMessage = () => {
      (async () => {
        const response = await ApiService.getConversations();
        if (response.success && response.data) setConversations(response.data);
      })();
    };
    socket.on('newMessage', handleNewMessage);
    return () => {
      socket.off('unreadUpdate', handleUnread);
      socket.off('newMessage', handleNewMessage);
    };
  }, [socket]);
  
  // Logique de filtrage et de recherche
  const filteredChats = useMemo(() => {
    let filtered = conversations;

    if (activeFilter === 'unread') {
      filtered = conversations.filter((c: any) => (c.unreadCount || 0) > 0);
    } else if (activeFilter === 'online') {
      filtered = conversations.filter((c: any) => c.isOnline);
    } else if (activeFilter === 'priority') {
        filtered = conversations.filter((c: any) => c.priority === 'high');
    }
    
    if (!searchQuery) {
        return filtered;
    }

    return filtered.filter((chat: any) => {
      const participant = chat.participants.find((p: any) => p.user.id !== user?.id)?.user;
      if (!participant) return false;
      const fullName = `${participant.firstName} ${participant.lastName}`;
      return fullName.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [conversations, activeFilter, searchQuery, user]);

  const unreadCount = useMemo(() => conversations.reduce((acc, chat) => acc + (chat.unreadCount || 0), 0), [conversations]);
  const onlineExpertsCount = useMemo(() => {
    let count = 0;
    conversations.forEach(c => {
      const participant = c.participants.find((p: any) => p.user.id !== user?.id)?.user;
      if (participant?.isOnline) count += 1;
    });
    return count;
  }, [conversations, user]);

  // Calcul du temps de réponse moyen basé sur les temps de réponse dynamiques renvoyés par l'API
  const averageResponseLabel = useMemo(() => {
    const minutesValues = conversations
      .map((c: any) => c.responseMinutes)
      .filter((v): v is number => typeof v === 'number' && v > 0);
    if (minutesValues.length === 0) return '—';
    const avg = Math.round(minutesValues.reduce((a, b) => a + b, 0) / minutesValues.length);
    if (avg >= 60) {
      const h = Math.floor(avg / 60);
      const m = avg % 60;
      return m > 0 ? `~ ${h}h ${m}m` : `~ ${h}h`;
    }
    return `~ ${avg} min`;
  }, [conversations, user]);
  
  const filters = [
    { id: 'all', label: 'Toutes', count: conversations.length },
    { id: 'unread', label: 'Non lues', count: unreadCount },
    { id: 'online', label: 'En ligne', count: onlineExpertsCount },
    { id: 'priority', label: 'Prioritaires', count: conversations.filter((c: any) => c.priority === 'high').length }
  ];

  if (loading) {
    return <div className="text-center p-8">Chargement...</div>
  }
  
  if (error) {
    return <div className="text-center p-8 text-red-500">Erreur : {error}</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
      <AppHeader />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Messagerie
          </h1>
          <p className="text-xl text-gray-600">
            Communiquez avec vos experts en temps réel
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Total Conversations */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/50">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                <i className="ri-message-2-line text-white text-xl"></i>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{conversations.length}</h3>
                <p className="text-gray-600 text-sm">Conversations</p>
              </div>
            </div>
          </div>
          
          {/* Experts en ligne */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/50">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <i className="ri-user-line text-white text-xl"></i>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{onlineExpertsCount}</h3>
                <p className="text-gray-600 text-sm">Experts en ligne</p>
              </div>
            </div>
          </div>
          
          {/* Messages non lus */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/50">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                <i className="ri-notification-3-line text-white text-xl"></i>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{unreadCount}</h3>
                <p className="text-gray-600 text-sm">Messages non lus</p>
              </div>
            </div>
          </div>
          
          {/* Temps de réponse (moyenne des experts contactés) */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/50">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center">
                <i className="ri-time-line text-white text-xl"></i>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{averageResponseLabel}</h3>
                <p className="text-gray-600 text-sm">Temps de réponse</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-white/50 overflow-hidden">
          <div className="p-8 border-b border-gray-200/50">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="relative flex-1 max-w-lg">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <i className="ri-search-line text-gray-400 text-xl"></i>
                </div>
                <input
                  type="text"
                  placeholder="Rechercher une conversation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                {filters.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                      activeFilter === filter.id
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filter.label}
                    <span className="ml-2 px-2 py-1 text-xs bg-white/20 rounded-full">
                      {filter.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-200/50">
            {filteredChats.map((chat) => {
                const participant = chat.participants.find((p: any) => p.user.id !== user?.id)?.user;
                if (!participant) return null;

              return (
                <Link
                  key={chat.id}
                  href={`/dashboard/chat/${chat.id}`}
                  className="block hover:bg-blue-50/50 transition-all duration-300 group"
                >
                  <div className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        {(() => {
                          const cand = buildUserCandidates(participant, 64);
                          const first = cand[0];
                          const fallback = cand[cand.length - 1];
                          return (
                            <img
                              src={first}
                              alt={participant.firstName}
                              className="w-16 h-16 rounded-2xl object-cover shadow-md group-hover:shadow-lg transition-shadow duration-300"
                              data-cand={cand.join('|')}
                              data-idx={0}
                              onError={(ev)=>{
                                const t=ev.currentTarget as HTMLImageElement;
                                const c=(t.getAttribute('data-cand')||'').split('|').filter(Boolean);
                                let i=parseInt(t.getAttribute('data-idx')||'0',10)||0;
                                if (i < c.length - 1) { i+=1; t.setAttribute('data-idx', String(i)); t.src=c[i]; }
                                else { t.onerror=null; t.src=fallback; }
                              }}
                            />
                          );
                        })()}
                         {participant.isOnline && (
                           <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-3 border-white shadow-lg animate-pulse"></div>
                         )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-bold text-gray-900 truncate text-lg group-hover:text-blue-600 transition-colors">
                            {participant.firstName} {participant.lastName}
                          </h3>
                          <div className="flex items-center space-x-3">
                            <span className="text-sm text-gray-500 font-medium">
                              {new Date(chat.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {(chat.unreadCount || 0) > 0 && (
                              <span className="min-w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
                                {chat.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-gray-600 truncate text-base">
                          {chat.lastMessage}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {filteredChats.length === 0 && (
            <div className="text-center py-16">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Aucune conversation trouvée
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Commencez une conversation avec un expert pour démarrer.
              </p>
              <Link href="/experts" className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-semibold hover:bg-blue-700 transition-colors whitespace-nowrap">
                Trouver un expert
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
