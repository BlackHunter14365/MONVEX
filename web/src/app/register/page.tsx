'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Clock, RefreshCw, ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  AuthShell,
  AuthHeader,
  AuthInput,
  AuthSelect,
  PasswordField,
  GoogleSignInButton,
  AuthFeedback,
  AccountLinkDialog,
} from '@/components/auth';

type UIState =
  | 'IDLE'
  | 'SENDING'
  | 'CODE_SENT'
  | 'VERIFYING'
  | 'VERIFIED'
  | 'INVALID_CODE'
  | 'EXPIRED'
  | 'RATE_LIMITED'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR'
  | 'ALREADY_VERIFIED';

const CURRENCY_OPTIONS = [
  { value: 'INR', label: 'INR (₹) - Indian Rupee' },
  { value: 'USD', label: 'USD ($) - US Dollar' },
  { value: 'EUR', label: 'EUR (€) - Euro' },
  { value: 'GBP', label: 'GBP (£) - British Pound' },
  { value: 'AED', label: 'AED (د.إ) - UAE Dirham' },
  { value: 'CAD', label: 'CAD ($) - Canadian Dollar' },
  { value: 'AUD', label: 'AUD ($) - Australian Dollar' },
  { value: 'JPY', label: 'JPY (¥) - Japanese Yen' },
  { value: 'SGD', label: 'SGD ($) - Singapore Dollar' },
];

