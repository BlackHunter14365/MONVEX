'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Mail,
  Lock,
  User,
  Phone,
  KeyRound,
  RefreshCw,
  AlertCircle,
  Eye,
  EyeOff,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { AccountLinkDialog } from '@/components/auth/AccountLinkDialog';

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

export default function RegisterPage() {
  const router = useRouter();
  const { refreshUser, loginWithGoogle, isAuthenticated, user, isLoading: authLoading } = useAuth();
  const toast = useToast();

  useEffect(() => {
    if (!authLoading && isAuthenticated && user && api.getAccessToken()) {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, user, router]);

  // Navigation Step: 'register' -> 'otp'
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
  const [showPassword, setShowPassword] = useState(false);

  // Verification Session State
  const [verificationId, setVerificationId] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);

  // Timers
  const [resendCooldown, setResendCooldown] = useState(60);
  const [sessionExpiresIn, setSessionExpiresIn] = useState(600); // 10 minutes
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
      const res = await api.checkVerification({
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
      const res = await api.resendVerification(verificationId);
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
          {step === 'register'
            ? 'Create your personal financial intelligence workspace'
            : 'Verify your email with single-use security code'}
        </p>
      </div>

      {/* Card Container */}
      <div className="w-full max-w-md editorial-card p-8 space-y-6">
        {/* Error / Alert Message Banner */}
        {statusMessage && uiState !== 'VERIFIED' && (
          <div
            className={cn(
              'p-3.5 rounded-lg text-xs border flex items-center gap-2.5',
              uiState === 'EXPIRED' || uiState === 'RATE_LIMITED'
                ? 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]'
                : 'bg-[#FFF1F2] text-[#E11D48] border-[#FECDD3]'
            )}
          >
            {uiState === 'EXPIRED' || uiState === 'RATE_LIMITED' ? (
              <ShieldAlert className="h-4 w-4 text-[#D97706] shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-[#E11D48] shrink-0" />
            )}
            <span className="leading-snug">{statusMessage}</span>
          </div>
        )}

        {step === 'register' ? (
          /* STEP 1: Registration Form */
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#5F6878] mb-1.5 block">Username</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#858D9A]" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username"
                  className="w-full rounded-lg bg-[#F6F5F1] border border-[#E4E2DC] pl-10 pr-3.5 py-2.5 text-xs font-medium text-[#172033] placeholder:text-[#858D9A] focus:border-[#172033] focus:ring-2 focus:ring-[#172033]/15 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#5F6878] mb-1.5 block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#858D9A]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-lg bg-[#F6F5F1] border border-[#E4E2DC] pl-10 pr-3.5 py-2.5 text-xs font-medium text-[#172033] placeholder:text-[#858D9A] focus:border-[#172033] focus:ring-2 focus:ring-[#172033]/15 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#5F6878] mb-1.5 block">
                Mobile Phone <span className="text-[#858D9A] font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#858D9A]" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full rounded-lg bg-[#F6F5F1] border border-[#E4E2DC] pl-10 pr-3.5 py-2.5 text-xs font-medium text-[#172033] placeholder:text-[#858D9A] focus:border-[#172033] focus:ring-2 focus:ring-[#172033]/15 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#5F6878] mb-1.5 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#858D9A]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 chars"
                    className="w-full rounded-lg bg-[#F6F5F1] border border-[#E4E2DC] pl-10 pr-8 py-2.5 text-xs font-medium text-[#172033] placeholder:text-[#858D9A] focus:border-[#172033] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#858D9A] hover:text-[#172033]"
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#5F6878] mb-1.5 block">Confirm</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#858D9A]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat"
                    className="w-full rounded-lg bg-[#F6F5F1] border border-[#E4E2DC] pl-10 pr-3.5 py-2.5 text-xs font-medium text-[#172033] placeholder:text-[#858D9A] focus:border-[#172033] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-xs font-semibold text-[#5F6878] mb-1.5 block">Primary Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full rounded-lg bg-[#F6F5F1] border border-[#E4E2DC] px-3 py-2.5 text-xs font-bold text-[#172033] focus:border-[#172033] focus:outline-none"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#5F6878] mb-1.5 block">Monthly Income</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                  className="w-full rounded-lg bg-[#F6F5F1] border border-[#E4E2DC] px-3 py-2.5 text-xs font-bold text-[#172033] focus:border-[#172033] focus:outline-none"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={uiState === 'SENDING'}
              className="w-full mt-2"
            >
              Create Account
            </Button>

            {/* ─── OR ─── DIVIDER */}
            <div className="relative flex items-center justify-center my-3">
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
                disabled={uiState === 'SENDING'}
                text="signup_with"
              />
            </div>
          </form>
        ) : (
          /* STEP 2: OTP Verification Screen */
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#DCFCE7] text-[#059669] mb-1">
                <KeyRound className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-[#172033]">Verify Your Email</h3>
              <p className="text-xs text-[#5F6878] leading-relaxed">
                We sent a 6-digit verification code to
                <br />
                <strong className="text-[#172033] font-bold">{maskedEmail || email}</strong>
              </p>
            </div>

            {/* 6 Digit Numeric Inputs */}
            <div className="space-y-2">
              <div className="flex justify-center gap-2 py-1">
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
                    className={cn(
                      'h-12 w-11 text-center text-lg font-bold rounded-xl border bg-white focus:outline-none transition-all',
                      digit ? 'border-[#172033] text-[#172033]' : 'border-[#E4E2DC] text-[#5F6878]',
                      uiState === 'INVALID_CODE' ? 'border-[#E11D48] text-[#E11D48]' : ''
                    )}
                  />
                ))}
              </div>

              {attemptsRemaining !== null && (
                <div className="text-center text-[11px] text-[#E11D48] font-medium">
                  {attemptsRemaining} attempt{attemptsRemaining === 1 ? '' : 's'} remaining
                </div>
              )}
            </div>

            {/* Expiration Timer Bar */}
            <div className="flex items-center justify-center gap-1.5 text-xs text-[#858D9A] font-mono">
              <Clock className="h-3.5 w-3.5" />
              <span>Code expires in:</span>
              <span className="font-bold text-[#172033]">{formatExpiryTime(sessionExpiresIn)}</span>
            </div>

            {/* Action Button */}
            <Button
              type="button"
              onClick={() => submitOtpVerification(otpDigits.join(''))}
              disabled={uiState === 'VERIFYING' || uiState === 'VERIFIED' || otpDigits.join('').length !== 6}
              isLoading={uiState === 'VERIFYING'}
              variant="primary"
              size="lg"
              className="w-full"
            >
              Verify Code & Continue
            </Button>

            {/* Resend Button */}
            <div className="pt-2 text-center">
              {resendCooldown > 0 ? (
                <span className="text-xs text-[#858D9A]">
                  Resend code in <strong className="text-[#172033]">{resendCooldown}s</strong>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending}
                  className="text-xs font-bold text-[#2563EB] hover:underline inline-flex items-center gap-1.5"
                >
                  <RefreshCw className={cn('h-3.5 w-3.5', isResending && 'animate-spin')} />
                  <span>Resend verification code</span>
                </button>
              )}
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-[#E4E2DC] text-center text-xs text-[#5F6878]">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-[#2563EB] hover:underline">
            Sign in
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
