'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import ApiService from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

export default function EditVideoPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const videoId = parseInt(params.id as string);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    title: '',
    category: '',
    description: '',
    price: 0,
    type: 'free',
  });

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) { router.push('/signin'); return; }
    loadVideo();
  }, [user, isAuthLoading, videoId]);

  const loadVideo = async () => {
    try {
      const res = await ApiService.getVideoById(videoId);
      if (res.success && res.data) {
        const v = res.data;
        setForm({
          title: v.title || '',
          category: v.category || '',
          description: v.description || '',
          price: v.price || 0,
          type: v.type || (v.accessType === 'PAID' ? 'premium' : 'free'),
        });
      } else {
        setError('Vidéo introuvable');
      }
    } catch { setError('Erreur de chargement'); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await ApiService.updateVideo(videoId, {
        title: form.title,
        category: form.category,
        description: form.description,
        price: form.type === 'premium' ? Number(form.price) : 0,
        type: form.type,
        accessType: form.type === 'premium' ? 'PAID' : 'FREE',
      });
      if (res.success) {
        setSuccess('Vidéo mise à jour !');
        setTimeout(() => router.push('/dashboard/videos'), 1500);
      } else { setError(res.message || 'Erreur'); }
    } catch (err: any) { setError(err.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  if (loading || isAuthLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppHeader />
      <main className="max-w-2xl mx-auto px-4 py-8 pt-24">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Modifier la vidéo</h1>

        {error && <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">{error}</div>}
        {success && <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg">{success}</div>}

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Titre</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Catégorie</label>
            <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option value="free">Gratuit</option>
              <option value="premium">Premium</option>
            </select>
          </div>
          {form.type === 'premium' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prix (coins)</label>
              <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => router.back()} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Annuler</button>
            <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