export default function RegisterPage() {
  const router = useRouter();
  const { refreshUser, loginWithGoogle, isAuthenticated, user, isLoading: authLoading } = useAuth();
  const toast = useToast();

  useEffect(() => {
    if (!authLoading && isAuthenticated && user && api.getAccessToken()) {
      router.replace('/dashboard');
    }
  }, [authLoading, isAuthenticated, user, router]);

  if (authLoading || (isAuthenticated && user)) {
    return (
      <div className="min-h-screen bg-[#F6F5F1] flex flex-col items-center justify-center p-6 space-y-4">
        <div className="h-12 w-12 rounded-2xl bg-white p-2 border border-[#E4E2DC] shadow-xs flex items-center justify-center animate-pulse">
          <img src="/logo.png" alt="MONVEX" className="h-full w-full object-contain" />
        </div>
        <div className="text-xs font-medium text-[#898390]">Validating session...</div>
      </div>
    );
  }

  // Step state: 'register' -> 'otp'
  const [step, setStep] = useState<'register' | 'otp'>('register');
  const [uiState, setUiState] = useState<UIState>('IDLE');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Account Linking State
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkEmail, setLinkEmail] = useState('');
  const [pendingGoogleCredential, setPendingGoogleCredential] = useState('');

  // Form Fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [monthlyIncome, setMonthlyIncome] = useState('75000');

  // Verification Session State
  const [verificationId, setVerificationId] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);

  // Timers
  const [resendCooldown, setResendCooldown] = useState(60);
  const [sessionExpiresIn, setSessionExpiresIn] = useState(600);
  const [isResending, setIsResending] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // 60-second Resend Cooldown Countdown
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

  // 10-minute Session Expiration Countdown
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (step === 'otp' && sessionExpiresIn > 0) {
      timer = setInterval(() => {
        setSessionExpiresIn((prev) => {
          if (prev <= 1) {
            setUiState('EXPIRED');
            setStatusMessage('Verification code has expired. Please request a new code.');
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

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage('');

    if (password !== confirmPassword) {
      setStatusMessage('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setStatusMessage('Password must be at least 8 characters long.');
      return;
    }

    setUiState('SENDING');

    try {
      const res = await api.register({
        username: username.trim(),
        email: email.trim(),
        password,
        phone_number: phoneNumber.trim() || undefined,
        currency,
        monthly_income: parseFloat(monthlyIncome) || 75000,
      });

      if (res.access && !res.verification_id) {
        toast.success('Registration successful. Welcome to MONVEX.');
        await refreshUser();
        router.push('/dashboard');
        return;
      }

      if (res.verification_id) {
        setVerificationId(res.verification_id);
        setMaskedEmail(res.email_masked || email);
        setResendCooldown(res.resend_after || 60);
        setSessionExpiresIn(res.expires_in || 600);
        setStep('otp');
        setUiState('CODE_SENT');
        toast.success('Account created. Enter the 6-digit code sent to your email.');
        setTimeout(() => otpInputsRef.current[0]?.focus(), 100);
      } else {
        toast.success('Account created successfully! Please sign in.');
        router.push('/login');
      }
    } catch (err: any) {
      setUiState('SERVER_ERROR');
      setStatusMessage(err.message || 'Registration failed. Please review your credentials.');
    }
  };

  const handleGoogleSuccess = async (credential: string) => {
    setIsGoogleLoading(true);
    setStatusMessage('');

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
      setStatusMessage(err.message || 'Google registration could not be completed.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleError = (msg: string) => {
    setStatusMessage(msg);
  };

  const handleDigitChange = (index: number, val: string) => {
    const cleanVal = val.replace(/\D/g, '');
    if (!cleanVal) {
      const newDigits = [...otpDigits];
      newDigits[index] = '';
      setOtpDigits(newDigits);
      return;
    }

    if (cleanVal.length > 1) {
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

  const submitOtpVerification = async (code: string) => {
    if (code.length !== 6 || !verificationId) return;

    setUiState('VERIFYING');
    setStatusMessage('');

    try {
      const res = await api.verifyRegisterOTP({
        verification_id: verificationId,
        code,
      });

      if (res.success) {
        setUiState('VERIFIED');
        toast.success('Account successfully verified! Redirecting to dashboard...');
        await refreshUser();
        setTimeout(() => router.push('/dashboard'), 1000);
      } else {
        setUiState('INVALID_CODE');
        setStatusMessage(res.message || 'Invalid verification code.');
        setAttemptsRemaining(res.attempts_remaining ?? null);
      }
    } catch (err: any) {
      setUiState('SERVER_ERROR');
      setStatusMessage(err.message || 'Verification failed. Please try again.');
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending || !verificationId) return;

    setIsResending(true);
    setStatusMessage('');

    try {
      const res = await api.resendRegisterOTP(verificationId);
      if (res.success) {
        setResendCooldown(res.resend_after || 60);
        setSessionExpiresIn(600);
        setOtpDigits(['', '', '', '', '', '']);
        setAttemptsRemaining(5);
        setUiState('CODE_SENT');
        toast.success('A new verification code has been sent. Check your inbox.');
        otpInputsRef.current[0]?.focus();
      } else {
        setStatusMessage(res.message || 'Failed to resend code.');
      }
    } catch (err: any) {
      setStatusMessage(err.message || 'Unable to resend verification code.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthShell>
      <div className="space-y-6 w-full">
        {step === 'register' ? (
          /* =========================================================================
             STEP 1: ACCOUNT REGISTRATION
             ========================================================================= */
          <>
            <AuthHeader
              title="Create your account."
              subtitle="Set up your workspace credentials and financial defaults."
            />

            {statusMessage && <AuthFeedback type="error" message={statusMessage} />}

            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <AuthInput
                  label="Username"
                  name="username"
                  type="text"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. alex"
                  disabled={uiState === 'SENDING'}
                />

                <AuthInput
                  label="Email address"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@example.com"
                  disabled={uiState === 'SENDING'}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <PasswordField
                  label="Password"
                  name="password"
                  required
                  minLength={8}
                  showForgotPassword={false}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  disabled={uiState === 'SENDING'}
                />

                <PasswordField
                  label="Confirm password"
                  name="confirmPassword"
                  required
                  minLength={8}
                  showForgotPassword={false}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  disabled={uiState === 'SENDING'}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <AuthSelect
                  label="Base currency"
                  name="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  options={CURRENCY_OPTIONS}
                  disabled={uiState === 'SENDING'}
                />

                <AuthInput
                  label="Monthly inflow"
                  name="monthlyIncome"
                  type="number"
                  step="1000"
                  required
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                  placeholder="75000"
                  disabled={uiState === 'SENDING'}
                />
              </div>

              <AuthInput
                label="Phone number (optional)"
                name="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+91 98765 43210"
                disabled={uiState === 'SENDING'}
              />

              <button
                type="submit"
                disabled={uiState === 'SENDING' || isGoogleLoading}
                className="w-full mt-2 min-h-[46px] flex items-center justify-center gap-2 rounded-lg bg-[#191522] hover:bg-[#2A1F3D] active:bg-[#120E1A] text-white text-sm font-medium transition-colors duration-150 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#191522]/30 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {uiState === 'SENDING' && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                <span>{uiState === 'SENDING' ? 'Configuring workspace...' : 'Create Account'}</span>
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
                disabled={uiState === 'SENDING'}
                text="signup_with"
                shape="pill"
              />
              <span className="text-[10px] font-mono text-[#A09CA8] tracking-wider uppercase mt-2.5 select-none">
                One-Click Workspace Registration
              </span>
            </div>

            <div className="pt-2 text-center text-xs text-[#625D69]">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-semibold text-[#191522] hover:text-[#2563EB] underline decoration-[#E4E2DC] hover:decoration-[#2563EB] underline-offset-4 transition-colors p-1"
              >
                Sign in
              </Link>
            </div>
          </>
        ) : (
          /* =========================================================================
             STEP 2: EMAIL / OTP VERIFICATION
             ========================================================================= */
          <div className="space-y-6">
            <button
              type="button"
              onClick={() => setStep('register')}
              className="inline-flex items-center gap-2 text-xs font-medium text-[#625D69] hover:text-[#191522] transition-colors py-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to registration</span>
            </button>

            <AuthHeader
              title="Verify your email."
              subtitle={`We dispatched a 6-digit confirmation code to ${maskedEmail || email}.`}
            />

            {statusMessage && (
              <AuthFeedback
                type={uiState === 'EXPIRED' ? 'info' : 'error'}
                message={statusMessage}
              />
            )}

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <div className="flex justify-center gap-2 sm:gap-3 py-2">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        otpInputsRef.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      disabled={uiState === 'VERIFYING' || uiState === 'VERIFIED'}
                      className={`h-12 w-11 sm:h-13 sm:w-12 text-center text-xl font-mono font-medium rounded-lg border bg-white focus:outline-none transition-colors duration-150 ${
                        uiState === 'INVALID_CODE'
                          ? 'border-[#E11D48] text-[#E11D48] bg-[#FFF1F2]'
                          : digit
                          ? 'border-[#191522] text-[#191522] shadow-2xs'
                          : 'border-[#E4E2DC] text-[#625D69] hover:border-[#D6D4CD] focus:border-[#191522] focus:ring-1 focus:ring-[#191522]'
                      }`}
                    />
                  ))}
                </div>

                {attemptsRemaining !== null && (
                  <div className="text-center text-[11px] text-[#E11D48] font-medium">
                    {attemptsRemaining} attempt{attemptsRemaining === 1 ? '' : 's'} remaining
                  </div>
                )}
              </div>

              {/* Expiration Timer */}
              <div className="flex items-center justify-center gap-2 text-xs text-[#898390]">
                <Clock className="h-3.5 w-3.5 text-[#898390]" />
                <span>Code expires in:</span>
                <span className="font-mono font-medium text-[#191522]">
                  {formatExpiryTime(sessionExpiresIn)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => submitOtpVerification(otpDigits.join(''))}
                disabled={
                  uiState === 'VERIFYING' ||
                  uiState === 'VERIFIED' ||
                  otpDigits.join('').length !== 6
                }
                className="w-full min-h-[46px] flex items-center justify-center gap-2 rounded-lg bg-[#191522] hover:bg-[#2A1F3D] active:bg-[#120E1A] text-white text-sm font-medium transition-colors duration-150 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#191522]/30 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {uiState === 'VERIFYING' && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                <span>{uiState === 'VERIFYING' ? 'Verifying...' : 'Verify Code & Access Workspace'}</span>
              </button>

              {/* Resend Action */}
              <div className="pt-2 text-center">
                {resendCooldown > 0 ? (
                  <span className="text-xs text-[#898390]">
                    Resend code in <strong className="font-mono text-[#191522]">{resendCooldown}s</strong>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isResending}
                    className="text-xs font-medium text-[#2563EB] hover:text-[#1D4ED8] hover:underline inline-flex items-center gap-1.5 py-1 focus-visible:outline-none"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isResending ? 'animate-spin' : ''}`} />
                    <span>Resend verification code</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
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
