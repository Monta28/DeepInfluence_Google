"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSocket } from "@/contexts/SocketContext";
import { useAuth } from "@/contexts/AuthContext";

interface VideoSessionProps {
  sessionId: string;
}

export default function VideoSession({ sessionId }: VideoSessionProps) {
  const router = useRouter();
  const socket = useSocket();
  const { user } = useAuth();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const screenShareRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const makingOfferRef = useRef(false);
  const ignoreOfferRef = useRef(false);
  const politeRef = useRef<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  // Guard to avoid concurrent setRemoteDescription(answer) calls
  const settingRemoteAnswerRef = useRef<boolean>(false);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("connecting");
  const [sessionTime, setSessionTime] = useState(0);
  const [sessionCost, setSessionCost] = useState(0);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatMessage, setChatMessage] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState<
    "idle" | "recording" | "stopped"
  >("idle");
  const [audioOnly, setAudioOnly] = useState(false);
  const [netQuality, setNetQuality] = useState<'good'|'ok'|'poor'>('good');
  const [netStats, setNetStats] = useState<{ bitrateKbps: number; rttMs: number; lossPct: number }>({ bitrateKbps: 0, rttMs: 0, lossPct: 0 });
  const lastStatsRef = useRef<{ ts: number; bytesSentVideo: number }>({ ts: 0, bytesSentVideo: 0 });
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  // Fonction helper pour ajouter debug info
  const addDebug = (message: string) => {
    console.log("DEBUG:", message);
    setDebugInfo(prev => [...prev.slice(-10), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const pricePerMinute = 3;

  useEffect(() => {
    (async () => {
      await initialize();
    })();
    const timer = setInterval(() => setSessionTime((t) => t + 1), 60000);
    return () => {
      clearInterval(timer);
      cleanup();
    };
  }, []);

  // Default polite side by role to ensure one side can start negotiation even if IDs are late
  useEffect(() => {
    if (user?.userType) {
      // Make expert the polite peer by default; user is impolite
      politeRef.current = user.userType === 'expert';
    }
  }, [user?.userType]);

  useEffect(() => {
    setSessionCost(sessionTime * pricePerMinute);
  }, [sessionTime]);

  // Determine polite side deterministically once both peers are present
  useEffect(() => {
    if (!socket) return;
    const onJoined = ({ userId: otherId }: any) => {
      addDebug(`Participant rejoint: ${otherId}, moi: ${user?.id}`);
      if (user?.id && otherId && user.id !== otherId) {
        politeRef.current = user.id > otherId;
        addDebug(`Je suis polite: ${politeRef.current}`);
        // Délai pour s'assurer que les deux pairs sont prêts
        setTimeout(() => {
          addDebug("Démarrage négociation (onJoined)");
          maybeStartNegotiation();
        }, 1000);
      }
    };
    const onPeers = ({ peers }: any) => {
      addDebug(`Pairs disponibles: [${peers}], moi: ${user?.id}`);
      if (Array.isArray(peers) && peers.length > 0 && user?.id) {
        // Determine polite based on first peer id (1:1)
        politeRef.current = user.id > peers[0];
        addDebug(`Je suis polite (peers): ${politeRef.current}`);
        setTimeout(() => {
          addDebug("Démarrage négociation (onPeers)");
          maybeStartNegotiation();
        }, 500);
      }
    };
    const onParticipantLeft = ({ userId: leftId }: any) => {
      console.log("Participant parti:", leftId);
      setIsConnected(false);
      setConnectionStatus("disconnected");
    };

    socket.on("session:participant-joined", onJoined);
    socket.on("session:peers", onPeers);
    socket.on("session:participant-left", onParticipantLeft);
    return () => {
      socket.off("session:participant-joined", onJoined);
      socket.off("session:peers", onPeers);
      socket.off("session:participant-left", onParticipantLeft);
    };
  }, [socket, user]);

  const initialize = async () => {
    try {
      addDebug("Initialisation session vidéo...");

      // Initial local media with more permissive constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          facingMode: "user"
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      addDebug(`Stream local obtenu: ${stream.getTracks().map((t: any) => t.kind).join(', ')}`);
      setLocalStream(stream);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        await localVideoRef.current.play().catch(e =>
          addDebug(`Erreur lecture vidéo locale: ${e.message}`)
        );
      }

      setupPeer(stream);

      if (socket && user?.id) {
        addDebug(`Rejoindre session ${sessionId} utilisateur ${user?.id}`);
        // Join with proper userId only
        socket.emit("joinSession", {
          sessionId,
          userId: user.id,
          role: user.userType || "user",
        });

        // Éviter les listeners multiples
        socket.off("webrtc:offer");
        socket.off("webrtc:answer");
        socket.off("webrtc:ice-candidate");
        socket.off("session:chat");
        socket.off("session:ended");

        // Test simple pour vérifier si les événements arrivent
        socket.on("webrtc:offer", (data) => {
          addDebug("🎯 Événement offer reçu (initial)!");
          onOffer(data);
        });
        socket.on("webrtc:answer", (data) => {
          addDebug("🎯 Événement answer reçu (initial)!");
          onAnswer(data);
        });
        socket.on("webrtc:ice-candidate", (data) => {
          addDebug("🎯 Événement ice-candidate reçu (initial)!");
          onCandidate(data);
        });
        addDebug("Listeners WebRTC enregistrés (initial)");

        socket.on("session:chat", (m) =>
          setChatMessages((p) => [
            ...p,
            { ...m, isOwn: m.userId === user?.id },
          ])
        );
        socket.on("session:ended", () => endSession());
      }

      // Fallback: relance une négociation après 8s si toujours pas connecté
      setTimeout(() => {
        if (!isConnected) {
          addDebug("Fallback négociation après 8s");
          try { maybeStartNegotiation(); } catch (e) { addDebug(`Fallback error: ${e}`); }
        }
      }, 8000);

    } catch (e: any) {
      addDebug(`Erreur initialisation: ${e.message}`);
      setConnectionStatus("disconnected");
    }
  };

  // Re-emit joinSession once the user is available to register correct userId on the server
  const lastJoinedUserIdRef = useRef<number | null>(null);
  useEffect(() => {
    if (!socket) return;
    if (!user?.id) return;
    if (lastJoinedUserIdRef.current === user.id) return;
    lastJoinedUserIdRef.current = user.id;
    try {
      addDebug(`Re-rejoindre session avec userId: ${user.id}`);
      socket.emit('joinSession', { sessionId, userId: user.id, role: user.userType });

      // Réenregistrer les listeners WebRTC à chaque reconnexion
      socket.off("webrtc:offer");
      socket.off("webrtc:answer");
      socket.off("webrtc:ice-candidate");

      socket.on("webrtc:offer", (data) => {
        addDebug("🎯 Événement offer reçu (re-registered)!");
        onOffer(data);
      });
      socket.on("webrtc:answer", (data) => {
        addDebug("🎯 Événement answer reçu (re-registered)!");
        onAnswer(data);
      });
      socket.on("webrtc:ice-candidate", (data) => {
        addDebug("🎯 Événement ice-candidate reçu (re-registered)!");
        onCandidate(data);
      });
      addDebug("Listeners WebRTC re-enregistrés");

      // If we are the polite peer, attempt to (re)start negotiation
      setTimeout(() => {
        addDebug("Tentative négociation après rejoindre");
        maybeStartNegotiation();
      }, 1500);
    } catch (e) {
      addDebug(`Erreur rejoindre: ${e}`);
    }
  }, [socket, user?.id, user?.userType, sessionId]);

  const setupPeer = (stream: MediaStream) => {
    const turnUrl = process.env.NEXT_PUBLIC_TURN_URL;
    const turnUser = process.env.NEXT_PUBLIC_TURN_USERNAME;
    const turnPass = process.env.NEXT_PUBLIC_TURN_PASSWORD;
    const stunUrls = process.env.NEXT_PUBLIC_STUN_URLS || "stun:stun.l.google.com:19302";

    const iceServers: RTCIceServer[] = [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
      { urls: "stun:stun3.l.google.com:19302" },
    ];

    // Ajouter des serveurs STUN supplémentaires si configurés
    if (stunUrls) {
      const additionalStunUrls = stunUrls.split(',').map((url: any) => ({ urls: url.trim() }));
      iceServers.push(...additionalStunUrls);
    }

    // Ajouter serveur TURN si configuré
    if (turnUrl && turnUser && turnPass) {
      iceServers.push({
        urls: turnUrl,
        username: turnUser,
        credential: turnPass
      });
    }
    const pc = new RTCPeerConnection({
      iceServers,
      iceCandidatePoolSize: 10,
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require',
    });
    pcRef.current = pc;

    // Pre-negotiate transceivers to keep m-line order stable
    const audioTransceiver = pc.addTransceiver("audio", { direction: "sendrecv" });
    const videoTransceiver = pc.addTransceiver("video", { direction: "sendrecv" });

    const audioTrack = stream.getAudioTracks()[0];
    const videoTrack = stream.getVideoTracks()[0];

    if (audioTrack) {
      audioTransceiver.sender.replaceTrack(audioTrack).catch(e =>
        console.warn("Erreur remplacement track audio:", e)
      );
    }
    if (videoTrack) {
      videoTransceiver.sender.replaceTrack(videoTrack).catch(e =>
        console.warn("Erreur remplacement track vidéo:", e)
      );
    }

    pc.onicecandidate = (ev: any) => {
      if (ev.candidate && socket?.connected) {
        socket.emit("webrtc:ice-candidate", { sessionId, candidate: ev.candidate });
      }
    };

    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      console.log("État connexion ICE:", state);

      switch (state) {
        case "connected":
        case "completed":
          addDebug(`Connexion ICE établie: ${state}`);
          setIsConnected(true);
          setConnectionStatus("connected");
          break;
        case "disconnected":
          setConnectionStatus("connecting");
          // Tentative de reconnexion après 3 secondes
          setTimeout(() => {
            if (pc.iceConnectionState === "disconnected") {
              maybeStartNegotiation();
            }
          }, 3000);
          break;
        case "failed":
        case "closed":
          setIsConnected(false);
          setConnectionStatus("disconnected");
          break;
        case "checking":
          setConnectionStatus("connecting");
          break;
      }
    };

    pc.onconnectionstatechange = () => {
      const st = pc.connectionState;
      console.log("État connexion WebRTC:", st);

      if (st === "connected") {
        setIsConnected(true);
        setConnectionStatus("connected");
      } else if (st === "disconnected") {
        setConnectionStatus("connecting");
      } else if (st === "failed" || st === "closed") {
        setIsConnected(false);
        setConnectionStatus("disconnected");
      }
    };
    pc.ontrack = (ev: any) => {
      addDebug(`Track reçu: ${ev.track.kind} (${ev.track.enabled ? 'actif' : 'inactif'})`);

      let remote = ev.streams && ev.streams[0];
      if (!remote) {
        remote = remoteStream || new MediaStream();
        remote.addTrack(ev.track);
        addDebug("Stream distant créé manuellement");
      } else {
        addDebug("Stream distant reçu directement");
      }

      setRemoteStream(remote);

      if (remoteVideoRef.current && remoteVideoRef.current.srcObject !== remote) {
        remoteVideoRef.current.srcObject = remote;
        remoteVideoRef.current.play().catch(e =>
          addDebug(`Erreur lecture vidéo distante: ${e.message}`)
        );
        addDebug("Vidéo distante configurée");
      }

      // Si on reçoit des tracks, considérer comme connecté
      // (même si ICE n'est pas encore "connected")
      setTimeout(() => {
        if (!isConnected) {
          addDebug("🔗 Connexion forcée après réception tracks");
          setIsConnected(true);
          setConnectionStatus("connected");
        }
      }, 1000);

      // Gestion des tracks qui se terminent
      ev.track.onended = () => {
        addDebug(`Track terminé: ${ev.track.kind}`);
      };
    };

    // Only polite peer drives negotiation
    pc.onnegotiationneeded = async () => {
      try {
        console.log("Négociation nécessaire, polite:", politeRef.current);

        if (!politeRef.current || makingOfferRef.current) return;

        const pcNow = pcRef.current;
        if (!pcNow || pcNow.signalingState !== "stable") {
          console.log("PC non stable pour négociation:", pcNow?.signalingState);
          return;
        }

        if (!socket?.connected) {
          console.log("Socket non connecté pour négociation");
          return;
        }

        makingOfferRef.current = true;

        // Créer l'offre avec contraintes optimales
        const offer = await pcNow.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });

        await pcNow.setLocalDescription(offer);

        socket.emit("webrtc:offer", { sessionId, offer: pcNow.localDescription });
        console.log("Offre envoyée");

      } catch (e: any) {
        console.error("Erreur négociation:", e?.name || e);
      } finally {
        makingOfferRef.current = false;
      }
    };
  };

  const maybeStartNegotiation = async () => {
    try {
      console.log("Tentative démarrage négociation");

      if (!politeRef.current || makingOfferRef.current) {
        console.log("Pas polite ou déjà en négociation");
        return;
      }

      const pc = pcRef.current;
      if (!pc || pc.signalingState !== "stable") {
        console.log("PC non stable:", pc?.signalingState);
        return;
      }

      if (!socket?.connected) {
        console.log("Socket non connecté");
        return;
      }

      // Permettre la renégociation si nécessaire
      if (pc.localDescription && pc.remoteDescription) {
        console.log("Connexion déjà établie, pas de nouvelle négociation");
        return;
      }

      makingOfferRef.current = true;

      // Créer l'offre avec contraintes
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });

      await pc.setLocalDescription(offer);
      socket.emit("webrtc:offer", { sessionId, offer: pc.localDescription });

      addDebug("Offre WebRTC envoyée avec succès");

    } catch (e) {
      console.error("Erreur maybeStartNegotiation:", e);
    } finally {
      makingOfferRef.current = false;
    }
  };

  const onOffer = async ({ offer }: any) => {
    try {
      addDebug("Offre WebRTC reçue");

      const pc = pcRef.current;
      if (!pc) {
        addDebug("Pas de PeerConnection pour traiter l'offre");
        return;
      }

      const offerDesc = new RTCSessionDescription(offer);
      const offerCollision = makingOfferRef.current || pc.signalingState !== "stable";

      ignoreOfferRef.current = !politeRef.current && offerCollision;

      if (ignoreOfferRef.current) {
        console.log("Offre ignorée (collision)");
        return;
      }

      // Résoudre collision si pair poli
      if (offerCollision && politeRef.current) {
        console.log("Résolution collision - rollback");
        await pc.setLocalDescription({ type: "rollback" } as any);
        makingOfferRef.current = false;
      }

      await pc.setRemoteDescription(offerDesc);
      console.log("Description distante définie");

      // Vérifier l'état avant de créer la réponse
      if (pc.signalingState !== 'have-remote-offer') {
        console.log("État incorrect pour réponse:", pc.signalingState);
        return;
      }

      // Créer et envoyer la réponse
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      if (socket?.connected) {
        socket.emit("webrtc:answer", { sessionId, answer: pc.localDescription });
        addDebug("Réponse WebRTC envoyée");
      }

    } catch (e) {
      console.error("Erreur traitement offre:", e);
    }
  };

  const onAnswer = async ({ answer }: any) => {
    try {
      addDebug("Réponse WebRTC reçue");

      const pc = pcRef.current;

      if (!pc) {
        addDebug("Pas de PeerConnection pour traiter la réponse");
        return;
      }

      // Vérifier l'état et éviter les doubles traitements
      if (pc.signalingState !== "have-local-offer") {
        console.log("État incorrect pour réponse:", pc.signalingState);
        return;
      }

      if (settingRemoteAnswerRef.current) {
        console.log("Déjà en train de traiter une réponse");
        return;
      }

      settingRemoteAnswerRef.current = true;
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
      addDebug("Réponse WebRTC traitée avec succès");

    } catch (e) {
      console.error("Erreur traitement réponse:", e);
    } finally {
      settingRemoteAnswerRef.current = false;
    }
  };

  const onCandidate = async ({ candidate }: any) => {
    try {
      const pc = pcRef.current;
      if (!pc) {
        console.log("Pas de PeerConnection pour ICE candidate");
        return;
      }

      // Attendre que la description distante soit définie
      if (!pc.remoteDescription) {
        console.log("Description distante non définie, candidat différé");
        // En production, vous pourriez vouloir mettre en file d'attente
        setTimeout(() => onCandidate({ candidate }), 100);
        return;
      }

      await pc.addIceCandidate(new RTCIceCandidate(candidate));
      console.log("Candidat ICE ajouté");

    } catch (e) {
      if (!ignoreOfferRef.current) {
        console.warn("Erreur ajout candidat ICE:", e);
      }
    }
  };

  const toggleMic = () => {
    const track = localStream?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setIsMicOn(track.enabled);
  };

  const toggleAudioOnly = async () => {
    try {
      const pc = pcRef.current;
      if (!pc) return;
      const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
      if (!audioOnly) {
        const v = localStream?.getVideoTracks()[0];
        if (v) v.enabled = false;
        setIsCameraOn(false);
        setAudioOnly(true);
      } else {
        let v = localStream?.getVideoTracks()[0];
        if (!v) {
          const g = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 } } });
          v = g.getVideoTracks()[0];
          if (v && localStream) localStream.addTrack(v);
        }
        if (v) v.enabled = true;
        if (sender && v) await sender.replaceTrack(v);
        setIsCameraOn(true);
        setAudioOnly(false);
      }
    } catch {}
  };

  // Stats réseau périodiques
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const pc = pcRef.current;
        if (!pc) return;
        const stats = await pc.getStats();
        let bytesSentVideo = 0;
        let rtt = 0;
        let packetsLost = 0;
        let packetsTotal = 0;
        stats.forEach((r:any) => {
          if (r.type === 'outbound-rtp' && r.kind === 'video') bytesSentVideo += r.bytesSent || 0;
          if (r.type === 'inbound-rtp' && r.kind === 'video') {
            packetsLost += r.packetsLost || 0;
            packetsTotal += (r.packetsLost || 0) + (r.packetsReceived || 0);
          }
          if (r.type === 'candidate-pair' && r.nominated) rtt = (r.currentRoundTripTime || 0) * 1000;
        });
        const now = Date.now();
        let bitrateKbps = 0;
        const last = lastStatsRef.current;
        if (last.ts) {
          const dt = (now - last.ts) / 1000;
          const dbytes = Math.max(0, bytesSentVideo - last.bytesSentVideo);
          bitrateKbps = Math.round((dbytes * 8) / 1000 / Math.max(0.001, dt));
        }
        lastStatsRef.current = { ts: now, bytesSentVideo };
        const lossPct = packetsTotal > 0 ? Math.round((packetsLost / packetsTotal) * 100) : 0;
        setNetStats({ bitrateKbps, rttMs: Math.round(rtt), lossPct });
        const quality = (bitrateKbps > 1000 && rtt < 150 && lossPct < 2) ? 'good' : (bitrateKbps > 300 && rtt < 400 && lossPct < 5) ? 'ok' : 'poor';
        setNetQuality(quality);
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  const toggleCamera = () => {
    const track = localStream?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setIsCameraOn(track.enabled);
  };

  const startScreenShare = async () => {
    try {
      const s = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      setScreenStream(s);
      if (screenShareRef.current) screenShareRef.current.srcObject = s;
      setIsScreenSharing(true);
      const vTrack = s.getVideoTracks()[0];
      const sender = pcRef.current?.getSenders().find((x) => x.track?.kind === "video");
      if (sender && vTrack) await sender.replaceTrack(vTrack);
      vTrack.onended = () => {
        stopScreenShare();
      };
    } catch (e) {
      console.error("share", e);
    }
  };
  const stopScreenShare = () => {
    if (screenStream) {
      screenStream.getTracks().forEach((t) => t.stop());
      setScreenStream(null);
      setIsScreenSharing(false);
      const cam = localStream?.getVideoTracks()[0];
      const sender = pcRef.current?.getSenders().find((x) => x.track?.kind === "video");
      if (sender && cam) sender.replaceTrack(cam);
    }
  };

  const startRecording = () => {
    if (!localStream) return;
    const rec = new MediaRecorder(localStream);
    recordedChunksRef.current = [];
    rec.ondataavailable = (e: any) => {
      if (e.data.size > 0) recordedChunksRef.current.push(e.data);
    };
    rec.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `session-${sessionId}.webm`;
      a.click();
      URL.revokeObjectURL(url);
    };
    rec.start();
    mediaRecorderRef.current = rec;
    setIsRecording(true);
    setRecordingStatus("recording");
  };
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingStatus("stopped");
    }
  };

  const sendChatMessage = () => {
    if (!chatMessage.trim()) return;
    const msg = {
      id: Date.now(),
      userId: user?.id,
      sender: user?.firstName || "Moi",
      message: chatMessage,
      timestamp: new Date().toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setChatMessages((p) => [...p, { ...msg, isOwn: true }]);
    socket?.emit("session:chat", { sessionId, message: msg });
    setChatMessage("");
  };

  const endSession = () => {
    if (isRecording) stopRecording();
    if (isScreenSharing) stopScreenShare();
    socket?.emit("session:end", { sessionId });
    cleanup();
    router.push("/dashboard/appointments");
  };
  const cleanup = () => {
    console.log("Nettoyage des ressources vidéo");

    // Fermer les streams
    localStream?.getTracks().forEach((t) => {
      t.stop();
      console.log("Track local fermé:", t.kind);
    });
    remoteStream?.getTracks().forEach((t) => {
      t.stop();
      console.log("Track distant fermé:", t.kind);
    });
    screenStream?.getTracks().forEach((t) => {
      t.stop();
      console.log("Track écran fermé:", t.kind);
    });

    // Fermer la connexion WebRTC
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
      console.log("PeerConnection fermée");
    }

    // Retirer les listeners socket
    if (socket) {
      socket.off("webrtc:offer", onOffer);
      socket.off("webrtc:answer", onAnswer);
      socket.off("webrtc:ice-candidate", onCandidate);
      socket.off("session:chat");
      socket.off("session:ended");
      console.log("Listeners socket retirés");
    }

    // Réinitialiser les états
    setLocalStream(null);
    setRemoteStream(null);
    setScreenStream(null);
    setIsConnected(false);
    setConnectionStatus("disconnected");
  };

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60),
      m = minutes % 60;
    return h > 0 ? `${h}h ${m}min` : `${m}min`;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <i className="ri-arrow-left-line text-xl"></i>
            </Link>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                  <i className="ri-user-line"></i>
                </div>
                <div
                  className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-gray-800 ${
                    isConnected ? "bg-green-500" : "bg-red-500"
                  }`}
                ></div>
              </div>
              <div>
                <h1 className="text-lg font-semibold">Session vidéo</h1>
                <p className="text-sm text-gray-400">
                  {isConnected ? "Connecté" : "Connexion en cours..."}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <button
              onClick={() => { try { navigator.clipboard.writeText(window.location.href); } catch {} }}
              className="px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm flex items-center"
              title="Copier le lien d'invitation"
            >
              <i className="ri-link"></i>
              <span className="ml-2 hidden sm:inline">Copier le lien</span>
            </button>
            <div className="bg-gray-700 rounded-lg px-4 py-2 text-center">
              <div className="text-2xl font-bold text-green-400">
                {formatDuration(sessionTime)}
              </div>
              <div className="text-sm text-gray-300">{sessionCost} coins</div>
            </div>
            {recordingStatus === "recording" && (
              <div className="flex items-center space-x-2 bg-red-600 rounded-lg px-3 py-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">REC</span>
              </div>
            )}
            <div
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                connectionStatus === "connected"
                  ? "bg-green-600"
                  : connectionStatus === "connecting"
                  ? "bg-yellow-600"
                  : "bg-red-600"
              }`}
            >
              {connectionStatus === "connected"
                ? "Connecté"
                : connectionStatus === "connecting"
                ? "Connexion..."
                : "Déconnecté"}
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        <div className="flex-1 relative">
          <div className="relative h-full">
            {isScreenSharing && screenStream ? (
              <video
                ref={screenShareRef}
                autoPlay
                playsInline
                className="w-full h-full object-contain bg-black"
              />
            ) : (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover bg-black"
              />
            )}
            {!isConnected && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-xl">Connexion au participant...</p>
                </div>
              </div>
            )}
          </div>
          <div className="absolute top-4 right-4 w-64 h-48 bg-black rounded-lg overflow-hidden border-2 border-gray-600">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-sm">
              Vous ({user?.userType === "expert" ? "Expert" : "Utilisateur"})
            </div>
            {/* Debug info */}
            {debugInfo.length > 0 && (
              <div className="absolute top-2 left-2 bg-black/80 text-xs text-green-400 p-2 rounded max-w-48 max-h-32 overflow-y-auto">
                {debugInfo.map((info, i) => (
                  <div key={i}>{info}</div>
                ))}
              </div>
            )}
          </div>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
            <div className="flex items-center space-x-4 bg-gray-800/90 backdrop-blur-sm rounded-full px-6 py-3">
              <button
                onClick={toggleMic}
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  isMicOn ? "bg-gray-700 hover:bg-gray-600" : "bg-red-600 hover:bg-red-700"
                }`}
                title={isMicOn ? "Couper le micro" : "Activer le micro"}
              >
                <i className={`${isMicOn ? "ri-mic-line" : "ri-mic-off-line"} text-xl`}></i>
              </button>
              <button
                onClick={toggleCamera}
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  isCameraOn
                    ? "bg-gray-700 hover:bg-gray-600"
                    : "bg-red-600 hover:bg-red-700"
                }`}
                title={isCameraOn ? "Couper la caméra" : "Activer la caméra"}
              >
                <i className={`${isCameraOn ? "ri-camera-line" : "ri-camera-off-line"} text-xl`}></i>
              </button>
              <button
                onClick={isScreenSharing ? () => stopScreenShare() : startScreenShare}
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  isScreenSharing
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-gray-700 hover:bg-gray-600"
                }`}
                title={isScreenSharing ? "Arrêter le partage" : "Partager l'écran"}
              >
                <i className={`${isScreenSharing ? "ri-stop-circle-line" : "ri-share-box-line"} text-xl`}></i>
              </button>
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  isRecording
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-gray-700 hover:bg-gray-600"
                }`}
                title={isRecording ? "Arrêter l'enregistrement" : "Démarrer l'enregistrement"}
              >
                <i className={`${isRecording ? "ri-stop-circle-line" : "ri-record-circle-line"} text-xl`}></i>
              </button>
              <button
                onClick={() => setShowChat(!showChat)}
                className="w-12 h-12 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center"
                title="Chat"
              >
                <i className="ri-chat-1-line text-xl"></i>
              </button>
              <button
                onClick={endSession}
                className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center"
                title="Terminer la session"
              >
                <i className="ri-phone-line text-xl"></i>
              </button>
            </div>
          </div>
        </div>

        {showChat && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold">Chat</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.isOwn ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-xs rounded-lg px-4 py-2 ${msg.isOwn ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-100"}`}>
                    <p className="text-sm">{msg.message}</p>
                    <p className="text-xs opacity-75 mt-1">{msg.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-700">
              <div className="flex items-center space-x-2">
                <input
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Votre message..."
                  className="flex-1 px-3 py-2 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button onClick={sendChatMessage} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white">
                  Envoyer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
