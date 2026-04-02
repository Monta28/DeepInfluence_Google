'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Page désactivée temporairement - redirect vers /dashboard
export default function EditCourseRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/dashboard'); }, [router]);
  return null;
}
