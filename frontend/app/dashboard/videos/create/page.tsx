'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import ApiService from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

type FieldErrors = Partial<Record<string, string>>;

export default function CreateVideoPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [errors, setErrors] = useState<FieldErrors>({});

  const [form, setForm] = useState({
    title: '',
    category: '',
    type: 'free' as 'free' | 'premium',
    duration: '', // mm:ss
    price: '',
    thumbnail: '',
    videoUrl: '',
    description: ''
  });

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/signin');
      } else if (user.userType !== 'expert') {
        router.push('/dashboard/videos');
      }
    }
  }, [user, isLoading, router]);

  const validate = () => {
    const newErrors: FieldErrors = {};
    if (!form.title.trim()) newErrors.title = 'Titre requis';
    if (!form.category.trim()) newErrors.category = 'Catégorie requise';
    if (!form.duration.trim()) newErrors.duration = 'Durée requise (ex: 08:30)';
    if (!/^(\d{1,2}):(\d{2})$/.test(form.duration.trim())) newErrors.duration = 'Format durée invalide (mm:ss)';
    if (!form.type) newErrors.type = 'Type requis';
    if (form.type === 'premium') {
      if (!form.price || isNaN(Number(form.price)) || Number(form.price) < 0) newErrors.price = 'Prix invalide';
    }
    if (!form.description.trim()) newErrors.description = 'Description requise';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        category: form.category.trim(),
        type: form.type,
        duration: form.duration.trim(),
        price: Number(form.type === 'premium' ? form.price || 0 : 0),
        thumbnail: form.thumbnail.trim() || undefined,
        description: form.description.trim(),
        videoUrl: form.videoUrl.trim() || undefined,
      };
      const res = await ApiService.createVideo(payload as any);
      if (res?.success) {
        setSuccess('Vidéo créée avec succès');
        const newId = res?.data?.id;
        setTimeout(() => {
          if (newId) router.push(`/videos/${newId}`);
          else router.push('/dashboard/videos');
        }, 600);
      } else {
        throw new Error(res?.message || 'Création impossible');
      }
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || !user || user.userType !== 'expert') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppHeader />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Ajouter une vidéo</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Publiez une nouvelle vidéo (gratuite ou premium).</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 border border-red-200">{error}</div>
        )}
        {success && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-700 border border-green-200">{success}</div>
        )}

        <form onSubmit={onSubmit} className="space-y-6">
          <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informations principales</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Titre</label>
                <input name="title" value={form.title} onChange={onChange} className={`w-full px-3 py-2 rounded-lg border ${errors.title ? 'border-red-400' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-gray-900`} placeholder="Ex: Mindset de leader" />
                {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Catégorie</label>
                <input name="category" value={form.category} onChange={onChange} className={`w-full px-3 py-2 rounded-lg border ${errors.category ? 'border-red-400' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-gray-900`} placeholder="Ex: Business" />
                {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Type</label>
                <select name="type" value={form.type} onChange={onChange} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900">
                  <option value="free">Gratuite</option>
                  <option value="premium">Premium</option>
                </select>
                {errors.type && <p className="text-xs text-red-500 mt-1">{errors.type}</p>}
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Durée (mm:ss)</label>
                <input name="duration" value={form.duration} onChange={onChange} className={`w-full px-3 py-2 rounded-lg border ${errors.duration ? 'border-red-400' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-gray-900`} placeholder="Ex: 10:30" />
                {errors.duration && <p className="text-xs text-red-500 mt-1">{errors.duration}</p>}
              </div>
              {form.type === 'premium' && (
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Prix (coins)</label>
                  <input name="price" value={form.price} onChange={onChange} inputMode="numeric" className={`w-full px-3 py-2 rounded-lg border ${errors.price ? 'border-red-400' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-gray-900`} placeholder="Ex: 49" />
                  {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
                </div>
              )}
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">URL de la miniature (optionnel)</label>
                <input name="thumbnail" value={form.thumbnail} onChange={onChange} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900" placeholder="https://.../image.jpg" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">URL de la vidéo (optionnel)</label>
                <input name="videoUrl" value={form.videoUrl} onChange={onChange} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900" placeholder="https://.../video.mp4" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Description</label>
                <textarea name="description" value={form.description} onChange={onChange} rows={5} className={`w-full px-3 py-2 rounded-lg border ${errors.description ? 'border-red-400' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-gray-900`} placeholder="Décrivez le contenu de la vidéo..." />
                {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
              </div>
            </div>
          </section>

          <div className="flex items-center justify-end gap-3">
            <button type="button" onClick={() => router.push('/dashboard/videos')} className="px-4 py-2 rounded-lg border">Annuler</button>
            <button type="submit" disabled={submitting} className={`px-4 py-2 rounded-lg text-white ${submitting ? 'bg-purple-300 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'}`}>
              {submitting ? 'Publication...' : 'Publier la vidéo'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

