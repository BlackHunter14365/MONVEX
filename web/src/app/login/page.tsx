'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Lock,
  User,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { AccountLinkDialog } from '@/components/auth/AccountLinkDialog';
import { api } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithGoogle, isAuthenticated, user, isLoading: authLoading } = useAuth();
  const toast = useToast();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Account Linking Dialog State
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkEmail, setLinkEmail] = useState('');
  const [pendingGoogleCredential, setPendingGoogleCredential] = useState('');

  useEffect(() => {
    if (!authLoading && isAuthenticated && user && api.getAccessToken()) {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, user, router]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      await login({
        identifier: identifier.trim(),
        password,
      });

      toast.success('Welcome back to MONVEX.');
      router.push('/dashboard');
    } catch (err: any) {
      if (err.message && err.message.includes('verify')) {
        setErrorMsg('Your account requires email verification before signing in.');
      } else {
        setErrorMsg(err.message || 'Invalid username/email or password.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credential: string) => {
    setIsGoogleLoading(true);
    setErrorMsg('');

    console.log('[MONVEX-GOOGLE] Credential received');
    console.log('[MONVEX-GOOGLE] Backend authentication started');

    try {
      const res = await loginWithGoogle(credential);

      if (res && res.code === 'ACCOUNT_LINKING_REQUIRED') {
        setLinkEmail(res.email || '');
        setPendingGoogleCredential(credential);
        setIsLinkDialogOpen(true);
        return;
      }

      if (res && res.access) {
        console.log('[MONVEX-GOOGLE] Backend authentication successful');
        toast.success(res.is_new_user ? 'Welcome to MONVEX!' : 'Welcome back to MONVEX.');
        router.push('/dashboard');
      }
    } catch (err: any) {
      console.error('[MONVEX-GOOGLE] Backend authentication failed:', err?.message || err);
      setErrorMsg(err.message || 'Unable to sign in with Google.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleError = (msg: string) => {
    setErrorMsg(msg);
  };

  return (
    <div className="min-h-screen bg-[#F6F5F1] text-[#172033] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12">
      {/* Brand Header */}
      <div className="text-center mb-8 space-y-3">
        <Link href="/" className="inline-flex flex-col items-center gap-3 group">
          <div className="relative h-16 w-16 rounded-2xl overflow-hidden shadow-xl ring-2 ring-white/80 transition-transform group-hover:scale-105">
            <img src="/logo.png" alt="MONVEX" className="h-full w-full object-cover" />
          </div>
          <span className="text-2xl font-black tracking-tight text-[#172033]">MONVEX</span>
        </Link>
        <p className="text-xs text-[#5F6878] font-medium">
          Sign in to access your personal financial intelligence workspace
        </p>
      </div>

      {/* Card Body */}
      <div className="w-full max-w-md editorial-card p-8 space-y-6">
        {errorMsg && (
          <div className="p-3.5 rounded-lg bg-[#FFF1F2] text-[#E11D48] text-xs border border-[#FECDD3] flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 text-[#E11D48] shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#5F6878] mb-1.5 block">
              Username or Email
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#858D9A]" />
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter username or email"
                className="w-full rounded-lg bg-[#F6F5F1] border border-[#E4E2DC] pl-10 pr-3.5 py-2.5 text-xs font-medium text-[#172033] placeholder:text-[#858D9A] focus:border-[#172033] focus:ring-2 focus:ring-[#172033]/15 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#5F6878] mb-1.5 block">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#858D9A]" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full rounded-lg bg-[#F6F5F1] border border-[#E4E2DC] pl-10 pr-10 py-2.5 text-xs font-medium text-[#172033] placeholder:text-[#858D9A] focus:border-[#172033] focus:ring-2 focus:ring-[#172033]/15 focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#858D9A] hover:text-[#172033]"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="w-full mt-2"
          >
            Sign In to Dashboard
          </Button>
        </form>

        {/* ─── OR ─── DIVIDER */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-[#E4E2DC] w-full" />
          <span className="bg-white px-3 text-[11px] font-bold text-[#858D9A] uppercase tracking-wider relative">
            Or
          </span>
        </div>

        {/* GOOGLE SIGN-IN BUTTON */}
        <div>
          <GoogleSignInButton
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            isLoading={isGoogleLoading}
            disabled={isLoading}
          />
        </div>

        <div className="pt-4 border-t border-[#E4E2DC] text-center text-xs text-[#5F6878]">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-bold text-[#2563EB] hover:underline">
            Register here
          </Link>
        </div>
      </div>

      {/* ACCOUNT LINKING MODAL */}
      <AccountLinkDialog
        isOpen={isLinkDialogOpen}
        onClose={() => setIsLinkDialogOpen(false)}
        email={linkEmail}
        credential={pendingGoogleCredential}
        onSuccess={() => {
          setIsLinkDialogOpen(false);
          router.push('/dashboard');
        }}
      />
    </div>
  );
}
