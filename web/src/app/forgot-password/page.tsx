'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, Mail, AlertCircle, CheckCircle2, ArrowLeft, ShieldCheck, KeyRound } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';

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
    <div className="min-h-screen bg-[#F6F5F1] text-[#191522] flex flex-col justify-center items-center px-3.5 sm:px-6 lg:px-8 py-6 sm:py-10">
      {/* Brand Header */}
      <div className="text-center mb-6 sm:mb-8 space-y-2.5">
        <Link href="/" className="inline-flex flex-col items-center gap-2 group">
          <div className="h-12 sm:h-14 w-12 sm:w-14 rounded-2xl overflow-hidden shadow-lg p-0.5 bg-white ring-1 ring-[#E2DFD7] transition-transform group-hover:scale-105">
            <img src="/logo.png" alt="MONVEX" className="h-full w-full object-cover rounded-xl" />
          </div>
          <span className="text-xl sm:text-2xl font-black tracking-tight text-[#191522]">MONVEX</span>
        </Link>
        <p className="text-xs text-[#625D69] font-medium">
          Deterministic Security & Account Recovery
        </p>
      </div>

      {/* Outer Double-Bezel Frame */}
      <div className="w-full max-w-md p-1 sm:p-2 rounded-2xl sm:rounded-[32px] bg-white border border-[#E2DFD7] shadow-xl">
        <div className="p-5 sm:p-8 rounded-xl sm:rounded-[24px] border border-[#ECE9E0] bg-[#FBFBFA] space-y-5 sm:space-y-6">
          <div className="space-y-1 text-center">
            <div className="h-10 w-10 mx-auto rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#2563EB] mb-2">
              <KeyRound className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-black text-[#191522] tracking-tight">Reset Password</h2>
            <p className="text-xs text-[#625D69] font-medium">
              Enter your account email to receive cryptographic recovery instructions
            </p>
          </div>

          {isSubmitted ? (
            <div className="space-y-4 text-center py-2 animate-in fade-in">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-[#059669] border border-emerald-200">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-[#191522]">Recovery Dispatch Sent</h3>
                <p className="text-xs text-[#625D69] leading-relaxed">
                  If an account is associated with <strong className="text-[#191522] font-bold">{email}</strong>, verification instructions have been dispatched.
                </p>
              </div>
              <Link
                href="/login"
                className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl bg-[#2A1F3D] px-6 py-3.5 text-xs font-bold text-white hover:bg-[#3B2D54] transition-all w-full shadow-xs min-h-[48px]"
              >
                Return to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs animate-in fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="forgot-email" className="text-xs font-bold text-[#191522] block">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#898390]" />
                  <input
                    id="forgot-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full rounded-xl bg-[#F6F5F1] border border-[#E4E2DC] pl-10 pr-4 py-3 text-base sm:text-xs font-medium text-[#191522] placeholder:text-[#898390] focus:border-[#2563EB] focus:outline-none min-h-[48px]"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                isLoading={isLoading}
                variant="primary"
                size="lg"
                className="w-full font-bold min-h-[48px] text-sm shadow-sm"
              >
                Send Recovery Instructions
              </Button>

              <div className="pt-2 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#625D69] hover:text-[#191522] transition-colors p-2 min-h-[44px]"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
