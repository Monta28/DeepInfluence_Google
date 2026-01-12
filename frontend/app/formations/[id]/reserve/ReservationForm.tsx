'use client';

import { useEffect, useState } from 'react';
import AppHeader from '@/components/AppHeader';
import Footer from '@/components/Footer';
import Link from 'next/link';
import ApiService from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface ReservationFormProps {
  formationId: string;
}

export default function ReservationForm({ formationId }: ReservationFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [formation, setFormation] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    level: '',
    motivation: '',
    paymentMethod: 'coins',
    agreeTerms: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const r = await ApiService.getFormationById(parseInt(formationId));
        if (mounted) {
          if (r.success && r.data) setFormation(r.data);
          else setError('Formation non trouvée');
        }
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Erreur de chargement');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [formationId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { router.push('/signin'); return; }
    setIsSubmitting(true);
    try {
      const r = await ApiService.enrollInFormation(parseInt(formationId));
      if (r.success) {
        setSubmitStatus('success');
        setSubmitError(null);
        setTimeout(() => router.push(`/dashboard/formations`), 800);
      } else {
        setSubmitStatus('error');
        setSubmitError((r as any)?.message || 'Échec de l\'inscription');
      }
    } catch (e: any) {
      setSubmitStatus('error');
      setSubmitError(e?.message || 'Échec de l\'inscription');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.firstName && formData.lastName && formData.email && 
                     formData.phone && formData.level && formData.motivation && 
                     formData.agreeTerms;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50"><AppHeader /><div className="max-w-4xl mx-auto p-8">Chargement…</div></div>
    );
  }
  if (error || !formation) {
    return (
      <div className="min-h-screen bg-gray-50"><AppHeader /><div className="max-w-4xl mx-auto p-8 text-red-500">{error || 'Formation introuvable'}</div></div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href="/formations" className="flex items-center text-blue-600 hover:text-blue-700 mb-4 cursor-pointer">
            <i className="ri-arrow-left-line mr-2"></i>
            <span>Retour aux formations</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Réserver votre place</h1>
          <p className="text-gray-600">Complétez le formulaire ci-dessous pour réserver votre place à la formation.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Informations de réservation</h2>
              
              <form id="reservation-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                      Prénom *
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                      Nom *
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-1">
                    Niveau d'expérience *
                  </label>
                  <select
                    id="level"
                    name="level"
                    value={formData.level}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8"
                  >
                    <option value="">Sélectionnez votre niveau</option>
                    <option value="debutant">Débutant</option>
                    <option value="intermediaire">Intermédiaire</option>
                    <option value="avance">Avancé</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="motivation" className="block text-sm font-medium text-gray-700 mb-1">
                    Motivation et objectifs *
                  </label>
                  <textarea
                    id="motivation"
                    name="motivation"
                    value={formData.motivation}
                    onChange={handleInputChange}
                    required
                    maxLength={500}
                    rows={4}
                    placeholder="Décrivez vos objectifs et ce que vous souhaitez apprendre..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {formData.motivation.length}/500 caractères
                  </p>
                </div>

                <div>
                  <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-1">
                    Méthode de paiement
                  </label>
                  <select
                    id="paymentMethod"
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8"
                  >
                    <option value="coins">Coins DeepInfluence</option>
                    <option value="card">Carte bancaire</option>
                    <option value="paypal">PayPal</option>
                  </select>
                </div>

                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="agreeTerms"
                    name="agreeTerms"
                    checked={formData.agreeTerms}
                    onChange={handleInputChange}
                    required
                    className="mt-1"
                  />
                  <label htmlFor="agreeTerms" className="text-sm text-gray-700 leading-relaxed">
                    J'accepte les{' '}
                    <Link href="/conditions" className="text-blue-600 hover:text-blue-700 cursor-pointer">
                      conditions d'utilisation
                    </Link>
                    {' '}et la{' '}
                    <Link href="/confidentialite" className="text-blue-600 hover:text-blue-700 cursor-pointer">
                      politique de confidentialité
                    </Link>
                    . Je confirme vouloir m'inscrire à cette formation.
                  </label>
                </div>

                {submitStatus === 'success' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <i className="ri-checkbox-circle-line text-green-600 mr-3"></i>
                      <div>
                        <p className="text-green-800 font-medium">Réservation confirmée !</p>
                        <p className="text-green-700 text-sm">Vous recevrez un email de confirmation avec tous les détails.</p>
                      </div>
                    </div>
                  </div>
                )}

                {submitStatus === 'error' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <i className="ri-error-warning-line text-red-600 mr-3"></i>
                      <div>
                        <p className="text-red-800 font-medium">Erreur lors de la réservation</p>
                        <p className="text-red-700 text-sm">{submitError || 'Veuillez réessayer ou contacter le support.'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Résumé de la formation</h3>
              
              <div className="space-y-4">
                <img 
                  src={formation.image} 
                  alt={formation.title}
                  className="w-full h-32 object-cover object-top rounded-lg"
                />
                
                <div>
                  <h4 className="font-semibold text-gray-900">{formation.title}</h4>
                  <p className="text-gray-600 text-sm">Par {formation.instructor}</p>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Durée:</span>
                    <span className="font-medium">{formation.duration}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Horaires:</span>
                    <span className="font-medium">{formation.schedule}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Début:</span>
                    <span className="font-medium">{new Date(formation.nextSession).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between text-lg font-semibold">
                    <span>Total:</span>
                    <span className="text-blue-600">{formation.price}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  form="reservation-form"
                  disabled={!isFormValid || isSubmitting || ((formation.maxPlaces || 0) - (formation.currentPlaces || 0)) <= 0 || (user && typeof user.coins === 'number' ? user.coins < (formation.price || 0) : false)}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors whitespace-nowrap ${
                    (isFormValid && !isSubmitting && ((formation.maxPlaces || 0) - (formation.currentPlaces || 0)) > 0)
                      ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isSubmitting
                    ? 'Traitement...'
                    : (((formation.maxPlaces || 0) - (formation.currentPlaces || 0)) <= 0
                        ? 'Formation complète'
                        : ((user && typeof user.coins === 'number' && user.coins < (formation.price || 0))
                            ? 'Solde insuffisant'
                            : 'Confirmer ma réservation'))}
                </button>

                <div className="text-center">
                  <p className="text-xs text-gray-500">
                    Paiement sécurisé • Remboursement 7 jours
                  </p>
                </div>
                {user && typeof user.coins === 'number' && user.coins < (formation.price || 0) && (
                  <div className="mt-3 text-center text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-2">
                    Solde insuffisant ({user.coins} coins). <Link href="/dashboard/coins" className="underline">Acheter des coins</Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
