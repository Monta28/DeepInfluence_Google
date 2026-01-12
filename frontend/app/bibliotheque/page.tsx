'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BibliotequePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/videos');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Redirection vers la bibliothèque...</p>
      </div>
    </div>
  );
}
