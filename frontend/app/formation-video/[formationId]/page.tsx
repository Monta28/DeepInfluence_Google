'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { useAuth } from '@/contexts/AuthContext';
import { io, Socket } from 'socket.io-client';

interface JaasTokenResponse {
  success: boolean;
  provider: string;
  token: string;
  roomName: string;
  appId: string;
  domain: string;
  isModerator: boolean;
  formationTitle: string;
  message?: string;
}

export default function FormationVideoPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const formationId = params?.formationId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jaasData, setJaasData] = useState<JaasTokenResponse | null>(null);
  const [participantCount, setParticipantCount] = useState(0);
  const [sessionEnded, setSessionEnded] = useState(false);

  const apiRef = useRef<any>(null);
  const socketRef = useRef<Socket | null>(null);

  // Récupérer le token JaaS pour la formation
  const fetchJaasToken = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Vous devez être connecté pour accéder à la vidéoconférence');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/video/formation-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ formationId })
      });

      const data: JaasTokenResponse = await res.json();

      if (!data.success) {
        setError(data.message || 'Erreur lors de la connexion à la vidéoconférence');
        setLoading(false);
        return;
      }

      setJaasData(data);
      setLoading(false);
    } catch (err: any) {
      setError(err?.message || 'Erreur de connexion');
      setLoading(false);
    }
  }, [formationId]);

  // Vérifier le statut de la session vidéo avant de rejoindre
  const checkSessionStatus = useCallback(async (): Promise<boolean> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return false;
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const res = await fetch(`${base}/formations/${formationId}/video/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        // Le propriétaire peut toujours rejoindre
        if (data.data.isOwner) return true;
        // Les autres peuvent rejoindre si canJoin est true
        return data.data.canJoin;
      }
      return false;
    } catch (e) {
      console.error('Error checking session status:', e);
      return false;
    }
  }, [formationId]);

  // Terminer la session vidéo (appelé quand le modérateur quitte)
  const stopVideoSession = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      await fetch(`${base}/formations/${formationId}/video/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
    } catch (e) {
      console.error('Error stopping video session:', e);
    }
  }, [formationId]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin');
      return;
    }

    if (!authLoading && user && formationId) {
      // Vérifier le statut de la session avant de récupérer le token
      checkSessionStatus().then(canJoin => {
        if (canJoin) {
          fetchJaasToken();
        } else {
          setError('La vidéoconférence n\'est pas encore accessible. L\'expert doit d\'abord lancer la formation.');
          setLoading(false);
        }
      });
    }
  }, [authLoading, user, formationId, fetchJaasToken, checkSessionStatus, router]);

  // Connexion Socket.IO pour écouter les événements de fin de session
  useEffect(() => {
    if (!user || !formationId) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
    const socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected for formation video');
    });

    // Écouter l'événement de fin de session
    socket.on('formationVideoEnded', (data: { formationId: number }) => {
      if (data.formationId === parseInt(formationId)) {
        console.log('Formation video session ended by expert');
        setSessionEnded(true);
        // Quitter la conférence Jitsi si connecté
        if (apiRef.current) {
          try {
            apiRef.current.executeCommand('hangup');
          } catch (e) {
            console.error('Error hanging up:', e);
          }
        }
        // Rediriger après un court délai
        setTimeout(() => {
          router.push(`/formations/${formationId}`);
        }, 2000);
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user, formationId, router]);

  const handleApiReady = (api: any) => {
    apiRef.current = api;
    console.log('🎬 JaaS API ready for formation');

    api.addEventListener('participantJoined', (participant: any) => {
      console.log('👤 Participant joined:', participant);
      setParticipantCount(prev => prev + 1);
    });

    api.addEventListener('participantLeft', (participant: any) => {
      console.log('👋 Participant left:', participant);
      setParticipantCount(prev => Math.max(0, prev - 1));
    });

    api.addEventListener('videoConferenceJoined', () => {
      console.log('📹 Joined formation conference');
      const count = api.getNumberOfParticipants();
      setParticipantCount(count);
    });

    api.addEventListener('videoConferenceLeft', () => {
      console.log('📴 Left formation conference');
      // Si c'est le modérateur qui quitte, arrêter la session
      if (jaasData?.isModerator) {
        console.log('🛑 Moderator leaving, stopping video session');
        stopVideoSession();
      }
      router.push(`/formations/${formationId}`);
    });

    api.addEventListener('readyToClose', () => {
      console.log('🚪 Ready to close');
      // Si c'est le modérateur qui quitte, arrêter la session
      if (jaasData?.isModerator) {
        console.log('🛑 Moderator closing, stopping video session');
        stopVideoSession();
      }
      router.push(`/formations/${formationId}`);
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl">Connexion à la vidéoconférence...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-6 max-w-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mx-auto mb-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <h2 className="text-xl font-semibold text-white mb-2">Erreur</h2>
            <p className="text-red-300 mb-4">{error}</p>
            <button
              onClick={() => router.push(`/formations/${formationId}`)}
              className="px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              Retour à la formation
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!jaasData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <p className="text-xl">Chargement...</p>
        </div>
      </div>
    );
  }

  // Afficher l'overlay de fin de session
  if (sessionEnded) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-8 max-w-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-400 mx-auto mb-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <h2 className="text-2xl font-semibold text-white mb-3">Session terminée</h2>
            <p className="text-blue-200 mb-6">L'expert a mis fin à la vidéoconférence de la formation.</p>
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white/70 text-sm">Redirection en cours...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-gray-900 relative">
      {/* Header avec info formation */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(`/formations/${formationId}`)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <div>
              <h1 className="text-white font-semibold text-lg">{jaasData.formationTitle}</h1>
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <span className="flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                  {participantCount} participant{participantCount > 1 ? 's' : ''}
                </span>
                {jaasData.isModerator && (
                  <span className="bg-purple-500/30 text-purple-300 px-2 py-0.5 rounded text-xs">
                    Modérateur
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Jitsi Meeting */}
      <JitsiMeeting
        domain={jaasData.domain}
        roomName={`${jaasData.appId}/${jaasData.roomName}`}
        jwt={jaasData.token}
        configOverwrite={{
          startWithAudioMuted: true,
          startWithVideoMuted: false,
          disableModeratorIndicator: false,
          enableEmailInStats: false,
          prejoinPageEnabled: true,
          disableDeepLinking: true,
          lang: 'fr',
          defaultLanguage: 'fr',
          toolbarButtons: [
            'camera',
            'chat',
            'closedcaptions',
            'desktop',
            'download',
            'embedmeeting',
            'etherpad',
            'feedback',
            'filmstrip',
            'fullscreen',
            'hangup',
            'help',
            'highlight',
            'invite',
            'linktosalesforce',
            'livestreaming',
            'microphone',
            'mute-everyone',
            'mute-video-everyone',
            'noisesuppression',
            'participants-pane',
            'profile',
            'raisehand',
            'recording',
            'security',
            'select-background',
            'settings',
            'shareaudio',
            'sharedvideo',
            'shortcuts',
            'stats',
            'tileview',
            'toggle-camera',
            'videoquality',
            'whiteboard',
          ],
        }}
        interfaceConfigOverwrite={{
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
          MOBILE_APP_PROMO: false,
          SHOW_CHROME_EXTENSION_BANNER: false,
          TOOLBAR_ALWAYS_VISIBLE: false,
          VIDEO_LAYOUT_FIT: 'both',
          HIDE_INVITE_MORE_HEADER: false,
          SHOW_PROMOTIONAL_CLOSE_PAGE: false,
          DEFAULT_BACKGROUND: '#1a1a2e',
          BRAND_WATERMARK_LINK: '',
          SHOW_BRAND_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_JITSI_WATERMARK: false,
        }}
        userInfo={{
          displayName: user ? `${user.firstName} ${user.lastName}` : 'Participant',
          email: user?.email || '',
        }}
        onApiReady={handleApiReady}
        getIFrameRef={(iframeRef) => {
          if (iframeRef) {
            iframeRef.style.height = '100%';
            iframeRef.style.width = '100%';
          }
        }}
        spinner={() => (
          <div className="h-screen w-screen flex items-center justify-center bg-gray-900">
            <div className="text-center text-white">
              <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-xl">Connexion à la conférence...</p>
            </div>
          </div>
        )}
      />
    </div>
  );
}
