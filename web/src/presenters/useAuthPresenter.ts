"use client";

/**
 * [P] PRESENTER: Authentication Feature ViewModel
 * Encapsulates Login, Registration, OTP verification, and Google OAuth.
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { LoginPayload, RegisterPayload } from '@/models';

export interface AuthPresenterState {
  isLoading: boolean;
  error: string | null;
  requiresOtp: boolean;
  otpSessionId: string | null;
  otpCooldownSeconds: number;
}

export function useAuthPresenter() {
  const { login, register, loginWithGoogle } = useAuth();
  const [state, setState] = useState<AuthPresenterState>({
    isLoading: false,
    error: null,
    requiresOtp: false,
    otpSessionId: null,
    otpCooldownSeconds: 0,
  });

  const performLogin = useCallback(async (payload: LoginPayload) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      await login({
        username: payload.username || payload.email || '',
        password: payload.password || '',
      });
      setState(prev => ({ ...prev, isLoading: false }));
      return { success: true };
    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false, error: err?.message || 'Login failed' }));
      return { success: false, error: err?.message || 'Login failed' };
    }
  }, [login]);

  const performRegister = useCallback(async (payload: RegisterPayload) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      await register({
        username: payload.username,
        email: payload.email,
        password: payload.password || '',
        first_name: payload.first_name,
        last_name: payload.last_name,
      });
      setState(prev => ({ ...prev, isLoading: false }));
      return { success: true };
    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false, error: err?.message || 'Registration failed' }));
      return { success: false, error: err?.message || 'Registration failed' };
    }
  }, [register]);

  const performGoogleAuth = useCallback(async (credential: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      await loginWithGoogle(credential);
      setState(prev => ({ ...prev, isLoading: false }));
      return { success: true };
    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false, error: err?.message || 'Google authentication failed' }));
      return { success: false, error: err?.message || 'Google authentication failed' };
    }
  }, [loginWithGoogle]);

  return {
    state,
    actions: {
      login: performLogin,
      register: performRegister,
      loginWithGoogle: performGoogleAuth,
      clearError: () => setState(prev => ({ ...prev, error: null })),
    },
  };
}
