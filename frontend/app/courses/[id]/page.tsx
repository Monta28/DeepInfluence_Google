'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Page désactivée temporairement - redirect vers /formations
export default function CourseDetailRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/formations'); }, [router]);
  return null;
}
