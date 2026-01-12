'use client';
import React, { useEffect, useState } from 'react';
import ApiService from '@/services/api';
import { useSocket } from '@/contexts/SocketContext';
import { useToast } from '@/contexts/ToastContext';

export default function AdminExpertsPage() {
  const socket = useSocket();
  const [items, setItems] = useState<any[]>([]);
  const [status, setStatus] = useState<'all'|'pending'|'verified'>('pending');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  const [selected, setSelected] = useState<any|null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await ApiService.adminListExperts({ status, search, limit: 50 });
      if (res.success) setItems(res.data.items || []);
    } catch {
      addToast('Erreur de chargement des experts', 'error');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [status]);

  // Real-time refresh when verification changes from elsewhere
  useEffect(() => {
    if (!socket) return;
    const handler = () => load();
    socket.on('expertVerificationChanged', handler);
    return () => { socket.off('expertVerificationChanged', handler); };
  }, [socket]);

  const verify = async (id: number, action: 'approve'|'reject') => {
    try {
      const res = await ApiService.adminVerifyExpert(id, action, action==='reject'?rejectReason:undefined);
      if (res.success) {
        addToast(action === 'approve' ? 'Expert vérifié' : 'Vérification refusée', 'success');
        load();
        setSelected(null);
        setRejectReason('');
      }
    } catch {
      addToast('Erreur lors de la mise à jour', 'error');
    }
  };

  const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, '') : '');
  const buildExpertCandidates = (id: number, name: string, avatar?: string, userId?: number) => {
    const ext = ['jpg','jpeg','png','webp'];
    const ids = Array.from(new Set([id, userId].filter(Boolean))) as number[];
    const apiList = backendBase ? ids.map((i: any) => `${backendBase}/api/assets/experts/${i}`) : [];
    const staticList = backendBase ? ids.flatMap(i => ext.map((e: any) => `${backendBase}/images/experts/${i}.${e}`)) : [];
    const fromAvatar = avatar && backendBase
      ? (/^(https?:)?\/\//i.test(avatar) || avatar.startsWith('data:')
          ? avatar
          : (avatar.startsWith('/') ? `${backendBase}${avatar}` : `${backendBase}/${avatar}`))
      : (avatar || '');
    const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Expert')}&size=40`;
    return Array.from(new Set([...(apiList as string[]), ...staticList, fromAvatar, fallback].filter(Boolean)));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Gestion des Experts</h1>
        <div className="flex items-center gap-2">
          <select value={status} onChange={e => setStatus(e.target.value as any)} className="border rounded-lg px-3 py-2 bg-white dark:bg-gray-800">
            <option value="all">Tous</option>
            <option value="pending">En attente</option>
            <option value="verified">Vérifiés</option>
          </select>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Recherche" className="border rounded-lg px-3 py-2 bg-white dark:bg-gray-800" />
          <button onClick={load} className="px-3 py-2 rounded-lg bg-blue-600 text-white">Rechercher</button>
        </div>
      </div>

      {loading ? (
        <div className="text-gray-600">Chargement…</div>
      ) : (
        <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-xl border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="text-left p-3">Expert</th>
                <th className="text-left p-3">Spécialité</th>
                <th className="text-left p-3">Statut</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((e) => (
                <tr key={e.id} className="border-t">
                  <td className="p-3 flex items-center gap-2">
                    {(() => {
                      const candidates = buildExpertCandidates(e.id, e.name, e.user?.avatar, e.userId);
                      const first = candidates[0];
                      const fallback = candidates[candidates.length - 1];
                      return (
                        <img
                          src={first}
                          alt="avatar"
                          className="w-8 h-8 rounded-full object-cover"
                          data-cand={candidates.join('|')}
                          data-idx={0}
                          onError={(ev)=>{
                            const t=ev.currentTarget as HTMLImageElement;
                            const cand=(t.getAttribute('data-cand')||'').split('|').filter(Boolean);
                            let idx=parseInt(t.getAttribute('data-idx')||'0',10)||0;
                            if (idx < cand.length - 1) {
                              idx+=1; t.setAttribute('data-idx', String(idx)); t.src=cand[idx];
                            } else {
                              t.onerror=null; t.src=fallback;
                            }
                          }}
                        />
                      );
                    })()}
                    <div>
                      <div className="font-medium">{e.name}</div>
                      <div className="text-xs text-gray-500">{e.user?.email}</div>
                    </div>
                  </td>
                  <td className="p-3">{e.specialty}</td>
                  <td className="p-3">
                    {e.verified ? <span className="px-2 py-0.5 text-xs rounded bg-green-100 text-green-700">Vérifié</span> : e.verificationStatus === 'PENDING' ? <span className="px-2 py-0.5 text-xs rounded bg-yellow-100 text-yellow-700">En attente</span> : <span className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-700">Non vérifié</span>}
                  </td>
                  <td className="p-3 space-x-2">
                    <button onClick={() => setSelected(e)} className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700">Voir docs</button>
                    <button onClick={() => verify(e.id, 'approve')} className="px-3 py-1 rounded bg-green-600 text-white">Valider</button>
                    <button onClick={() => { setSelected(e); }} className="px-3 py-1 rounded bg-red-600 text-white">Refuser</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}



      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={()=>{ setSelected(null); setRejectReason(''); }}>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-3xl p-6" onClick={(e)=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Vérification: {selected.name}</h2>
              <button onClick={()=>{ setSelected(null); setRejectReason(''); }} className="text-gray-500">Fermer</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selected.identityDocumentFront && (
                <div>
                  <div className="text-sm text-gray-500 mb-1">Pièce d'identité (recto)</div>
                  <img src={selected.identityDocumentFront} alt="recto" className="w-full rounded border object-contain max-h-64" />
                </div>
              )}
              {selected.identityDocumentBack && (
                <div>
                  <div className="text-sm text-gray-500 mb-1">Pièce d'identité (verso)</div>
                  <img src={selected.identityDocumentBack} alt="verso" className="w-full rounded border object-contain max-h-64" />
                </div>
              )}
              {selected.selfieWithIdentity && (
                <div>
                  <div className="text-sm text-gray-500 mb-1">Selfie avec pièce</div>
                  <img src={selected.selfieWithIdentity} alt="selfie" className="w-full rounded border object-contain max-h-64" />
                </div>
              )}
              {selected.bankDocument && (
                <div>
                  <div className="text-sm text-gray-500 mb-1">Document bancaire</div>
                  {/\.pdf$/i.test(selected.bankDocument) ? (
                    <a href={selected.bankDocument} target="_blank" className="text-blue-600 underline">Ouvrir le PDF</a>
                  ) : (
                    <img src={selected.bankDocument} alt="bank" className="w-full rounded border object-contain max-h-64" />
                  )}
                </div>
              )}
            </div>
            <div className="mt-4 space-y-2">
              <div className="text-sm text-gray-500">Type: {selected.identityDocumentType || '—'}</div>
              <div className="text-sm text-gray-500 break-words">Coordonnées bancaires: {selected.bankDetails || '—'}</div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <button onClick={()=>verify(selected.id,'approve')} className="px-3 py-2 rounded bg-green-600 text-white">Valider</button>
              <input value={rejectReason} onChange={e=>setRejectReason(e.target.value)} placeholder="Raison du refus (optionnel)" className="flex-1 border rounded px-3 py-2 bg-white dark:bg-gray-800" />
              <button onClick={()=>verify(selected.id,'reject')} className="px-3 py-2 rounded bg-red-600 text-white">Refuser</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
