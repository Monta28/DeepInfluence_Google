'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import ApiService from '@/services/api';
import { useAuth } from './AuthContext';

type FavoritesContextType = {
  expertIds: Set<number>;
  formationIds: Set<number>;
  videoIds: Set<number>;
  experts: any[];
  formations: any[];
  videos: any[];
  loading: boolean;
  refresh: () => Promise<void>;
  toggleExpert: (id: number) => Promise<void>;
  toggleFormation: (id: number) => Promise<void>;
  toggleVideo: (id: number) => Promise<void>; // like/unlike
  toggleFavoriteVideo: (id: number) => Promise<void>; // favoris séparés
};

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const useFavorites = () => {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
};

export const FavoritesProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [experts, setExperts] = useState<any[]>([]);
  const [formations, setFormations] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const expertIds = useMemo(() => new Set<number>(experts.map((e) => e.id)), [experts]);
  const formationIds = useMemo(() => new Set<number>(formations.map((f) => f.id)), [formations]);
  const videoIds = useMemo(() => new Set<number>(videos.map((v) => v.id)), [videos]);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const [e, f, v] = await Promise.all([
        ApiService.getFavoriteExperts().catch(() => ({ success: false })),
        ApiService.getFavoriteFormations().catch(() => ({ success: false })),
        (ApiService as any).getFavoriteVideos ? (ApiService as any).getFavoriteVideos().catch(() => ({ success: false })) : Promise.resolve({ success: false })
      ]);
      if ((e as any)?.success) setExperts((e as any).data?.experts || []); else setExperts([]);
      if ((f as any)?.success) setFormations((f as any).data?.formations || []); else setFormations([]);
      if ((v as any)?.success) setVideos((v as any).data?.videos || []); else setVideos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const emit = () => {
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('favorites:updated'));
  };

  const toggleExpert = useCallback(async (id: number) => {
    await ApiService.toggleFavoriteExpert(id);
    await refresh();
    emit();
  }, [refresh]);

  const toggleFormation = useCallback(async (id: number) => {
    await ApiService.toggleFavoriteFormation(id);
    await refresh();
    emit();
  }, [refresh]);

  const toggleVideo = useCallback(async (id: number) => {
    await ApiService.likeVideo(id);
    emit();
  }, []);

  const toggleFavoriteVideo = useCallback(async (id: number) => {
    await ApiService.toggleFavoriteVideo(id);
    await refresh();
    emit();
  }, [refresh]);

  useEffect(() => {
    // Only fetch favorites if user is authenticated
    if (user) {
      refresh();
    } else {
      // Clear favorites when user logs out
      setExperts([]);
      setFormations([]);
      setVideos([]);
    }
  }, [user, refresh]);

  const value: FavoritesContextType = {
    expertIds,
    formationIds,
    videoIds,
    experts,
    formations,
    videos,
    loading,
    refresh,
    toggleExpert,
    toggleFormation,
    toggleVideo,
    toggleFavoriteVideo,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};
