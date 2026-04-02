'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppHeader from '@/components/AppHeader';
import Footer from '@/components/Footer';
import { useAuth } from '../../contexts/AuthContext';

export default function SignUpPage() {
  const [userType, setUserType] = useState<'user' | 'expert'>('user');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    referralCode: '',
    acceptTerms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [apiError, setApiError] = useState('');

  const { register, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (apiError) setApiError('');
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'Le prénom est requis';
    if (!formData.lastName.trim()) newErrors.lastName = 'Le nom est requis';
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'Vous devez accepter les conditions générales';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setApiError('');
    try {
      await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        userType: userType,
        referralCode: formData.referralCode.trim() || undefined
      });
      router.push('/signin?registered=true');
    } catch (err: any) {
      setApiError(err.message || 'Erreur lors de l\'inscription.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSocialSignup = (provider: string) => {
    setSocialLoading(provider);
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    
    // CORRECTION : On encode le userType dans le paramètre 'state'
    // pour que le backend sache quel type de compte créer.
    const state = Buffer.from(JSON.stringify({ userType })).toString('base64');
    
    window.location.href = `${backendUrl}/api/auth/${provider.toLowerCase()}?state=${state}`;
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-900">
      <AppHeader />
      <div className="pt-20 pb-12 px-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Inscription</h1>
              <p className="text-gray-600 dark:text-gray-300">Créez votre compte DeepInfluence</p>
            </div>

            {apiError && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl">
                <div className="flex items-center">
                  <i className="ri-error-warning-line text-red-500 mr-2"></i>
                  <p className="text-red-700 dark:text-red-300 text-sm">{apiError}</p>
                </div>
              </div>
            )}
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                Type de compte
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setUserType('user')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    userType === 'user'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="w-8 h-8 mx-auto mb-2 flex items-center justify-center">
                    <i className="ri-user-line text-2xl"></i>
                  </div>
                  <div className="text-sm font-medium">Utilisateur</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Rechercher des experts</div>
                </button>
                <button
                  type="button"
                  onClick={() => setUserType('expert')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    userType === 'expert'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="w-8 h-8 mx-auto mb-2 flex items-center justify-center">
                    <i className="ri-graduation-cap-line text-2xl"></i>
                  </div>
                  <div className="text-sm font-medium">Expert</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Offrir mes services</div>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Prénom</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 ${errors.firstName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                    placeholder="Jean"
                  />
                  {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Nom</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 ${errors.lastName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                    placeholder="Dupont"
                  />
                  {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                </div>
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Adresse e-mail</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                  placeholder="votre@email.com"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Mot de passe</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 pr-12 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 ${errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                    <div className="w-5 h-5 flex items-center justify-center"><i className={`ri-eye-${showPassword ? 'off-' : ''}line`}></i></div>
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Confirmer le mot de passe</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 pr-12 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                    <div className="w-5 h-5 flex items-center justify-center"><i className={`ri-eye-${showConfirmPassword ? 'off-' : ''}line`}></i></div>
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Code de parrainage (optionnel)</label>
                <input
                  type="text"
                  name="referralCode"
                  value={formData.referralCode}
                  onChange={handleInputChange}
                  placeholder="Entrez votre code de parrainage"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    name="acceptTerms"
                    checked={formData.acceptTerms}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:ring-2 mt-1"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-200">
                    J'accepte les <Link href="/terms" className="text-blue-600 hover:text-blue-800">conditions générales</Link> et la <Link href="/privacy" className="text-blue-600 hover:text-blue-800">politique de confidentialité</Link>.
                  </span>
                </label>
                {errors.acceptTerms && <p className="text-red-500 text-xs mt-1">{errors.acceptTerms}</p>}
              </div>
              <button
                type="submit"
                disabled={isLoading || !!socialLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium py-3 px-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Inscription...
                  </div>
                ) : (
                  `Créer mon compte ${userType === 'user' ? 'utilisateur' : 'expert'}`
                )}
              </button>
            </form>
            <div className="mt-8 text-center">
              <p className="text-gray-600 dark:text-gray-300">
                Vous avez déjà un compte ? <Link href="/signin" className="text-blue-600 hover:text-blue-800 font-medium">Se connecter</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}