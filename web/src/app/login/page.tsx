'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
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

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithGoogle, isAuthenticated, user, isLoading: authLoading } = useAuth();
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
    <AuthShell>
      <div className="space-y-6 w-full">
        {/* Human-focused header */}
        <AuthHeader
          title="Welcome back."
          subtitle="Sign in to continue to your financial workspace."
        />

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

        {/* Quiet divider */}
        <div className="relative flex items-center justify-center my-4" aria-hidden="true">
          <div className="border-t border-[#E4E2DC] w-full" />
          <span className="bg-[#F6F5F1] px-3 text-[11px] font-medium text-[#898390] uppercase tracking-wider relative select-none">
            or
          </span>
        </div>

        {/* Refined Google Authentication Action */}
        <div>
          <GoogleSignInButton
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            isLoading={isGoogleLoading}
            disabled={isLoading}
            text="continue_with"
          />
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
    </AuthShell>
  );
}
