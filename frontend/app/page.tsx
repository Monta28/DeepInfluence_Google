
'use client';

import { useEffect, useState } from 'react';
import AppHeader from '@/components/AppHeader';
import Hero from '@/components/Hero';
import ExpertsList from '@/components/ExpertsList';
import FormationsList from '@/components/FormationsList';
import VideosList from '@/components/VideosList';
import Features from '@/components/Features';
import Testimonials from '@/components/Testimonials';
import CTA from '@/components/CTA';
import Footer from '@/components/Footer';

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
    
    // Vérifier et appliquer le mode sombre au chargement
    const darkMode = localStorage.getItem('darkMode') === 'true';
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <div className={`min-h-screen transition-all duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'} bg-white dark:bg-gray-900 transition-colors duration-300`}>
      <AppHeader />
      <Hero />
      <ExpertsList />
      <FormationsList />
      <VideosList />
      <Features />
      <Testimonials />
      <CTA />
      <Footer />
    </div>
  );
}
