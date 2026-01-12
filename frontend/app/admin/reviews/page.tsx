'use client';
import React, { useEffect, useState } from 'react';
import ApiService from '@/services/api';
import { useToast } from '@/contexts/ToastContext';

export default function AdminReviewsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  const [selected, setSelected] = useState<number[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await ApiService.adminListReviews({ search, limit: 50 });
      if (res.success) setItems(res.data.items || []);
    } catch {
      addToast('Erreur de chargement des avis', 'error');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);


  const bulkRemove = async () => {
    if (selected.length === 0) return;
    if (!confirm(`Supprimer ${selected.length} avis ?`)) return;
    try {
      const r = await ApiService.adminBulkDeleteReviews(selected);
      if (r.success) {
        addToast('Avis supprimés', 'success');
        setSelected([]);
        load();
      }
    } catch {
      addToast('Erreur lors de la suppression groupée', 'error');
    }
  };

  const remove = async (id: number) => {
    if (!confirm('Supprimer cet avis ?')) return;
    try {
      const r = await ApiService.adminDeleteReview(id);
      if (r.success) {
        addToast('Avis supprimé', 'success');
        load();
      }
    } catch {
      addToast('Erreur lors de la suppression', 'error');
    }
  };

  const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, '') : '');
  const buildUserCandidates = (u: any) => {
    const name = `${u?.firstName||''} ${u?.lastName||''}`.trim();
    const list: string[] = [];
    if (backendBase && u?.id) {
      list.push(`${backendBase}/api/assets/users/${u.id}`);
      ;['jpg','jpeg','png','webp'].forEach(ext => list.push(`${backendBase}/images/users/${u.id}.${ext}`));
    }
    if (u?.avatar) {
      const raw = String(u.avatar).replace(/\\/g, '/');
      if (/^(https?:)?\/\//i.test(raw) || raw.startsWith('data:')) list.push(raw);
      else if (backendBase) list.push(raw.startsWith('/') ? `${backendBase}${raw}` : `${backendBase}/${raw}`);
      else list.push(raw);
    }
    list.push(`https://ui-avatars.com/api/?name=${encodeURIComponent(name||'User')}&size=40`);
    return Array.from(new Set(list));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Modération des avis</h1>
        <div className="flex items-center gap-2">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Recherche" className="border rounded-lg px-3 py-2 bg-white dark:bg-gray-800" />
          <button onClick={load} className="px-3 py-2 rounded-lg bg-blue-600 text-white">Rechercher</button>
          <button disabled={selected.length===0} onClick={bulkRemove} className="px-3 py-2 rounded-lg bg-red-600 text-white disabled:opacity-50">Supprimer sélection ({selected.length})</button>
        </div>
      </div>

      {loading ? (
        <div className="text-gray-600">Chargement…</div>
      ) : (
        <div className="space-y-3">
          {items.map((rev) => (
            <div key={rev.id} className="bg-white dark:bg-gray-800 rounded-xl border p-4 flex items-start justify-between">
              <div className="flex items-start gap-3">
                <input type="checkbox" checked={selected.includes(rev.id)} onChange={(e)=>{ setSelected(prev=> e.target.checked ? Array.from(new Set([...prev, rev.id])) : prev.filter((id: any) =>id!==rev.id)); }} className="mt-2"/>
                {(() => {
                  const cand = buildUserCandidates(rev.user);
                  const first = cand[0];
                  const fallback = cand[cand.length - 1];
                  return (
                    <img
                      src={first}
                      className="w-10 h-10 rounded-full object-cover"
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
                  <div className="font-medium">{rev.user?.firstName} {rev.user?.lastName} <span className="text-xs text-gray-500">({rev.rating}/5)</span></div>
                  <div className="text-xs text-gray-500">Expert: {rev.expert?.name || 'N/A'}</div>
                  <div className="text-sm mt-1">{rev.comment}</div>
                </div>
              </div>
              <button onClick={() => remove(rev.id)} className="px-3 py-1 rounded bg-red-600 text-white">Supprimer</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
