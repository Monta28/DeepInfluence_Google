"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { JitsiMeeting } from "@jitsi/react-sdk";

interface JitsiSessionProps {
  sessionId: string;
}

interface JaasTokenResponse {
  success: boolean;
  token?: string;
  roomName?: string;
  appId?: string;
  domain?: string;
  message?: string;
  isModerator?: boolean;
  hourlyRate?: number;
  perMinute?: number;
}

interface MeterResponse {
  success: boolean;
  perMinute?: number;
  elapsedSec?: number;
  message?: string;
}

export default function JitsiSession({ sessionId }: JitsiSessionProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jaasData, setJaasData] = useState<{
    token: string;
    roomName: string;
    appId: string;
    domain: string;
    isModerator: boolean;
    hourlyRate: number;
    perMinute: number;
  } | null>(null);

  // Timer et coins state
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [perMinute, setPerMinute] = useState(0);
  const [expertConnected, setExpertConnected] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [meterStarted, setMeterStarted] = useState(false);
  const [timerPaused, setTimerPaused] = useState(false);

  const apiRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const authTokenRef = useRef<string | null>(null);
  const timerPausedRef = useRef(false); // Ref pour suivre l'état de pause actuel
  const meterStartedRef = useRef(false); // Ref pour suivre si le meter a démarré

  // Fonction pour récupérer le tarif du rendez-vous
  const fetchAppointmentRate = useCallback(async () => {
    if (!authTokenRef.current) return;

    try {
      // Extraire l'ID du rendez-vous depuis sessionId (format: session-XX)
      const appointmentId = sessionId.replace('session-', '');
      const res = await fetch(`/api/appointments/${appointmentId}`, {
        headers: {
          'Authorization': `Bearer ${authTokenRef.current}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        console.log('📋 Données rendez-vous:', data);
        // Le tarif horaire de l'expert
        const hourlyRate = data.appointment?.expertRel?.hourlyRate || data.hourlyRate || 0;
        const ratePerMinute = Math.max(1, Math.ceil(hourlyRate / 60));
        setPerMinute(ratePerMinute);
        console.log('💵 Tarif récupéré:', hourlyRate, '/heure =', ratePerMinute, '/min');
      }
    } catch (err) {
      console.error('Erreur récupération tarif:', err);
    }
  }, [sessionId]);

  // Fonction pour formater le temps
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculer les coins consommés (par tranches de 15 minutes)
  // 0-15 min = 15 min, 16-30 min = 30 min, etc.
  const elapsedMinutes = Math.ceil(elapsedSeconds / 60);
  const blocksOf15 = elapsedSeconds > 0 ? Math.ceil(elapsedMinutes / 15) : 0;
  const billedMinutes = blocksOf15 * 15;
  // Calculer directement avec le tarif horaire pour éviter les erreurs d'arrondi
  // 150/h = 2.5/min, donc 15 min = 37.5 coins
  const coinsUsedRaw = billedMinutes * (jaasData?.hourlyRate || 0) / 60;
  // Afficher avec 1 décimale si nécessaire, sinon entier
  const coinsUsed = Number.isInteger(coinsUsedRaw) ? coinsUsedRaw : parseFloat(coinsUsedRaw.toFixed(1));

  // Démarrer le compteur
  const startMeter = useCallback(async () => {
    if (meterStarted || !authTokenRef.current) {
      console.log('⏭️ startMeter ignoré: meterStarted=', meterStarted, 'authToken=', !!authTokenRef.current);
      return;
    }

    console.log('🚀 Tentative de démarrage du compteur pour sessionId:', sessionId);

    try {
      const res = await fetch(`/api/video/meter/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokenRef.current}`
        },
        body: JSON.stringify({ sessionId })
      });

      const data: MeterResponse = await res.json();
      console.log('📊 Réponse meter/start:', data);

      if (data.success) {
        setPerMinute(data.perMinute || 0);
        setElapsedSeconds(data.elapsedSec || 0);
        setMeterStarted(true);
        console.log('💰 Compteur démarré:', data.perMinute, 'coins/min');
      } else {
        // Le compteur API a échoué, mais on démarre quand même le timer local
        console.warn('⚠️ Compteur API non démarré:', data.message);
        // Le tarif a déjà été défini depuis la réponse JaaS token
        setMeterStarted(true);
        console.log('💰 Timer local démarré (mode hors ligne), tarif actuel:', perMinute);
      }
    } catch (err) {
      console.error('❌ Erreur démarrage compteur:', err);
      // En cas d'erreur, le timer local démarre quand même
      // Le tarif a déjà été défini depuis la réponse JaaS token
      setMeterStarted(true);
      console.log('💰 Timer local démarré (erreur API), tarif actuel:', perMinute);
    }
  }, [sessionId, meterStarted]);

  // Envoyer un heartbeat
  const sendHeartbeat = useCallback(async () => {
    if (!authTokenRef.current) return;

    try {
      const res = await fetch(`/api/video/meter/heartbeat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokenRef.current}`
        },
        body: JSON.stringify({ sessionId })
      });

      const data: MeterResponse = await res.json();
      if (data.success && data.elapsedSec !== undefined) {
        setElapsedSeconds(data.elapsedSec);
      }
    } catch (err) {
      console.error('Erreur heartbeat:', err);
    }
  }, [sessionId]);

  // Arrêter le compteur
  const stopMeter = useCallback(async () => {
    if (!authTokenRef.current) return;

    try {
      await fetch(`/api/video/meter/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokenRef.current}`
        },
        body: JSON.stringify({ sessionId })
      });
      console.log('💰 Compteur arrêté');
    } catch (err) {
      console.error('Erreur arrêt compteur:', err);
    }
  }, [sessionId]);

  // Récupérer le token JaaS depuis le backend
  useEffect(() => {
    const fetchJaasToken = async () => {
      try {
        const authToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        authTokenRef.current = authToken;

        if (!authToken) {
          const next = encodeURIComponent(`/video-session/${sessionId}`);
          router.push(`/signin?next=${next}`);
          return;
        }

        // Vérifier l'authentification
        const authRes = await fetch(`/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${authToken}` },
          cache: 'no-store'
        });

        if (!authRes.ok) {
          localStorage.removeItem('token');
          router.push(`/signin?next=${encodeURIComponent(`/video-session/${sessionId}`)}`);
          return;
        }

        // Récupérer le token JaaS
        const jaasRes = await fetch(`/api/video/jaas-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({ sessionId })
        });

        const data: JaasTokenResponse = await jaasRes.json();

        if (!jaasRes.ok || !data.success) {
          throw new Error(data.message || 'Erreur lors de la récupération du token JaaS');
        }

        if (!data.token || !data.roomName || !data.appId) {
          throw new Error('Données JaaS incomplètes');
        }

        setJaasData({
          token: data.token,
          roomName: data.roomName,
          appId: data.appId,
          domain: data.domain || '8x8.vc',
          isModerator: data.isModerator || false,
          hourlyRate: data.hourlyRate || 0,
          perMinute: data.perMinute || 0
        });

        // Définir le tarif par minute dès maintenant
        if (data.perMinute) {
          setPerMinute(data.perMinute);
          console.log('💵 Tarif défini depuis JaaS:', data.perMinute, 'coins/min');
        }

        // Si c'est l'expert, il est connecté
        if (data.isModerator) {
          setExpertConnected(true);
        }

        console.log('✅ Token JaaS récupéré, isModerator:', data.isModerator);
      } catch (err: any) {
        console.error('Erreur JaaS:', err);
        setError(err.message || 'Erreur de connexion');
      } finally {
        setLoading(false);
      }
    };

    fetchJaasToken();
  }, [sessionId, router]);

  // Gérer le timer local quand l'expert est connecté et le timer n'est pas en pause
  useEffect(() => {
    if (expertConnected && meterStarted && !timerPaused) {
      // Démarrer le timer local
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);

      // Démarrer les heartbeats (toutes les 10 secondes)
      heartbeatRef.current = setInterval(() => {
        sendHeartbeat();
      }, 10000);
    } else {
      // Arrêter le timer si l'expert n'est pas connecté ou en pause
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [expertConnected, meterStarted, timerPaused, sendHeartbeat]);

  // Synchroniser les refs avec les états
  useEffect(() => {
    timerPausedRef.current = timerPaused;
  }, [timerPaused]);

  useEffect(() => {
    meterStartedRef.current = meterStarted;
  }, [meterStarted]);

  // Fonction pour basculer la pause du timer (expert uniquement)
  // Envoie aussi un message à tous les participants pour synchroniser
  const toggleTimerPause = useCallback(() => {
    const newPausedState = !timerPaused;
    setTimerPaused(newPausedState);
    timerPausedRef.current = newPausedState;
    console.log(newPausedState ? '⏸️ Timer en pause' : '▶️ Timer repris');

    // Envoyer l'état de pause à tous les participants via Jitsi
    if (apiRef.current) {
      try {
        const syncMessage = `__TIMER_SYNC__:${newPausedState ? 'PAUSED' : 'RESUMED'}`;

        // Méthode 1: Envoyer via chat (message public)
        apiRef.current.executeCommand('sendChatMessage', syncMessage);
        console.log('📤 Sync message envoyé via chat:', syncMessage);

        // Méthode 2: Envoyer via data channel à tous les participants (plus fiable)
        try {
          apiRef.current.executeCommand('sendEndpointTextMessage', '', syncMessage);
          console.log('📤 Sync message envoyé via data channel:', syncMessage);
        } catch (e) {
          console.log('Data channel non disponible, utilisation du chat uniquement');
        }
      } catch (err) {
        console.error('Erreur envoi sync:', err);
      }
    }
  }, [timerPaused]);

  // Construire le nom d'affichage
  const displayName = user
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Participant'
    : 'Participant';

  const handleApiReady = (api: any) => {
    apiRef.current = api;
    console.log('🎥 Jitsi API ready - en attente du clic sur "Rejoindre la réunion"');

    // NE PAS démarrer le compteur ici - attendre videoConferenceJoined
    // Le timer ne démarre que quand l'utilisateur clique vraiment sur "Rejoindre la réunion"

    // Écouter le nombre de participants
    api.addEventListener('participantJoined', (participant: any) => {
      console.log('👤 Participant joined:', participant);
      setParticipantCount(prev => {
        const newCount = prev + 1;
        console.log('👥 Nouveau nombre de participants:', newCount);
        return newCount;
      });

      // Vérifier si c'est un modérateur (expert)
      // Note: JaaS ne fournit pas directement cette info via l'événement
      // On considère que si quelqu'un rejoint et qu'on n'est pas modérateur, c'est l'expert
      if (!jaasData?.isModerator) {
        console.log('🟢 Un participant a rejoint (je suis client) - expertConnected = true');
        setExpertConnected(true);
      }

      // Si on est l'expert et le timer est en pause, envoyer l'état au nouveau participant
      if (jaasData?.isModerator && timerPausedRef.current) {
        setTimeout(() => {
          try {
            const syncMessage = '__TIMER_SYNC__:PAUSED';
            // Envoyer via chat
            api.executeCommand('sendChatMessage', syncMessage);
            // Envoyer via data channel au nouveau participant
            try {
              api.executeCommand('sendEndpointTextMessage', participant.id || '', syncMessage);
            } catch (e) {
              console.log('Data channel non disponible pour nouveau participant');
            }
            console.log('📤 Sync envoyé au nouveau participant: PAUSED');
          } catch (err) {
            console.error('Erreur sync nouveau participant:', err);
          }
        }, 1000); // Petit délai pour s'assurer que le participant est prêt
      }
    });

    api.addEventListener('participantLeft', (participant: any) => {
      console.log('👋 Participant left:', participant);
      setParticipantCount(prev => Math.max(0, prev - 1));

      // Si un participant part et qu'on n'est pas modérateur, peut-être que l'expert est parti
      // On vérifie le nombre de participants restants
      const count = api.getNumberOfParticipants();
      if (count <= 1 && !jaasData?.isModerator) {
        setExpertConnected(false);
      }
    });

    // Fonction pour gérer l'entrée en conférence
    const handleConferenceJoin = () => {
      if (meterStartedRef.current) {
        console.log('⏭️ Conférence déjà jointe, ignoré');
        return;
      }

      console.log('📹 Joined conference - isModerator:', jaasData?.isModerator);

      // Démarrer le compteur MAINTENANT (quand on rejoint vraiment la réunion)
      console.log('🎬 Appel de startMeter()...');
      startMeter();

      // Obtenir le nombre initial de participants
      const count = api.getNumberOfParticipants();
      console.log('👥 Nombre de participants:', count);
      setParticipantCount(count);

      // Si c'est l'expert qui rejoint, marquer comme connecté
      if (jaasData?.isModerator) {
        console.log('🟢 Expert (moi) rejoint - expertConnected = true');
        setExpertConnected(true);
      }
      // Si plus d'un participant et on n'est pas modérateur, l'expert est déjà là
      else if (count > 1) {
        console.log('🟢 Expert déjà présent (count > 1) - expertConnected = true');
        setExpertConnected(true);
      } else {
        console.log('🟡 En attente de l\'expert (count=', count, ')');
      }
    };

    api.addEventListener('videoConferenceJoined', handleConferenceJoin);

    // Écouter aussi d'autres événements qui indiquent que la conférence a commencé
    api.addEventListener('participantRoleChanged', (event: any) => {
      console.log('🎭 Participant role changed:', event);
      if (!meterStartedRef.current) {
        handleConferenceJoin();
      }
    });

    api.addEventListener('subjectChange', (event: any) => {
      console.log('📝 Subject changed:', event);
      if (!meterStartedRef.current) {
        handleConferenceJoin();
      }
    });

    api.addEventListener('videoConferenceLeft', () => {
      console.log('📴 Conference left');
      stopMeter();
      router.push('/dashboard');
    });

    api.addEventListener('readyToClose', () => {
      console.log('🚪 Ready to close');
      stopMeter();
      router.push('/dashboard');
    });

    // Fonction helper pour traiter les messages de synchronisation
    const handleSyncMessage = (message: string, source: string) => {
      console.log(`📩 Message reçu (${source}):`, message);

      // Vérifier si c'est un message de synchronisation du timer
      if (message && message.startsWith('__TIMER_SYNC__:')) {
        const action = message.replace('__TIMER_SYNC__:', '');
        if (action === 'PAUSED') {
          console.log('⏸️ Timer synchronisé: PAUSE reçue');
          setTimerPaused(true);
          timerPausedRef.current = true;
        } else if (action === 'RESUMED') {
          console.log('▶️ Timer synchronisé: REPRISE reçue');
          setTimerPaused(false);
          timerPausedRef.current = false;
        }
      }
    };

    // Écouter les messages entrants pour la synchronisation (méthode principale)
    api.addEventListener('incomingMessage', (event: any) => {
      const message = event.message || event.text || '';
      handleSyncMessage(message, 'incomingMessage');
    });

    // Écouter aussi endpointTextMessageReceived comme backup
    api.addEventListener('endpointTextMessageReceived', (event: any) => {
      const message = event.data?.text || event.text || '';
      handleSyncMessage(message, 'endpointTextMessageReceived');
    });

    // Écouter chatUpdated pour capturer les messages via le chat
    api.addEventListener('chatUpdated', (event: any) => {
      if (event.isOpen === false) return;
      // Les messages dans chatUpdated ont une structure différente
      const messages = event.unreadCount > 0 ? event.messages : [];
      if (messages && messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage && lastMessage.message) {
          handleSyncMessage(lastMessage.message, 'chatUpdated');
        }
      }
    });
  };

  const handleReadyToClose = () => {
    stopMeter();
    router.push('/dashboard');
  };

  // Cleanup au démontage
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, []);

  // État de chargement
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-xl">Préparation de la session vidéo...</p>
        </div>
      </div>
    );
  }

  // État d'erreur
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <p className="text-xl mb-4">Erreur de connexion</p>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg"
          >
            Retour au dashboard
          </button>
        </div>
      </div>
    );
  }

  // Pas de données JaaS
  if (!jaasData || !user) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl">Authentification requise</p>
        </div>
      </div>
    );
  }

  // Le nom de room pour JaaS doit inclure l'appId
  const fullRoomName = `${jaasData.appId}/${jaasData.roomName}`;

  return (
    <div className="min-h-screen bg-gray-900 relative">
      {/* Timer et Coins Overlay */}
      <div className="absolute top-4 left-4 z-50 bg-gray-800/90 backdrop-blur-sm rounded-lg p-4 shadow-lg">
        <div className="flex items-center gap-6">
          {/* Timer */}
          <div className="text-center">
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Durée</div>
            <div className={`text-2xl font-mono font-bold ${
              timerPaused
                ? 'text-orange-400 animate-pulse'
                : expertConnected
                  ? 'text-green-400'
                  : 'text-yellow-400'
            }`}>
              {formatTime(elapsedSeconds)}
            </div>
          </div>

          {/* Séparateur */}
          <div className="h-10 w-px bg-gray-600"></div>

          {/* Coins */}
          <div className="text-center">
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Coins</div>
            <div className="text-2xl font-bold text-yellow-400">
              {coinsUsed}
            </div>
          </div>

          {/* Séparateur */}
          <div className="h-10 w-px bg-gray-600"></div>

          {/* Tarif */}
          <div className="text-center">
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Tarif</div>
            <div className="text-lg text-gray-300">
              {jaasData?.hourlyRate || 0} <span className="text-xs text-gray-500">/heure</span>
            </div>
          </div>

          {/* Séparateur */}
          <div className="h-10 w-px bg-gray-600"></div>

          {/* Minutes facturées */}
          <div className="text-center">
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Facturé</div>
            <div className="text-lg text-blue-400">
              {billedMinutes} <span className="text-xs text-gray-500">min</span>
            </div>
          </div>
        </div>

        {/* Indicateur de statut et bouton pause */}
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className={`text-center text-xs px-3 py-1 rounded-full ${
            timerPaused
              ? 'bg-orange-500/20 text-orange-400'
              : expertConnected
                ? 'bg-green-500/20 text-green-400'
                : 'bg-yellow-500/20 text-yellow-400'
          }`}>
            {timerPaused
              ? '⏸️ Timer en pause'
              : expertConnected
                ? (jaasData.isModerator ? '🟢 Vous êtes l\'expert' : '🟢 Expert connecté - Timer actif')
                : '🟡 En attente de l\'expert...'}
          </div>

          {/* Bouton Pause/Reprendre (visible uniquement pour l'expert) */}
          {jaasData.isModerator && meterStarted && (
            <button
              onClick={toggleTimerPause}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                timerPaused
                  ? 'bg-green-600 hover:bg-green-500 text-white'
                  : 'bg-orange-600 hover:bg-orange-500 text-white'
              }`}
            >
              {timerPaused ? '▶️ Reprendre' : '⏸️ Pause'}
            </button>
          )}
        </div>
      </div>

      {/* Jitsi Meeting */}
      <JitsiMeeting
        domain={jaasData.domain}
        roomName={fullRoomName}
        jwt={jaasData.token}
        configOverwrite={{
          prejoinPageEnabled: true, // Activer la page de pré-jonction
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          disableDeepLinking: true,
          enableChat: true,
          enableScreenSharing: true,
          disableInviteFunctions: true,
          defaultLanguage: 'fr',
          disableAP: false,
          resolution: 720,
          constraints: {
            video: {
              height: { ideal: 720, max: 720, min: 180 }
            }
          },
          disableReactions: false,
          disableTileView: false,
          enableLobby: false,
          lobbyModeEnabled: false,
          hideConferenceSubject: true,
          hideConferenceTimer: true,
          fileRecordingsEnabled: true,
          liveStreamingEnabled: false,
          enableUserRolesBasedOnToken: true,
          enableClosePage: false,
        }}
        interfaceConfigOverwrite={{
          TOOLBAR_BUTTONS: [
            'microphone',
            'camera',
            'desktop',
            'chat',
            'raisehand',
            'participants-pane',
            'tileview',
            'select-background',
            'settings',
            'recording',
            'hangup'
          ],
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          SHOW_CHROME_EXTENSION_BANNER: false,
          SHOW_PROMOTIONAL_CLOSE_PAGE: false,
          FILM_STRIP_MAX_HEIGHT: 120,
          VERTICAL_FILMSTRIP: true,
          HIDE_INVITE_MORE_HEADER: true,
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
          DISABLE_PRESENCE_STATUS: false,
          DEFAULT_BACKGROUND: '#1a1a2e',
          DEFAULT_LOCAL_DISPLAY_NAME: 'Moi',
          DEFAULT_REMOTE_DISPLAY_NAME: 'Participant',
          TILE_VIEW_MAX_COLUMNS: 5,
        }}
        userInfo={{
          displayName: displayName,
          email: user.email || '',
        }}
        onApiReady={handleApiReady}
        onReadyToClose={handleReadyToClose}
        getIFrameRef={(iframeRef) => {
          iframeRef.style.height = '100vh';
          iframeRef.style.width = '100%';
          iframeRef.style.border = 'none';
        }}
        spinner={() => (
          <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-xl">Connexion à la conférence...</p>
            </div>
          </div>
        )}
      />
    </div>
  );
}
