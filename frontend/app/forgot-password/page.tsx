'use client';

import { useState } from 'react';
import Link from 'next/link';
import AppHeader from '@/components/AppHeader';
import Footer from '@/components/Footer';

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
      // TODO: Implémenter l'endpoint de réinitialisation de mot de passe
      // const response = await ApiService.forgotPassword(email);
      
      // Simulation d'envoi d'email pour le moment
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Vérifier si l'email existe (simulation)
      const commonEmails = [
        'sarah.martin@email.com',
        'user1@email.com',
        'marc.dubois@email.com',
        'sophie.laurent@email.com',
        'ahmed.hassan@email.com'
      ];
      
      if (!commonEmails.includes(email.toLowerCase())) {
        throw new Error('Aucun compte associé à cette adresse email');
      }
      
      setIsSubmitted(true);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <AppHeader />
      
      <div className="pt-20 pb-12 px-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {!isSubmitted ? (
              <>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="ri-lock-line text-2xl text-blue-600"></i>
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Mot de passe oublié</h1>
                  <p className="text-gray-600">Entrez votre email pour recevoir un lien de réinitialisation</p>
                </div>

                {/* Affichage des erreurs */}
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <div className="flex items-center">
                      <i className="ri-error-warning-line text-red-500 mr-2"></i>
                      <p className="text-red-700 text-sm">{error}</p>
                    </div>
                  </div>
                )}

                {/* Comptes de test */}
                <div className="mb-6 p-4 bg-blue-50 rounded-xl">
                  <h3 className="text-sm font-medium text-blue-800 mb-2">Emails de test disponibles :</h3>
                  <div className="space-y-1">
                    {[
                      'sarah.martin@email.com',
                      'user1@email.com',
                      'marc.dubois@email.com'
                    ].map((testEmail, index) => (
                      <button
                        key={index}
                        onClick={() => setEmail(testEmail)}
                        className="block w-full text-left text-xs text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        {testEmail}
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
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
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-mail-check-line text-2xl text-green-600"></i>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Email envoyé</h1>
                <p className="text-gray-600 mb-6">
                  Nous avons envoyé un lien de réinitialisation à <strong>{email}</strong>
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                  <div className="flex items-start">
                    <i className="ri-information-line text-yellow-600 mr-2 mt-0.5"></i>
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium mb-1">Mode démonstration</p>
                      <p>La fonctionnalité de réinitialisation par email sera implémentée prochainement. Pour le moment, contactez l'administrateur pour réinitialiser votre mot de passe.</p>
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

