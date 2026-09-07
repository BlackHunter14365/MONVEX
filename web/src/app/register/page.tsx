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
  BrainCircuit,
  TrendingUp,
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
    <div className="min-h-screen bg-[#F6F5F1] text-[#191522] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-10">
      {/* Outer Double-Bezel Frame */}
      <div className="w-full max-w-4xl p-1.5 sm:p-2 rounded-[32px] bg-white border border-[#E2DFD7] shadow-xl">
        <div className="rounded-[26px] border border-[#ECE9E0] bg-[#FBFBFA] overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
          
          {/* LEFT COLUMN: INSTITUTIONAL BRANDING & TRUST ENGINE (5 COLS) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[#2A1F3D] to-[#1D152B] p-7 sm:p-9 text-white flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Brand Mark */}
            <div className="space-y-6 relative z-10">
              <Link href="/" className="inline-flex items-center gap-3 group">
                <div className="h-11 w-11 rounded-2xl overflow-hidden shadow-lg p-0.5 bg-white/10 ring-1 ring-white/20 transition-transform group-hover:scale-105">
                  <img src="/logo.png" alt="MONVEX" className="h-full w-full object-cover rounded-xl" />
                </div>
                <div>
                  <span className="text-xl font-black tracking-tight text-white block leading-tight">
                    MONVEX
                  </span>
                  <span className="text-[10.5px] font-mono tracking-wider text-slate-300 block uppercase">
                    Financial Intelligence
                  </span>
                </div>
              </Link>

              <div className="space-y-2 pt-2">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                  {step === 'register' ? 'Establish Your Account' : 'Security Verification'}
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                  {step === 'register'
                    ? 'Join the private wealth intelligence ecosystem. Unify your bank feeds, budgets, debts, and predictive runway.'
                    : 'We ensure bank-grade account protection through deterministic single-use session verification codes.'}
                </p>
              </div>

              {/* Three Institutional Pillars */}
              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <div className="h-7 w-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Verified Tenant Isolation</span>
                    <span className="text-[11px] text-slate-400">Strict database encryption prevents cross-account exposure.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-7 w-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    <BrainCircuit className="h-4 w-4 text-blue-400" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Zero-Hallucination Math</span>
                    <span className="text-[11px] text-slate-400">Deterministic engines verify every rupee across your balance sheet.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-7 w-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    <TrendingUp className="h-4 w-4 text-purple-400" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Autonomous Milestone Tracking</span>
                    <span className="text-[11px] text-slate-400">Forecast and accelerate retirement, savings, and debt payoff dates.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Security Footer */}
            <div className="pt-6 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400 relative z-10">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Zero-Trust Shield: Active
              </span>
              <span className="font-mono">v2.4 Core</span>
            </div>
          </div>

          {/* RIGHT COLUMN: REGISTRATION / OTP FORM (7 COLS) */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between bg-white overflow-y-auto">
            <div className="space-y-5 max-w-md mx-auto w-full">
              {/* Header */}
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-black text-[#191522] tracking-tight">
                  {step === 'register' ? 'Create Your Account' : 'Verify Email Address'}
                </h2>
                <p className="text-xs text-[#625D69] font-medium">
                  {step === 'register'
                    ? 'Fill out your profile details to configure your personal workspace'
                    : `Enter the 6-digit confirmation code dispatched to ${maskedEmail || email}`}
                </p>
              </div>

              {/* Status banner */}
              {statusMessage && uiState !== 'VERIFIED' && (
                <div
                  className={cn(
                    'p-3.5 rounded-xl text-xs border flex items-center gap-2.5',
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
                  <span className="leading-snug font-medium">{statusMessage}</span>
                </div>
              )}

              {step === 'register' ? (
                /* STEP 1: Registration Form */
                <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#191522] block">Username</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#898390]" />
                        <input
                          type="text"
                          required
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="alex"
                          className="w-full rounded-xl bg-[#F6F5F1] border border-[#E4E2DC] pl-10 pr-3 py-2.5 text-xs font-medium text-[#191522] placeholder:text-[#898390] focus:border-[#2563EB] focus:outline-none min-h-[44px]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#191522] block">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#898390]" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="alex@example.com"
                          className="w-full rounded-xl bg-[#F6F5F1] border border-[#E4E2DC] pl-10 pr-3 py-2.5 text-xs font-medium text-[#191522] placeholder:text-[#898390] focus:border-[#2563EB] focus:outline-none min-h-[44px]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#191522] block">
                      Mobile Phone <span className="text-[#898390] font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#898390]" />
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full rounded-xl bg-[#F6F5F1] border border-[#E4E2DC] pl-10 pr-3.5 py-2.5 text-xs font-medium text-[#191522] placeholder:text-[#898390] focus:border-[#2563EB] focus:outline-none min-h-[44px]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#191522] block">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#898390]" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          minLength={8}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Min 8 chars"
                          className="w-full rounded-xl bg-[#F6F5F1] border border-[#E4E2DC] pl-9 pr-8 py-2.5 text-xs font-medium text-[#191522] placeholder:text-[#898390] focus:border-[#2563EB] focus:outline-none min-h-[44px]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#898390] hover:text-[#191522]"
                        >
                          {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#191522] block">Confirm Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#898390]" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          minLength={8}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repeat password"
                          className="w-full rounded-xl bg-[#F6F5F1] border border-[#E4E2DC] pl-9 pr-3.5 py-2.5 text-xs font-medium text-[#191522] placeholder:text-[#898390] focus:border-[#2563EB] focus:outline-none min-h-[44px]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#191522] block">Base Currency</label>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full rounded-xl bg-[#F6F5F1] border border-[#E4E2DC] px-3 py-2.5 text-xs font-bold text-[#191522] focus:border-[#2563EB] focus:outline-none min-h-[44px]"
                      >
                        <option value="INR">INR (₹)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#191522] block">Monthly Inflow</label>
                      <input
                        type="number"
                        step="1000"
                        required
                        value={monthlyIncome}
                        onChange={(e) => setMonthlyIncome(e.target.value)}
                        className="w-full rounded-xl bg-[#F6F5F1] border border-[#E4E2DC] px-3 py-2.5 text-xs font-bold text-[#191522] focus:border-[#2563EB] focus:outline-none min-h-[44px]"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    isLoading={uiState === 'SENDING'}
                    className="w-full mt-3 font-bold min-h-[44px]"
                  >
                    Create Account & Continue
                  </Button>

                  {/* OR DIVIDER */}
                  <div className="relative flex items-center justify-center my-2">
                    <div className="border-t border-[#E4E2DC] w-full" />
                    <span className="bg-white px-3 text-[11px] font-bold text-[#898390] uppercase tracking-wider relative">
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
                <div className="space-y-6 py-2">
                  <div className="text-center space-y-2">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-[#059669] border border-emerald-200 shadow-xs mb-1">
                      <KeyRound className="h-6 w-6" />
                    </div>
                    <h3 className="text-base font-black text-[#191522]">Enter 6-Digit Code</h3>
                    <p className="text-xs text-[#625D69] leading-relaxed">
                      We sent a one-time verification code to
                      <br />
                      <strong className="text-[#191522] font-mono font-bold">{maskedEmail || email}</strong>
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
                            'h-13 w-11 text-center text-xl font-mono font-black rounded-2xl border bg-white focus:outline-none transition-all',
                            digit ? 'border-[#2A1F3D] text-[#191522] shadow-xs' : 'border-[#E4E2DC] text-[#625D69]',
                            uiState === 'INVALID_CODE' ? 'border-[#E11D48] text-[#E11D48] bg-rose-50/50' : ''
                          )}
                        />
                      ))}
                    </div>

                    {attemptsRemaining !== null && (
                      <div className="text-center text-[11px] text-[#E11D48] font-semibold">
                        {attemptsRemaining} attempt{attemptsRemaining === 1 ? '' : 's'} remaining
                      </div>
                    )}
                  </div>

                  {/* Expiration Timer */}
                  <div className="flex items-center justify-center gap-1.5 text-xs text-[#898390] font-mono">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Code expires in:</span>
                    <span className="font-bold text-[#191522]">{formatExpiryTime(sessionExpiresIn)}</span>
                  </div>

                  {/* Action Button */}
                  <Button
                    type="button"
                    onClick={() => submitOtpVerification(otpDigits.join(''))}
                    disabled={uiState === 'VERIFYING' || uiState === 'VERIFIED' || otpDigits.join('').length !== 6}
                    isLoading={uiState === 'VERIFYING'}
                    variant="primary"
                    size="lg"
                    className="w-full font-bold min-h-[44px]"
                  >
                    Verify Code & Access Dashboard
                  </Button>

                  {/* Resend Button */}
                  <div className="pt-2 text-center">
                    {resendCooldown > 0 ? (
                      <span className="text-xs text-[#898390]">
                        Resend code in <strong className="text-[#191522] font-mono">{resendCooldown}s</strong>
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
            </div>

            {/* Bottom Login Prompt */}
            <div className="pt-6 border-t border-[#E4E2DC] text-center text-xs text-[#625D69] max-w-md mx-auto w-full">
              Already have an account?{' '}
              <Link href="/login" className="font-bold text-[#2563EB] hover:underline">
                Sign in
              </Link>
            </div>
          </div>
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
