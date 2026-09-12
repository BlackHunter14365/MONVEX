'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { authVerificationStorage } from '@/lib/authVerificationStorage';
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
  OtpVerificationView,
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
  const [resendCooldown, setResendCooldown] = useState(60);
  const [sessionExpiresIn, setSessionExpiresIn] = useState(600);
  const [statusMessage, setStatusMessage] = useState('');

  // Restore active registration verification session on refresh or revisit
  useEffect(() => {
    const activeSession = authVerificationStorage.getSession();
    if (activeSession && activeSession.verification_id && activeSession.expires_at > Date.now()) {
      setVerificationId(activeSession.verification_id);
      setMaskedEmail(activeSession.masked_email);
      setResendCooldown(authVerificationStorage.getResendCooldownSeconds(activeSession));
      setSessionExpiresIn(authVerificationStorage.getRemainingSeconds(activeSession));
      setStep('otp');
    }
  }, []);

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
        const vid = res.verification_id;
        const emailM = res.email_masked || email;
        const expIn = res.expires_in || 600;
        const resAfter = res.resend_after || 60;

        authVerificationStorage.saveSession({
          verification_id: vid,
          masked_email: emailM,
          purpose: 'REGISTRATION',
          expires_in: expIn,
          resend_after: resAfter,
        });

        setVerificationId(vid);
        setMaskedEmail(emailM);
        setSessionExpiresIn(expIn);
        setResendCooldown(resAfter);
        setStep('otp');
        setUiState('CODE_SENT');
        toast.success('Account created. Enter the 6-digit code sent to your email.');
        return;
      } else {
        toast.success('Account created successfully! Please sign in.');
        router.push('/login');
      }
    } catch (err: any) {
      if (err.data?.verification_id) {
        const vid = err.data.verification_id;
        const emailM = err.data.email_masked || email;
        const expIn = err.data.expires_in || 600;
        const resAfter = err.data.resend_after || 60;

        authVerificationStorage.saveSession({
          verification_id: vid,
          masked_email: emailM,
          purpose: 'REGISTRATION',
          expires_in: expIn,
          resend_after: resAfter,
        });

        setVerificationId(vid);
        setMaskedEmail(emailM);
        setSessionExpiresIn(expIn);
        setResendCooldown(resAfter);
        setStep('otp');
        setUiState('CODE_SENT');
        toast.success('Verification code dispatched to your email.');
        return;
      }

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
                  id="register-username"
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
                  id="register-email"
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
                  id="register-password"
                  label="Password"
                  name="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  showForgotPassword={false}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  disabled={uiState === 'SENDING'}
                />

                <PasswordField
                  id="register-confirm-password"
                  label="Confirm password"
                  name="confirmPassword"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  showForgotPassword={false}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  disabled={uiState === 'SENDING'}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <AuthSelect
                  id="register-currency"
                  label="Base currency"
                  name="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  options={CURRENCY_OPTIONS}
                  disabled={uiState === 'SENDING'}
                />

                <AuthInput
                  id="register-monthly-income"
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
                id="register-phone-number"
                label="Phone number (optional)"
                name="phoneNumber"
                type="tel"
                autoComplete="tel"
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
          <OtpVerificationView
            purpose="REGISTRATION"
            verificationId={verificationId}
            maskedEmail={maskedEmail || email}
            initialExpiresIn={sessionExpiresIn}
            initialResendAfter={resendCooldown}
            onSuccess={async () => {
              await refreshUser();
              router.replace('/dashboard');
            }}
            onBack={() => {
              authVerificationStorage.clearSession();
              setStep('register');
              setStatusMessage('');
            }}
          />
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
