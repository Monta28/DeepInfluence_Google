'use client';

import { Suspense, useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import ApiService from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

type FieldErrors = Partial<Record<string, string>>;

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export default function CreateVideoPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div></div>}>
      <CreateVideoPage />
    </Suspense>
  );
}

function CreateVideoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading } = useAuth();

  const isReelMode = searchParams.get('type') === 'reel';

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [errors, setErrors] = useState<FieldErrors>({});

  // Video source mode (upload only)
  const [videoMode] = useState<'upload'>('upload');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string>('');

  // Thumbnail mode
  const [thumbMode, setThumbMode] = useState<'auto' | 'upload'>('auto');
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [thumbUploading, setThumbUploading] = useState(false);
  const [thumbPreview, setThumbPreview] = useState<string>('');

  // Auto-detected duration
  const [detectedDuration, setDetectedDuration] = useState<number | null>(null);
  const [detectingDuration, setDetectingDuration] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [form, setForm] = useState({
    title: '',
    category: '',
    type: 'free' as 'free' | 'premium',
    price: '',
    videoUrl: '',
    thumbnailUrl: '',
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

  // Auto-detect duration and thumbnail from video
  const detectVideoMetadata = useCallback((src: string) => {
    setDetectingDuration(true);
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      const dur = Math.round(video.duration);
      setDetectedDuration(dur);
      setDetectingDuration(false);

      // Auto-generate thumbnail at 1 second
      if (thumbMode === 'auto') {
        video.currentTime = Math.min(1, video.duration / 2);
      }
    };

    video.onseeked = () => {
      if (thumbMode === 'auto' && canvasRef.current) {
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setThumbPreview(dataUrl);
        }
      }
    };

    video.onerror = () => {
      setDetectingDuration(false);
      setDetectedDuration(null);
    };

    video.src = src;
  }, [thumbMode]);

  // When video file is selected
  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoFile(file);
    setDetectedDuration(null);
    setThumbPreview('');

    // Create a local preview URL for duration detection
    const localUrl = URL.createObjectURL(file);
    setVideoPreviewUrl(localUrl);
    detectVideoMetadata(localUrl);
  };

  // When video URL changes
  const handleVideoUrlChange = (url: string) => {
    setForm(prev => ({ ...prev, videoUrl: url }));
    setDetectedDuration(null);
    setThumbPreview('');
    if (url.trim()) {
      detectVideoMetadata(url.trim());
    }
  };

  // Upload video file to backend
  const uploadVideoFile = async (): Promise<string | null> => {
    if (!videoFile) return null;
    setVideoUploading(true);
    setVideoUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('video', videoFile);

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

      const xhr = new XMLHttpRequest();
      const uploadPromise = new Promise<string>((resolve, reject) => {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setVideoUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const res = JSON.parse(xhr.responseText);
            if (res.success && res.data?.url) {
              resolve(res.data.url);
            } else {
              reject(new Error(res.message || 'Upload échoué'));
            }
          } else {
            reject(new Error('Upload échoué'));
          }
        };
        xhr.onerror = () => reject(new Error('Erreur réseau'));
        xhr.open('POST', `${API_BASE}/upload/video`);
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(formData);
      });

      const url = await uploadPromise;
      return url;
    } catch (err: any) {
      setError(err?.message || 'Erreur upload vidéo');
      return null;
    } finally {
      setVideoUploading(false);
    }
  };

  // Upload thumbnail file to backend
  const uploadThumbnailFile = async (): Promise<string | null> => {
    if (!thumbFile) return null;
    setThumbUploading(true);

    try {
      const formData = new FormData();
      formData.append('thumbnail', thumbFile);

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

      const res = await fetch(`${API_BASE}/upload/thumbnail`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData
      });
      const data = await res.json();
      if (data.success && data.data?.url) {
        return data.data.url;
      }
      throw new Error(data.message || 'Upload miniature échoué');
    } catch (err: any) {
      setError(err?.message || 'Erreur upload miniature');
      return null;
    } finally {
      setThumbUploading(false);
    }
  };

  // Upload auto-generated thumbnail (from canvas dataURL)
  const uploadAutoThumbnail = async (): Promise<string | null> => {
    if (!thumbPreview || !thumbPreview.startsWith('data:')) return null;

    try {
      // Convert dataURL to blob
      const res = await fetch(thumbPreview);
      const blob = await res.blob();
      const file = new File([blob], 'auto-thumbnail.jpg', { type: 'image/jpeg' });

      const formData = new FormData();
      formData.append('thumbnail', file);

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

      const uploadRes = await fetch(`${API_BASE}/upload/thumbnail`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData
      });
      const data = await uploadRes.json();
      if (data.success && data.data?.url) {
        return data.data.url;
      }
      return null;
    } catch {
      return null;
    }
  };

  // Handle thumbnail file selection
  const handleThumbFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbFile(file);
    setThumbPreview(URL.createObjectURL(file));
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const newErrors: FieldErrors = {};
    if (!form.title.trim()) newErrors.title = 'Titre requis';
    if (!form.category.trim()) newErrors.category = 'Catégorie requise';

    // Video validation
    if (videoMode === 'upload' && !videoFile) {
      newErrors.video = 'Veuillez sélectionner un fichier vidéo';
    }
    // Duration validation
    if (!detectedDuration || detectedDuration <= 0) {
      newErrors.duration = 'Impossible de détecter la durée. Vérifiez votre vidéo.';
    } else if (isReelMode) {
      if (detectedDuration < 10 || detectedDuration > 180) {
        newErrors.duration = 'La durée d\'un Reel doit être entre 10s et 3min';
      }
    }

    if (!form.type) newErrors.type = 'Type requis';
    if (form.type === 'premium') {
      if (!form.price || isNaN(Number(form.price)) || Number(form.price) < 0) newErrors.price = 'Prix invalide';
    }
    if (!form.description.trim()) newErrors.description = 'Description requise';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!validate()) return;
    setSubmitting(true);

    try {
      // 1. Upload video file
      let finalVideoUrl = '';
      {
        const uploadedUrl = await uploadVideoFile();
        if (!uploadedUrl) {
          setSubmitting(false);
          return;
        }
        finalVideoUrl = uploadedUrl;
      }

      // 2. Upload thumbnail
      let finalThumbnailUrl = '';
      if (thumbMode === 'upload' && thumbFile) {
        const uploadedThumb = await uploadThumbnailFile();
        if (uploadedThumb) finalThumbnailUrl = uploadedThumb;
      } else if (thumbMode === 'auto' && thumbPreview && thumbPreview.startsWith('data:')) {
        const uploadedThumb = await uploadAutoThumbnail();
        if (uploadedThumb) finalThumbnailUrl = uploadedThumb;
      }

      // 3. Create video/reel
      const payload: any = {
        title: form.title.trim(),
        category: form.category.trim(),
        duration: detectedDuration,
        price: Number(form.type === 'premium' ? form.price || 0 : 0),
        thumbnail: finalThumbnailUrl || undefined,
        description: form.description.trim(),
        videoUrl: finalVideoUrl,
        status: 'PUBLISHED',
      };

      if (isReelMode) {
        payload.videoType = 'REEL';
        payload.orientation = 'PORTRAIT';
        payload.accessType = form.type === 'premium' ? 'PAID' : 'FREE';
      } else {
        payload.type = form.type;
        payload.videoType = 'NORMAL';
        payload.orientation = 'LANDSCAPE';
        payload.accessType = form.type === 'premium' ? 'PAID' : 'FREE';
      }

      const res = await ApiService.createVideo(payload);
      if (res?.success) {
        setSuccess(isReelMode ? 'Reel créé avec succès !' : 'Vidéo créée avec succès !');
        const newId = res?.data?.id;
        setTimeout(() => {
          if (isReelMode) {
            router.push('/dashboard/reels');
          } else if (newId) {
            router.push(`/videos/${newId}`);
          } else {
            router.push('/dashboard/videos');
          }
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

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (isLoading || !user || user.userType !== 'expert') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppHeader />
      {/* Hidden canvas for thumbnail generation */}
      <canvas ref={canvasRef} className="hidden" />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {isReelMode ? 'Créer un Reel' : 'Ajouter une vidéo'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {isReelMode
              ? 'Publiez un Reel vertical (15s - 3min, format 9:16).'
              : 'Publiez une nouvelle vidéo (gratuite ou premium).'}
          </p>
        </div>

        {isReelMode && (
          <div className="mb-6 p-4 bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 rounded-xl">
            <div className="flex items-center gap-3">
              <i className="ri-movie-2-line text-2xl text-pink-500"></i>
              <div>
                <p className="text-sm font-medium text-pink-800 dark:text-pink-200">Mode Reel</p>
                <p className="text-xs text-pink-600 dark:text-pink-300">Format portrait 9:16, durée entre 10 secondes et 3 minutes</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">{error}</div>
        )}
        {success && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">{success}</div>
        )}

        <form onSubmit={onSubmit} className="space-y-6">
          {/* Section 1: Video Source */}
          <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              <i className="ri-video-line mr-2 text-purple-500"></i>
              {isReelMode ? 'Fichier du Reel' : 'Fichier vidéo'}
            </h2>

            <div>
              <label className="block border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-purple-400 dark:hover:border-purple-500 transition-colors">
                <input
                  type="file"
                  accept="video/mp4,video/mov,video/avi,video/mkv,video/webm"
                  onChange={handleVideoFileChange}
                  className="hidden"
                />
                {videoFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <i className="ri-film-line text-3xl text-purple-500"></i>
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-white">{videoFile.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{(videoFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); setVideoFile(null); setDetectedDuration(null); setThumbPreview(''); setVideoPreviewUrl(''); }}
                      className="ml-4 p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                    >
                      <i className="ri-close-line text-xl"></i>
                    </button>
                  </div>
                ) : (
                  <>
                    <i className="ri-upload-cloud-2-line text-4xl text-gray-400 mb-2"></i>
                    <p className="text-gray-600 dark:text-gray-400 font-medium">Cliquez pour sélectionner une vidéo</p>
                    <p className="text-xs text-gray-400 mt-1">MP4, MOV, AVI, MKV, WebM - Max 500 MB</p>
                  </>
                )}
              </label>
            </div>
            {errors.video && <p className="text-xs text-red-500 mt-2">{errors.video}</p>}

            {/* Duration auto-detected */}
            <div className="mt-4 flex items-center gap-3">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                detectingDuration
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
                  : detectedDuration
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                    : 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}>
                {detectingDuration ? (
                  <>
                    <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                    Détection de la durée...
                  </>
                ) : detectedDuration ? (
                  <>
                    <i className="ri-time-line"></i>
                    Durée détectée : <strong>{formatDuration(detectedDuration)}</strong>
                    {isReelMode && (detectedDuration < 10 || detectedDuration > 180) && (
                      <span className="text-red-500 ml-2">(hors limites 10s-3min)</span>
                    )}
                  </>
                ) : (
                  <>
                    <i className="ri-time-line"></i>
                    La durée sera détectée automatiquement
                  </>
                )}
              </div>
            </div>
            {errors.duration && <p className="text-xs text-red-500 mt-1">{errors.duration}</p>}

            {/* Upload progress */}
            {videoUploading && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                  <span>Upload en cours...</span>
                  <span>{videoUploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full transition-all duration-300" style={{ width: `${videoUploadProgress}%` }}></div>
                </div>
              </div>
            )}
          </section>

          {/* Section 2: Thumbnail */}
          <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              <i className="ri-image-line mr-2 text-purple-500"></i>
              Miniature
            </h2>

            <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg mb-4 w-fit">
              <button
                type="button"
                onClick={() => setThumbMode('auto')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${thumbMode === 'auto' ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}
              >
                <i className="ri-magic-line mr-1"></i>Auto (depuis la vidéo)
              </button>
              <button
                type="button"
                onClick={() => { setThumbMode('upload'); setThumbPreview(''); }}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${thumbMode === 'upload' ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}
              >
                <i className="ri-image-add-line mr-1"></i>Uploader une image
              </button>
            </div>

            {thumbMode === 'auto' ? (
              <div className="flex items-center gap-4">
                {thumbPreview ? (
                  <div className="relative">
                    <img src={thumbPreview} alt="Miniature auto" className={`${isReelMode ? 'w-24 h-40' : 'w-40 h-24'} rounded-lg object-cover border border-gray-200 dark:border-gray-600`} />
                    <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">Auto</div>
                  </div>
                ) : (
                  <div className={`${isReelMode ? 'w-24 h-40' : 'w-40 h-24'} rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center border border-dashed border-gray-300 dark:border-gray-600`}>
                    <div className="text-center">
                      <i className="ri-image-line text-2xl text-gray-400"></i>
                      <p className="text-xs text-gray-400 mt-1">Auto</p>
                    </div>
                  </div>
                )}
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  La miniature sera générée automatiquement à partir de votre vidéo.
                  {!thumbPreview && ' Ajoutez une vidéo pour voir l\'aperçu.'}
                </p>
              </div>
            ) : (
              <div>
                <label className="block border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center cursor-pointer hover:border-purple-400 dark:hover:border-purple-500 transition-colors">
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleThumbFileChange}
                    className="hidden"
                  />
                  {thumbPreview ? (
                    <div className="flex items-center justify-center gap-4">
                      <img src={thumbPreview} alt="Miniature" className={`${isReelMode ? 'w-24 h-40' : 'w-40 h-24'} rounded-lg object-cover`} />
                      <div className="text-left">
                        <p className="font-medium text-gray-900 dark:text-white">{thumbFile?.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{thumbFile ? `${(thumbFile.size / 1024).toFixed(0)} KB` : ''}</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <i className="ri-image-add-line text-3xl text-gray-400 mb-2"></i>
                      <p className="text-gray-600 dark:text-gray-400 font-medium text-sm">Cliquez pour sélectionner une image</p>
                      <p className="text-xs text-gray-400 mt-1">JPEG, PNG, GIF, WebP - Max 10 MB</p>
                    </>
                  )}
                </label>
              </div>
            )}
            {thumbUploading && <p className="text-sm text-purple-600 mt-2">Upload de la miniature...</p>}
          </section>

          {/* Section 3: Details */}
          <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              <i className="ri-file-text-line mr-2 text-purple-500"></i>
              Informations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Titre</label>
                <input name="title" value={form.title} onChange={onChange} className={`w-full px-3 py-2 rounded-lg border ${errors.title ? 'border-red-400' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400`} placeholder={isReelMode ? 'Ex: Astuce rapide #1' : 'Ex: Mindset de leader'} />
                {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Catégorie</label>
                <input name="category" value={form.category} onChange={onChange} className={`w-full px-3 py-2 rounded-lg border ${errors.category ? 'border-red-400' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400`} placeholder="Ex: Business" />
                {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Accès</label>
                <select name="type" value={form.type} onChange={onChange} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                  <option value="free">Gratuit</option>
                  <option value="premium">Payant (Premium)</option>
                </select>
              </div>
              {form.type === 'premium' && (
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Prix (coins)</label>
                  <input name="price" value={form.price} onChange={onChange} inputMode="numeric" className={`w-full px-3 py-2 rounded-lg border ${errors.price ? 'border-red-400' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400`} placeholder="Ex: 49" />
                  {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
                </div>
              )}
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Description</label>
                <textarea name="description" value={form.description} onChange={onChange} rows={isReelMode ? 3 : 5} className={`w-full px-3 py-2 rounded-lg border ${errors.description ? 'border-red-400' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400`} placeholder={isReelMode ? 'Décrivez brièvement votre Reel...' : 'Décrivez le contenu de la vidéo...'} />
                {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
              </div>
            </div>
          </section>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3">
            <button type="button" onClick={() => router.push(isReelMode ? '/dashboard/reels' : '/dashboard/videos')} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting || videoUploading || thumbUploading}
              className={`px-6 py-2 rounded-lg text-white font-medium ${
                submitting || videoUploading || thumbUploading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : isReelMode
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700'
                    : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {videoUploading ? 'Upload vidéo...' : thumbUploading ? 'Upload miniature...' : submitting ? 'Publication...' : isReelMode ? 'Publier le Reel' : 'Publier la vidéo'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
