'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import ApiService from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import AppHeader from '@/components/AppHeader';
import Footer from '@/components/Footer';
import { useSocket } from '@/contexts/SocketContext';

// --- Définition des types ---
interface Participant {
  user: {
    id: number;
    firstName: string;
    lastName: string;
    avatar: string;
    isOnline: boolean;
    specialty: string;
  };
}

interface Conversation {
  id: number;
  participants: Participant[];
  isFree: boolean;
}

interface Message {
  id: number;
  content: string;
  timestamp: string;
  senderId: number;
  conversationId: number; // Essentiel pour le temps réel
  sender: {
    avatar: string;
  };
  isRead?: boolean;
}

export default function ChatInterface() {
  const params = useParams();
  const chatId = params.id ? parseInt(params.id as string) : null;
  const { user, updateUser } = useAuth();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isConversationFree, setIsConversationFree] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  const otherParticipant = conversation?.participants.find((p: any) => p.user.id !== user?.id)?.user;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const socket = useSocket()
  const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, '') : '');
  const buildUserCandidates = (id?: number, avatar?: string, name?: string, size: number = 48) => {
    const list: string[] = [];
    if (backendBase && id) {
      list.push(`${backendBase}/api/assets/users/${id}`);
      ['jpg','jpeg','png','webp'].forEach(ext => list.push(`${backendBase}/images/users/${id}.${ext}`));
      // Also try expert images keyed by user id
      list.push(`${backendBase}/api/assets/experts/${id}`);
      ['jpg','jpeg','png','webp'].forEach(ext => list.push(`${backendBase}/images/experts/${id}.${ext}`));
    }
    if (avatar) {
      const raw = avatar.replace(/\\/g, '/');
      if (/^(https?:)?\/\//i.test(raw) || raw.startsWith('data:')) list.push(raw);
      else if (backendBase) list.push(raw.startsWith('/') ? `${backendBase}${raw}` : `${backendBase}/${raw}`);
      else list.push(raw);
    }
    list.push(`https://ui-avatars.com/api/?name=${encodeURIComponent(name||'User')}&size=${size}`);
    return Array.from(new Set(list));
  };

  // --- Chargement des données et actualisation ---
  useEffect(() => {
    if (!user || !chatId) return;

    const loadData = async () => {
      try {
        setLoading(true);
        const convRes = await ApiService.getConversations();
        if (convRes.success && convRes.data) {
          const currentConv = convRes.data.find((c: any) => c.id === chatId);
          if (currentConv) {
            setConversation(currentConv);
            setIsConversationFree(currentConv.isFree);
          } else {
            throw new Error("Conversation introuvable.");
          }
        }
        await fetchMessages();
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [chatId, user]);

  const fetchMessages = async () => {
    if (!chatId) return;
    try {
      const res = await ApiService.getMessages(chatId);
      if (res.success && res.data) setMessages(res.data);
    } catch (err) {
      console.error("Erreur de rafraîchissement:", err);
    }
  };

  useEffect(() => {
      // Charger les messages une seule fois au début
      fetchMessages();
  }, [chatId]);

  // Marquer comme lus dès que la conversation est ouverte/chargée
  useEffect(() => {
    if (!chatId || !user) return;
    ApiService.markAllMessagesAsRead(chatId).catch(() => {});
  }, [chatId, user]);

  useEffect(() => {
      if (!socket) return;

      // Quand on reçoit un nouveau message du serveur
      const handleNewMessage = (newMessage: Message) => {
          // On vérifie si le message appartient à la conversation actuelle
          if (newMessage.conversationId === chatId) {
              // Empêcher les doublons (ex: message déjà ajouté côté sender)
              setMessages((prevMessages) => {
                if (prevMessages.some(m => m.id === newMessage.id)) {
                  return prevMessages;
                }
                return [...prevMessages, newMessage];
              });
          }
          // Ici, vous pourriez aussi afficher une notification globale
      };

      socket.on('newMessage', handleNewMessage);

      // Marquer comme lus si je reçois un message dans la conversation ouverte
      const markReadOnArrive = (newMessage: Message) => {
        if (newMessage.conversationId === chatId && newMessage.senderId !== user?.id) {
          ApiService.markAllMessagesAsRead(chatId!).catch(() => {});
        }
      };
      socket.on('newMessage', markReadOnArrive);

      // Quand l'autre a lu mes messages -> marquer localement comme lus
      const handleMessagesRead = (data: { conversationId: number; readerId: number }) => {
        if (data.conversationId === chatId) {
          setMessages(prev => prev.map((m: any) => m.senderId === user?.id ? { ...m, isRead: true } : m));
        }
      };
      socket.on('messagesRead', handleMessagesRead);

      // Nettoyer l'écouteur en quittant
      return () => {
          socket.off('newMessage', handleNewMessage);
          socket.off('newMessage', markReadOnArrive);
          socket.off('messagesRead', handleMessagesRead);
      };
  }, [socket, chatId, user]);

  // Cette fonction s'assure que seul le conteneur des messages défile.
  const scrollToBottom = (behavior: 'auto' | 'instant' = 'instant') => {
    const el = messagesEndRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // --- Logique d'envoi et de monétisation ---
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !conversation || !otherParticipant) return;
    setSubmitting(true);
    const messageToSend = message;
    setMessage('');
    try {
      const response = await ApiService.sendMessage(conversation.id, otherParticipant.id, messageToSend);
      if (response.success) {
        // Eviter un doublon si le message est déjà arrivé via Socket.io
        setMessages(prev => {
          if (prev.some(m => m.id === response.data.id)) return prev;
          return [...prev, response.data];
        });
        const me = await ApiService.getMe();
        if (me.success) updateUser(me.data);
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      if (err.message === 'Solde de coins insuffisant.') {
        setShowPaymentModal(true);
      } else {
        alert(err.message || "Erreur lors de l'envoi");
      }
      setMessage(messageToSend);
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleToggleFree = async () => {
    if (!conversation) return;
    try {
        const response = await ApiService.toggleConversationFree(conversation.id);
        if (response.success) {
            setIsConversationFree(response.data.isFree);
        }
    } catch (err) {
        alert("Erreur lors du changement de statut.");
    }
  };
  
  if (loading) return <div className="p-8 text-center">Chargement...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Erreur : {error}</div>;
  if (!user || !conversation || !otherParticipant) return <div className="p-8 text-center">Conversation introuvable.</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AppHeader />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full">
        {/* **SOLUTION POUR LE DÉFILEMENT** : Le conteneur principal du chat a une hauteur définie */}
        <div className="bg-white rounded-lg shadow-sm flex flex-col h-[calc(100vh-150px)]">
          {/* Chat Header (hauteur fixe) */}
          <div className="p-6 border-b bg-white rounded-t-lg flex-shrink-0">
             <div className="flex items-center justify-between">
               <div className="flex items-center space-x-4">
                 <Link href="/dashboard/chat" className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
                   <i className="ri-arrow-left-line text-gray-600"></i>
                 </Link>
                 <div className="relative">
                   {(() => {
                     const cand = buildUserCandidates(otherParticipant.id, otherParticipant.avatar, `${otherParticipant.firstName} ${otherParticipant.lastName}`, 48);
                     const first = cand[0];
                     const fallback = cand[cand.length - 1];
                     return (
                      <img
                        src={first}
                        alt={otherParticipant.firstName}
                        className="w-12 h-12 rounded-full object-cover"
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
                   {otherParticipant.isOnline && (
                     <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                   )}
                 </div>
                 <div>
                   <h3 className="font-semibold text-gray-900">{otherParticipant.firstName} {otherParticipant.lastName}</h3>
                   <p className="text-sm text-gray-600">{otherParticipant.specialty}</p>
                 </div>
               </div>
               <div className="flex items-center space-x-2">
                 <div className="flex items-center space-x-2 px-3 py-1 bg-blue-50 rounded-full">
                   <i className="ri-coins-line text-blue-600"></i>
                   <span className="text-sm font-medium text-blue-600">{user?.coins || 0} coins</span>
                 </div>
                 {user?.userType === 'expert' && (
                    <button
                        onClick={handleToggleFree}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                            isConversationFree 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        {isConversationFree ? 'Gratuit' : 'Payant'}
                    </button>
                 )}
               </div>
             </div>
          </div>

          {/* **SOLUTION POUR LE DÉFILEMENT** : Ce conteneur prend le reste de la place et défile si nécessaire */}
          <div
            ref={messagesEndRef}
            className="flex-1 overflow-y-auto p-6 space-y-4"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-end gap-3 my-2 ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
              >
                {msg.senderId !== user?.id && (() => {
                  const cand = buildUserCandidates(msg.senderId, msg.sender?.avatar, otherParticipant ? `${otherParticipant.firstName} ${otherParticipant.lastName}` : 'User', 40);
                  const first = cand[0];
                  const fallback = cand[cand.length - 1];
                  return (
                    <img
                      src={first}
                      className="w-8 h-8 rounded-full object-cover"
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
                <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${msg.senderId === user?.id ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-200 text-gray-900 rounded-bl-none'}`}>
                  <p className="text-sm">{msg.content}</p>
                  {msg.senderId === user?.id && (
                    <div className="mt-1 text-[10px] opacity-80 text-right">{msg.isRead ? 'Lu' : 'Envoyé'}</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Message Input (hauteur fixe) */}
          <footer className="p-6 border-t bg-white rounded-b-lg flex-shrink-0">
            <form onSubmit={handleSendMessage} className="flex items-center space-x-4">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tapez votre message..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={!message.trim() || submitting}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {submitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <i className="ri-send-plane-line"></i>}
              </button>
            </form>
          </footer>
        </div>
      </div>
      <Footer />
    </div>
  );
}
