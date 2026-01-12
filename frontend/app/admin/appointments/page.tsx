'use client';
import React, { useEffect, useState } from 'react';
import ApiService from '@/services/api';
import { useToast } from '@/contexts/ToastContext';

export default function AdminAppointmentsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const r = await ApiService.adminListAppointments({ status, limit: 50 });
      if (r.success) setItems(r.data.items || []);
    } catch { addToast('Erreur de chargement', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [status]);

  const update = async (id: number, action: 'confirm'|'cancel'|'complete') => {
    try {
      const r = await ApiService.adminUpdateAppointment(id, action);
      if (r.success) { addToast('Mise à jour effectuée', 'success'); load(); }
    } catch { addToast('Erreur de mise à jour', 'error'); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Rendez-vous</h1>
        <div className="flex items-center gap-2">
          <select value={status} onChange={e=>setStatus(e.target.value)} className="border rounded-lg px-3 py-2 bg-white dark:bg-gray-800">
            <option value="">Tous</option>
            <option value="pending">En attente</option>
            <option value="confirmed">Confirmés</option>
            <option value="completed">Complétés</option>
            <option value="cancelled">Annulés</option>
          </select>
          <button onClick={load} className="px-3 py-2 rounded-lg bg-blue-600 text-white">Rafraîchir</button>
        </div>
      </div>
      <div className="mb-4"><a className="text-sm text-blue-600 underline" href={(process.env.NEXT_PUBLIC_API_URL||'http://localhost:3001/api')+"/admin/export/appointments.csv"} target="_blank" rel="noreferrer">Exporter CSV</a></div>
      {loading ? (
        <div className="text-gray-600">Chargement…</div>
      ) : (
        <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-xl border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="text-left p-3">ID</th>
                <th className="text-left p-3">Utilisateur</th>
                <th className="text-left p-3">Expert</th>
                <th className="text-left p-3">Date</th>
                <th className="text-left p-3">Heure</th>
                <th className="text-left p-3">Coins</th>
                <th className="text-left p-3">Statut</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id} className="border-t">
                  <td className="p-3">{a.id}</td>
                  <td className="p-3">{a.user?.firstName} {a.user?.lastName}</td>
                  <td className="p-3">{a.expertRel?.name}</td>
                  <td className="p-3">{a.date}</td>
                  <td className="p-3">{a.time}</td>
                  <td className="p-3">{a.coins}</td>
                  <td className="p-3">{a.status}</td>
                  <td className="p-3 space-x-2">
                    <button onClick={()=>update(a.id,'confirm')} className="px-2 py-1 rounded bg-green-600 text-white">Confirmer</button>
                    <button onClick={()=>update(a.id,'cancel')} className="px-2 py-1 rounded bg-red-600 text-white">Annuler</button>
                    <button onClick={()=>update(a.id,'complete')} className="px-2 py-1 rounded bg-blue-600 text-white">Compléter</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
