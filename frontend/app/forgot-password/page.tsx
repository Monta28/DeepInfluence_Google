'use client';

import { useState } from 'react';
import Link from 'next/link';
import AppHeader from '@/components/AppHeader';
import Footer from '@/components/Footer';
import ApiService from '@/services/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const response = await ApiService.forgotPassword(email);
      if (response.success) {
        setIsSubmitted(true);
      } else {
        // Always show success to prevent email enumeration
        setIsSubmitted(true);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'envoi de l\'email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsSubmitted(false);
    setError('');
    // Permettre de renvoyer l'email
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-900">
      <AppHeader />
      
      <div className="pt-20 pb-12 px-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            {!isSubmitted ? (
              <>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="ri-lock-line text-2xl text-blue-600"></i>
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Mot de passe oublié</h1>
                  <p className="text-gray-600 dark:text-gray-300">Entrez votre email pour recevoir un lien de réinitialisation</p>
                </div>

                {/* Affichage des erreurs */}
                {error && (
                  <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl">
                    <div className="flex items-center">
                      <i className="ri-error-warning-line text-red-500 mr-2"></i>
                      <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                      Adresse e-mail
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError('');
                      }}
                      required
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                      placeholder="votre@email.com"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium py-3 px-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Envoi en cours...
                      </div>
                    ) : (
                      'Envoyer le lien de réinitialisation'
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-mail-check-line text-2xl text-green-600"></i>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Email envoyé</h1>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Nous avons envoyé un lien de réinitialisation à <strong>{email}</strong>
                </p>
                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-xl p-4 mb-6">
                  <div className="flex items-start">
                    <i className="ri-information-line text-blue-600 mr-2 mt-0.5"></i>
                    <div className="text-sm text-blue-800 dark:text-blue-200">
                      <p>Vérifiez votre boîte de réception et vos spams. Le lien expire dans 1 heure.</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleResend}
                  className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  Essayer avec un autre email
                </button>
              </div>
            )}

            <div className="mt-8 text-center">
              <Link
                href="/signin"
                className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                ← Retour à la connexion
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

