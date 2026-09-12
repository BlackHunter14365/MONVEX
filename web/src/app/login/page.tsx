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
  OtpVerificationView,
} from '@/components/auth';
import { api } from '@/lib/api';
import { authVerificationStorage } from '@/lib/authVerificationStorage';

type LoginStep = 'credentials' | 'otp';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason');
  const {
    login,
    refreshUser,
    loginWithGoogle,
    isAuthenticated,
    user,
    isLoading: authLoading,
    sessionExpiredReason,
  } = useAuth();
  const toast = useToast();

  // Stage 1 Fields
  const [step, setStep] = useState<LoginStep>('credentials');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Stage 2 (OTP) Fields
  const [verificationId, setVerificationId] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [verificationPurpose, setVerificationPurpose] = useState<'LOGIN' | 'REGISTRATION'>('LOGIN');
  const [resendCooldown, setResendCooldown] = useState(60);
  const [sessionExpiresIn, setSessionExpiresIn] = useState(600);

  // Account Linking Dialog State
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkEmail, setLinkEmail] = useState('');
  const [pendingGoogleCredential, setPendingGoogleCredential] = useState('');

  // Auto-redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated && user && api.getAccessToken()) {
      router.replace('/dashboard');
    }
  }, [authLoading, isAuthenticated, user, router]);

  // Restore active verification session on refresh or revisit
  useEffect(() => {
    const activeSession = authVerificationStorage.getSession();
    if (activeSession && activeSession.verification_id && activeSession.expires_at > Date.now()) {
      setVerificationId(activeSession.verification_id);
      setMaskedEmail(activeSession.masked_email);
      setVerificationPurpose(activeSession.purpose || 'LOGIN');
      setResendCooldown(authVerificationStorage.getResendCooldownSeconds(activeSession));
      setSessionExpiresIn(authVerificationStorage.getRemainingSeconds(activeSession));
      setStep('otp');
    }
  }, []);

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

  // Stage 1: Submit Credentials
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await login({
        identifier: identifier.trim(),
        password,
      });

      if (res && res.requires_otp) {
        const vid = res.verification_id || '';
        const emailM = res.email_masked || identifier;
        const purp = (res.verification_purpose as 'LOGIN' | 'REGISTRATION') || 'LOGIN';
        const expIn = res.expires_in || 600;
        const resAfter = res.resend_after || 60;

        authVerificationStorage.saveSession({
          verification_id: vid,
          masked_email: emailM,
          purpose: purp,
          expires_in: expIn,
          resend_after: resAfter,
        });

        setVerificationId(vid);
        setMaskedEmail(emailM);
        setVerificationPurpose(purp);
        setResendCooldown(resAfter);
        setSessionExpiresIn(expIn);
        setStep('otp');
        toast.success(
          purp === 'REGISTRATION'
            ? 'Account verification code sent to your email.'
            : 'Security code sent to your email.'
        );
        return;
      }

      // If OTP was not required (e.g. disabled in settings)
      if (res && res.access) {
        toast.success('Welcome back to MONVEX.');
        router.push('/dashboard');
      }
    } catch (err: any) {
      if (err.data?.requires_otp || err.data?.verification_id) {
        const vid = err.data.verification_id;
        const emailM = err.data.email_masked || identifier;
        const purp = (err.data.verification_purpose as 'LOGIN' | 'REGISTRATION') || 'REGISTRATION';
        const expIn = err.data.expires_in || 600;
        const resAfter = err.data.resend_after || 60;

        authVerificationStorage.saveSession({
          verification_id: vid,
          masked_email: emailM,
          purpose: purp,
          expires_in: expIn,
          resend_after: resAfter,
        });

        setVerificationId(vid);
        setMaskedEmail(emailM);
        setVerificationPurpose(purp);
        setResendCooldown(resAfter);
        setSessionExpiresIn(expIn);
        setStep('otp');
        toast.success('Verification code sent to your email.');
        return;
      }

      setErrorMsg(err.message || 'Invalid username/email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  // Google SSO
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
      {step === 'credentials' ? (
        /* =========================================================================
           STAGE 1: CREDENTIALS (USERNAME / EMAIL + PASSWORD)
           ========================================================================= */
        <>
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

          {/* Error feedback */}
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

          {/* Google Sign In */}
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
        </>
      ) : (
        /* =========================================================================
           STAGE 2: TWO-FACTOR EMAIL OTP VERIFICATION
           ========================================================================= */
        <OtpVerificationView
          purpose={verificationPurpose}
          verificationId={verificationId}
          maskedEmail={maskedEmail}
          initialExpiresIn={sessionExpiresIn}
          initialResendAfter={resendCooldown}
          onSuccess={async () => {
            await refreshUser();
            router.replace('/dashboard');
          }}
          onBack={() => {
            authVerificationStorage.clearSession();
            setStep('credentials');
            setErrorMsg('');
          }}
        />
      )}

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
