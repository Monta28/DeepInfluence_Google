'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import ApiService from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

type FieldErrors = Partial<Record<string, string>>;

export default function CreateFormationPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [errors, setErrors] = useState<FieldErrors>({});

  const [form, setForm] = useState({
    title: '',
    category: '',
    type: 'live',
    level: 'Débutant',
    duration: '',
    price: '',
    maxPlaces: '',
    location: '',
    image: '',
    nextSession: '',
    description: '',
    schedule: '',
    tagsInput: '',
    modulesInput: '',
    objectivesInput: '',
    prerequisitesInput: '',
    includedInput: '',
    toolsInput: ''
  });

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/signin');
      } else if (user.userType !== 'expert') {
        router.push('/dashboard/formations');
      }
    }
  }, [user, isLoading, router]);

  const validate = () => {
    const newErrors: FieldErrors = {};
    if (!form.title.trim()) newErrors.title = 'Titre requis';
    if (!form.category.trim()) newErrors.category = 'Catégorie requise';
    if (!form.duration.trim()) newErrors.duration = 'Durée requise';
    if (!form.level.trim()) newErrors.level = 'Niveau requis';
    if (!form.type.trim()) newErrors.type = 'Type requis';
    if (!form.price || isNaN(Number(form.price))) newErrors.price = 'Prix invalide';
    if (!form.maxPlaces || isNaN(Number(form.maxPlaces))) newErrors.maxPlaces = 'Nombre de places invalide';
    if (!form.location.trim()) newErrors.location = 'Lieu requis';
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
        level: form.level,
        duration: form.duration.trim(),
        price: Number(form.price),
        maxPlaces: Number(form.maxPlaces),
        location: form.location.trim(),
        image: form.image.trim() || undefined,
        nextSession: form.nextSession || undefined,
        description: form.description.trim(),
        schedule: form.schedule.trim() || undefined,
        tags: form.tagsInput
          .split(',')
          .map((t: any) => t.trim())
          .filter(Boolean),
        modules: form.modulesInput
          .split(',')
          .map((m: any) => m.trim())
          .filter(Boolean),
        objectives: form.objectivesInput
          .split(',')
          .map((o: any) => o.trim())
          .filter(Boolean),
        prerequisites: form.prerequisitesInput
          .split(',')
          .map((p: any) => p.trim())
          .filter(Boolean),
        included: form.includedInput
          .split(',')
          .map((i: any) => i.trim())
          .filter(Boolean),
        tools: form.toolsInput
          .split(',')
          .map((t: any) => t.trim())
          .filter(Boolean)
      };
      const res = await ApiService.createFormation(payload as any);
      if (res?.success) {
        setSuccess('Formation créée avec succès');
        const newId = res?.data?.id;
        // Redirige vers la fiche si l'ID est renvoyé, sinon vers la liste
        setTimeout(() => {
          if (newId) router.push(`/formations/${newId}`);
          else router.push('/dashboard/formations');
        }, 500);
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
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppHeader />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Créer une formation</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Renseignez les informations ci-dessous pour publier votre formation.</p>
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
                <input name="title" value={form.title} onChange={onChange} className={`w-full px-3 py-2 rounded-lg border ${errors.title ? 'border-red-400' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-gray-900`} placeholder="Ex: Marketing Digital Avancé" />
                {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Catégorie</label>
                <input name="category" value={form.category} onChange={onChange} className={`w-full px-3 py-2 rounded-lg border ${errors.category ? 'border-red-400' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-gray-900`} placeholder="Ex: Marketing" />
                {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Type</label>
                <select name="type" value={form.type} onChange={onChange} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900">
                  <option value="live">En direct</option>
                  <option value="presentiel">Présentiel</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Niveau</label>
                <select name="level" value={form.level} onChange={onChange} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900">
                  <option>Débutant</option>
                  <option>Intermédiaire</option>
                  <option>Avancé</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Durée</label>
                <input name="duration" value={form.duration} onChange={onChange} className={`w-full px-3 py-2 rounded-lg border ${errors.duration ? 'border-red-400' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-gray-900`} placeholder="Ex: 8 semaines" />
                {errors.duration && <p className="text-xs text-red-500 mt-1">{errors.duration}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Prix (€)</label>
                  <input name="price" value={form.price} onChange={onChange} inputMode="numeric" className={`w-full px-3 py-2 rounded-lg border ${errors.price ? 'border-red-400' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-gray-900`} placeholder="Ex: 199" />
                  {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Places max</label>
                  <input name="maxPlaces" value={form.maxPlaces} onChange={onChange} inputMode="numeric" className={`w-full px-3 py-2 rounded-lg border ${errors.maxPlaces ? 'border-red-400' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-gray-900`} placeholder="Ex: 50" />
                  {errors.maxPlaces && <p className="text-xs text-red-500 mt-1">{errors.maxPlaces}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Lieu</label>
                <input name="location" value={form.location} onChange={onChange} className={`w-full px-3 py-2 rounded-lg border ${errors.location ? 'border-red-400' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-gray-900`} placeholder="Ex: Paris ou en ligne" />
                {errors.location && <p className="text-xs text-red-500 mt-1">{errors.location}</p>}
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Date prochaine session</label>
                <input type="date" name="nextSession" value={form.nextSession} onChange={onChange} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Image (URL)</label>
                <input name="image" value={form.image} onChange={onChange} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900" placeholder="https://..." />
              </div>
          </div>
        </section>

        <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contenu pédagogique</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Objectifs de la formation</label>
              <textarea name="objectivesInput" value={form.objectivesInput} onChange={onChange} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900" placeholder="Ex: Comprendre les bases, Savoir appliquer… (séparés par des virgules)" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Prérequis</label>
              <textarea name="prerequisitesInput" value={form.prerequisitesInput} onChange={onChange} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900" placeholder="Ex: Connaissances de base, Notions de… (séparés par des virgules)" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Ce qui est inclus</label>
              <textarea name="includedInput" value={form.includedInput} onChange={onChange} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900" placeholder="Ex: Certificat, Ressources PDF, Accès au replay… (séparés par des virgules)" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Outils utilisés</label>
              <textarea name="toolsInput" value={form.toolsInput} onChange={onChange} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900" placeholder="Ex: Figma, VS Code, Excel… (séparés par des virgules)" />
            </div>
          </div>
        </section>

          <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contenu</h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Description</label>
                <textarea name="description" value={form.description} onChange={onChange} rows={4} className={`w-full px-3 py-2 rounded-lg border ${errors.description ? 'border-red-400' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-gray-900`} placeholder="Décrivez votre formation..." />
                {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Emploi du temps</label>
                <input name="schedule" value={form.schedule} onChange={onChange} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900" placeholder="Ex: Tous les mardis 18h-20h" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Tags (séparés par des virgules)</label>
                <input name="tagsInput" value={form.tagsInput} onChange={onChange} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900" placeholder="marketing, SEO, analytics" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Modules (séparés par des virgules)</label>
                <input name="modulesInput" value={form.modulesInput} onChange={onChange} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900" placeholder="Introduction, SEO, Publicité, Analytics" />
              </div>
            </div>
          </section>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => router.back()} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Annuler</button>
            <button type="submit" disabled={submitting} className={`px-4 py-2 rounded-lg text-white ${submitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
              {submitting ? 'Création...' : 'Créer la formation'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
