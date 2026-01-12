'use client';

import React from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { SocketProvider } from '@/contexts/SocketContext';
import { ToastProvider } from '@/contexts/ToastContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SocketProvider>
        <ToastProvider>
          <FavoritesProvider>
            {children}
          </FavoritesProvider>
        </ToastProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

