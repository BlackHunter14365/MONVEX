'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Clock, ArrowLeft, RefreshCw, ShieldCheck } from 'lucide-react';
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

type LoginStep = 'credentials' | 'otp';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason');
  const {
    login,
    verifyLoginOTP,
    resendLoginOTP,
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
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [isOtpVerifying, setIsOtpVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [sessionExpiresIn, setSessionExpiresIn] = useState(600);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

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

  // 60-second Resend Cooldown Timer
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (step === 'otp' && resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step, resendCooldown]);

  // 10-minute Session Expiry Countdown
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (step === 'otp' && sessionExpiresIn > 0) {
      timer = setInterval(() => {
        setSessionExpiresIn((prev) => {
          if (prev <= 1) {
            setErrorMsg('Verification session has expired. Please sign in again or request a new code.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step, sessionExpiresIn]);

  const formatExpiryTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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
        setVerificationId(res.verification_id || '');
        setMaskedEmail(res.email_masked || identifier);
        setResendCooldown(res.resend_after || 60);
        setSessionExpiresIn(res.expires_in || 600);
        setOtpDigits(['', '', '', '', '', '']);
        setAttemptsRemaining(null);
        setStep('otp');
        toast.success('Security code sent to your email.');
        setTimeout(() => otpInputsRef.current[0]?.focus(), 150);
        return;
      }

      // If OTP was not required (e.g. disabled in settings)
      if (res && res.access) {
        toast.success('Welcome back to MONVEX.');
        router.push('/dashboard');
      }
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

  // Stage 2: Submit 6-digit OTP
  const submitOtpVerification = async (code: string) => {
    if (code.length !== 6 || !verificationId) return;

    setIsOtpVerifying(true);
    setErrorMsg('');

    try {
      const res = await verifyLoginOTP({
        verification_id: verificationId,
        code,
      });

      if (res && res.success) {
        toast.success('Identity verified. Welcome back to MONVEX.');
        router.push('/dashboard');
      } else {
        setErrorMsg(res?.message || 'The code is incorrect. Please try again.');
        if (res?.attempts_remaining !== undefined) {
          setAttemptsRemaining(res.attempts_remaining);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed. Please check the code and try again.');
    } finally {
      setIsOtpVerifying(false);
    }
  };

  // OTP Input event handlers
  const handleDigitChange = (index: number, val: string) => {
    const cleanVal = val.replace(/\D/g, '');
    if (!cleanVal) {
      const newDigits = [...otpDigits];
      newDigits[index] = '';
      setOtpDigits(newDigits);
      return;
    }

    if (cleanVal.length > 1) {
      // Handle paste
      const pasted = cleanVal.slice(0, 6).split('');
      const newDigits = [...otpDigits];
      pasted.forEach((d, i) => {
        if (i < 6) newDigits[i] = d;
      });
      setOtpDigits(newDigits);
      const nextIndex = Math.min(5, pasted.length);
      otpInputsRef.current[nextIndex]?.focus();
      if (pasted.length === 6) {
        submitOtpVerification(pasted.join(''));
      }
      return;
    }

    const newDigits = [...otpDigits];
    newDigits[index] = cleanVal;
    setOtpDigits(newDigits);

    if (index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    } else if (index === 5) {
      const fullCode = newDigits.join('');
      if (fullCode.length === 6) {
        submitOtpVerification(fullCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  // Stage 2: Resend Code
  const handleResend = async () => {
    if (resendCooldown > 0 || isResending || !verificationId) return;

    setIsResending(true);
    setErrorMsg('');

    try {
      const res = await resendLoginOTP(verificationId);
      if (res && res.success) {
        setResendCooldown(res.resend_after || 60);
        setSessionExpiresIn(res.expires_in || 600);
        setOtpDigits(['', '', '', '', '', '']);
        setAttemptsRemaining(5);
        toast.success('A fresh verification code has been dispatched to your inbox.');
        otpInputsRef.current[0]?.focus();
      } else {
        setErrorMsg(res?.message || 'Failed to resend code.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to resend verification code right now.');
    } finally {
      setIsResending(false);
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
        <>
          <div className="flex items-center justify-between pb-1">
            <button
              type="button"
              onClick={() => {
                setStep('credentials');
                setErrorMsg('');
                setOtpDigits(['', '', '', '', '', '']);
              }}
              className="inline-flex items-center gap-1.5 text-xs text-[#898390] hover:text-[#191522] transition-colors p-1 -ml-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#191522]/30"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to sign in</span>
            </button>
            <div className="flex items-center gap-1 text-[11px] font-mono text-[#898390] bg-[#ECEAE3] px-2 py-0.5 rounded-md">
              <ShieldCheck className="h-3 w-3 text-[#2563EB]" />
              <span>2-STAGE AUTH</span>
            </div>
          </div>

          <AuthHeader
            title="Verify your identity."
            subtitle={
              maskedEmail
                ? `Enter the 6-digit passcode sent to ${maskedEmail}.`
                : 'Enter the 6-digit passcode sent to your verified email address.'
            }
          />

          {/* Error feedback */}
          {errorMsg && <AuthFeedback type="error" message={errorMsg} />}

          {/* Attempts remaining pill */}
          {attemptsRemaining !== null && attemptsRemaining < 5 && attemptsRemaining > 0 && (
            <div className="text-center text-xs font-medium text-amber-700 bg-amber-500/10 border border-amber-500/20 py-1.5 px-3 rounded-lg">
              {attemptsRemaining} attempt{attemptsRemaining > 1 ? 's' : ''} remaining before session lock.
            </div>
          )}

          {/* 6 Discrete OTP Input Boxes */}
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 sm:gap-2.5">
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    otpInputsRef.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  disabled={isOtpVerifying}
                  aria-label={`Digit ${idx + 1}`}
                  className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold font-mono rounded-xl bg-white border border-[#DDD9D0] focus:border-[#191522] focus:ring-2 focus:ring-[#191522]/10 outline-none transition-all shadow-2xs text-[#191522] disabled:opacity-50"
                />
              ))}
            </div>

            {/* Verification Button */}
            <button
              type="button"
              onClick={() => submitOtpVerification(otpDigits.join(''))}
              disabled={isOtpVerifying || otpDigits.join('').length !== 6}
              className="w-full min-h-[46px] flex items-center justify-center gap-2 rounded-lg bg-[#191522] hover:bg-[#2A1F3D] active:bg-[#120E1A] text-white text-sm font-medium transition-colors duration-150 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#191522]/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isOtpVerifying && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{isOtpVerifying ? 'Verifying Code...' : 'Authorize Sign In'}</span>
            </button>

            {/* Session Expiration & Resend Cooldown Controls */}
            <div className="pt-2 flex flex-col items-center gap-2.5 text-xs text-[#898390]">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-[#898390]" />
                <span>
                  Code expires in{' '}
                  <span className="font-mono font-medium text-[#191522]">
                    {formatExpiryTime(sessionExpiresIn)}
                  </span>
                </span>
              </div>

              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || isResending}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#191522] hover:text-[#2563EB] disabled:text-[#A09CA8] disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isResending ? 'animate-spin' : ''}`} />
                <span>
                  {resendCooldown > 0
                    ? `Resend code in ${resendCooldown}s`
                    : isResending
                    ? 'Sending...'
                    : 'Resend verification code'}
                </span>
              </button>
            </div>
          </div>
        </>
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
