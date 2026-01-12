'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { useAuth } from '../../../../contexts/AuthContext';
import ApiService, { Expert } from '../../../../services/api';

interface BookExpertFormProps {
  expertId: string;
}

export default function BookExpertForm({ expertId }: BookExpertFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  
  const [expert, setExpert] = useState<Expert | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [duration, setDuration] = useState('30');
  const [customDuration, setCustomDuration] = useState('');
  const [subject, setSubject] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [occupied, setOccupied] = useState<string[]>([]);

  useEffect(() => {
    if (!user) {
      router.push('/signin');
      return;
    }
    loadExpert();
  }, [expertId, user, router]);

  const loadExpert = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await ApiService.getExpert(parseInt(expertId));
      if (response.success && response.data){
        setExpert(response.data);
      } else {
        setError('Expert non trouvé');
      }
    } catch (err: any) {
      setError('Erreur de connexion au serveur.');
    } finally {
      setLoading(false);
    }
  };
  
  const availableTimes = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30', '18:00', '18:30'
  ];

  // Date min = aujourd'hui (YYYY-MM-DD)
  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = `${now.getMonth() + 1}`.padStart(2, '0');
    const d = `${now.getDate()}`.padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  // Calendar helpers
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const formatDate = (d: Date) => {
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, '0');
    const dd = `${d.getDate()}`.padStart(2, '0');
    return `${y}-${m}-${dd}`;
  };
  const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const monthDays = useMemo(() => {
    const first = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const shift = (first.getDay() + 6) % 7; // Monday-first
    const start = addDays(first, -shift);
    return Array.from({ length: 42 }, (_, i) => addDays(start, i));
  }, [currentMonth]);
  useEffect(() => {
    if (selectedDate) {
      const d = new Date(selectedDate + 'T00:00:00');
      setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  }, [selectedDate]);

  useEffect(() => {
    if (!expert || !selectedDate) return;
    (async () => {
      try {
        const res = await ApiService.getOccupiedSlots(expert.id, selectedDate);
        if (res.success && Array.isArray(res.data)) {
          setOccupied(res.data);
        } else {
          setOccupied([]);
        }
      } catch {
        setOccupied([]);
      }
    })();
  }, [expert, selectedDate]);

  const isSlotPastToday = (time: string) => {
    if (selectedDate !== todayStr) return false;
    const now = new Date();
    const [hh, mm] = time.split(':').map(Number);
    const minutesNow = now.getHours() * 60 + now.getMinutes();
    const minutesSlot = hh * 60 + mm;
    return minutesSlot <= minutesNow;
  };

  const isSlotOccupied = (time: string) => occupied.includes(time);

  // Quand la date change, réinitialiser l'heure sélectionnée
  useEffect(() => {
    setSelectedTime('');
  }, [selectedDate]);

  const getFinalDuration = () => {
    return duration === 'custom' ? parseInt(customDuration) || 0 : parseInt(duration);
  };

  const getTotalCost = () => {
    if (!expert) return 0;
    return getFinalDuration() * expert.hourlyRate / 60; // Calcul basé sur le tarif horaire
  };

  const isFormValid = selectedDate && selectedTime && subject.trim() && getFinalDuration() >= 10;

  const handleBooking = async () => {
    if (!isFormValid || !expert) return;
    
    setIsBooking(true);
    
    try {
      const appointmentData = {
        expertId: expert.id,
        type: 'video-call',
        date: selectedDate,
        time: selectedTime,
        duration: getFinalDuration().toString(),
        category: expert.category,
      };
      
      const response = await ApiService.createAppointment(appointmentData);

      if (response.success) {
        router.push('/dashboard/appointments');
      } else {
        setError(response.message || 'Erreur lors de la réservation.');
      }
    } catch (error: any) {
      setError(error.message || 'Une erreur est survenue.');
    } finally {
      setIsBooking(false);
    }
  };
  
  if (loading) return <div>Chargement...</div>;
  if (error) return <div>{error}</div>;
  if (!expert) return <div>Expert non trouvé.</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppHeader />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link 
            href={`/experts/${expertId}`} 
            className="flex items-center text-blue-600 hover:text-blue-700 mb-4 cursor-pointer"
          >
            <i className="ri-arrow-left-line mr-2"></i>
            <span>Retour au profil</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Réserver un appel vidéo</h1>
          <p className="text-gray-600 dark:text-gray-300">Planifiez votre consultation personnalisée.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Détails de la réservation</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date souhaitée
                  </label>
                  {/* Hidden native input for accessibility */}
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={todayStr}
                    className="hidden"
                  />
                  {/* Tailwind calendar */}
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-4">
                    <div className="flex items-center justify-between mb-3">
                      <button
                        type="button"
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                        aria-label="Mois précédent"
                      >
                        <i className="ri-arrow-left-s-line text-gray-600 dark:text-gray-300"></i>
                      </button>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                      </div>
                      <button
                        type="button"
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                        aria-label="Mois suivant"
                      >
                        <i className="ri-arrow-right-s-line text-gray-600 dark:text-gray-300"></i>
                      </button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-xs text-gray-500 dark:text-gray-400 mb-1">
                      {['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'].map((d, i) => (
                        <div key={`${d}-${i}`} className="text-center py-1">{d}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {monthDays.map((d) => {
                        const dStr = formatDate(d);
                        const isCurrent = d.getMonth() === currentMonth.getMonth();
                        const isPast = dStr < todayStr;
                        const isSelected = selectedDate === dStr;
                        const isToday = dStr === todayStr;
                        const base = 'text-sm rounded-lg py-2 text-center select-none';
                        const tone = !isCurrent ? 'text-gray-400 dark:text-gray-600' : 'text-gray-900 dark:text-white';
                        const state = isPast
                          ? 'bg-gray-100 dark:bg-gray-700/40 text-gray-400 cursor-not-allowed'
                          : isSelected
                            ? 'bg-blue-600 text-white shadow'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer';
                        const ring = isToday && !isSelected ? 'ring-1 ring-blue-400' : '';
                        return (
                          <div
                            key={dStr}
                            onClick={() => { if (!isPast) setSelectedDate(dStr); }}
                            className={`${base} ${tone} ${state} ${ring}`}
                          >
                            {d.getDate()}
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Vous ne pouvez choisir qu'une date à partir d'aujourd'hui.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Heure souhaitée
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {availableTimes.map((time) => (
                      <button
                        key={time}
                        type="button"
                        disabled={isSlotOccupied(time) || isSlotPastToday(time) || !selectedDate}
                        onClick={() => !(isSlotOccupied(time) || isSlotPastToday(time) || !selectedDate) && setSelectedTime(time)}
                        className={`p-2 text-sm rounded-lg border transition-colors whitespace-nowrap ${
                          isSlotOccupied(time)
                            ? 'bg-red-100 text-red-700 border-red-300 cursor-not-allowed'
                            : isSlotPastToday(time) || !selectedDate
                              ? 'bg-gray-100 text-gray-500 border-gray-300 cursor-not-allowed'
                              : selectedTime === time
                                ? 'bg-blue-600 text-white border-blue-600 cursor-pointer'
                                : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 hover:border-blue-500 cursor-pointer'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Durée de l'appel
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => {
                      setDuration(e.target.value);
                      if (e.target.value !== 'custom') {
                        setCustomDuration('');
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white pr-8"
                  >
                    <option value="15">15 minutes ({15 * expert.hourlyRate / 60} coins)</option>
                    <option value="30">30 minutes ({30 * expert.hourlyRate / 60} coins)</option>
                    <option value="45">45 minutes ({45 * expert.hourlyRate / 60} coins)</option>
                    <option value="60">60 minutes ({expert.hourlyRate} coins)</option>
                    <option value="custom">Durée personnalisée</option>
                  </select>
                  
                  {duration === 'custom' && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nombre de minutes (minimum 10)
                      </label>
                      <input
                        type="number"
                        min="10"
                        max="120"
                        value={customDuration}
                        onChange={(e) => setCustomDuration(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Entrez le nombre de minutes"
                      />
                      {customDuration && parseInt(customDuration) < 10 && (
                        <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                          La durée minimum est de 10 minutes
                        </p>
                      )}
                      {customDuration && parseInt(customDuration) >= 10 && (
                        <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                          Coût: {parseInt(customDuration) * expert.hourlyRate / 60} coins
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sujet de consultation <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    rows={4}
                    maxLength={500}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                    placeholder="Décrivez brièvement le sujet que vous souhaitez aborder durant la consultation..."
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {subject.length}/500 caractères
                  </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <div className="flex items-center text-blue-800 dark:text-blue-200">
                    <i className="ri-information-line mr-2"></i>
                    <span className="font-medium">Informations importantes</span>
                  </div>
                  <ul className="mt-2 text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• Durée minimum : 10 minutes</li>
                    <li>• Vous recevrez un lien de connexion par email</li>
                    <li>• Arrivez 5 minutes avant l'heure prévue</li>
                    <li>• Assurez-vous d'avoir une connexion stable</li>
                    <li>• Annulation possible jusqu'à 2h avant</li>
                  </ul>
                </div>

                <button
                  onClick={handleBooking}
                  disabled={!isFormValid || isBooking}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    isFormValid && !isBooking
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isBooking ? 'Réservation en cours...' : `Réserver maintenant (${getTotalCost()} coins)`}
                </button>

                {/* Indicateur des champs manquants */}
                {!isFormValid && !isBooking && (
                  <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium mb-1">
                      Veuillez compléter tous les champs requis:
                    </p>
                    <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-0.5">
                      {!selectedDate && <li>• Sélectionnez une date</li>}
                      {!selectedTime && <li>• Sélectionnez une heure</li>}
                      {!subject.trim() && <li>• Entrez un sujet de consultation</li>}
                      {getFinalDuration() < 10 && <li>• La durée doit être d'au moins 10 minutes</li>}
                    </ul>
                  </div>
                )}

                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Après confirmation, vous recevrez un lien pour rejoindre la session vidéo
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Récapitulatif</h3>
              
              <div className="flex items-center space-x-4 mb-6">
                <div className="relative">
                  <img 
                    src={expert.image} 
                    alt={expert.name}
                    className="w-16 h-16 rounded-full object-cover object-top"
                  />
                  {expert.isOnline && (
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">{expert.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{expert.specialty}</p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    {expert.isOnline ? 'En ligne' : 'Hors ligne'}
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Date:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {selectedDate ? new Date(selectedDate).toLocaleDateString('fr-FR', { 
                      day: 'numeric', 
                      month: 'long' 
                    }) : 'Non sélectionnée'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Heure:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {selectedTime || 'Non sélectionnée'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Durée:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {getFinalDuration()} minutes
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Tarif:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {expert.hourlyRate} coins/heure
                  </span>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-600 pt-4 mt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">Total:</span>
                  <span className="text-xl font-bold text-blue-600">{getTotalCost()} coins</span>
                </div>
              </div>

              <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                <p>• Paiement sécurisé</p>
                <p>• Confirmation immédiate</p>
                <p>• Support technique inclus</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
