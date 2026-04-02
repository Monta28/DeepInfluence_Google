'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import Footer from '@/components/Footer';
import Link from 'next/link';
import ApiService from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useToast } from '@/contexts/ToastContext';

interface FormationDetailProps {
  formationId: string;
}

interface VideoSessionStatus {
  isSessionActive: boolean;
  isWithin5MinutesOfSchedule: boolean;
  canJoin: boolean;
  isOwner: boolean;
  videoSessionStartedAt: string | null;
  videoSessionEndedAt: string | null;
  nextSession: string | null;
  hasVideoConferenceLink: boolean;
}

export default function FormationDetail({ formationId }: FormationDetailProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('apercu');
  const [formation, setFormation] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentSort, setStudentSort] = useState<'newest'|'oldest'|'name'>('newest');
  const [studentRoleFilter, setStudentRoleFilter] = useState<'all'|'user'|'expert'|'admin'>('all');
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [joiningVideo, setJoiningVideo] = useState(false);
  const [videoSessionStatus, setVideoSessionStatus] = useState<VideoSessionStatus | null>(null);
  const [startingSession, setStartingSession] = useState(false);
  const [stoppingSession, setStoppingSession] = useState(false);

  const { user } = useAuth();
  const { formationIds, toggleFormation, refresh: refreshFavorites } = useFavorites();
  const { addToast } = useToast();

  const handleExportEnrollments = async () => {
    try {
      const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api');
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const resp = await fetch(`${base}/formations/${formationId}/enrollments/export.csv`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
      if (!resp.ok) throw new Error('Téléchargement impossible');
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `formation_${formationId}_inscrits.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e?.message || 'Erreur export CSV');
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const r = await ApiService.getFormationById(parseInt(formationId));
        if (r.success && mounted) {
          const f = r.data || {};
          const instructor = f.expert || {};
          setFormation({
            ...f,
            objectives: f.objectives || [],
            prerequisites: f.prerequisites || [],
            included: f.included || [],
            tools: f.tools || [],
            program: f.modules || [],
            instructor_details: f.instructor_details || {
              name: instructor.name,
              title: 'Formateur',
              experience: '',
              rating: instructor.rating,
              students: f.students,
              image: instructor.image,
              bio: '',
              expertise: [],
              education: [],
              certifications: []
            }
          });
        }
        if (!r.success && mounted) setError('Formation non trouvée');
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Erreur de chargement');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [formationId]);

  // Charger/sync favoris pour état initial du coeur
  useEffect(() => { refreshFavorites().catch(()=>{}); }, [refreshFavorites]);
  useEffect(() => { if (formation?.id) setIsFavorite(formationIds.has(formation.id)); }, [formation?.id, formationIds]);

  const handleFavorite = async () => {
    try {
      if (!user) {
        if (typeof window !== 'undefined') sessionStorage.setItem('returnUrl', `/formations/${formationId}`);
        window.location.href = '/signin';
        return;
      }
      if (!formation?.id) return;
      await toggleFormation(formation.id);
      setIsFavorite((v)=>!v);
    } catch (e: any) {
      addToast(e?.message || 'Action impossible', 'error');
    }
  };

  // Récupérer le statut de la session vidéo
  const fetchVideoSessionStatus = useCallback(async () => {
    if (!user || !formationId) return;
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const res = await fetch(`${base}/formations/${formationId}/video/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setVideoSessionStatus(data.data);
      }
    } catch (e) {
      console.error('Error fetching video session status:', e);
    }
  }, [formationId, user]);

  // Charger le statut de la session vidéo après le chargement de la formation
  useEffect(() => {
    if (formation && (formation.isEnrolled || formation.isOwner) && formation.hasVideoConferenceLink) {
      fetchVideoSessionStatus();
      // Rafraîchir le statut toutes les 30 secondes
      const interval = setInterval(fetchVideoSessionStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [formation, fetchVideoSessionStatus]);

  // Démarrer la session vidéo (expert propriétaire)
  const handleStartVideoSession = async () => {
    if (!user || !formation?.isOwner) return;
    setStartingSession(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Non authentifié');
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const res = await fetch(`${base}/formations/${formationId}/video/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        addToast('Session vidéo démarrée', 'success');
        await fetchVideoSessionStatus();
      } else {
        throw new Error(data.message || 'Erreur');
      }
    } catch (e: any) {
      addToast(e?.message || 'Erreur lors du démarrage', 'error');
    } finally {
      setStartingSession(false);
    }
  };

  // Terminer la session vidéo (expert propriétaire)
  const handleStopVideoSession = async () => {
    if (!user || !formation?.isOwner) return;
    setStoppingSession(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Non authentifié');
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const res = await fetch(`${base}/formations/${formationId}/video/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        addToast('Session vidéo terminée', 'success');
        await fetchVideoSessionStatus();
      } else {
        throw new Error(data.message || 'Erreur');
      }
    } catch (e: any) {
      addToast(e?.message || 'Erreur lors de l\'arrêt', 'error');
    } finally {
      setStoppingSession(false);
    }
  };

  // Rejoindre la vidéoconférence de la formation
  const handleJoinVideo = async () => {
    if (!user) {
      addToast('Vous devez être connecté pour rejoindre la vidéoconférence', 'error');
      return;
    }
    if (!formation?.isEnrolled && !formation?.isOwner) {
      addToast('Vous devez être inscrit à cette formation pour accéder à la vidéoconférence', 'error');
      return;
    }

    setJoiningVideo(true);
    try {
      // Rediriger vers la page de vidéoconférence de la formation
      router.push(`/formation-video/${formationId}`);
    } catch (e: any) {
      addToast(e?.message || 'Erreur lors de la connexion à la vidéoconférence', 'error');
      setJoiningVideo(false);
    }
  };

  const levelColor = useMemo(() => {
    const level = formation?.level;
    if (level === 'Débutant') return 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300';
    if (level === 'Intermédiaire') return 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300';
    if (level === 'Avancé') return 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300';
    return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
  }, [formation?.level]);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <i key={i} className={`ri-star-${i < Math.round(rating) ? 'fill' : 'line'} text-yellow-400`} />
    ));
  };

  const formatDate = (val?: string) => {
    try { return val ? new Date(val).toLocaleDateString('fr-FR') : ''; } catch { return ''; }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'apercu':
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Objectifs de la formation
                </h3>
                <ul className="space-y-3">
                  {(formation.objectives || []).map((objective: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <i className="ri-check-line text-green-600 mr-3 mt-0.5"></i>
                      <span className="text-gray-700 dark:text-gray-200">{objective}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Prérequis
                </h3>
                <ul className="space-y-3">
                  {(formation.prerequisites || []).map((prereq: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <i className="ri-arrow-right-line text-blue-600 mr-3 mt-0.5"></i>
                      <span className="text-gray-700 dark:text-gray-200">{prereq}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Ce qui est inclus
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(formation.included || []).map((item: string, index: number) => (
                  <div key={index} className="flex items-center">
                    <i className="ri-check-line text-green-600 mr-3"></i>
                    <span className="text-gray-700 dark:text-gray-200">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Outils utilisés
              </h3>
              <div className="flex flex-wrap gap-2">
                {(formation.tools || []).map((tool: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full text-sm"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );

      case 'programme':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Programme détaillé - {formation.duration}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">{(formation.program || []).length} sessions de formation</p>
            </div>
            
            <div className="space-y-4">
              {(formation.program || []).map((session: any, index: number) => {
                const isObj = session && typeof session === 'object';
                const week = isObj && session.week ? session.week : index + 1;
                const title = isObj && session.title ? session.title : (typeof session === 'string' ? session : `Module ${index + 1}`);
                const content = isObj && session.content ? session.content : '';
                const duration = isObj && session.duration ? session.duration : '';
                return (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold mr-4">
                          {week}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">{title}</h4>
                          {content && <p className="text-sm text-gray-600 dark:text-gray-300">{content}</p>}
                        </div>
                      </div>
                      {duration && <span className="text-sm text-blue-600 font-medium">{duration}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'instructeur':
        return (
          <div className="space-y-6">
            {formation.expert ? (
              <div className="flex items-start space-x-6">
                <img
                  src={formation.expert.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(formation.expert.name)}&size=160`}
                  alt={formation.expert.name}
                  className="w-32 h-32 rounded-2xl object-cover"
                />
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">{formation.expert.name}</h3>
                  {formation.expert.verified && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-xs">
                      <i className="ri-shield-check-line mr-1"></i> Vérifié
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-gray-600 dark:text-gray-300">Aucune information instructeur.</div>
            )}
          </div>
        );

      case 'etudiants':
        return (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Liste des inscrits ({(formation.enrollments || []).length})</h3>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e)=>setStudentSearch(e.target.value)}
                  placeholder="Rechercher par nom..."
                  className="border border-gray-300 dark:border-gray-600 rounded px-3 py-1 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <select value={studentRoleFilter} onChange={(e)=>setStudentRoleFilter(e.target.value as any)} className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  <option value="all">Tous</option>
                  <option value="user">Utilisateur</option>
                  <option value="expert">Expert</option>
                  <option value="admin">Administrateur</option>
                </select>
                <select value={studentSort} onChange={(e)=>setStudentSort(e.target.value as any)} className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  <option value="newest">Plus récent</option>
                  <option value="oldest">Plus ancien</option>
                  <option value="name">Nom (A→Z)</option>
                </select>
                <button onClick={handleExportEnrollments} className="text-sm text-blue-600 hover:underline">Exporter CSV</button>
              </div>
            </div>
            {(formation.enrollments || []).length === 0 ? (
              <div className="text-gray-600 dark:text-gray-300">Aucun inscrit pour le moment.</div>
            ) : (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700 rounded-lg border border-gray-200 dark:border-gray-700">
                {[...(formation.enrollments || [])]
                  .filter((e: any) => {
                    const name = `${e.user?.firstName || ''} ${e.user?.lastName || ''}`.toLowerCase();
                    const matchesName = !studentSearch || name.includes(studentSearch.toLowerCase());
                    const matchesRole = studentRoleFilter === 'all' || (e.user?.userType === studentRoleFilter);
                    return matchesName && matchesRole;
                  })
                  .sort((a: any, b: any) => {
                    if (studentSort === 'name') {
                      const an = `${a.user?.firstName || ''} ${a.user?.lastName || ''}`.toLowerCase();
                      const bn = `${b.user?.firstName || ''} ${b.user?.lastName || ''}`.toLowerCase();
                      return an.localeCompare(bn);
                    }
                    const at = a.enrolledAt ? new Date(a.enrolledAt).getTime() : 0;
                    const bt = b.enrolledAt ? new Date(b.enrolledAt).getTime() : 0;
                    return studentSort === 'oldest' ? at - bt : bt - at;
                  })
                  .map((e: any) => {
                  const role = (e.user?.userType === 'admin') ? 'Administrateur' : (e.user?.userType === 'expert') ? 'Expert' : 'Utilisateur';
                  const roleStyle = e.user?.userType === 'admin' ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300' : e.user?.userType === 'expert' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200';
                  return (
                    <li key={e.user?.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <img src={e.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent((e.user?.firstName||'')+' '+(e.user?.lastName||''))}&size=64`} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">{e.user?.firstName} {e.user?.lastName}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Inscrit le {e.enrolledAt ? new Date(e.enrolledAt).toLocaleString('fr-FR') : '-'}</div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${roleStyle}`}>{role}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );

      case 'avis':
        return (
          <div className="space-y-8">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Avis des étudiants
                </h3>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    {renderStars(formation.rating)}
                    <span className="ml-2 text-lg font-semibold text-gray-900 dark:text-white">
                      {formation.rating}
                    </span>
                  </div>
                  <span className="text-gray-600 dark:text-gray-300">{(formation.reviews || []).length} avis</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[5, 4, 3, 2, 1].map((star) => (
                  <div key={star} className="flex items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-300 mr-2">{star}</span>
                    <i className="ri-star-fill text-yellow-400 mr-2"></i>
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-full">
                      <div
                        className="h-full bg-yellow-400 rounded-full"
                        style={{ width: star === 5 ? '70%' : star === 4 ? '25%' : '5%' }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              {formation.reviews.map((review: any) => (
                <div key={review.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                        {review.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{review.name}</p>
                        <div className="flex items-center space-x-2">
                          <div className="flex">
                            {renderStars(review.rating)}
                          </div>
                          {review.verified && (
                            <span className="text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/40 px-2 py-1 rounded-full">
                              Vérifié
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(review.date)}
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-200">{review.comment}</p>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Guards to avoid accessing formation.* while loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <AppHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-gray-600 dark:text-gray-300">Chargement...</div>
        <Footer />
      </div>
    );
  }
  if (error || !formation) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <AppHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-red-600 dark:text-red-400">{error || 'Formation introuvable'}</div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppHeader />

      {/* Breadcrumb */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
            <Link href="/" className="hover:text-blue-600">Accueil</Link>
            <i className="ri-arrow-right-s-line"></i>
            <Link href="/formations" className="hover:text-blue-600">Formations</Link>
            <i className="ri-arrow-right-s-line"></i>
            <span className="text-gray-900 dark:text-white">{formation.title}</span>
          </nav>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-900 to-blue-700 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <img
          src={formation.image}
          alt={formation.title}
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay"
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-3xl">
            <div className="flex items-center space-x-4 mb-6">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${levelColor}`}>{formation.level || '—'}</span>
              <span className="bg-white/20 text-white px-3 py-1 rounded-full text-sm">
                {formation.category}
              </span>
              <span className="bg-white/20 text-white px-3 py-1 rounded-full text-sm">
                {formation.duration}
              </span>
            </div>
            
              <h1 className="text-4xl md:text-5xl font-bold mb-6 flex items-center gap-3">
                {formation.title}
                <button
                  onClick={handleFavorite}
                className={`w-7 h-7 inline-flex items-center justify-center rounded-full transition-colors flex-shrink-0 text-white ${isFavorite ? 'bg-red-500' : 'bg-white/20 hover:bg-white/30'}`}
                  aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                >
                <i className={`ri-heart-${isFavorite ? 'fill' : 'line'} text-sm leading-none`}></i>
                </button>
              {formation.isOwner && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                  <i className="ri-shield-user-line mr-1"></i> Propriétaire
                </span>
              )}
              {formation.isEnrolled && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">
                  <i className="ri-checkbox-circle-line mr-1"></i> Inscrit
                </span>
              )}
            </h1>
            
            <p className="text-xl text-blue-100 mb-8">
              {formation.description}
            </p>
            
            <div className="flex items-center space-x-8 mb-8">
              <div className="flex items-center">
                {renderStars(formation.rating)}
                <span className="ml-2 text-lg font-semibold">{formation.rating}</span>
                <span className="ml-1 text-blue-200">({(formation.reviews || []).length} avis)</span>
              </div>
              <div className="flex items-center">
                <i className="ri-group-line mr-2"></i>
                <span>{formation.students} étudiants</span>
              </div>
              <div className="flex items-center">
                <i className="ri-calendar-line mr-2"></i>
                <span>Début: {formatDate(formation.nextSession)}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <span className="text-3xl font-bold">{formation.price} coins</span>
                {(typeof (formation as any).originalPrice === 'number' && (formation as any).originalPrice > formation.price) && (
                  <span className="text-lg text-blue-200 line-through">{(formation as any).originalPrice} coins</span>
                )}
              </div>
              {(typeof (formation as any).originalPrice === 'number' && (formation as any).originalPrice > formation.price) && (
                <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Économisez {(formation as any).originalPrice - formation.price} coins
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Content */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
              <nav className="flex space-x-8">
                {[
                  { id: 'apercu', label: 'Aperçu' },
                  { id: 'programme', label: 'Programme' },
                  { id: (formation.isOwner ? 'etudiants' : 'instructeur'), label: (formation.isOwner ? 'Étudiants' : 'Instructeur') },
                  { id: 'avis', label: 'Avis' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8">
              {renderTabContent()}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Enrollment Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 sticky top-6">
              <div className="text-center mb-6">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">{formation.price} coins</span>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Places disponibles</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {(formation.maxPlaces || 0) - (formation.currentPlaces || 0)}/{formation.maxPlaces || 0}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${(formation.maxPlaces ? ((formation.currentPlaces || 0) / formation.maxPlaces) * 100 : 0)}%`
                    }}
                  ></div>
                </div>
              </div>

              {!formation.isOwner && (
                <Link
                  href={formation.isEnrolled ? '/dashboard/formations' : `/formations/${formationId}/reserve`}
                  className={`block text-center w-full py-3 px-6 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap mb-4 ${
                    formation.isEnrolled ? 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300' : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {formation.isEnrolled ? 'Déjà inscrit' : "S'inscrire maintenant"}
                </Link>
              )}
              {formation.isOwner && (
                <Link
                  href={'/dashboard/formations'}
                  className="block text-center w-full py-3 px-6 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap mb-4 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                >
                  Gérer la formation
                </Link>
              )}

              {/* Section Vidéoconférence - visible seulement pour les inscrits et le propriétaire */}
              {(formation.isEnrolled || formation.isOwner) && formation.hasVideoConferenceLink && (
                <div className="mb-4 space-y-3">
                  {/* Boutons pour le propriétaire (expert) */}
                  {formation.isOwner && (
                    <div className="flex gap-2">
                      {!videoSessionStatus?.isSessionActive ? (
                        <button
                          onClick={handleStartVideoSession}
                          disabled={startingSession}
                          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold transition-colors bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {startingSession ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Lancement...
                            </>
                          ) : (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                              </svg>
                              Lancer la formation
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={handleStopVideoSession}
                          disabled={stoppingSession}
                          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold transition-colors bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {stoppingSession ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Arrêt...
                            </>
                          ) : (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                              </svg>
                              Terminer la formation
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Statut de la session pour le propriétaire */}
                  {formation.isOwner && videoSessionStatus && (
                    <div className={`text-center text-sm py-2 px-3 rounded-lg ${videoSessionStatus.isSessionActive ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                      {videoSessionStatus.isSessionActive ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                          Session en cours
                        </span>
                      ) : (
                        'Session non démarrée'
                      )}
                    </div>
                  )}

                  {/* Bouton Rejoindre la vidéoconférence */}
                  {/* Pour le propriétaire: toujours visible si session active */}
                  {/* Pour les inscrits: visible seulement si canJoin est true */}
                  {(formation.isOwner || (formation.isEnrolled && videoSessionStatus?.canJoin)) && (
                    <button
                      onClick={handleJoinVideo}
                      disabled={joiningVideo || (formation.isOwner && !videoSessionStatus?.isSessionActive)}
                      className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-lg font-semibold transition-colors bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {joiningVideo ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Connexion...
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                          </svg>
                          Rejoindre la vidéoconférence
                        </>
                      )}
                    </button>
                  )}

                  {/* Message pour les inscrits si la session n'est pas accessible */}
                  {formation.isEnrolled && !formation.isOwner && videoSessionStatus && !videoSessionStatus.canJoin && (
                    <div className="text-center text-sm py-3 px-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mx-auto mb-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      <p className="font-medium">La vidéoconférence n'est pas encore accessible</p>
                      <p className="text-xs mt-1">
                        {videoSessionStatus.nextSession
                          ? `Elle sera disponible 5 minutes avant le ${new Date(videoSessionStatus.nextSession).toLocaleString('fr-FR')} ou lorsque l'expert la lancera.`
                          : "L'expert n'a pas encore lancé la session."}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-center">
                  <i className="ri-calendar-line mr-3 text-blue-600"></i>
                  <span>Début: {formatDate(formation.nextSession)}</span>
                </div>
                {formation.schedule && (
                  <div className="flex items-center">
                    <i className="ri-time-line mr-3 text-blue-600"></i>
                    <span>{formation.schedule}</span>
                  </div>
                )}
                {formation.language && (
                  <div className="flex items-center">
                    <i className="ri-global-line mr-3 text-blue-600"></i>
                    <span>{formation.language}</span>
                  </div>
                )}
                {formation.support && (
                  <div className="flex items-center">
                    <i className="ri-customer-service-line mr-3 text-blue-600"></i>
                    <span>Support {formation.support}</span>
                  </div>
                )}
                {formation.accessDuration && (
                  <div className="flex items-center">
                    <i className="ri-time-line mr-3 text-blue-600"></i>
                    <span>Accès {formation.accessDuration}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Instructor Card */}
            {formation.expert && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Votre instructeur</h3>
                <div className="flex items-center space-x-4 mb-2">
                  <img
                    src={formation.expert.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(formation.expert.name)}&size=128`}
                    alt={formation.expert.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{formation.expert.name}</p>
                    {formation.expert.verified && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-xs mt-1">
                        <i className="ri-shield-check-line mr-1"></i> Vérifié
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Catégorie: {formation.category}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal d'inscription supprimé; la réservation se fait via la page dédiée */}

      <Footer />
    </div>
  );
}
