'use client';

import React from 'react';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/contexts/AuthContext';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { SocketProvider } from '@/contexts/SocketContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <CurrencyProvider>
        <AuthProvider>
          <SocketProvider>
            <ToastProvider>
              <FavoritesProvider>
                {children}
              </FavoritesProvider>
            </ToastProvider>
          </SocketProvider>
        </AuthProvider>
      </CurrencyProvider>
    </ThemeProvider>
  );
}

