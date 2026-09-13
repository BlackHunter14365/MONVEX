'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
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

  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const [statusMessage, setStatusMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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
    setFieldErrors({});

    if (password !== confirmPassword) {
      const msg = 'Passwords do not match.';
      setStatusMessage(msg);
      setFieldErrors({ confirmPassword: msg });
      return;
    }

    if (password.length < 8) {
      const msg = 'Password must be at least 8 characters long.';
      setStatusMessage(msg);
      setFieldErrors({ password: msg });
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await api.register({
        username: username.trim(),
        email: email.trim(),
        password,
        phone_number: phoneNumber.trim() || undefined,
        currency,
        monthly_income: parseFloat(monthlyIncome) || 75000,
      });

      if (res.access) {
        toast.success('Registration successful. Welcome to MONVEX.');
        await refreshUser();
        router.push('/dashboard');
        return;
      }

      toast.success('Account created successfully! Please sign in.');
      router.push('/login');
    } catch (err: any) {
      // Extract field-level errors from DRF custom_exception_handler format
      const extracted: Record<string, string> = {};
      const rawDetails = err.data?.error?.details || err.data?.details;
      if (rawDetails && typeof rawDetails === 'object' && !Array.isArray(rawDetails)) {
        for (const [key, val] of Object.entries(rawDetails)) {
          const text = Array.isArray(val) ? val.join(' ') : String(val);
          extracted[key] = text;
        }
        setFieldErrors(extracted);
      }

      // If this was an account conflict (IntegrityError or duplicate check)
      if (err.data?.code === 'USER_ALREADY_EXISTS') {
        extracted['username'] = extracted['username'] || 'This username or email may already be in use.';
        extracted['email'] = extracted['email'] || 'This email or username may already be in use.';
        setFieldErrors(extracted);
      }

      setStatusMessage(err.message || 'Registration failed. Please review your credentials.');
    } finally {
      setIsSubmitting(false);
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
              onChange={(e) => {
                setUsername(e.target.value);
                if (fieldErrors.username) setFieldErrors(prev => ({ ...prev, username: '' }));
              }}
              error={fieldErrors.username}
              placeholder="e.g. alex"
              disabled={isSubmitting}
            />

            <AuthInput
              id="register-email"
              label="Email address"
              name="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: '' }));
              }}
              error={fieldErrors.email}
              placeholder="alex@example.com"
              disabled={isSubmitting}
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
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: '' }));
              }}
              error={fieldErrors.password}
              placeholder="Minimum 8 characters"
              disabled={isSubmitting}
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
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (fieldErrors.confirmPassword || fieldErrors.confirm_password) {
                  setFieldErrors(prev => ({ ...prev, confirmPassword: '', confirm_password: '' }));
                }
              }}
              error={fieldErrors.confirmPassword || fieldErrors.confirm_password}
              placeholder="Repeat password"
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <AuthSelect
              id="register-currency"
              label="Base currency"
              name="currency"
              value={currency}
              onChange={(e) => {
                setCurrency(e.target.value);
                if (fieldErrors.currency) setFieldErrors(prev => ({ ...prev, currency: '' }));
              }}
              error={fieldErrors.currency}
              options={CURRENCY_OPTIONS}
              disabled={isSubmitting}
            />

            <AuthInput
              id="register-monthly-income"
              label="Monthly inflow"
              name="monthlyIncome"
              type="number"
              step="1000"
              required
              value={monthlyIncome}
              onChange={(e) => {
                setMonthlyIncome(e.target.value);
                if (fieldErrors.monthly_income || fieldErrors.monthlyIncome) {
                  setFieldErrors(prev => ({ ...prev, monthly_income: '', monthlyIncome: '' }));
                }
              }}
              error={fieldErrors.monthly_income || fieldErrors.monthlyIncome}
              placeholder="75000"
              disabled={isSubmitting}
            />
          </div>

          <AuthInput
            id="register-phone-number"
            label="Phone number (optional)"
            name="phoneNumber"
            type="tel"
            autoComplete="tel"
            value={phoneNumber}
            onChange={(e) => {
              setPhoneNumber(e.target.value);
              if (fieldErrors.phone_number || fieldErrors.phoneNumber) {
                setFieldErrors(prev => ({ ...prev, phone_number: '', phoneNumber: '' }));
              }
            }}
            error={fieldErrors.phone_number || fieldErrors.phoneNumber}
            placeholder="+91 98765 43210"
            disabled={isSubmitting}
          />

          <button
            type="submit"
            disabled={isSubmitting || isGoogleLoading}
            className="w-full mt-2 min-h-[46px] flex items-center justify-center gap-2 rounded-lg bg-[#191522] hover:bg-[#2A1F3D] active:bg-[#120E1A] text-white text-sm font-medium transition-colors duration-150 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#191522]/30 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            <span>{isSubmitting ? 'Creating account...' : 'Create Account'}</span>
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
            disabled={isSubmitting}
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
