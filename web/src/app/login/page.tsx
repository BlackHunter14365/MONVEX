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
  ShieldCheck,
  Zap,
  TrendingUp,
  BrainCircuit,
  ArrowRight,
  CheckCircle2,
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
    <div className="min-h-screen bg-[#F6F5F1] text-[#191522] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-10">
      {/* Outer Double-Bezel Frame */}
      <div className="w-full max-w-4xl p-1.5 sm:p-2 rounded-[32px] bg-white border border-[#E2DFD7] shadow-xl">
        <div className="rounded-[26px] border border-[#ECE9E0] bg-[#FBFBFA] overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[560px]">
          
          {/* LEFT COLUMN: INSTITUTIONAL BRANDING & TRUST ENGINE (5 COLS) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[#2A1F3D] to-[#1D152B] p-7 sm:p-9 text-white flex flex-col justify-between relative overflow-hidden">
            {/* Background geometric accents */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Top Brand Mark */}
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
                  Autonomous Capital Intelligence
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                  Real-time double-entry ledger analysis, deterministic anomaly detection, and predictive cashflow runway modeling.
                </p>
              </div>

              {/* Three Institutional Pillars */}
              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <div className="h-7 w-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">256-Bit Ledger Encryption</span>
                    <span className="text-[11px] text-slate-400">Zero-knowledge tenant isolation & tamper-evident audit trails.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-7 w-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    <BrainCircuit className="h-4 w-4 text-blue-400" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Deterministic Mathematical Reasoner</span>
                    <span className="text-[11px] text-slate-400">Zero-hallucination cashflow & What-If scenario simulations.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-7 w-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    <TrendingUp className="h-4 w-4 text-purple-400" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Milestone Acceleration Engine</span>
                    <span className="text-[11px] text-slate-400">Live burn velocity optimization and compounding SIP forecasts.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Security Footer */}
            <div className="pt-6 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400 relative z-10">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Ledger API: Operational (99.99%)
              </span>
              <span className="font-mono">v2.4 Core</span>
            </div>
          </div>

          {/* RIGHT COLUMN: AUTHENTICATION FORM (7 COLS) */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between bg-white">
            <div className="space-y-6 max-w-md mx-auto w-full">
              {/* Header */}
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-black text-[#191522] tracking-tight">
                  Sign In to Workspace
                </h2>
                <p className="text-xs text-[#625D69] font-medium">
                  Enter your credentials or use Google Single Sign-On to continue
                </p>
              </div>

              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-[#FFF1F2] text-[#E11D48] text-xs border border-[#FECDD3] flex items-center gap-2.5">
                  <AlertCircle className="h-4 w-4 text-[#E11D48] shrink-0" />
                  <span className="font-medium">{errorMsg}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#191522] block">
                    Username or Registered Email
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#898390]" />
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="e.g. alex or alex@example.com"
                      className="w-full rounded-xl bg-[#F6F5F1] border border-[#E4E2DC] pl-10 pr-3.5 py-3 text-xs font-medium text-[#191522] placeholder:text-[#898390] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 focus:outline-none transition-all min-h-[44px]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#191522] block">
                      Account Password
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-[11px] font-bold text-[#2563EB] hover:underline"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#898390]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your security password"
                      className="w-full rounded-xl bg-[#F6F5F1] border border-[#E4E2DC] pl-10 pr-11 py-3 text-xs font-medium text-[#191522] placeholder:text-[#898390] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 focus:outline-none transition-all min-h-[44px]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#898390] hover:text-[#191522] p-1"
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
                  className="w-full mt-2 font-bold min-h-[44px] shadow-sm"
                >
                  Sign In to Dashboard
                </Button>
              </form>

              {/* OR DIVIDER */}
              <div className="relative flex items-center justify-center pt-1">
                <div className="border-t border-[#E4E2DC] w-full" />
                <span className="bg-white px-3 text-[11px] font-bold text-[#898390] uppercase tracking-wider relative">
                  Or Connect With
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
            </div>

            {/* Bottom Register Prompt */}
            <div className="pt-6 border-t border-[#E4E2DC] text-center text-xs text-[#625D69] max-w-md mx-auto w-full">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="font-bold text-[#2563EB] hover:underline">
                Create New Account
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
