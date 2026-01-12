'use client';

import React, { useEffect, useState } from 'react';
import ApiService from '@/services/api';
import { useSocket } from '@/contexts/SocketContext';
import { useToast } from '@/contexts/ToastContext';
import { useCurrency } from '@/contexts/CurrencyContext';

interface Expert {
  id: number;
  name: string;
  specialty: string;
  verified: boolean;
  verificationStatus: string;
  rating: number;
  reviews: number;
  hourlyRate: number;
  pricePerMessage: number;
  sessions: number;
  followers: number;
  userId: number;
  identityDocumentType?: string;
  identityDocumentFront?: string;
  identityDocumentBack?: string;
  selfieWithIdentity?: string;
  bankDocument?: string;
  bankDetails?: string;
  user?: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

export default function AdminExpertsPage() {
  const socket = useSocket();
  const { addToast } = useToast();
  const { formatPriceWithUnit } = useCurrency();
  const [items, setItems] = useState<Expert[]>([]);
  const [status, setStatus] = useState<'all' | 'pending' | 'verified'>('pending');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Expert | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, '') : '');

  const load = async () => {
    setLoading(true);
    try {
      const res = await ApiService.adminListExperts({ status, search, limit, page });
      if (res.success) {
        setItems(res.data.items || []);
        setTotal(res.data.total || 0);
      }
    } catch {
      addToast('Erreur de chargement des experts', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [status, page]);

  useEffect(() => {
    if (!socket) return;
    const handler = () => load();
    socket.on('expertVerificationChanged', handler);
    return () => {
      socket.off('expertVerificationChanged', handler);
    };
  }, [socket]);

  const verify = async (id: number, action: 'approve' | 'reject') => {
    try {
      const res = await ApiService.adminVerifyExpert(id, action, action === 'reject' ? rejectReason : undefined);
      if (res.success) {
        addToast(action === 'approve' ? 'Expert vérifié avec succès' : 'Vérification refusée', 'success');
        load();
        setSelected(null);
        setRejectReason('');
      }
    } catch {
      addToast('Erreur lors de la mise à jour', 'error');
    }
  };

  const buildExpertCandidates = (id: number, name: string, avatar?: string, userId?: number) => {
    const ext = ['jpg', 'jpeg', 'png', 'webp'];
    const ids = Array.from(new Set([id, userId].filter(Boolean))) as number[];
    const apiList = backendBase ? ids.map((i: any) => `${backendBase}/api/assets/experts/${i}`) : [];
    const staticList = backendBase ? ids.flatMap((i) => ext.map((e: any) => `${backendBase}/images/experts/${i}.${e}`)) : [];
    const fromAvatar = avatar && backendBase
      ? (/^(https?:)?\/\//i.test(avatar) || avatar.startsWith('data:')
        ? avatar
        : (avatar.startsWith('/') ? `${backendBase}${avatar}` : `${backendBase}/${avatar}`))
      : (avatar || '');
    const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Expert')}&size=40`;
    return Array.from(new Set([...(apiList as string[]), ...staticList, fromAvatar, fallback].filter(Boolean)));
  };

  const getStatusBadge = (expert: Expert) => {
    if (expert.verified) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
          <i className="ri-checkbox-circle-fill"></i>
          Vérifié
        </span>
      );
    }
    if (expert.verificationStatus === 'PENDING') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
          <i className="ri-time-line"></i>
          En attente
        </span>
      );
    }
    if (expert.verificationStatus === 'REJECTED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
          <i className="ri-close-circle-fill"></i>
          Refusé
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
        <i className="ri-question-line"></i>
        Non soumis
      </span>
    );
  };

  const stats = {
    total: items.length,
    verified: items.filter((e) => e.verified).length,
    pending: items.filter((e) => e.verificationStatus === 'PENDING').length,
    rejected: items.filter((e) => e.verificationStatus === 'REJECTED').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: total, icon: 'ri-user-star-line', color: 'blue', filter: 'all' as const },
          { label: 'Vérifiés', value: stats.verified, icon: 'ri-checkbox-circle-line', color: 'green', filter: 'verified' as const },
          { label: 'En attente', value: stats.pending, icon: 'ri-time-line', color: 'yellow', filter: 'pending' as const },
          { label: 'Refusés', value: stats.rejected, icon: 'ri-close-circle-line', color: 'red', filter: 'all' as const },
        ].map((stat) => (
          <button
            key={stat.label}
            onClick={() => setStatus(stat.filter)}
            className={`p-4 rounded-xl border transition-all text-left ${
              status === stat.filter
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300'
            }`}
          >
            <div className={`w-10 h-10 rounded-lg bg-${stat.color}-50 dark:bg-${stat.color}-900/20 flex items-center justify-center mb-2`}>
              <i className={`${stat.icon} text-${stat.color}-600 text-lg`}></i>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
          </button>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex flex-1 gap-2 w-full sm:w-auto">
            <div className="relative flex-1">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && load()}
                placeholder="Rechercher par nom ou spécialité..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button onClick={load} className="px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors">
              <i className="ri-search-line"></i>
            </button>
          </div>
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/admin/export/experts.csv`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <i className="ri-download-2-line"></i>
            <span>Exporter CSV</span>
          </a>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <i className="ri-user-star-line text-4xl mb-2"></i>
            <p>Aucun expert trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="text-left px-6 py-4 font-medium text-gray-600 dark:text-gray-300">Expert</th>
                  <th className="text-left px-6 py-4 font-medium text-gray-600 dark:text-gray-300">Spécialité</th>
                  <th className="text-left px-6 py-4 font-medium text-gray-600 dark:text-gray-300">Tarifs</th>
                  <th className="text-left px-6 py-4 font-medium text-gray-600 dark:text-gray-300">Stats</th>
                  <th className="text-left px-6 py-4 font-medium text-gray-600 dark:text-gray-300">Statut</th>
                  <th className="text-right px-6 py-4 font-medium text-gray-600 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {items.map((expert) => {
                  const candidates = buildExpertCandidates(expert.id, expert.name, expert.user?.avatar, expert.userId);
                  return (
                    <tr key={expert.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={candidates[0]}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover"
                            data-cand={candidates.join('|')}
                            data-idx={0}
                            onError={(ev) => {
                              const t = ev.currentTarget as HTMLImageElement;
                              const cand = (t.getAttribute('data-cand') || '').split('|').filter(Boolean);
                              let idx = parseInt(t.getAttribute('data-idx') || '0', 10) || 0;
                              if (idx < cand.length - 1) {
                                idx += 1;
                                t.setAttribute('data-idx', String(idx));
                                t.src = cand[idx];
                              } else {
                                t.onerror = null;
                                t.src = cand[cand.length - 1];
                              }
                            }}
                          />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{expert.name}</p>
                            <p className="text-xs text-gray-500">{expert.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{expert.specialty}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="font-medium text-gray-900 dark:text-white">{formatPriceWithUnit(expert.hourlyRate, 'h')}</p>
                          <p className="text-gray-500">{formatPriceWithUnit(expert.pricePerMessage, 'msg')}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1 text-yellow-600">
                            <i className="ri-star-fill"></i>
                            <span>{expert.rating.toFixed(1)}</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-500">
                            <i className="ri-chat-3-line"></i>
                            <span>{expert.reviews}</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-500">
                            <i className="ri-calendar-line"></i>
                            <span>{expert.sessions}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(expert)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelected(expert)}
                            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                            title="Voir les documents"
                          >
                            <i className="ri-file-list-3-line text-lg"></i>
                          </button>
                          {!expert.verified && expert.verificationStatus === 'PENDING' && (
                            <>
                              <button
                                onClick={() => verify(expert.id, 'approve')}
                                className="p-2 rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                                title="Approuver"
                              >
                                <i className="ri-checkbox-circle-line text-lg"></i>
                              </button>
                              <button
                                onClick={() => setSelected(expert)}
                                className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                title="Refuser"
                              >
                                <i className="ri-close-circle-line text-lg"></i>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > limit && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Page {page} sur {Math.ceil(total / limit)}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <i className="ri-arrow-left-s-line"></i>
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= Math.ceil(total / limit)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <i className="ri-arrow-right-s-line"></i>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Expert Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setSelected(null); setRejectReason(''); }}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Vérification: {selected.name}</h2>
              <button onClick={() => { setSelected(null); setRejectReason(''); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            <div className="p-6">
              {/* Expert Info */}
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                <img
                  src={buildExpertCandidates(selected.id, selected.name, selected.user?.avatar, selected.userId)[0]}
                  alt=""
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">{selected.name}</h3>
                  <p className="text-gray-500">{selected.specialty}</p>
                  <p className="text-sm text-gray-400">{selected.user?.email}</p>
                </div>
                <div className="ml-auto">{getStatusBadge(selected)}</div>
              </div>

              {/* Documents */}
              <h4 className="font-medium text-gray-900 dark:text-white mb-4">Documents de vérification</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {selected.identityDocumentFront && (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                    <p className="text-sm text-gray-500 mb-2">Pièce d'identité (recto)</p>
                    <img src={selected.identityDocumentFront} alt="recto" className="w-full rounded-lg object-contain max-h-48" />
                  </div>
                )}
                {selected.identityDocumentBack && (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                    <p className="text-sm text-gray-500 mb-2">Pièce d'identité (verso)</p>
                    <img src={selected.identityDocumentBack} alt="verso" className="w-full rounded-lg object-contain max-h-48" />
                  </div>
                )}
                {selected.selfieWithIdentity && (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                    <p className="text-sm text-gray-500 mb-2">Selfie avec pièce d'identité</p>
                    <img src={selected.selfieWithIdentity} alt="selfie" className="w-full rounded-lg object-contain max-h-48" />
                  </div>
                )}
                {selected.bankDocument && (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                    <p className="text-sm text-gray-500 mb-2">Document bancaire</p>
                    {/\.pdf$/i.test(selected.bankDocument) ? (
                      <a href={selected.bankDocument} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
                        <i className="ri-file-pdf-line text-2xl"></i>
                        <span>Ouvrir le PDF</span>
                      </a>
                    ) : (
                      <img src={selected.bankDocument} alt="bank" className="w-full rounded-lg object-contain max-h-48" />
                    )}
                  </div>
                )}
              </div>

              {/* Additional Info */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Type de document:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">{selected.identityDocumentType || '—'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Coordonnées bancaires:</span>
                    <span className="ml-2 text-gray-900 dark:text-white break-all">{selected.bankDetails || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {!selected.verified && selected.verificationStatus === 'PENDING' && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => verify(selected.id, 'approve')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-green-600 text-white hover:bg-green-700 transition-colors"
                  >
                    <i className="ri-checkbox-circle-line"></i>
                    <span>Approuver la vérification</span>
                  </button>
                  <div className="flex-1 flex gap-2">
                    <input
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Raison du refus (optionnel)"
                      className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
                    />
                    <button
                      onClick={() => verify(selected.id, 'reject')}
                      className="px-4 py-3 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors"
                    >
                      <i className="ri-close-circle-line mr-2"></i>
                      Refuser
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
