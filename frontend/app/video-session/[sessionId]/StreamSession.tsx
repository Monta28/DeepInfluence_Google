"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  StreamVideo,
  StreamVideoClient,
  StreamCall,
  ParticipantView
} from '@stream-io/video-react-sdk';
import '@stream-io/video-react-sdk/dist/css/styles.css';

export default function StreamSession({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [callId, setCallId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ id: string; text: string; userId: string; userName: string; timestamp: number }>>([]);
  const [messageInput, setMessageInput] = useState('');
  const [participants, setParticipants] = useState<any[]>([]);
  const [dominantSpeaker, setDominantSpeaker] = useState<string | null>(null);
  const clientRef = useRef<StreamVideoClient | null>(null);
  const callRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const raw = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!raw) {
          const next = encodeURIComponent(`/video-session/${sessionId}`);
          router.push(`/signin?next=${next}`);
          return;
        }
        const me = await fetch(`/api/auth/me`, { headers: { 'Authorization': `Bearer ${raw}` }, cache: 'no-store' });
        if (!me.ok) {
          localStorage.removeItem('token');
          router.push(`/signin?next=${encodeURIComponent(`/video-session/${sessionId}`)}`);
          return;
        }
        const r = await fetch(`/api/video/create-room`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${raw}` },
          body: JSON.stringify({ sessionId })
        });
        const data = await r.json().catch(() => ({}));
        if (!r.ok || !data?.success) throw new Error(data?.message || 'create-room failed');

        setApiKey(data.apiKey || null);
        setUserToken(data.token || null);
        setCallId(data.roomId || null);
      } catch (e) {
        console.error('StreamSession init error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [sessionId, router]);

  useEffect(() => {
    if (!apiKey || !userToken || !user) return;

    const initClient = async () => {
      try {
        setReady(false);

        // Clean up existing client if any
        if (clientRef.current) {
          try {
            await clientRef.current.disconnectUser();
          } catch (e) {
            console.log('Cleanup error:', e);
          }
        }

        // Create new client
        const client = new StreamVideoClient({
          apiKey,
          user: {
            id: String(user.id),
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User'
          },
          token: userToken
        });

        clientRef.current = client;

        // Create and join call
        if (callId) {
          const call = client.call('default', callId);
          await call.join({ create: true });
          callRef.current = call;
          setReady(true);
        }
      } catch (e) {
        console.error('Client init error:', e);
        setReady(false);
      }
    };

    initClient();

    return () => {
      setReady(false);
      if (callRef.current) {
        callRef.current.leave().catch(() => {});
        callRef.current = null;
      }
      if (clientRef.current) {
        clientRef.current.disconnectUser().catch(() => {});
        clientRef.current = null;
      }
    };
  }, [apiKey, userToken, user, callId]);

  // Listen to call state changes for participants and dominant speaker
  useEffect(() => {
    if (!callRef.current || !ready) return;

    const updateParticipants = () => {
      const call = callRef.current;
      if (!call?.state?.participants) return;

      const participantList = Array.from(call.state.participants.values());
      setParticipants(participantList);

      // Get dominant speaker
      if (call.state.dominantSpeaker) {
        setDominantSpeaker(call.state.dominantSpeaker.userId);
      }
    };

    // Initial update
    updateParticipants();

    // Subscribe to call events (correct event names for Stream SDK)
    const unsubscribeJoined = callRef.current.on('call.participant_joined', updateParticipants);
    const unsubscribeLeft = callRef.current.on('call.participant_left', updateParticipants);
    const unsubscribeSpeaker = callRef.current.on('call.dominant_speaker_changed', updateParticipants);

    // Also poll every 2 seconds as a fallback
    const pollInterval = setInterval(updateParticipants, 2000);

    return () => {
      if (unsubscribeJoined) unsubscribeJoined();
      if (unsubscribeLeft) unsubscribeLeft();
      if (unsubscribeSpeaker) unsubscribeSpeaker();
      clearInterval(pollInterval);
    };
  }, [ready]);

  // Listen for custom messages (chat)
  useEffect(() => {
    if (!callRef.current || !ready) return;

    const handleCustomEvent = (event: any) => {
      if (event.custom?.type === 'chat') {
        const newMessage = {
          id: event.custom.id || String(Date.now()),
          text: event.custom.text || '',
          userId: event.user?.id || 'unknown',
          userName: event.user?.name || 'User',
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, newMessage]);
      }
    };

    const unsubscribe = callRef.current.on('call.custom_event', handleCustomEvent);

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [ready]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (loading || !ready) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-xl">Préparation de la session vidéo...</p>
        </div>
      </div>
    );
  }

  if (!clientRef.current || !callRef.current) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl">Erreur de connexion à la session vidéo</p>
        </div>
      </div>
    );
  }

  const handleLeave = async () => {
    if (callRef.current) {
      await callRef.current.leave();
    }
    router.push('/dashboard');
  };

  const toggleAudio = async () => {
    const call = callRef.current;
    if (!call) return;
    if (isMicOn) {
      await call.microphone.disable();
      setIsMicOn(false);
    } else {
      await call.microphone.enable();
      setIsMicOn(true);
    }
  };

  const toggleVideo = async () => {
    const call = callRef.current;
    if (!call) return;
    if (isCameraOn) {
      await call.camera.disable();
      setIsCameraOn(false);
    } else {
      await call.camera.enable();
      setIsCameraOn(true);
    }
  };

  const toggleScreenShare = async () => {
    const call = callRef.current;
    if (!call) return;
    try {
      if (isScreenSharing) {
        await call.screenShare.disable();
        setIsScreenSharing(false);
      } else {
        await call.screenShare.enable();
        setIsScreenSharing(true);
      }
    } catch (e) {
      console.error('Screen share error:', e);
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !callRef.current || !user) return;

    try {
      await callRef.current.sendCustomEvent({
        type: 'chat',
        id: `${user.id}-${Date.now()}`,
        text: messageInput.trim(),
      });

      // Add to local messages immediately
      setMessages(prev => [...prev, {
        id: `${user.id}-${Date.now()}`,
        text: messageInput.trim(),
        userId: String(user.id),
        userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'You',
        timestamp: Date.now()
      }]);

      setMessageInput('');
    } catch (e) {
      console.error('Send message error:', e);
    }
  };

  // Always show the OTHER user large (remote participant)
  const localParticipant = participants.find(p => p.isLocalParticipant);
  const remoteParticipants = participants.filter(p => !p.isLocalParticipant);

  let mainSpeaker = null;
  let sidebarParticipants: any[] = [];

  if (remoteParticipants.length > 0) {
    // Show first remote participant in main view
    mainSpeaker = remoteParticipants[0];
    // Show local participant in sidebar
    sidebarParticipants = [localParticipant].filter(Boolean);
  } else if (localParticipant) {
    // Only local participant (waiting for others)
    mainSpeaker = localParticipant;
    sidebarParticipants = [];
  }

  return (
    <StreamVideo client={clientRef.current}>
      <StreamCall call={callRef.current}>
        <div className="min-h-screen bg-gray-900 relative flex flex-col md:flex-row">
          {/* Main speaker view */}
          <div className="flex-1 relative flex items-center justify-center p-4">
            {mainSpeaker && (
              <div className="w-full h-full max-w-6xl max-h-[80vh] aspect-video bg-gray-800 rounded-lg overflow-hidden">
                <ParticipantView participant={mainSpeaker} />
              </div>
            )}
          </div>

          {/* Sidebar with other participants */}
          {sidebarParticipants.length > 0 && !isChatOpen && (
            <div className="md:w-64 w-full md:h-screen h-auto bg-gray-950 p-4 flex md:flex-col flex-row gap-4 overflow-auto">
              {sidebarParticipants.map((participant) => (
                <div key={participant.sessionId} className="md:w-full w-48 aspect-video bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                  <ParticipantView participant={participant} />
                </div>
              ))}
            </div>
          )}

          {/* Chat Panel */}
          {isChatOpen && (
            <div className="md:w-96 w-full md:h-screen h-96 bg-gray-950 flex flex-col">
              {/* Chat Header */}
              <div className="p-4 bg-gray-900 border-b border-gray-700 flex justify-between items-center">
                <h3 className="text-white font-semibold">Messages</h3>
                <button onClick={() => setIsChatOpen(false)} className="text-gray-400 hover:text-white">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="text-gray-500 text-center mt-8">Aucun message</div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={`flex flex-col ${msg.userId === String(user?.id) ? 'items-end' : 'items-start'}`}>
                      <div className="text-xs text-gray-400 mb-1">{msg.userName}</div>
                      <div className={`px-4 py-2 rounded-lg max-w-[80%] ${msg.userId === String(user?.id) ? 'bg-blue-600 text-white' : 'bg-gray-800 text-white'}`}>
                        {msg.text}
                      </div>
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 bg-gray-900 border-t border-gray-700">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Tapez un message..."
                    className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={sendMessage}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Control buttons */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 items-center bg-gray-800 px-6 py-4 rounded-full shadow-2xl z-10">
            <button onClick={toggleAudio} className={`w-12 h-12 rounded-full ${isMicOn ? 'bg-gray-600 hover:bg-gray-500' : 'bg-red-600 hover:bg-red-500'} flex items-center justify-center transition-colors`}>
              {isMicOn ? (
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" />
                  <path d="M5.5 9.643a.75.75 0 00-1.5 0V10c0 3.06 2.29 5.585 5.25 5.954V17.5h-1.5a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-1.5v-1.546A6.001 6.001 0 0016 10v-.357a.75.75 0 00-1.5 0V10a4.5 4.5 0 01-9 0v-.357z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 11c0 1.19-.34 2.3-.9 3.28l-1.23-1.23c.27-.62.43-1.31.43-2.05H19zM15 11.16L9 5.18V5a3 3 0 0 1 6 0v6.16zM4.27 3L3 4.27l6.01 6.01V11a3 3 0 0 0 5.41 1.74l1.38 1.38C15 15.44 13.64 16 12 16c-2.21 0-4-1.79-4-4H6c0 2.76 2.24 5 5 5 .28 0 .55-.03.81-.08L13.98 19H10v2h8v-2h-2.58l2.31 2.31L19 20.03l-8.71-8.71L3 4.27z"/>
                </svg>
              )}
            </button>
            <button onClick={toggleVideo} className={`w-12 h-12 rounded-full ${isCameraOn ? 'bg-gray-600 hover:bg-gray-500' : 'bg-red-600 hover:bg-red-500'} flex items-center justify-center transition-colors`}>
              {isCameraOn ? (
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.54-.18L19.73 21 21 19.73 3.27 2z"/>
                </svg>
              )}
            </button>
            <button onClick={toggleScreenShare} className={`w-12 h-12 rounded-full ${isScreenSharing ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-600 hover:bg-gray-500'} flex items-center justify-center transition-colors`}>
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M1 3c0-1.1.9-2 2-2h18c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2h-7v2h2c.55 0 1 .45 1 1s-.45 1-1 1H6c-.55 0-1-.45-1-1s.45-1 1-1h2v-2H3c-1.1 0-2-.9-2-2V3zm2 0v12h18V3H3zm9 6l4 4H8l4-4z"/>
              </svg>
            </button>
            <button onClick={() => setIsChatOpen(!isChatOpen)} className={`w-12 h-12 rounded-full ${isChatOpen ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-600 hover:bg-gray-500'} flex items-center justify-center transition-colors relative`}>
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3.293 3.293 3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
              {messages.length > 0 && !isChatOpen && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {messages.length}
                </span>
              )}
            </button>
            <button onClick={handleLeave} className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M6 10a.75.75 0 01.75-.75h9.546l-1.048-.943a.75.75 0 111.004-1.114l2.5 2.25a.75.75 0 010 1.114l-2.5 2.25a.75.75 0 11-1.004-1.114l1.048-.943H6.75A.75.75 0 016 10z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </StreamCall>
    </StreamVideo>
  );
}
