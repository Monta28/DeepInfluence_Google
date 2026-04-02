'use client';

import { useState, useEffect, useCallback } from 'react';
import AppHeader from '@/components/AppHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import ApiService from '@/services/api';
import Link from 'next/link';
import { createScheduleException, listScheduleExceptions, deleteScheduleException } from '@/services/api';
import { useToast } from '@/contexts/ToastContext';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Dimanche', short: 'Dim' },
  { value: 1, label: 'Lundi', short: 'Lun' },
  { value: 2, label: 'Mardi', short: 'Mar' },
  { value: 3, label: 'Mercredi', short: 'Mer' },
  { value: 4, label: 'Jeudi', short: 'Jeu' },
  { value: 5, label: 'Vendredi', short: 'Ven' },
  { value: 6, label: 'Samedi', short: 'Sam' },
];

interface TimeSlot {
  start: string;
  end: string;
}

interface ScheduleException {
  id: number;
  date: string;
  type: 'UNAVAILABLE' | 'CUSTOM_HOURS';
  reason?: string;
  customSlots?: TimeSlot[];
}

export default function AvailabilityPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [availableDays, setAvailableDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([
    { start: '09:00', end: '12:00' },
    { start: '14:00', end: '18:00' }
  ]);

  // Schedule Exceptions state
  const [exceptions, setExceptions] = useState<ScheduleException[]>([]);
  const [showExceptionForm, setShowExceptionForm] = useState(false);
  const [exceptionDate, setExceptionDate] = useState('');
  const [exceptionType, setExceptionType] = useState<'UNAVAILABLE' | 'CUSTOM_HOURS'>('UNAVAILABLE');
  const [exceptionReason, setExceptionReason] = useState('');
  const [customExceptionSlots, setCustomExceptionSlots] = useState<TimeSlot[]>([{ start: '09:00', end: '17:00' }]);

  const loadAvailability = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ApiService.getMyAvailability();
      if (response.success && response.data) {
        if (response.data.availableDays && response.data.availableDays.length > 0) {
          setAvailableDays(response.data.availableDays);
        }
        if (response.data.availableTimeSlots && response.data.availableTimeSlots.length > 0) {
          setTimeSlots(response.data.availableTimeSlots);
        }
      }
      // Load schedule exceptions without blocking the rest of the page.
      try {
        const exceptionsRes = await listScheduleExceptions();
        if (exceptionsRes.success && exceptionsRes.data) {
          const payload = exceptionsRes.data;
          if (Array.isArray(payload)) {
            setExceptions(payload);
          } else {
            setExceptions(payload.exceptions || []);
          }
        }
      } catch (exceptionsErr) {
        console.error('Failed to load schedule exceptions:', exceptionsErr);
      }
    } catch (err: any) {
      setError(err?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      router.push('/signin');
      return;
    }
    if (user.userType !== 'expert' && user.userType !== 'admin') {
      router.push('/dashboard');
      return;
    }
    loadAvailability();
  }, [user, router, loadAvailability]);

  const toggleDay = (dayValue: number) => {
    setAvailableDays(prev => {
      if (prev.includes(dayValue)) {
        return prev.filter(d => d !== dayValue);
      } else {
        return [...prev, dayValue].sort((a, b) => a - b);
      }
    });
  };

  const addTimeSlot = () => {
    setTimeSlots(prev => [...prev, { start: '09:00', end: '17:00' }]);
  };

  const removeTimeSlot = (index: number) => {
    setTimeSlots(prev => prev.filter((_, i) => i !== index));
  };

  const updateTimeSlot = (index: number, field: 'start' | 'end', value: string) => {
    setTimeSlots(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Validation
      if (availableDays.length === 0) {
        setError('Veuillez sélectionner au moins un jour disponible');
        return;
      }
      if (timeSlots.length === 0) {
        setError('Veuillez ajouter au moins un créneau horaire');
        return;
      }

      // Validate time slots
      for (const slot of timeSlots) {
        if (slot.start >= slot.end) {
          setError('L\'heure de fin doit être après l\'heure de début');
          return;
        }
      }

      const response = await ApiService.updateMyAvailability({
        availableDays,
        availableTimeSlots: timeSlots
      });

      if (response.success) {
        setSuccess('Disponibilité mise à jour avec succès');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.message || 'Erreur lors de la sauvegarde');
      }
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  // Generate time options for dropdowns
  const generateTimeOptions = () => {
    const options = [];
    for (let h = 6; h <= 22; h++) {
      for (let m = 0; m < 60; m += 30) {
        const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        options.push(time);
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  // Generate preview of available time slots
  const generatePreviewSlots = () => {
    const slots: string[] = [];
    timeSlots.forEach(slot => {
      let [startH, startM] = slot.start.split(':').map(Number);
      const [endH, endM] = slot.end.split(':').map(Number);
      const endMinutes = endH * 60 + endM;

      while (startH * 60 + startM < endMinutes) {
        const time = `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`;
        slots.push(time);
        startM += 30;
        if (startM >= 60) {
          startH += 1;
          startM = 0;
        }
      }
    });
    return slots.sort();
  };

  // Schedule Exception handlers
  const handleCreateException = async () => {
    try {
      if (!exceptionDate) {
        addToast('Veuillez sélectionner une date', 'error');
        return;
      }

      const payload: any = {
        date: exceptionDate,
        type: exceptionType,
        reason: exceptionReason || undefined
      };

      if (exceptionType === 'CUSTOM_HOURS') {
        payload.customSlots = customExceptionSlots;
      }

      const response = await createScheduleException(payload);
      if (response.success) {
        addToast('Exception créée avec succès', 'success');
        setShowExceptionForm(false);
        setExceptionDate('');
        setExceptionReason('');
        setCustomExceptionSlots([{ start: '09:00', end: '17:00' }]);
        loadAvailability();
      } else {
        addToast(response.message || 'Erreur lors de la création', 'error');
      }
    } catch (err: any) {
      addToast(err?.message || 'Erreur lors de la création', 'error');
    }
  };

  const handleDeleteException = async (id: number) => {
    if (!confirm('Voulez-vous vraiment supprimer cette exception ?')) return;

    try {
      const response = await deleteScheduleException(id);
      if (response.success) {
        addToast('Exception supprimée', 'success');
        loadAvailability();
      } else {
        addToast(response.message || 'Erreur lors de la suppression', 'error');
      }
    } catch (err: any) {
      addToast(err?.message || 'Erreur lors de la suppression', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <AppHeader />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-8"></div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 space-y-4">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5, 6, 7].map(i => (
                  <div key={i} className="h-10 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppHeader />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href="/dashboard" className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-4 cursor-pointer">
            <i className="ri-arrow-left-line mr-2"></i>
            <span>Retour au dashboard</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Disponibilité</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Configurez vos jours et horaires disponibles pour les rendez-vous</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center">
              <i className="ri-error-warning-line text-red-600 dark:text-red-400 mr-3"></i>
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center">
              <i className="ri-checkbox-circle-line text-green-600 dark:text-green-400 mr-3"></i>
              <p className="text-green-800 dark:text-green-200">{success}</p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Days Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Jours disponibles</h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">Sélectionnez les jours où vous êtes disponible pour des rendez-vous</p>

            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    availableDays.includes(day.value)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>

            <p className="text-gray-500 dark:text-gray-400 text-xs mt-3">
              {availableDays.length === 0
                ? 'Aucun jour sélectionné'
                : `${availableDays.length} jour(s) sélectionné(s)`}
            </p>
          </div>

          {/* Time Slots */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Plages horaires</h2>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Définissez vos plages horaires de disponibilité</p>
              </div>
              <button
                type="button"
                onClick={addTimeSlot}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer flex items-center"
              >
                <i className="ri-add-line mr-2"></i>
                Ajouter
              </button>
            </div>

            <div className="space-y-3">
              {timeSlots.map((slot, index) => (
                <div key={index} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Début</label>
                      <select
                        value={slot.start}
                        onChange={(e) => updateTimeSlot(index, 'start', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white"
                      >
                        {timeOptions.map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Fin</label>
                      <select
                        value={slot.end}
                        onChange={(e) => updateTimeSlot(index, 'end', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white"
                      >
                        {timeOptions.map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {timeSlots.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTimeSlot(index)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors cursor-pointer"
                      title="Supprimer"
                    >
                      <i className="ri-delete-bin-line text-lg"></i>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Schedule Exceptions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Exceptions Horaires</h2>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Définissez des exceptions pour des dates spécifiques</p>
              </div>
              <button
                type="button"
                onClick={() => setShowExceptionForm(!showExceptionForm)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors cursor-pointer flex items-center"
              >
                <i className={`ri-${showExceptionForm ? 'close' : 'add'}-line mr-2`}></i>
                {showExceptionForm ? 'Annuler' : 'Ajouter une exception'}
              </button>
            </div>

            {showExceptionForm && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date</label>
                  <input
                    type="date"
                    value={exceptionDate}
                    onChange={(e) => setExceptionDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label>
                  <select
                    value={exceptionType}
                    onChange={(e) => setExceptionType(e.target.value as 'UNAVAILABLE' | 'CUSTOM_HOURS')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 dark:text-white"
                  >
                    <option value="UNAVAILABLE">Indisponible</option>
                    <option value="CUSTOM_HOURS">Horaires personnalisés</option>
                  </select>
                </div>

                {exceptionType === 'CUSTOM_HOURS' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Créneaux personnalisés</label>
                    {customExceptionSlots.map((slot, idx) => (
                      <div key={idx} className="flex gap-2 mb-2">
                        <select
                          value={slot.start}
                          onChange={(e) => {
                            const updated = [...customExceptionSlots];
                            updated[idx].start = e.target.value;
                            setCustomExceptionSlots(updated);
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 dark:text-white"
                        >
                          {timeOptions.map(time => <option key={time} value={time}>{time}</option>)}
                        </select>
                        <select
                          value={slot.end}
                          onChange={(e) => {
                            const updated = [...customExceptionSlots];
                            updated[idx].end = e.target.value;
                            setCustomExceptionSlots(updated);
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 dark:text-white"
                        >
                          {timeOptions.map(time => <option key={time} value={time}>{time}</option>)}
                        </select>
                        {customExceptionSlots.length > 1 && (
                          <button
                            onClick={() => setCustomExceptionSlots(customExceptionSlots.filter((_, i) => i !== idx))}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                          >
                            <i className="ri-delete-bin-line"></i>
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => setCustomExceptionSlots([...customExceptionSlots, { start: '09:00', end: '17:00' }])}
                      className="text-purple-600 dark:text-purple-400 text-sm hover:underline"
                    >
                      + Ajouter un créneau
                    </button>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Raison (optionnel)</label>
                  <input
                    type="text"
                    value={exceptionReason}
                    onChange={(e) => setExceptionReason(e.target.value)}
                    placeholder="Ex: Conférence professionnelle"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <button
                  onClick={handleCreateException}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Créer l'exception
                </button>
              </div>
            )}

            <div className="space-y-2">
              {exceptions.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">Aucune exception définie</p>
              ) : (
                exceptions.map((exception) => (
                  <div key={exception.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {new Date(exception.date).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          exception.type === 'UNAVAILABLE'
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        }`}>
                          {exception.type === 'UNAVAILABLE' ? 'Indisponible' : 'Horaires personnalisés'}
                        </span>
                      </div>
                      {exception.reason && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{exception.reason}</p>
                      )}
                      {exception.type === 'CUSTOM_HOURS' && exception.customSlots && (
                        <div className="flex gap-2 mt-2">
                          {exception.customSlots.map((slot, idx) => (
                            <span key={idx} className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                              {slot.start} - {slot.end}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteException(exception.id)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <i className="ri-delete-bin-line text-lg"></i>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Aperçu des créneaux</h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">Voici les créneaux de 30 minutes qui seront proposés aux clients</p>

            <div className="flex flex-wrap gap-2">
              {generatePreviewSlots().map((time, index) => (
                <span key={index} className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm">
                  {time}
                </span>
              ))}
            </div>

            {generatePreviewSlots().length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-sm">Aucun créneau disponible</p>
            )}
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors cursor-pointer ${
                saving
                  ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {saving ? (
                <>
                  <i className="ri-loader-4-line animate-spin mr-2"></i>
                  Enregistrement...
                </>
              ) : (
                <>
                  <i className="ri-save-line mr-2"></i>
                  Enregistrer les modifications
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
