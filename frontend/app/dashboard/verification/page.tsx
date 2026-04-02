'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';

interface VerificationStatus {
  expertId: number;
  expertName: string;
  verified: boolean;
  verificationStatus: 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  submittedAt: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  hasDocuments: boolean;
  statusInfo: {
    title: string;
    message: string;
    canResubmit: boolean;
  };
}

export default function VerificationPage() {
  const router = useRouter();
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    diplomaFile: null as File | null,
    identityFile: null as File | null,
    experience: '',
    specialization: '',
    motivation: ''
  });

  useEffect(() => {
    loadVerificationStatus();
  }, []);

  const loadVerificationStatus = async () => {
    try {
      const response = await api.get('/experts/verification/status');
      setStatus(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Erreur chargement status:', error);
      setLoading(false);
    }
  };

  const handleFileChange = (field: 'diplomaFile' | 'identityFile', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Le fichier ne doit pas dépasser 5 MB');
        return;
      }
      // Vérifier le type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        alert('Format non supporté. Utilisez JPG, PNG ou PDF');
        return;
      }
      setFormData({ ...formData, [field]: file });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.diplomaFile || !formData.identityFile) {
      alert('Veuillez uploader tous les documents requis');
      return;
    }

    if (!formData.experience || !formData.specialization) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setSubmitting(true);

    try {
      // Créer FormData pour l'upload
      const data = new FormData();
      data.append('diploma', formData.diplomaFile);
      data.append('identity', formData.identityFile);
      data.append('experience', formData.experience);
      data.append('specialization', formData.specialization);
      data.append('motivation', formData.motivation);

      await api.post('/experts/submit-verification', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      alert('Demande soumise avec succès ! Vous recevrez une notification une fois la validation effectuée.');
      loadVerificationStatus();
    } catch (error: any) {
      console.error('Erreur soumission:', error);
      alert(error.response?.data?.message || 'Erreur lors de la soumission');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Erreur de chargement
          </h2>
          <button onClick={() => router.back()} className="text-purple-600 dark:text-purple-400 hover:underline">
            Retour
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (verificationStatus: string) => {
    switch (verificationStatus) {
      case 'APPROVED': return 'text-green-600 dark:text-green-400';
      case 'PENDING': return 'text-blue-600 dark:text-blue-400';
      case 'REJECTED': return 'text-red-600 dark:text-red-400';
      case 'EXPIRED': return 'text-orange-600 dark:text-orange-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusIcon = (verificationStatus: string) => {
    switch (verificationStatus) {
      case 'APPROVED':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'PENDING':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'REJECTED':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour
          </button>

          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Vérification Expert
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Obtenez le badge vérifié pour renforcer votre crédibilité
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              {getStatusIcon(status.verificationStatus)}
            </div>
            <div className="flex-1">
              <h2 className={`text-2xl font-bold mb-2 ${getStatusColor(status.verificationStatus)}`}>
                {status.statusInfo.title}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {status.statusInfo.message}
              </p>

              {status.submittedAt && (
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  Demande soumise le {new Date(status.submittedAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </div>
              )}

              {status.reviewedAt && (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Révisée le {new Date(status.reviewedAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </div>
              )}

              {status.verificationStatus === 'REJECTED' && status.rejectionReason && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <h3 className="font-semibold text-red-900 dark:text-red-300 mb-2">
                    Motif du refus :
                  </h3>
                  <p className="text-red-700 dark:text-red-400 text-sm">
                    {status.rejectionReason}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Formulaire de soumission */}
        {status.statusInfo.canResubmit && (
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              {status.verificationStatus === 'NOT_SUBMITTED' ? 'Soumettre ma demande' : 'Soumettre à nouveau'}
            </h2>

            {/* Documents */}
            <div className="space-y-6 mb-6">
              {/* Diplôme */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Diplôme ou Certification <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex-1 flex items-center justify-center px-4 py-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-purple-500 dark:hover:border-purple-400 transition">
                    <div className="text-center">
                      {formData.diplomaFile ? (
                        <div>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{formData.diplomaFile.name}</p>
                        </div>
                      ) : (
                        <div>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Cliquez pour uploader</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">JPG, PNG ou PDF (max 5MB)</p>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) => handleFileChange('diplomaFile', e)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Pièce d'identité */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pièce d'identité (CIN) <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex-1 flex items-center justify-center px-4 py-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-purple-500 dark:hover:border-purple-400 transition">
                    <div className="text-center">
                      {formData.identityFile ? (
                        <div>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{formData.identityFile.name}</p>
                        </div>
                      ) : (
                        <div>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Cliquez pour uploader</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">JPG, PNG ou PDF (max 5MB)</p>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) => handleFileChange('identityFile', e)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Informations */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Années d'expérience <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  placeholder="Ex: 5"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Spécialisation <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  placeholder="Ex: Coach sportif certifié en nutrition"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Motivation (optionnel)
                </label>
                <textarea
                  value={formData.motivation}
                  onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                  placeholder="Pourquoi souhaitez-vous obtenir le badge vérifié ?"
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                />
              </div>
            </div>

            {/* Note */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-1">
                    Informations importantes
                  </h3>
                  <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                    <li>• Tous les documents seront traités de manière confidentielle</li>
                    <li>• La validation prend généralement 2-3 jours ouvrables</li>
                    <li>• Vous recevrez une notification une fois votre demande traitée</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Soumission en cours...
                </span>
              ) : (
                'Soumettre ma demande'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
