

'use client';

import { useEffect, useMemo, useState } from 'react';
import AppHeader from '@/components/AppHeader';
import Link from 'next/link';
import ApiService from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { useToast } from '@/contexts/ToastContext';

export default function Appointments() {
  const { user } = useAuth();
  const socket = useSocket();
  const { addToast } = useToast();
  const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, '') : '');
  const [viewMode, setViewMode] = useState<'user' | 'expert'>(user?.userType === 'expert' ? 'expert' : 'user');
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'cancelled'>('upcoming');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [allAppointments, setAllAppointments] = useState<any[]>([]);
  const [expertAppointments, setExpertAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        setLoading(true);
        const res = await ApiService.getAppointments();
        if (res.success && res.data) setAllAppointments(res.data);
        else setError(res.message || 'Impossible de charger les rendez-vous');
      } catch (e: any) {
        setError(e.message || 'Erreur de connexion');
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  // Charger les rendez-vous côté expert si nécessaire
  useEffect(() => {
    if (!user || user.userType !== 'expert') return;
    (async () => {
      try {
        const res = await ApiService.getExpertAppointments();
        if (res.success) setExpertAppointments(res.data || []);
      } catch {}
    })();
  }, [user]);

  const now = new Date();
  const toDateTime = (a: any) => new Date(`${a.date}T${a.time}:00`);
  const upcoming = useMemo(() => allAppointments.filter((a: any) => (a.status === 'pending') || (a.status === 'confirmed' && toDateTime(a) > now)), [allAppointments]);
  const completed = useMemo(() => allAppointments.filter((a: any) => (a.status === 'completed') || (a.status === 'confirmed' && toDateTime(a) <= now)), [allAppointments]);
  const cancelled = useMemo(() => allAppointments.filter((a: any) => a.status === 'cancelled'), [allAppointments]);

  const expertUpcoming = useMemo(() => expertAppointments.filter((a: any) => (a.status === 'pending') || (a.status === 'confirmed' && toDateTime(a) > now)), [expertAppointments]);
  const expertCompleted = useMemo(() => expertAppointments.filter((a: any) => (a.status === 'completed') || (a.status === 'confirmed' && toDateTime(a) <= now)), [expertAppointments]);
  const expertCancelled = useMemo(() => expertAppointments.filter((a: any) => a.status === 'cancelled'), [expertAppointments]);

  const handleJoinSession = (appointment: any) => {
    setSelectedAppointment(appointment);
    setShowJoinModal(true);
  };

  const handleJoinFormation = (appointment: any) => {
    if (appointment.formationId) {
      window.open(`/dashboard/formation/${appointment.formationId}/live`, '_blank');
    }
  };

  const isDateToday = (dateString: string) => {
    const today = new Date();
    const appointmentDate = new Date(dateString);
    return today.toDateString() === appointmentDate.toDateString();
  };

  const isWithinWindow = (dateString: string, timeString: string, beforeMinutes: number, afterMinutes: number) => {
    const now = new Date();
    const start = new Date(`${dateString}T${timeString}:00`);
    const from = new Date(start.getTime() - beforeMinutes * 60 * 1000);
    const to = new Date(start.getTime() + afterMinutes * 60 * 1000);
    return now >= from && now <= to;
  };

  const canJoinNow = (appointment: any) => {
    // Fenêtre élargie: utilisateurs: -30/+15 min, experts: -60/+30 min
    const isExpert = user?.userType === 'expert';
    const before = isExpert ? 60 : 30;
    const after = isExpert ? 30 : 15;
    return isWithinWindow(appointment.date, appointment.time, before, after);
  };

  const getJoinWindowText = () => {
    const isExpert = user?.userType === 'expert';
    return isExpert
      ? 'Disponible 60 min avant et 30 min après l\'heure prévue'
      : 'Disponible 30 min avant et 15 min après l\'heure prévue';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmé';
      case 'pending': return 'En attente';
      case 'completed': return 'Terminé';
      case 'cancelled': return 'Annulé';
      default: return status;
    }
  };

  // Realtime refresh for expert and user on appointment events
  useEffect(() => {
    if (!socket) return;
    const refresh = () => {
      (async () => {
        try {
          const resUser = await ApiService.getAppointments();
          if (resUser.success && resUser.data) setAllAppointments(resUser.data);
          if (user?.userType === 'expert') {
            const resExpert = await ApiService.getExpertAppointments();
            if (resExpert.success) setExpertAppointments(resExpert.data || []);
          }
        } catch {}
      })();
    };
    socket.on('appointmentBooked', refresh);
    socket.on('appointmentUpdated', refresh);
    socket.on('appointmentReminder', refresh);
    return () => {
      socket.off('appointmentBooked', refresh);
      socket.off('appointmentUpdated', refresh);
      socket.off('appointmentReminder', refresh);
    };
  }, [socket, user]);

  const refreshLists = async () => {
    try {
      const resUser = await ApiService.getAppointments();
      if (resUser.success && resUser.data) setAllAppointments(resUser.data);
      if (user?.userType === 'expert') {
        const resExpert = await ApiService.getExpertAppointments();
        if (resExpert.success) setExpertAppointments(resExpert.data || []);
      }
    } catch {}
  };

  const onConfirm = async (id: number) => {
    try {
      const res = await ApiService.confirmAppointment(id);
      if (res.success) {
        addToast('Rendez-vous confirmé', 'success');
        await refreshLists();
      }
    } catch {
      addToast("Erreur lors de la confirmation", 'error');
    }
  };
  const onCancel = async (id: number) => {
    try {
      const res = await ApiService.cancelAppointment(id);
      if (res.success) {
        addToast('Rendez-vous annulé', 'warning');
        await refreshLists();
      }
    } catch {
      addToast("Erreur lors de l'annulation", 'error');
    }
  };
  const onComplete = async (id: number) => {
    try {
      const res = await ApiService.completeAppointment(id);
      if (res.success) {
        addToast('Rendez-vous marqué comme effectué', 'success');
        await refreshLists();
      }
    } catch {
      addToast("Erreur lors de la finalisation", 'error');
    }
  };

  const isExpertMode = viewMode === 'expert';
  const up = isExpertMode ? expertUpcoming : upcoming;
  const comp = isExpertMode ? expertCompleted : completed;
  const can = isExpertMode ? expertCancelled : cancelled;
  const currentList = activeTab === 'upcoming' ? up : activeTab === 'completed' ? comp : can;

  const buildExpertCandidates = (apt: any) => {
    const list: string[] = [];
    const eId = apt?.expertRel?.id || apt?.expertId;
    const uId = apt?.expertRel?.userId;
    const name = apt?.expert || '';
    if (backendBase && (eId || uId)) {
      const ids = Array.from(new Set([eId, uId].filter(Boolean)));
      ids.forEach((id:any) => {
        list.push(`${backendBase}/api/assets/experts/${id}`);
        ['jpg','jpeg','png','webp'].forEach(ext => list.push(`${backendBase}/images/experts/${id}.${ext}`));
      });
    }
    if (apt?.image) {
      const raw = String(apt.image).replace(/\\/g, '/');
      if (/^(https?:)?\/\//i.test(raw) || raw.startsWith('data:')) list.push(raw);
      else if (backendBase) list.push(raw.startsWith('/') ? `${backendBase}${raw}` : `${backendBase}/${raw}`);
      else list.push(raw);
    }
    list.push(`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=96`);
    return Array.from(new Set(list));
  };
  const buildUserCandidates = (apt: any) => {
    const u = apt?.user;
    const list: string[] = [];
    const name = `${u?.firstName||''} ${u?.lastName||''}`.trim();
    if (backendBase && u?.id) {
      list.push(`${backendBase}/api/assets/users/${u.id}`);
      ['jpg','jpeg','png','webp'].forEach(ext => list.push(`${backendBase}/images/users/${u.id}.${ext}`));
      // Also try expert images keyed by user id
      list.push(`${backendBase}/api/assets/experts/${u.id}`);
      ['jpg','jpeg','png','webp'].forEach(ext => list.push(`${backendBase}/images/experts/${u.id}.${ext}`));
    }
    if (u?.avatar) {
      const raw = String(u.avatar).replace(/\\/g, '/');
      if (/^(https?:)?\/\//i.test(raw) || raw.startsWith('data:')) list.push(raw);
      else if (backendBase) list.push(raw.startsWith('/') ? `${backendBase}${raw}` : `${backendBase}/${raw}`);
      else list.push(raw);
    }
    list.push(`https://ui-avatars.com/api/?name=${encodeURIComponent(name||'User')}&size=96`);
    return Array.from(new Set(list));
  };

  if (loading) return (<div className="min-h-screen bg-gray-50"><AppHeader /><div className="max-w-7xl mx-auto p-8">Chargement...</div></div>);
  if (error) return (<div className="min-h-screen bg-gray-50"><AppHeader /><div className="max-w-7xl mx-auto p-8 text-red-500">{error}</div></div>);

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Mes Rendez-vous
          </h1>
          <p className="text-gray-600">
            Gérez vos consultations et formations avec nos experts
          </p>
        </div>

        {/* Switch utilisateur/expert */}
        {user?.userType === 'expert' && (
          <div className="mb-4">
            <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden bg-white">
              <button onClick={() => setViewMode('user')} className={`px-4 py-2 text-sm ${!isExpertMode ? 'bg-blue-600 text-white' : 'text-gray-700'}`}>Côté utilisateur</button>
              <button onClick={() => setViewMode('expert')} className={`px-4 py-2 text-sm ${isExpertMode ? 'bg-blue-600 text-white' : 'text-gray-700'}`}>Côté expert</button>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <i className="ri-calendar-line text-blue-600 text-xl"></i>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{up.length}</h3>
                <p className="text-gray-600 text-sm">À venir</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <i className="ri-check-line text-green-600 text-xl"></i>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{comp.length}</h3>
                <p className="text-gray-600 text-sm">Terminés</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <i className="ri-graduation-cap-line text-purple-600 text-xl"></i>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {up.filter((a: any) => String(a.type || '').toLowerCase().includes('formation')).length}
                </h3>
                <p className="text-gray-600 text-sm">Formations</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <i className="ri-coins-line text-orange-600 text-xl"></i>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {up.reduce((sum, a) => sum + (a.coins || 0), 0)}
                </h3>
                <p className="text-gray-600 text-sm">Coins investis</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg max-w-md">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'upcoming'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              À venir ({up.length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'completed'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Terminés ({comp.length})
            </button>
            <button
              onClick={() => setActiveTab('cancelled')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'cancelled'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Annulés ({can.length})
            </button>
          </div>
        </div>

        {/* Appointments List */}
        <div className="space-y-4">
          {currentList.map((appointment: any) => (
            <div key={appointment.id} className="bg-white rounded-lg shadow-sm p-6 border">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {(() => {
                    const cand = isExpertMode ? buildUserCandidates(appointment) : buildExpertCandidates(appointment);
                    const first = cand[0];
                    const fallback = cand[cand.length - 1];
                    return (
                      <img
                        src={first}
                        alt={isExpertMode && (appointment as any).user ? `${(appointment as any).user.firstName} ${(appointment as any).user.lastName}` : (appointment.expert || '')}
                        className="w-16 h-16 rounded-full object-cover"
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
                  <div>
                    <h3 className="font-semibold text-gray-900">{isExpertMode && (appointment as any).user ? `${(appointment as any).user.firstName} ${(appointment as any).user.lastName}` : appointment.expert}</h3>
                    <p className="text-gray-600">{appointment.type}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-sm text-gray-500">
                        <i className="ri-calendar-line mr-1"></i>
                        {new Date(appointment.date).toLocaleDateString('fr-FR')}
                      </span>
                      <span className="text-sm text-gray-500">
                        <i className="ri-time-line mr-1"></i>
                        {appointment.time}
                      </span>
                      <span className="text-sm text-gray-500">
                        <i className="ri-timer-line mr-1"></i>
                        {appointment.duration}
                      </span>
                    </div>
                    
                    {/* Formation specific info */}
                    {appointment.type.includes('Formation') && appointment.enrolled && (
                      <div className="mt-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-blue-600">
                            <i className="ri-group-line mr-1"></i>
                            {appointment.enrolled} inscrits
                          </span>
                          <span className="text-sm text-gray-500">
                            (minimum: {appointment.minEnrolled})
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center space-x-3 mb-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {appointment.status === 'confirmed' ? 'Confirmé' :
                       appointment.status === 'pending' ? 'En attente' :
                       appointment.status === 'cancelled' ? 'Annulé' : 'Terminé'}
                    </span>
                    {(!isExpertMode && (appointment.status === 'pending' || appointment.status === 'confirmed')) && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Coins bloqués: {appointment.coins || 0}
                      </span>
                    )}
                    
                    {appointment.status === 'confirmed' && new Date(appointment.date + 'T' + appointment.time) <= new Date() && (
                      <Link
                        href={`/video-session/session-${appointment.id}`}
                        className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm whitespace-nowrap cursor-pointer"
                      >
                        Rejoindre
                      </Link>
                    )}
                    
                    {appointment.status === 'confirmed' && new Date(appointment.date + 'T' + appointment.time) > new Date() && (
                      <span className="px-3 py-1 bg-gray-200 text-gray-600 rounded-lg text-sm">
                        Planifié
                      </span>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    {activeTab === 'upcoming' && appointment.status === 'confirmed' && (
                      <>
                        {appointment.type.includes('Formation') ? (
                          <button
                            onClick={() => handleJoinFormation(appointment)}
                            disabled={!canJoinNow(appointment)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                              canJoinNow(appointment)
                                ? 'bg-purple-600 text-white hover:bg-purple-700'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            {canJoinNow(appointment) ? 'Rejoindre formation' : 'Pas encore disponible'}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleJoinSession(appointment)}
                            disabled={!canJoinNow(appointment)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                              canJoinNow(appointment)
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            {canJoinNow(appointment) ? 'Rejoindre' : 'Pas encore disponible'}
                          </button>
                        )}
                        {!canJoinNow(appointment) && (
                          <div className="text-xs text-gray-500 mt-1">{getJoinWindowText()}</div>
                        )}
                        {new Date(appointment.date + 'T' + appointment.time) <= new Date() && (
                          <button onClick={() => onComplete(appointment.id)} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm whitespace-nowrap">
                            Marquer comme effectué
                          </button>
                        )}
                      </>
                    )}
                    
                    {activeTab === 'completed' && (
                      <>
                        {appointment.certificateAvailable && (
                          <button className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors text-sm whitespace-nowrap">
                            Télécharger certificat
                          </button>
                        )}
                        {!appointment.rating && (
                          <button className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors text-sm whitespace-nowrap">
                            Laisser un avis
                          </button>
                        )}
                        <button className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors text-sm whitespace-nowrap">
                          Voir détails
                        </button>
                        {(() => {
                          const t = String(appointment?.type || '').toLowerCase();
                          const isVideo = t.includes('video') || t.includes('visio') || t.includes('appel') || t.includes('call');
                          if (!isVideo) return null;
                          return (
                            <Link
                              href={`/dashboard/recordings?sessionId=session-${appointment.id}`}
                              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors text-sm whitespace-nowrap"
                            >
                              Voir enregistrement
                            </Link>
                          );
                        })()}
                      </>
                    )}
                    
                    {activeTab === 'cancelled' && appointment.refunded && (
                      <div className="text-green-600 text-sm">
                        <i className="ri-refund-line mr-1"></i>
                        Remboursé: {appointment.refundAmount} coins
                      </div>
                    )}

                    {/* Actions côté expert sur rendez-vous en attente */}
                    {viewMode === 'expert' && appointment.status === 'pending' && (
                      <>
                        <button onClick={() => onConfirm(appointment.id)} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm whitespace-nowrap">
                          Confirmer
                        </button>
                        <button onClick={() => onCancel(appointment.id)} className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors text-sm whitespace-nowrap">
                          Annuler
                        </button>
                      </>
                    )}

                    {/* Annulation côté utilisateur (si non terminé/annulé) */}
                    {viewMode === 'user' && appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                      <button onClick={() => onCancel(appointment.id)} className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors text-sm whitespace-nowrap">
                        Annuler
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {currentList.length === 0 && (
          <div className="text-center py-12">
            <i className="ri-calendar-line text-6xl text-gray-400 mb-4"></i>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun rendez-vous
            </h3>
            <p className="text-gray-600 mb-6">
              Vous n\'avez aucun rendez-vous dans cette catégorie.
            </p>
            <div className="flex justify-center space-x-4">
              <Link
                href="/dashboard/search"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold whitespace-nowrap"
              >
                Trouver un expert
              </Link>
              <Link
                href="/formations"
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-semibold whitespace-nowrap"
              >
                Voir les formations
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Join Session Modal */}
      {showJoinModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Rejoindre la session
            </h3>
            <div className="mb-4">
              <p className="text-gray-600 mb-2">
                <strong>Expert:</strong> {selectedAppointment.expert}
              </p>
              <p className="text-gray-600 mb-2">
                <strong>Type:</strong> {selectedAppointment.type}
              </p>
              <p className="text-gray-600 mb-4">
                <strong>Durée:</strong> {selectedAppointment.duration}
              </p>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <p className="text-blue-800 text-sm">
                <i className="ri-information-line mr-2"></i>
                Assurez-vous d\'avoir un environnement calme et une connexion internet stable.
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowJoinModal(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors whitespace-nowrap"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  if (!selectedAppointment) return;
                  if (!canJoinNow(selectedAppointment)) return;
                  setShowJoinModal(false);
                  if (selectedAppointment.formationId) {
                    window.open(`/dashboard/formation/${selectedAppointment.formationId}/live`, '_blank');
                  } else if (selectedAppointment.joinLink) {
                    window.open(selectedAppointment.joinLink, '_blank');
                  } else {
                    window.location.href = `/video-session/session-${selectedAppointment.id}`;
                  }
                }}
                disabled={!selectedAppointment || !canJoinNow(selectedAppointment)}
                className={`flex-1 py-2 px-4 rounded-md transition-colors whitespace-nowrap ${selectedAppointment && canJoinNow(selectedAppointment) ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
              >
                Rejoindre maintenant
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
