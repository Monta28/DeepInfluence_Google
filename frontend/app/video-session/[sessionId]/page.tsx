'use client';

import dynamic from 'next/dynamic';

// Provider vidéo configuré via variable d'environnement
// Options: 'stream' (défaut) ou 'jitsi'
const VIDEO_PROVIDER = process.env.NEXT_PUBLIC_VIDEO_PROVIDER || 'stream';

// Chargement dynamique des composants vidéo (désactive SSR pour WebRTC)
const StreamSession = dynamic(() => import('./StreamSession'), {
  ssr: false,
  loading: () => <VideoLoader message="Chargement de Stream SDK..." />,
});

const JitsiSession = dynamic(() => import('./JitsiSession'), {
  ssr: false,
  loading: () => <VideoLoader message="Chargement de Jitsi Meet..." />,
});

// Composant de chargement réutilisable
function VideoLoader({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-xl">{message}</p>
      </div>
    </div>
  );
}

export default function VideoSessionPage({ params }: { params: { sessionId: string } }) {
  // Utiliser Jitsi si configuré, sinon Stream par défaut
  if (VIDEO_PROVIDER === 'jitsi') {
    return <JitsiSession sessionId={params.sessionId} />;
  }

  return <StreamSession sessionId={params.sessionId} />;
}
