'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Clock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  AuthShell,
  AuthHeader,
  AuthInput,
  PasswordField,
  GoogleSignInButton,
  AuthFeedback,
  AccountLinkDialog,
} from '@/components/auth';
import { api } from '@/lib/api';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason');
  const { login, loginWithGoogle, isAuthenticated, user, isLoading: authLoading, sessionExpiredReason } = useAuth();
  const toast = useToast();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Account Linking Dialog State
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkEmail, setLinkEmail] = useState('');
  const [pendingGoogleCredential, setPendingGoogleCredential] = useState('');

  useEffect(() => {
    if (!authLoading && isAuthenticated && user && api.getAccessToken()) {
      router.replace('/dashboard');
    }
  }, [authLoading, isAuthenticated, user, router]);

  if (authLoading || (isAuthenticated && user)) {
    return (
      <div className="min-h-[360px] flex flex-col items-center justify-center space-y-4 p-8">
        <div className="h-12 w-12 rounded-2xl bg-white p-2 border border-[#E4E2DC] shadow-xs flex items-center justify-center animate-pulse">
          <img src="/logo.png" alt="MONVEX" className="h-full w-full object-contain" />
        </div>
        <div className="text-xs font-medium text-[#898390]">Validating session...</div>
      </div>
    );
  }

  const isInactiveExpiry = reason === 'inactivity' || sessionExpiredReason === 'inactivity';

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

    try {
      const res = await loginWithGoogle(credential);

      if (res && res.code === 'ACCOUNT_LINKING_REQUIRED') {
        setLinkEmail(res.email || '');
        setPendingGoogleCredential(credential);
        setIsLinkDialogOpen(true);
        return;
      }

      if (res && res.access) {
        toast.success(res.is_new_user ? 'Welcome to MONVEX!' : 'Welcome back to MONVEX.');
        router.push('/dashboard');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to sign in with Google.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleError = (msg: string) => {
    setErrorMsg(msg);
  };

  return (
    <div className="space-y-6 w-full">
      {/* Human-focused header */}
      <AuthHeader
        title="Welcome back."
        subtitle="Sign in to continue to your financial workspace."
      />

      {/* Inactivity Expiry Notice */}
      {isInactiveExpiry && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 text-xs flex items-start gap-2.5">
          <Clock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block text-amber-950">Session Expired</span>
            Your session timed out after 7 days of inactivity. Please log in again to resume your workspace.
          </div>
        </div>
      )}

      {/* Accessible error feedback */}
      {errorMsg && <AuthFeedback type="error" message={errorMsg} />}

      {/* Primary Authentication Form */}
      <form onSubmit={handleLoginSubmit} className="space-y-4">
          <AuthInput
            label="Username or email"
            name="identifier"
            type="text"
            required
            autoComplete="username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="e.g. alex or alex@example.com"
            disabled={isLoading || isGoogleLoading}
          />

          <PasswordField
            label="Password"
            name="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your account password"
            disabled={isLoading || isGoogleLoading}
          />

          <button
            type="submit"
            disabled={isLoading || isGoogleLoading}
            className="w-full mt-2 min-h-[46px] flex items-center justify-center gap-2 rounded-lg bg-[#191522] hover:bg-[#2A1F3D] active:bg-[#120E1A] text-white text-sm font-medium transition-colors duration-150 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#191522]/30 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            <span>{isLoading ? 'Authenticating...' : 'Sign In'}</span>
          </button>
        </form>

        {/* SSO Divider */}
        <div className="relative flex items-center justify-center my-5 select-none" aria-hidden="true">
          <div className="border-t border-[#E4E2DC] w-full" />
          <span className="bg-[#F6F5F1] px-3.5 text-[10px] font-mono tracking-widest text-[#898390] uppercase relative">
            SSO ACCESS
          </span>
        </div>

        {/* Unique Floating Capsule Google Authentication */}
        <div className="flex flex-col items-center justify-center w-full">
          <GoogleSignInButton
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            isLoading={isGoogleLoading}
            disabled={isLoading}
            text="continue_with"
            shape="pill"
          />
          <span className="text-[10px] font-mono text-[#A09CA8] tracking-wider uppercase mt-2.5 select-none">
            One-Click Workspace Access
          </span>
        </div>

        {/* Registration navigation */}
        <div className="pt-2 text-center text-xs text-[#625D69]">
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="font-semibold text-[#191522] hover:text-[#2563EB] underline decoration-[#E4E2DC] hover:decoration-[#2563EB] underline-offset-4 transition-colors p-1"
          >
            Create one
          </Link>
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

export default function LoginPage() {
  return (
    <AuthShell>
      <Suspense
        fallback={
          <div className="min-h-[360px] flex flex-col items-center justify-center space-y-4 p-8">
            <div className="h-12 w-12 rounded-2xl bg-white p-2 border border-[#E4E2DC] shadow-xs flex items-center justify-center animate-pulse">
              <img src="/logo.png" alt="MONVEX" className="h-full w-full object-contain" />
            </div>
            <div className="text-xs font-medium text-[#898390]">Loading authentication...</div>
          </div>
        }
      >
        <LoginContent />
      </Suspense>
    </AuthShell>
  );
}
