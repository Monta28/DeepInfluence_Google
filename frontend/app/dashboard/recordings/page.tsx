"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import AppHeader from "@/components/AppHeader";

type Rec = {
  id: string | number | null;
  room: string | null;
  createdAt: string | number | null;
  durationSec: number | null;
  download: string | null;
  appointmentId: number | null;
  appointment?: { id: number; date: string; time: string; expert?: string | null } | null;
};

function RecordingsContent() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<Rec[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [loadingVideo, setLoadingVideo] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (isLoading) return;
    if (!user) { router.push('/signin?next=' + encodeURIComponent('/dashboard/recordings')); return; }
    // seed from query param
    const qp = searchParams.get('sessionId');
    if (qp && !q) setQ(qp);
    load(qp || q);
  }, [user, isLoading, searchParams]);

  async function load(qOverride?: string) {
    try {
      setLoading(true);
      const role = (user?.userType === 'expert') ? 'expert' : 'user';
      const qVal = (qOverride !== undefined ? qOverride : q).trim();
      const url = qVal ? `/api/video/recordings/my?as=${role}&sessionId=${encodeURIComponent(qVal)}` : `/api/video/recordings/my?as=${role}`;
      const resp = await fetch(url, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
      const data = await resp.json();
      setItems(Array.isArray(data?.recordings) ? data.recordings : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  const handlePlayVideo = async (rec: Rec) => {
    if (!rec.id) return;
    setLoadingVideo(true);
    try {
      const resp = await fetch(`/api/video/recordings/proxy-download/${encodeURIComponent(String(rec.id))}?json=1`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!resp.ok) {
        alert('Vidéo indisponible (en traitement ou non autorisée)');
        return;
      }
      const data = await resp.json();
      const link = data?.link || rec.download;
      if (link) {
        setSelectedVideo(link);
      } else {
        alert('Lien vidéo indisponible');
      }
    } catch {
      alert('Erreur lors de la récupération de la vidéo');
    } finally {
      setLoadingVideo(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mes Enregistrements</h1>
          <p className="text-gray-600">Retrouvez tous vos enregistrements de sessions vidéo</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4">
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Filtrer par session (ex: session-2)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={() => load()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              🔍 Rechercher
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <i className="ri-film-line text-6xl text-gray-400 mb-4"></i>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun enregistrement</h3>
            <p className="text-gray-600">Vos enregistrements de sessions vidéo apparaîtront ici</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Video Player */}
            {selectedVideo && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">📹 Lecture vidéo</h2>
                  <button
                    onClick={() => setSelectedVideo(null)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    ✕ Fermer
                  </button>
                </div>
                <div className="relative bg-black rounded-lg overflow-hidden" style={{ paddingBottom: '56.25%' }}>
                  <video
                    controls
                    className="absolute inset-0 w-full h-full"
                    src={selectedVideo}
                  >
                    Votre navigateur ne supporte pas la lecture vidéo.
                  </video>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-white text-sm bg-black/50 px-3 py-1 rounded">
                      Cliquez sur ▶ pour lire la vidéo
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recordings List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {items.map((r, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg mb-2">
                        🎬 {r.appointmentId ? `Session ${r.appointmentId}` : (r.room || 'Enregistrement')}
                      </h3>
                      {r.appointment && (
                        <div className="space-y-1 mb-3">
                          <p className="text-sm text-gray-600">
                            <i className="ri-calendar-line mr-2"></i>
                            {new Date(r.appointment.date).toLocaleDateString('fr-FR', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                          <p className="text-sm text-gray-600">
                            <i className="ri-time-line mr-2"></i>
                            {r.appointment.time}
                          </p>
                          {r.appointment.expert && (
                            <p className="text-sm text-gray-600">
                              <i className="ri-user-line mr-2"></i>
                              {r.appointment.expert}
                            </p>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <i className="ri-timer-line mr-1"></i>
                          {r.durationSec ? `${Math.floor(r.durationSec / 60)} min ${r.durationSec % 60} sec` : 'Durée inconnue'}
                        </span>
                        {r.createdAt && (
                          <span className="text-xs text-gray-500">
                            {new Date(r.createdAt).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePlayVideo(r)}
                      disabled={loadingVideo}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:bg-gray-400"
                    >
                      {loadingVideo ? '⏳ Chargement...' : '▶️ Lire'}
                    </button>
                    {(r.download && !String(r.download).startsWith('/api/video/recordings/proxy-download')) ? (
                      <a
                        href={String(r.download)}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        ⬇️ Télécharger
                      </a>
                    ) : r.id ? (
                      <button
                        onClick={() => openViaProxy(String(r.id))}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        ⬇️ Télécharger
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RecordingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <RecordingsContent />
    </Suspense>
  );
}

async function openViaProxy(id: string) {
  try {
    const resp = await fetch(`/api/video/recordings/proxy-download/${encodeURIComponent(id)}?json=1`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    if (!resp.ok) {
      alert('Lien indisponible (en traitement ou non autorisé)');
      return;
    }
    const data = await resp.json();
    const link = data?.link;
    if (link) window.open(link, '_blank');
    else alert('Lien indisponible');
  } catch {
    alert('Erreur lors de la récupération du lien');
  }
}
