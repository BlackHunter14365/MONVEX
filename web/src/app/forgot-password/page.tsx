'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, Mail, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    // Simulate secure reset token dispatch
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md rounded-2xl glass-panel p-8 border border-surface-border shadow-2xl bg-surface-100/90">
        <div className="text-center mb-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-400 p-[1px] shadow-neon-indigo mb-3">
            <div className="flex h-full w-full items-center justify-center rounded-[15px] bg-background">
              <span className="text-2xl font-black text-white">M</span>
            </div>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">Reset Password</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Enter your account email to receive recovery instructions
          </p>
        </div>

        {isSubmitted ? (
          <div className="space-y-4 text-center animate-in fade-in">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">Recovery Link Dispatched</h3>
              <p className="text-xs text-zinc-400">
                If an account exists for <span className="text-brand-300 font-semibold">{email}</span>, a password reset link has been sent.
              </p>
            </div>
            <Link
              href="/login"
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-2.5 text-xs font-semibold text-white hover:bg-brand-500 transition-all shadow-neon-indigo w-full"
            >
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Account Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl bg-surface-200 border border-surface-border pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-xs font-semibold text-white hover:bg-brand-500 transition-all shadow-neon-indigo"
            >
              {isLoading ? (
                'Sending Link...'
              ) : (
                <>
                  Send Recovery Link
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Sign In</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
