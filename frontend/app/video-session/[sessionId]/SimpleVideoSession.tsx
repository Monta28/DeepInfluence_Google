"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/contexts/SocketContext";
import { useAuth } from "@/contexts/AuthContext";

interface VideoSessionProps {
  sessionId: string;
}

export default function SimpleVideoSession({ sessionId }: VideoSessionProps) {
  const router = useRouter();
  const socket = useSocket();
  const { user } = useAuth();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>("connecting");
  const [debug, setDebug] = useState<string[]>([]);

  const addDebug = (msg: string) => {
    console.log("🎥", msg);
    setDebug(prev => [...prev.slice(-5), msg]);
  };

  useEffect(() => {
    initialize();
    return () => cleanup();
  }, []);

  const initialize = async () => {
    try {
      addDebug("Démarrage session vidéo simple...");

      // Get local media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      setLocalStream(stream);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play();
      }

      // Setup WebRTC
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });
      pcRef.current = pc;

      // Add local stream
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Handle remote stream
      pc.ontrack = (event: any) => {
        addDebug("📹 Vidéo distante reçue!");
        const remoteStream = event.streams[0];
        setRemoteStream(remoteStream);

        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
          remoteVideoRef.current.play();
        }

        setIsConnected(true);
        setConnectionStatus("connected");
      };

      // Handle ICE candidates
      pc.onicecandidate = (event: any) => {
        if (event.candidate && socket) {
          socket.emit('ice-candidate', {
            sessionId,
            candidate: event.candidate,
            from: user?.id
          });
        }
      };

      // Connection state
      pc.onconnectionstatechange = () => {
        addDebug(`État: ${pc.connectionState}`);
        if (pc.connectionState === 'connected') {
          setIsConnected(true);
          setConnectionStatus("connected");
        }
      };

      if (socket) {
        // Join session
        socket.emit('join-video-session', {
          sessionId,
          userId: user?.id,
          role: user?.userType
        });

        // Handle signaling
        socket.on('user-joined', async (data) => {
          addDebug(`👤 Utilisateur rejoint: ${data.userId}`);
          if (data.userId !== user?.id) {
            // Create offer if we're the first one
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            socket.emit('offer', {
              sessionId,
              offer,
              to: data.userId,
              from: user?.id
            });
            addDebug("📤 Offre envoyée");
          }
        });

        socket.on('offer', async (data) => {
          addDebug("📥 Offre reçue");
          await pc.setRemoteDescription(new RTCSessionDescription(data.offer));

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          socket.emit('answer', {
            sessionId,
            answer,
            to: data.from,
            from: user?.id
          });
          addDebug("📤 Réponse envoyée");
        });

        socket.on('answer', async (data) => {
          addDebug("📥 Réponse reçue");
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        });

        socket.on('ice-candidate', async (data) => {
          if (data.from !== user?.id) {
            await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
          }
        });
      }

    } catch (error) {
      addDebug(`❌ Erreur: ${error}`);
    }
  };

  const cleanup = () => {
    localStream?.getTracks().forEach(track => track.stop());
    pcRef.current?.close();

    if (socket) {
      socket.off('user-joined');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
    }
  };

  const endCall = () => {
    cleanup();
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Session Vidéo Simplifiée</h1>
          <button
            onClick={endCall}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
          >
            Terminer
          </button>
        </div>

        {/* Video Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Local Video */}
          <div className="relative">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-64 bg-black rounded-lg object-cover"
            />
            <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-sm">
              Vous
            </div>
          </div>

          {/* Remote Video */}
          <div className="relative">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-64 bg-black rounded-lg object-cover"
            />
            <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-sm">
              {isConnected ? "Participant" : "En attente..."}
            </div>

            {!isConnected && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                <div className="text-center">
                  <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p>Connexion en cours...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <span>État: {connectionStatus}</span>
            <span className={`px-3 py-1 rounded-full text-sm ${
              isConnected ? 'bg-green-600' : 'bg-yellow-600'
            }`}>
              {isConnected ? 'Connecté' : 'Connexion...'}
            </span>
          </div>
        </div>

        {/* Debug */}
        {debug.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-sm font-bold mb-2">Debug:</h3>
            {debug.map((msg, i) => (
              <div key={i} className="text-xs text-green-400 font-mono">
                {msg}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}