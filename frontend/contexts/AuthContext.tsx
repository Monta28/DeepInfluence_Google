'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import ApiService, { User } from '../services/api';

// Ajout de la propriété `profileCompleted` à l'interface User si elle n'y est pas déjà
export interface UserWithProfileStatus extends User {
  profileCompleted?: boolean;
}

interface AuthContextType {
  user: UserWithProfileStatus | null;
  isLoading: boolean;
  isCompletingProfile: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    userType?: string;
  }) => Promise<void>;
  logout: () => void;
  updateUser: (newUserData: Partial<UserWithProfileStatus>) => void; // Modifié pour être synchrone  
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserWithProfileStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const isCompletingProfile = user ? !user.profileCompleted : false;

  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    const allowedPaths = ['/dashboard/profile', '/', '/contact'];

    if (isCompletingProfile && !allowedPaths.includes(pathname)) {
      router.push('/dashboard/profile');
    }
  }, [user, isCompletingProfile, pathname, router]);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await ApiService.getMe();
        if (response.success) {
          setUser(response.data);
        } else {
          localStorage.removeItem('token');
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await ApiService.login(email, password);
      if (response.success) {
        localStorage.setItem('token', response.data.token);
        await checkAuthStatus(); // Met à jour l'utilisateur et déclenche le useEffect de redirection
      } else {
        throw new Error(response.message || 'Erreur de connexion');
      }
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    userType?: string;
  }) => {
    try {
      const response = await ApiService.register(userData);
      if (!response.success) {
        throw new Error(response.message || 'Erreur d\'inscription');
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    router.push('/'); // Redirige vers l'accueil après déconnexion
  };

  const updateUser = (newUserData: Partial<UserWithProfileStatus>) => {
    setUser(prevUser => {
        if (!prevUser) return null;
        // Fusionne les nouvelles données avec les anciennes
        const updatedUser = { ...prevUser, ...newUserData };
        // Si les données de l'expert sont mises à jour, fusionne-les aussi
        if (newUserData.expert) {
            updatedUser.expert = { ...prevUser.expert, ...newUserData.expert };
        }
        return updatedUser;
    });
  };
  
  const value: AuthContextType = {
    user,
    isLoading,
    isCompletingProfile,
    login,
    register,
    logout,
    updateUser,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};