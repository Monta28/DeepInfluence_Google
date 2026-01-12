'use client';
import React, { useState } from 'react';
import ApiService from '@/services/api';
import { useToast } from '@/contexts/ToastContext';

export default function AdminBroadcastPage() {
  const [target, setTarget] = useState<'all'|'users'|'experts'>('all');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [actionUrl, setActionUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return addToast('Titre et message requis', 'warning');
    try {
      setLoading(true);
      const r = await ApiService.adminBroadcast({ target, title, message, actionUrl: actionUrl || undefined });
      if (r.success) {
        addToast(`Notification envoyée (${r.data.count} utilisateurs)`, 'success');
        setTitle(''); setMessage(''); setActionUrl('');
      }
    } catch {
      addToast('Erreur lors de la diffusion', 'error');
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold mb-4">Diffusion de notifications</h1>
      <form onSubmit={submit} className="space-y-3 bg-white dark:bg-gray-800 rounded-xl border p-4">
        <div className="flex gap-2">
          <label className="font-medium">Cible:</label>
          <select value={target} onChange={e=>setTarget(e.target.value as any)} className="border rounded px-3 py-2 bg-white dark:bg-gray-800">
            <option value="all">Tous</option>
            <option value="users">Utilisateurs</option>
            <option value="experts">Experts</option>
          </select>
        </div>
        <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Titre" className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-800" />
        <textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="Message" className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-800 min-h-[120px]" />
        <input value={actionUrl} onChange={e=>setActionUrl(e.target.value)} placeholder="URL d'action (optionnel)" className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-800" />
        <button type="submit" disabled={loading} className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50">{loading ? 'Envoi…' : 'Envoyer'}</button>
      </form>
    </div>
  );
}
