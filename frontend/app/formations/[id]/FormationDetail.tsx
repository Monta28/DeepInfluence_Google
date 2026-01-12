'use client';

import { useEffect, useMemo, useState } from 'react';
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

export default function FormationDetail({ formationId }: FormationDetailProps) {
  const [activeTab, setActiveTab] = useState('apercu');
  const [formation, setFormation] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentSort, setStudentSort] = useState<'newest'|'oldest'|'name'>('newest');
  const [studentRoleFilter, setStudentRoleFilter] = useState<'all'|'user'|'expert'|'admin'>('all');
  const [isFavorite, setIsFavorite] = useState<boolean>(false);

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

  const levelColor = useMemo(() => {
    const level = formation?.level;
    if (level === 'Débutant') return 'bg-green-100 text-green-800';
    if (level === 'Intermédiaire') return 'bg-yellow-100 text-yellow-800';
    if (level === 'Avancé') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
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
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Objectifs de la formation
                </h3>
                <ul className="space-y-3">
                  {(formation.objectives || []).map((objective: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <i className="ri-check-line text-green-600 mr-3 mt-0.5"></i>
                      <span className="text-gray-700">{objective}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Prérequis
                </h3>
                <ul className="space-y-3">
                  {(formation.prerequisites || []).map((prereq: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <i className="ri-arrow-right-line text-blue-600 mr-3 mt-0.5"></i>
                      <span className="text-gray-700">{prereq}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Ce qui est inclus
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(formation.included || []).map((item: string, index: number) => (
                  <div key={index} className="flex items-center">
                    <i className="ri-check-line text-green-600 mr-3"></i>
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Outils utilisés
              </h3>
              <div className="flex flex-wrap gap-2">
                {(formation.tools || []).map((tool: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
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
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Programme détaillé - {formation.duration}
              </h3>
              <p className="text-gray-600">{(formation.program || []).length} sessions de formation</p>
            </div>
            
            <div className="space-y-4">
              {(formation.program || []).map((session: any, index: number) => {
                const isObj = session && typeof session === 'object';
                const week = isObj && session.week ? session.week : index + 1;
                const title = isObj && session.title ? session.title : (typeof session === 'string' ? session : `Module ${index + 1}`);
                const content = isObj && session.content ? session.content : '';
                const duration = isObj && session.duration ? session.duration : '';
                return (
                  <div key={index} className="border rounded-lg p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold mr-4">
                          {week}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{title}</h4>
                          {content && <p className="text-sm text-gray-600">{content}</p>}
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
                  <h3 className="text-2xl font-semibold text-gray-900 mb-2">{formation.expert.name}</h3>
                  {formation.expert.verified && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs">
                      <i className="ri-shield-check-line mr-1"></i> Vérifié
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-gray-600">Aucune information instructeur.</div>
            )}
          </div>
        );

      case 'etudiants':
        return (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-gray-900">Liste des inscrits ({(formation.enrollments || []).length})</h3>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e)=>setStudentSearch(e.target.value)}
                  placeholder="Rechercher par nom..."
                  className="border rounded px-3 py-1 text-sm"
                />
                <select value={studentRoleFilter} onChange={(e)=>setStudentRoleFilter(e.target.value as any)} className="border rounded px-2 py-1 text-sm">
                  <option value="all">Tous</option>
                  <option value="user">Utilisateur</option>
                  <option value="expert">Expert</option>
                  <option value="admin">Administrateur</option>
                </select>
                <select value={studentSort} onChange={(e)=>setStudentSort(e.target.value as any)} className="border rounded px-2 py-1 text-sm">
                  <option value="newest">Plus récent</option>
                  <option value="oldest">Plus ancien</option>
                  <option value="name">Nom (A→Z)</option>
                </select>
                <button onClick={handleExportEnrollments} className="text-sm text-blue-600 hover:underline">Exporter CSV</button>
              </div>
            </div>
            {(formation.enrollments || []).length === 0 ? (
              <div className="text-gray-600">Aucun inscrit pour le moment.</div>
            ) : (
              <ul className="divide-y rounded-lg border">
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
                  const roleStyle = e.user?.userType === 'admin' ? 'bg-purple-100 text-purple-700' : e.user?.userType === 'expert' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700';
                  return (
                    <li key={e.user?.id} className="flex items-center gap-3 p-3">
                      <img src={e.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent((e.user?.firstName||'')+' '+(e.user?.lastName||''))}&size=64`} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{e.user?.firstName} {e.user?.lastName}</div>
                        <div className="text-xs text-gray-500">Inscrit le {e.enrolledAt ? new Date(e.enrolledAt).toLocaleString('fr-FR') : '-'}</div>
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
            <div className="bg-gray-50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  Avis des étudiants
                </h3>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    {renderStars(formation.rating)}
                    <span className="ml-2 text-lg font-semibold text-gray-900">
                      {formation.rating}
                    </span>
                  </div>
                  <span className="text-gray-600">{(formation.reviews || []).length} avis</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[5, 4, 3, 2, 1].map((star) => (
                  <div key={star} className="flex items-center">
                    <span className="text-sm text-gray-600 mr-2">{star}</span>
                    <i className="ri-star-fill text-yellow-400 mr-2"></i>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full">
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
                <div key={review.id} className="border rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                        {review.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{review.name}</p>
                        <div className="flex items-center space-x-2">
                          <div className="flex">
                            {renderStars(review.rating)}
                          </div>
                          {review.verified && (
                            <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                              Vérifié
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">
                      {formatDate(review.date)}
                    </span>
                  </div>
                  <p className="text-gray-700">{review.comment}</p>
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
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-gray-600">Chargement…</div>
        <Footer />
      </div>
    );
  }
  if (error || !formation) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-red-600">{error || 'Formation introuvable'}</div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-blue-600">Accueil</Link>
            <i className="ri-arrow-right-s-line"></i>
            <Link href="/formations" className="hover:text-blue-600">Formations</Link>
            <i className="ri-arrow-right-s-line"></i>
            <span className="text-gray-900">{formation.title}</span>
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
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-700">
                  <i className="ri-shield-user-line mr-1"></i> Propriétaire
                </span>
              )}
              {formation.isEnrolled && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-700">
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
            <div className="border-b border-gray-200 mb-8">
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
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-lg p-8">
              {renderTabContent()}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Enrollment Card */}
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-6">
              <div className="text-center mb-6">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <span className="text-3xl font-bold text-gray-900">{formation.price} coins</span>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Places disponibles</span>
                  <span className="font-semibold text-gray-900">
                    {(formation.maxPlaces || 0) - (formation.currentPlaces || 0)}/{formation.maxPlaces || 0}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
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
                    formation.isEnrolled ? 'bg-gray-300 text-gray-600' : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {formation.isEnrolled ? 'Déjà inscrit' : "S'inscrire maintenant"}
                </Link>
              )}
              {formation.isOwner && (
                <Link
                  href={'/dashboard/formations'}
                  className="block text-center w-full py-3 px-6 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap mb-4 bg-gray-200 text-gray-700"
                >
                  Gérer la formation
                </Link>
              )}

              <div className="space-y-3 text-sm text-gray-600">
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
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Votre instructeur</h3>
                <div className="flex items-center space-x-4 mb-2">
                  <img
                    src={formation.expert.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(formation.expert.name)}&size=128`}
                    alt={formation.expert.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold text-gray-900">{formation.expert.name}</p>
                    {formation.expert.verified && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs mt-1">
                        <i className="ri-shield-check-line mr-1"></i> Vérifié
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600">Catégorie: {formation.category}</p>
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
