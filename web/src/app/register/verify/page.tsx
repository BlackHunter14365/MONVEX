'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { AuthShell, AuthHeader, OtpVerificationView } from '@/components/auth';
import { authVerificationStorage, VerificationSessionData } from '@/lib/authVerificationStorage';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

export default function RegisterVerifyPage() {
  const router = useRouter();
  const { refreshUser, isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [session, setSession] = useState<VerificationSessionData | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // Auto-redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated && user && api.getAccessToken()) {
      router.replace('/dashboard');
    }
  }, [authLoading, isAuthenticated, user, router]);

  // Load verification session from storage
  useEffect(() => {
    const current = authVerificationStorage.getSession();
    if (current && current.verification_id && current.expires_at > Date.now()) {
      setSession(current);
    } else {
      setSession(null);
    }
    setIsCheckingSession(false);
  }, []);

  if (authLoading || isCheckingSession) {
    return (
      <AuthShell>
        <div className="min-h-[360px] flex flex-col items-center justify-center space-y-4 p-8">
          <div className="h-12 w-12 rounded-2xl bg-white p-2 border border-[#E4E2DC] shadow-xs flex items-center justify-center animate-pulse">
            <img src="/logo.png" alt="MONVEX" className="h-full w-full object-contain" />
          </div>
          <div className="text-xs font-medium text-[#898390]">Validating verification session...</div>
        </div>
      </AuthShell>
    );
  }

  // Fallback state if session is missing or expired
  if (!session) {
    return (
      <AuthShell>
        <div className="space-y-6 w-full text-center py-4">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
            <ShieldAlert className="h-6 w-6" />
          </div>

          <AuthHeader
            title="No Pending Verification"
            subtitle="We could not find a pending registration verification session, or your code has expired."
          />

          <div className="pt-2">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 w-full min-h-[46px] rounded-lg bg-[#191522] hover:bg-[#2A1F3D] active:bg-[#120E1A] text-white text-sm font-medium transition-colors shadow-2xs"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Return to Registration</span>
            </Link>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="space-y-6 w-full">
        <OtpVerificationView
          purpose="REGISTRATION"
          verificationId={session.verification_id}
          maskedEmail={session.masked_email}
          initialExpiresIn={authVerificationStorage.getRemainingSeconds(session)}
          initialResendAfter={authVerificationStorage.getResendCooldownSeconds(session)}
          onSuccess={async () => {
            await refreshUser();
            router.replace('/dashboard');
          }}
          onBack={() => {
            authVerificationStorage.clearSession();
            router.push('/register');
          }}
        />
      </div>
    </AuthShell>
  );
}
