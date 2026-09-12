'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { queryClient } from '@/lib/query/queryClient';
import { authStorage } from '@/lib/authStorage';
import { AUTH_CONFIG, SessionExpiredReason } from '@/config/auth';

export type AuthStatus = 'AUTH_INITIALIZING' | 'AUTHENTICATED' | 'UNAUTHENTICATED' | 'SESSION_EXPIRED';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  bio?: string;
  theme?: string;
  avatar_url?: string;
  avatar_preset?: string;
  preferences?: Record<string, any>;
  is_verified?: boolean;
  status?: string;
  currency: string;
  monthly_income: number;
  savings_target_percentage?: number;
  has_google_auth?: boolean;
  has_password_auth?: boolean;
  profile?: Record<string, any>;
}

interface AuthContextType {
  user: UserProfile | null;
  authStatus: AuthStatus;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionExpiredReason: SessionExpiredReason | null;
  clearSessionExpiredReason: () => void;
  login: (credentials: any) => Promise<any>;
  verifyLoginOTP: (payload: { verification_id: string; code: string }) => Promise<any>;
  resendLoginOTP: (verification_id: string) => Promise<any>;
  loginWithGoogle: (credential: string) => Promise<any>;
  linkGoogleAccount: (payload: { credential: string; password: string }) => Promise<any>;
  register: (userData: any) => Promise<any>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('AUTH_INITIALIZING');
  const [sessionExpiredReason, setSessionExpiredReasonState] = useState<SessionExpiredReason | null>(null);

  const clearSessionExpiredReason = useCallback(() => {
    authStorage.clearSessionExpiredReason();
    setSessionExpiredReasonState(null);
  }, []);

  const refreshUser = useCallback(async () => {
    // 1. Inactivity verification
    if (authStorage.isInactive()) {
      authStorage.setSessionExpiredReason('inactivity');
      authStorage.clearSession(false);
      queryClient.clear();
      setUser(null);
      setSessionExpiredReasonState('inactivity');
      setAuthStatus('SESSION_EXPIRED');
      return;
    }

    const token = authStorage.getAccessToken();
    const refreshToken = authStorage.getRefreshToken();

    if (!token && !refreshToken) {
      const reason = authStorage.getSessionExpiredReason();
      setUser(null);
      setSessionExpiredReasonState(reason);
      setAuthStatus(reason ? 'SESSION_EXPIRED' : 'UNAUTHENTICATED');
      return;
    }

    try {
      // Proactively refresh access token if absent but refresh token exists
      if (!token && refreshToken) {
        const newAccess = await api.client.refreshAccessToken();
        if (!newAccess) {
          const reason = authStorage.getSessionExpiredReason() || 'invalid_token';
          setUser(null);
          setSessionExpiredReasonState(reason);
          setAuthStatus('SESSION_EXPIRED');
          return;
        }
      }

      const profile = await api.getProfile();
      setUser(profile);
      setAuthStatus('AUTHENTICATED');
      setSessionExpiredReasonState(null);
      authStorage.updateActivity(true);
    } catch (err: any) {
      // Only clear credentials if backend explicitly returns 401 or invalid token
      const isExplicitAuthFailure =
        err.message?.includes('401') ||
        err.message?.includes('invalid') ||
        err.message?.includes('expired') ||
        err.message?.includes('Authentication credentials');

      if (isExplicitAuthFailure) {
        authStorage.clearSession();
        queryClient.clear();
        setUser(null);
        setSessionExpiredReasonState('invalid_token');
        setAuthStatus('UNAUTHENTICATED');
      } else {
        // Network drop or server cold start: preserve valid local session
        const hasSession = !!authStorage.getSession();
        if (hasSession) {
          setAuthStatus('AUTHENTICATED');
        } else {
          setAuthStatus('UNAUTHENTICATED');
        }
      }
    }
  }, []);

  useEffect(() => {
    refreshUser();

    const handleAuthLogout = () => {
      queryClient.clear();
      setUser(null);
      const reason = authStorage.getSessionExpiredReason();
      setSessionExpiredReasonState(reason);
      setAuthStatus(reason ? 'SESSION_EXPIRED' : 'UNAUTHENTICATED');
    };

    // User interaction listeners for activity renewal
    const handleUserActivity = () => {
      authStorage.updateActivity();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(AUTH_CONFIG.EVENTS.LOGOUT, handleAuthLogout);
      window.addEventListener('pointerdown', handleUserActivity, { passive: true });
      window.addEventListener('keydown', handleUserActivity, { passive: true });
      window.addEventListener('focus', handleUserActivity);

      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          if (authStorage.isInactive()) {
            handleAuthLogout();
          } else {
            handleUserActivity();
          }
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        window.removeEventListener(AUTH_CONFIG.EVENTS.LOGOUT, handleAuthLogout);
        window.removeEventListener('pointerdown', handleUserActivity);
        window.removeEventListener('keydown', handleUserActivity);
        window.removeEventListener('focus', handleUserActivity);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [refreshUser]);

  const login = async (credentials: any) => {
    queryClient.clear();
    const res = await api.login(credentials);
    if (res.access) {
      authStorage.clearSessionExpiredReason();
      setSessionExpiredReasonState(null);
      await refreshUser();
    }
    return res;
  };

  const verifyLoginOTP = async (payload: { verification_id: string; code: string }) => {
    queryClient.clear();
    const res = await api.verifyLoginOTP(payload);
    const access = res.access || res.data?.access;
    if (access) {
      authStorage.clearSessionExpiredReason();
      setSessionExpiredReasonState(null);
      await refreshUser();
    }
    return res;
  };

  const resendLoginOTP = async (verification_id: string) => {
    return api.resendLoginOTP(verification_id);
  };

  const loginWithGoogle = async (credential: string) => {
    queryClient.clear();
    const res = await api.googleLogin(credential);
    if (res.access) {
      authStorage.clearSessionExpiredReason();
      setSessionExpiredReasonState(null);
      await refreshUser();
    }
    return res;
  };

  const linkGoogleAccount = async (payload: { credential: string; password: string }) => {
    const res = await api.linkGoogleAccount(payload);
    if (res.access) {
      authStorage.clearSessionExpiredReason();
      setSessionExpiredReasonState(null);
      await refreshUser();
    }
    return res;
  };

  const register = async (userData: any) => {
    queryClient.clear();
    const res = await api.register(userData);
    if (res.access) {
      authStorage.clearSessionExpiredReason();
      setSessionExpiredReasonState(null);
      await refreshUser();
    }
    return res;
  };

  const logout = async () => {
    queryClient.clear();
    const refresh = authStorage.getRefreshToken();
    authStorage.clearSession(true);
    setUser(null);
    setAuthStatus('UNAUTHENTICATED');
    setSessionExpiredReasonState(null);

    try {
      if (refresh) {
        await api.logout();
      }
    } catch {
      // ignore
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(AUTH_CONFIG.EVENTS.LOGOUT));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        authStatus,
        isAuthenticated: authStatus === 'AUTHENTICATED' && !!user,
        isLoading: authStatus === 'AUTH_INITIALIZING',
        sessionExpiredReason,
        clearSessionExpiredReason,
        login,
        verifyLoginOTP,
        resendLoginOTP,
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


