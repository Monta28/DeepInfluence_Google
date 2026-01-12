'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';

function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { checkAuthStatus } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      console.error('Social login error:', error);
      router.push('/signin?error=social');
      return;
    }

    if (token) {
      localStorage.setItem('token', token);
      // Forcer la mise à jour du contexte d'authentification
      checkAuthStatus().then(() => {
        router.push('/dashboard');
      });
    } else {
      // Pas de token, rediriger vers la connexion
      router.push('/signin');
    }
  }, [router, searchParams, checkAuthStatus]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Finalisation de la connexion...</p>
      </div>
    </div>
  );
}

// Suspense est nécessaire car useSearchParams est un Client Component hook
export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthCallback />
    </Suspense>
  );
}