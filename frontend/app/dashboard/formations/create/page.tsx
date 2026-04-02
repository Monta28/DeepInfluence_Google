'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import ApiService from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

type FieldErrors = Partial<Record<string, string>>;

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const CATEGORIES = [
  'Business',
  'Bien-être',
  'Développement personnel',
  'Marketing',
  'Technologie',
  'Finance',
  'Design & Créativité',
  'Langues',
  'Santé',
  'Éducation',
  'Communication',
  'Management',
  'Droit',
  'Ressources humaines',
  'Data & IA',
  'Musique & Arts',
  'Sport & Fitness',
  'Cuisine & Gastronomie',
  'Immobilier',
  'Autre',
];

const STEP_LABELS = [
  'Informations Générales',
  'Catégories & Classification',
  'Format & Durée',
  'Horaires',
  'Structure Pédagogique',
  'Tarification',
  "Paramètres d'accès",
];

interface SubModule {
  title: string;
  description: string;
  durationMinutes: string;
  specificTime: string;
}

interface Module {
  title: string;
  description: string;
  durationHours: string;
  durationMinutes: string;
  subModules: SubModule[];
}

interface TimeSlot {
  start: string;
  end: string;
}

export default function CreateFormationPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      }
    >
      <CreateFormationPage />
    </Suspense>
  );
}

function CreateFormationPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});

  // --- Image upload state ---
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');

  // --- Step 1: Informations Générales ---
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [learningObjectives, setLearningObjectives] = useState<string[]>(['', '', '']);
  const [targetAudience, setTargetAudience] = useState('');

  // --- Step 2: Catégories & Classification ---
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [level, setLevel] = useState('Débutant');
  const [language, setLanguage] = useState('Français');

  // --- Step 3: Format & Durée ---
  const [type, setType] = useState('live');
  const [totalHours, setTotalHours] = useState('');
  const [totalMinutes, setTotalMinutes] = useState('');
  const [totalWeeks, setTotalWeeks] = useState('');
  const [totalModules, setTotalModules] = useState('');

  // --- Step 4: Horaires ---
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [frequency, setFrequency] = useState('Tous les jours');
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([{ start: '09:00', end: '10:00' }]);

  // --- Step 5: Structure Pédagogique ---
  const [modules, setModules] = useState<Module[]>([
    {
      title: '',
      description: '',
      durationHours: '1',
      durationMinutes: '0',
      subModules: [],
    },
  ]);

  // --- Step 6: Tarification ---
  const [price, setPrice] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState('');
  const [promoMaxUses, setPromoMaxUses] = useState('');

  // --- Step 7: Paramètres d'accès ---
  const [maxEnrolled, setMaxEnrolled] = useState('');
  const [location, setLocation] = useState('');

  // Auth guard
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/signin');
      } else if (user.userType !== 'expert') {
        router.push('/dashboard/formations');
      }
    }
  }, [user, isLoading, router]);

  // ========== Image upload handler (file-only, like video create) ==========
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/mov', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
      setError('Type de fichier non supporté. Utilisez JPEG, PNG, GIF, WebP, MP4, MOV ou WebM.');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError('Le fichier est trop volumineux. Maximum 50MB.');
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setUploadedImageUrl('');
    setError('');
  };

  const removeImageFile = () => {
    setImageFile(null);
    setImagePreview('');
    setUploadedImageUrl('');
  };

  const uploadImageFile = async (): Promise<string | null> => {
    if (!imageFile) return uploadedImageUrl || null;
    if (uploadedImageUrl) return uploadedImageUrl;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`${API_BASE}/upload/formation-image`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.data?.url) {
        setUploadedImageUrl(data.data.url);
        return data.data.url;
      }
      throw new Error(data.message || 'Erreur upload image');
    } catch (err: any) {
      setError(err?.message || "Erreur lors de l'upload de l'image");
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  // ========== Learning objectives helpers ==========
  const addObjective = () => {
    if (learningObjectives.length < 5) {
      setLearningObjectives([...learningObjectives, '']);
    }
  };

  const removeObjective = (idx: number) => {
    if (learningObjectives.length > 3) {
      setLearningObjectives(learningObjectives.filter((_, i) => i !== idx));
    }
  };

  const updateObjective = (idx: number, value: string) => {
    setLearningObjectives(learningObjectives.map((o, i) => (i === idx ? value : o)));
  };

  // ========== Time slots helpers ==========
  const addTimeSlot = () => {
    setTimeSlots([...timeSlots, { start: '09:00', end: '10:00' }]);
  };

  const removeTimeSlot = (idx: number) => {
    if (timeSlots.length > 1) {
      setTimeSlots(timeSlots.filter((_, i) => i !== idx));
    }
  };

  const updateTimeSlot = (idx: number, field: 'start' | 'end', value: string) => {
    setTimeSlots(timeSlots.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
  };

  // ========== Modules helpers ==========
  const addModule = () => {
    setModules([
      ...modules,
      { title: '', description: '', durationHours: '1', durationMinutes: '0', subModules: [] },
    ]);
  };

  const removeModule = (idx: number) => {
    if (modules.length > 1) {
      setModules(modules.filter((_, i) => i !== idx));
    }
  };

  const updateModule = (idx: number, field: keyof Module, value: any) => {
    setModules(modules.map((m, i) => (i === idx ? { ...m, [field]: value } : m)));
  };

  const addSubModule = (moduleIdx: number) => {
    const updated = [...modules];
    updated[moduleIdx].subModules.push({
      title: '',
      description: '',
      durationMinutes: '30',
      specificTime: '',
    });
    setModules(updated);
  };

  const removeSubModule = (moduleIdx: number, subIdx: number) => {
    const updated = [...modules];
    updated[moduleIdx].subModules = updated[moduleIdx].subModules.filter((_, i) => i !== subIdx);
    setModules(updated);
  };

  const updateSubModule = (moduleIdx: number, subIdx: number, field: keyof SubModule, value: string) => {
    const updated = [...modules];
    updated[moduleIdx].subModules = updated[moduleIdx].subModules.map((s, i) =>
      i === subIdx ? { ...s, [field]: value } : s
    );
    setModules(updated);
  };

  // ========== Per-step validation ==========
  const validateStep = (step: number): boolean => {
    const newErrors: FieldErrors = {};

    switch (step) {
      case 1:
        if (!title.trim()) newErrors.title = 'Titre requis';
        if (shortDescription.length > 300) newErrors.shortDescription = 'Maximum 300 caractères';
        {
          const filledObjectives = learningObjectives.filter((o) => o.trim());
          if (filledObjectives.length < 3) newErrors.learningObjectives = 'Minimum 3 objectifs pédagogiques requis';
        }
        break;

      case 2:
        if (!category) newErrors.category = 'Catégorie requise';
        break;

      case 3:
        if (!type) newErrors.type = 'Type requis';
        if (!totalHours && !totalMinutes) newErrors.duration = 'Durée requise';
        break;

      case 4:
        if (!startDate) newErrors.startDate = 'Date de début requise';
        if (!endDate) newErrors.endDate = 'Date de fin requise';
        if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
          newErrors.endDate = 'La date de fin doit être après la date de début';
        }
        break;

      case 5:
        modules.forEach((m, i) => {
          if (!m.title.trim()) newErrors[`module_${i}_title`] = `Titre du module ${i + 1} requis`;
        });
        break;

      case 6:
        if (!price || isNaN(Number(price)) || Number(price) < 0) newErrors.price = 'Prix invalide';
        if (promoDiscount && (isNaN(Number(promoDiscount)) || Number(promoDiscount) < 0 || Number(promoDiscount) > 100)) {
          newErrors.promoDiscount = 'Réduction invalide (0-100%)';
        }
        break;

      case 7:
        if (!maxEnrolled || isNaN(Number(maxEnrolled)) || Number(maxEnrolled) < 1) {
          newErrors.maxEnrolled = "Nombre max d'inscrits invalide";
        }
        if (!location.trim()) newErrors.location = 'Lieu requis';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((s) => Math.min(s + 1, 7));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goPrev = () => {
    setErrors({});
    setCurrentStep((s) => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ========== Submit ==========
  const onSubmit = async () => {
    if (!validateStep(7)) return;
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      // Upload image if a file was selected
      let finalImage = uploadedImageUrl || '';
      if (imageFile && !uploadedImageUrl) {
        const uploaded = await uploadImageFile();
        if (!uploaded) {
          setSubmitting(false);
          return;
        }
        finalImage = uploaded;
      }

      // Build duration string for legacy field
      const h = parseInt(totalHours) || 0;
      const m = parseInt(totalMinutes) || 0;
      const durationStr = h > 0 && m > 0 ? `${h}h${m}min` : h > 0 ? `${h}h` : `${m}min`;

      // Build structured modules JSON
      const structuredModules = modules.map((mod) => ({
        title: mod.title,
        description: mod.description,
        durationHours: parseInt(mod.durationHours) || 0,
        durationMinutes: parseInt(mod.durationMinutes) || 0,
        subModules: mod.subModules.map((sub) => ({
          title: sub.title,
          description: sub.description,
          durationMinutes: parseInt(sub.durationMinutes) || 0,
          specificTime: sub.specificTime || undefined,
        })),
      }));

      const filledObjectives = learningObjectives.filter((o) => o.trim());

      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const moduleNames = modules.map((m) => m.title).filter(Boolean);

      const payload: any = {
        // Legacy fields
        title: title.trim(),
        category,
        type,
        level,
        duration: durationStr,
        price: Number(price),
        maxPlaces: Number(maxEnrolled),
        location: location.trim(),
        image: finalImage || undefined,
        tags,
        description: description.trim(),
        modules: moduleNames,
        objectives: filledObjectives,
        nextSession: startDate ? `${startDate}T${timeSlots[0]?.start || '09:00'}:00` : undefined,
        schedule:
          frequency === 'Personnalisé'
            ? timeSlots.map((s) => `${s.start}-${s.end}`).join(', ')
            : frequency,

        // New extended fields
        subtitle: subtitle.trim() || undefined,
        shortDescription: shortDescription.trim() || undefined,
        learningObjectives: JSON.stringify(filledObjectives),
        targetAudience: targetAudience.trim() || undefined,
        subcategory: subcategory.trim() || undefined,
        language,
        totalHours: parseInt(totalHours) || 0,
        totalMinutes: parseInt(totalMinutes) || 0,
        totalWeeks: parseInt(totalWeeks) || undefined,
        totalModules: parseInt(totalModules) || modules.length,
        frequency,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        promoCode: promoCode.trim() || undefined,
        promoDiscount: promoDiscount ? Number(promoDiscount) : undefined,
        promoMaxUses: promoMaxUses ? Number(promoMaxUses) : undefined,
        maxEnrolled: Number(maxEnrolled),
        structuredModules: JSON.stringify(structuredModules),
      };

      const res = await ApiService.createFormation(payload);
      if (res?.success) {
        setSuccess('Formation créée avec succès !');
        const newId = res?.data?.id;
        setTimeout(() => {
          if (newId) router.push(`/formations/${newId}`);
          else router.push('/dashboard/formations');
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

  // ========== Loading state ==========
  if (isLoading || !user || user.userType !== 'expert') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // ========== Stepper ==========
  const renderStepper = () => (
    <div className="mb-10">
      <div className="flex items-center justify-between">
        {STEP_LABELS.map((label, idx) => {
          const stepNum = idx + 1;
          const isActive = stepNum === currentStep;
          const isCompleted = stepNum < currentStep;
          return (
            <div key={stepNum} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                    isActive
                      ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30'
                      : isCompleted
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {isCompleted ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    stepNum
                  )}
                </div>
                <span
                  className={`mt-2 text-xs font-medium text-center max-w-[80px] leading-tight hidden md:block ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400'
                      : isCompleted
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {label}
                </span>
              </div>
              {stepNum < 7 && (
                <div
                  className={`flex-1 h-0.5 mx-2 mt-[-1rem] md:mt-0 ${
                    isCompleted ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // ========== Input helpers ==========
  const inputClass = (fieldName?: string) =>
    `w-full px-3 py-2.5 rounded-lg border ${
      fieldName && errors[fieldName] ? 'border-red-400' : 'border-gray-300 dark:border-gray-700'
    } bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`;

  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';
  const sectionClass = 'bg-white dark:bg-gray-800 rounded-xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-gray-700';

  // ========== Step 1: Informations Générales ==========
  const renderStep1 = () => (
    <div className={sectionClass}>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Informations Générales</h2>
      <div className="space-y-5">
        {/* Titre */}
        <div>
          <label className={labelClass}>
            Titre de la formation <span className="text-red-500">*</span>
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass('title')}
            placeholder="Ex: Marketing Digital Avancé"
          />
          {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
        </div>

        {/* Image / Vidéo upload */}
        <div>
          <label className={labelClass}>Image ou vidéo de couverture</label>
          <label className="block border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,video/mp4,video/mov,video/webm"
              onChange={handleImageFileChange}
              className="hidden"
            />
            {imageFile ? (
              <div className="flex items-center justify-center gap-3">
                {imageFile.type.startsWith('video/') ? (
                  <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
                <div className="text-left">
                  <p className="font-medium text-gray-900 dark:text-white">{imageFile.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {(imageFile.size / (1024 * 1024)).toFixed(1)} MB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    removeImageFile();
                  }}
                  className="ml-4 p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <>
                <svg className="w-10 h-10 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-gray-600 dark:text-gray-400 font-medium">Cliquez pour sélectionner une image ou vidéo</p>
                <p className="text-xs text-gray-400 mt-1">JPEG, PNG, GIF, WebP, MP4, MOV, WebM - Max 50 MB</p>
              </>
            )}
          </label>
          {imagePreview && imageFile?.type.startsWith('image/') && (
            <div className="mt-3">
              <img src={imagePreview} alt="Aperçu" className="w-full h-48 object-cover rounded-lg" />
            </div>
          )}
          {uploadingImage && (
            <div className="mt-3 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              Upload en cours...
            </div>
          )}
        </div>

        {/* Sous-titre */}
        <div>
          <label className={labelClass}>Sous-titre</label>
          <input
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            className={inputClass()}
            placeholder="Ex: Maîtrisez les outils modernes du marketing"
          />
        </div>

        {/* Description courte */}
        <div>
          <label className={labelClass}>Description courte (max 300 caractères)</label>
          <textarea
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            maxLength={300}
            rows={3}
            className={inputClass('shortDescription')}
            placeholder="Résumé accrocheur de votre formation..."
          />
          <div className="flex justify-between mt-1">
            {errors.shortDescription && <p className="text-xs text-red-500">{errors.shortDescription}</p>}
            <p
              className={`text-xs ml-auto ${
                shortDescription.length > 280
                  ? 'text-orange-500'
                  : shortDescription.length > 250
                    ? 'text-yellow-500'
                    : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              {shortDescription.length}/300
            </p>
          </div>
        </div>

        {/* Description détaillée */}
        <div>
          <label className={labelClass}>Description détaillée</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            className={inputClass()}
            placeholder="Décrivez en détail le contenu, la méthodologie et les bénéfices de votre formation..."
          />
        </div>

        {/* Objectifs pédagogiques */}
        <div>
          <label className={labelClass}>
            Objectifs pédagogiques (3 à 5) <span className="text-red-500">*</span>
          </label>
          <div className="space-y-3">
            {learningObjectives.map((obj, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-400 dark:text-gray-500 w-6 text-center">{idx + 1}.</span>
                <input
                  value={obj}
                  onChange={(e) => updateObjective(idx, e.target.value)}
                  className={inputClass()}
                  placeholder={`Objectif ${idx + 1}`}
                />
                {learningObjectives.length > 3 && (
                  <button
                    type="button"
                    onClick={() => removeObjective(idx)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
          {learningObjectives.length < 5 && (
            <button
              type="button"
              onClick={addObjective}
              className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Ajouter un objectif
            </button>
          )}
          {errors.learningObjectives && <p className="text-xs text-red-500 mt-1">{errors.learningObjectives}</p>}
        </div>

        {/* Public cible */}
        <div>
          <label className={labelClass}>Public cible</label>
          <input
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            className={inputClass()}
            placeholder="Ex: Entrepreneurs, responsables marketing, étudiants en commerce"
          />
        </div>
      </div>
    </div>
  );

  // ========== Step 2: Catégories & Classification ==========
  const renderStep2 = () => (
    <div className={sectionClass}>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Catégories & Classification</h2>
      <div className="space-y-5">
        {/* Catégorie principale */}
        <div>
          <label className={labelClass}>
            Catégorie principale <span className="text-red-500">*</span>
          </label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass('category')}>
            <option value="">-- Sélectionnez une catégorie --</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
        </div>

        {/* Sous-catégorie */}
        <div>
          <label className={labelClass}>Sous-catégorie</label>
          <input
            value={subcategory}
            onChange={(e) => setSubcategory(e.target.value)}
            className={inputClass()}
            placeholder="Ex: SEO, Growth Hacking, Comptabilité..."
          />
        </div>

        {/* Tags */}
        <div>
          <label className={labelClass}>Mots-clés / Tags (séparés par des virgules)</label>
          <input
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            className={inputClass()}
            placeholder="Ex: marketing, SEO, analytics, digital"
          />
          {tagsInput && (
            <div className="flex flex-wrap gap-2 mt-2">
              {tagsInput
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean)
                .map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full font-medium"
                  >
                    {tag}
                  </span>
                ))}
            </div>
          )}
        </div>

        {/* Niveau */}
        <div>
          <label className={labelClass}>Niveau</label>
          <select value={level} onChange={(e) => setLevel(e.target.value)} className={inputClass()}>
            <option value="Débutant">Débutant</option>
            <option value="Intermédiaire">Intermédiaire</option>
            <option value="Avancé">Avancé</option>
          </select>
        </div>

        {/* Langue */}
        <div>
          <label className={labelClass}>Langue de la formation</label>
          <input
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className={inputClass()}
            placeholder="Français"
          />
        </div>
      </div>
    </div>
  );

  // ========== Step 3: Format & Durée ==========
  const renderStep3 = () => (
    <div className={sectionClass}>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Format & Durée</h2>
      <div className="space-y-5">
        {/* Type */}
        <div>
          <label className={labelClass}>
            Type de formation <span className="text-red-500">*</span>
          </label>
          <select value={type} onChange={(e) => setType(e.target.value)} className={inputClass('type')}>
            <option value="live">En direct</option>
            <option value="hybride">Hybride</option>
            <option value="presentiel">Présentiel</option>
          </select>
          {errors.type && <p className="text-xs text-red-500 mt-1">{errors.type}</p>}

          {type === 'live' && (
            <div className="mt-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Vidéoconférence automatique</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Une salle Jitsi sera automatiquement créée. Seuls les inscrits pourront y accéder.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Durée totale */}
        <div>
          <label className={labelClass}>
            Durée totale <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={totalHours}
                  onChange={(e) => setTotalHours(e.target.value)}
                  className={inputClass('duration')}
                  placeholder="0"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">heures</span>
              </div>
            </div>
            <div>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={totalMinutes}
                  onChange={(e) => setTotalMinutes(e.target.value)}
                  className={inputClass('duration')}
                  placeholder="0"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">minutes</span>
              </div>
            </div>
          </div>
          {errors.duration && <p className="text-xs text-red-500 mt-1">{errors.duration}</p>}
        </div>

        {/* Nombre de semaines */}
        <div>
          <label className={labelClass}>Nombre de semaines</label>
          <input
            type="number"
            min="0"
            value={totalWeeks}
            onChange={(e) => setTotalWeeks(e.target.value)}
            className={inputClass()}
            placeholder="Ex: 4"
          />
        </div>

        {/* Nombre total de modules */}
        <div>
          <label className={labelClass}>Nombre total de modules</label>
          <input
            type="number"
            min="1"
            value={totalModules}
            onChange={(e) => setTotalModules(e.target.value)}
            className={inputClass()}
            placeholder="Ex: 8"
          />
        </div>
      </div>
    </div>
  );

  // ========== Step 4: Horaires ==========
  const renderStep4 = () => (
    <div className={sectionClass}>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Horaires</h2>
      <div className="space-y-5">
        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>
              Date de début <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={inputClass('startDate')}
            />
            {errors.startDate && <p className="text-xs text-red-500 mt-1">{errors.startDate}</p>}
          </div>
          <div>
            <label className={labelClass}>
              Date de fin <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={inputClass('endDate')}
            />
            {errors.endDate && <p className="text-xs text-red-500 mt-1">{errors.endDate}</p>}
          </div>
        </div>

        {/* Fréquence */}
        <div>
          <label className={labelClass}>Fréquence</label>
          <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className={inputClass()}>
            <option value="Tous les jours">Tous les jours</option>
            <option value="2 fois par semaine">2 fois par semaine</option>
            <option value="Week-end">Week-end</option>
            <option value="Personnalisé">Personnalisé</option>
          </select>
        </div>

        {/* Créneaux horaires */}
        <div>
          <label className={labelClass}>Créneaux horaires</label>
          <div className="space-y-3">
            {timeSlots.map((slot, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="text-sm text-gray-500 dark:text-gray-400 w-16">Créneau {idx + 1}</span>
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="time"
                    value={slot.start}
                    onChange={(e) => updateTimeSlot(idx, 'start', e.target.value)}
                    className={inputClass()}
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="time"
                    value={slot.end}
                    onChange={(e) => updateTimeSlot(idx, 'end', e.target.value)}
                    className={inputClass()}
                  />
                </div>
                {timeSlots.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTimeSlot(idx)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addTimeSlot}
            className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Ajouter un créneau
          </button>
        </div>
      </div>
    </div>
  );

  // ========== Step 5: Structure Pédagogique ==========
  const renderStep5 = () => (
    <div className={sectionClass}>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Structure Pédagogique</h2>
      <div className="space-y-6">
        {modules.map((mod, mIdx) => (
          <div
            key={mIdx}
            className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 bg-gray-50 dark:bg-gray-800/50"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Module {mIdx + 1}</h3>
              {modules.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeModule(mIdx)}
                  className="text-sm text-red-500 hover:text-red-700 font-medium flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Supprimer
                </button>
              )}
            </div>

            <div className="space-y-4">
              {/* Titre du module */}
              <div>
                <label className={labelClass}>Titre du module</label>
                <input
                  value={mod.title}
                  onChange={(e) => updateModule(mIdx, 'title', e.target.value)}
                  className={inputClass(`module_${mIdx}_title`)}
                  placeholder="Ex: Introduction au Marketing Digital"
                />
                {errors[`module_${mIdx}_title`] && (
                  <p className="text-xs text-red-500 mt-1">{errors[`module_${mIdx}_title`]}</p>
                )}
              </div>

              {/* Description du module */}
              <div>
                <label className={labelClass}>Description du module</label>
                <textarea
                  value={mod.description}
                  onChange={(e) => updateModule(mIdx, 'description', e.target.value)}
                  rows={3}
                  className={inputClass()}
                  placeholder="Décrivez le contenu de ce module..."
                />
              </div>

              {/* Durée du module */}
              <div>
                <label className={labelClass}>Durée du module</label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={mod.durationHours}
                      onChange={(e) => updateModule(mIdx, 'durationHours', e.target.value)}
                      className={inputClass()}
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">h</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={mod.durationMinutes}
                      onChange={(e) => updateModule(mIdx, 'durationMinutes', e.target.value)}
                      className={inputClass()}
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">min</span>
                  </div>
                </div>
              </div>

              {/* Sub-modules */}
              {mod.subModules.length > 0 && (
                <div className="ml-4 border-l-2 border-blue-300 dark:border-blue-700 pl-4 space-y-4">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Sous-modules</h4>
                  {mod.subModules.map((sub, sIdx) => (
                    <div
                      key={sIdx}
                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Sous-module {sIdx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeSubModule(mIdx, sIdx)}
                          className="text-xs text-red-500 hover:text-red-700 font-medium"
                        >
                          Supprimer
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Titre</label>
                          <input
                            value={sub.title}
                            onChange={(e) => updateSubModule(mIdx, sIdx, 'title', e.target.value)}
                            className={inputClass()}
                            placeholder="Titre du sous-module"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Description</label>
                          <input
                            value={sub.description}
                            onChange={(e) => updateSubModule(mIdx, sIdx, 'description', e.target.value)}
                            className={inputClass()}
                            placeholder="Description"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Durée (minutes)</label>
                          <input
                            type="number"
                            min="0"
                            value={sub.durationMinutes}
                            onChange={(e) => updateSubModule(mIdx, sIdx, 'durationMinutes', e.target.value)}
                            className={inputClass()}
                            placeholder="30"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                            Horaire spécifique
                          </label>
                          <input
                            type="time"
                            value={sub.specificTime}
                            onChange={(e) => updateSubModule(mIdx, sIdx, 'specificTime', e.target.value)}
                            className={inputClass()}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => addSubModule(mIdx)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Ajouter un sous-module
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addModule}
          className="w-full py-3 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-xl text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-medium flex items-center justify-center gap-2 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Ajouter un module
        </button>
      </div>
    </div>
  );

  // ========== Step 6: Tarification ==========
  const renderStep6 = () => (
    <div className={sectionClass}>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Tarification</h2>
      <div className="space-y-5">
        {/* Prix */}
        <div>
          <label className={labelClass}>
            Prix de la formation (TND) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={inputClass('price')}
              placeholder="Ex: 199"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">TND</span>
          </div>
          {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
        </div>

        {/* Promo section */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 bg-gray-50 dark:bg-gray-800/50">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Code promotionnel (optionnel)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Code promo</label>
              <input
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                className={inputClass()}
                placeholder="Ex: PROMO2024"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Réduction (%)</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={promoDiscount}
                  onChange={(e) => setPromoDiscount(e.target.value)}
                  className={inputClass('promoDiscount')}
                  placeholder="Ex: 20"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">%</span>
              </div>
              {errors.promoDiscount && <p className="text-xs text-red-500 mt-1">{errors.promoDiscount}</p>}
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Nombre max d'utilisation</label>
              <input
                type="number"
                min="0"
                value={promoMaxUses}
                onChange={(e) => setPromoMaxUses(e.target.value)}
                className={inputClass()}
                placeholder="Ex: 50"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ========== Step 7: Paramètres d'accès + Summary ==========
  const renderStep7 = () => {
    const filledObjectives = learningObjectives.filter((o) => o.trim());
    const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);

    return (
      <div className="space-y-6">
        <div className={sectionClass}>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Paramètres d'accès</h2>
          <div className="space-y-5">
            {/* Max inscrits */}
            <div>
              <label className={labelClass}>
                Nombre maximum d'inscrits <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={maxEnrolled}
                onChange={(e) => setMaxEnrolled(e.target.value)}
                className={inputClass('maxEnrolled')}
                placeholder="Ex: 30"
              />
              {errors.maxEnrolled && <p className="text-xs text-red-500 mt-1">{errors.maxEnrolled}</p>}
            </div>

            {/* Lieu */}
            <div>
              <label className={labelClass}>
                Lieu <span className="text-red-500">*</span>
              </label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className={inputClass('location')}
                placeholder={type === 'live' ? 'En ligne' : 'Ex: 12 Rue de Paris, Tunis'}
              />
              {errors.location && <p className="text-xs text-red-500 mt-1">{errors.location}</p>}
            </div>
          </div>
        </div>

        {/* Summary / Preview */}
        <div className={sectionClass}>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Récapitulatif
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
            <SummaryItem label="Titre" value={title} />
            {subtitle && <SummaryItem label="Sous-titre" value={subtitle} />}
            <SummaryItem label="Catégorie" value={category} />
            {subcategory && <SummaryItem label="Sous-catégorie" value={subcategory} />}
            <SummaryItem label="Type" value={type === 'live' ? 'En direct' : type === 'hybride' ? 'Hybride' : 'Présentiel'} />
            <SummaryItem label="Niveau" value={level} />
            <SummaryItem label="Langue" value={language} />
            <SummaryItem
              label="Durée totale"
              value={`${totalHours || 0}h ${totalMinutes || 0}min`}
            />
            {totalWeeks && <SummaryItem label="Semaines" value={`${totalWeeks} semaine(s)`} />}
            <SummaryItem label="Date de début" value={startDate ? new Date(startDate).toLocaleDateString('fr-FR') : '-'} />
            <SummaryItem label="Date de fin" value={endDate ? new Date(endDate).toLocaleDateString('fr-FR') : '-'} />
            <SummaryItem label="Fréquence" value={frequency} />
            <SummaryItem
              label="Créneaux"
              value={timeSlots.map((s) => `${s.start} - ${s.end}`).join(' | ')}
            />
            <SummaryItem label="Modules" value={`${modules.length} module(s)`} />
            <SummaryItem label="Prix" value={`${price || 0} TND`} />
            {promoCode && <SummaryItem label="Code promo" value={`${promoCode} (-${promoDiscount || 0}%)`} />}
            <SummaryItem label="Places max" value={maxEnrolled || '-'} />
            <SummaryItem label="Lieu" value={location || '-'} />
            {imageFile && <SummaryItem label="Fichier média" value={imageFile.name} />}
          </div>

          {/* Objectives */}
          {filledObjectives.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Objectifs pédagogiques</p>
              <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                {filledObjectives.map((o, i) => (
                  <li key={i}>{o}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tags</p>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Modules detail */}
          {modules.some((m) => m.title.trim()) && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Structure des modules</p>
              <div className="space-y-2">
                {modules
                  .filter((m) => m.title.trim())
                  .map((m, i) => (
                    <div key={i} className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {i + 1}. {m.title}
                      </span>
                      {' '}
                      ({m.durationHours}h{m.durationMinutes}min)
                      {m.subModules.length > 0 && (
                        <ul className="ml-6 mt-1 space-y-0.5">
                          {m.subModules.map((sub, si) => (
                            <li key={si} className="text-xs text-gray-500 dark:text-gray-500">
                              - {sub.title || 'Sans titre'} ({sub.durationMinutes}min)
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Short & detailed descriptions */}
          {(shortDescription || description) && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              {shortDescription && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description courte</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{shortDescription}</p>
                </div>
              )}
              {description && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description détaillée</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">{description}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ========== Render current step ==========
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      case 5:
        return renderStep5();
      case 6:
        return renderStep6();
      case 7:
        return renderStep7();
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppHeader />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Créer une formation</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Renseignez les informations ci-dessous pour publier votre formation.
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
            {success}
          </div>
        )}

        {/* Stepper */}
        {renderStepper()}

        {/* Current step content */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (currentStep === 7) onSubmit();
            else goNext();
          }}
        >
          {renderCurrentStep()}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-8">
            <div>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={goPrev}
                  className="px-5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Précédent
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium transition-colors"
              >
                Annuler
              </button>

              {currentStep < 7 ? (
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors flex items-center gap-2"
                >
                  Suivant
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting || uploadingImage}
                  className={`px-6 py-2.5 rounded-lg text-white font-medium transition-colors flex items-center gap-2 ${
                    submitting || uploadingImage
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {uploadingImage ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Upload image...
                    </>
                  ) : submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Création...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Créer la formation
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

// ========== Summary item helper component ==========
function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="font-medium text-gray-700 dark:text-gray-300">{label}:</span>{' '}
      <span className="text-gray-600 dark:text-gray-400">{value}</span>
    </div>
  );
}
