'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { AuthShell, AuthHeader, AuthInput, AuthFeedback } from '@/components/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await api.sendVerification(cleanEmail);
      setIsSubmitted(true);
    } catch (err: any) {
      const msg = err?.message || '';
      if (
        msg.toLowerCase().includes('rate') ||
        msg.toLowerCase().includes('limit') ||
        msg.toLowerCase().includes('wait') ||
        msg.toLowerCase().includes('too many')
      ) {
        setErrorMessage(msg || 'Too many requests. Please wait a moment before trying again.');
      } else {
        // Avoid user enumeration
        setIsSubmitted(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell>
      <div className="space-y-6 w-full">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-xs font-medium text-[#625D69] hover:text-[#191522] transition-colors py-1"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to sign in</span>
        </Link>

        <AuthHeader
          title="Reset your password."
          subtitle="Enter your account email to receive security recovery instructions."
        />

        {errorMessage && <AuthFeedback type="error" message={errorMessage} />}

        {isSubmitted ? (
          <div className="space-y-5 py-2">
            <div className="p-4 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] space-y-2">
              <div className="flex items-center gap-2 font-medium text-xs">
                <CheckCircle2 className="h-4 w-4 text-[#16A34A] shrink-0" />
                <span>Recovery instructions dispatched</span>
              </div>
              <p className="text-xs text-[#166534]/90 leading-relaxed pl-6">
                If an account exists for <strong className="font-semibold">{email}</strong>, a reset link has been dispatched to your inbox.
              </p>
            </div>

            <Link
              href="/login"
              className="w-full min-h-[46px] flex items-center justify-center gap-2 rounded-lg bg-[#191522] hover:bg-[#2A1F3D] active:bg-[#120E1A] text-white text-sm font-medium transition-colors duration-150 shadow-2xs"
            >
              Return to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <AuthInput
              label="Email address"
              name="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@example.com"
              disabled={isLoading}
            />

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 min-h-[46px] flex items-center justify-center gap-2 rounded-lg bg-[#191522] hover:bg-[#2A1F3D] active:bg-[#120E1A] text-white text-sm font-medium transition-colors duration-150 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#191522]/30 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              <span>{isLoading ? 'Dispatching instructions...' : 'Send Recovery Instructions'}</span>
            </button>
          </form>
        )}
      </div>
    </AuthShell>
  );
}
