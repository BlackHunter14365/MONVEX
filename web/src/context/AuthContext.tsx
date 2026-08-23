'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  is_verified?: boolean;
  status?: string;
  currency: string;
  monthly_income: number;
  has_google_auth?: boolean;
  has_password_auth?: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: any) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<any>;
  linkGoogleAccount: (payload: { credential: string; password: string }) => Promise<any>;
  register: (userData: any) => Promise<any>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    const token = api.getAccessToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const profile = await api.getProfile();
      setUser(profile);
    } catch {
      api.clearTokens();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();

    const handleAuthLogout = () => {
      setUser(null);
      setIsLoading(false);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('monvex:auth-logout', handleAuthLogout);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('monvex:auth-logout', handleAuthLogout);
      }
    };
  }, []);

  const login = async (credentials: any) => {
    await api.login(credentials);
    await refreshUser();
  };

  const loginWithGoogle = async (credential: string) => {
    const res = await api.googleLogin(credential);
    if (res.access) {
      await refreshUser();
    }
    return res;
  };

  const linkGoogleAccount = async (payload: { credential: string; password: string }) => {
    const res = await api.linkGoogleAccount(payload);
    if (res.access) {
      await refreshUser();
    }
    return res;
  };

  const register = async (userData: any) => {
    const res = await api.register(userData);
    if (res.access) {
      await refreshUser();
    }
    return res;
  };

  const logout = async () => {
    api.clearTokens();
    setUser(null);
    try {
      await api.logout();
    } catch {
      // ignore
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('monvex:auth-logout'));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginWithGoogle,
        linkGoogleAccount,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

