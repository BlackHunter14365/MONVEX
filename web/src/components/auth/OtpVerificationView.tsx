'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Clock, ArrowLeft, RefreshCw, ShieldCheck, MailCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { AuthHeader } from './AuthHeader';
import { AuthFeedback } from './AuthFeedback';
import { authVerificationStorage } from '@/lib/authVerificationStorage';

export interface OtpVerificationViewProps {
  purpose: 'REGISTRATION' | 'LOGIN';
  verificationId: string;
  maskedEmail: string;
  initialExpiresIn?: number;
  initialResendAfter?: number;
  onSuccess: (data: any) => void;
  onBack: () => void;
}

export function OtpVerificationView({
  purpose,
  verificationId,
  maskedEmail,
  initialExpiresIn = 600,
  initialResendAfter = 60,
  onSuccess,
  onBack,
}: OtpVerificationViewProps) {
  const toast = useToast();
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);

  // Initialize countdowns from initial values or stored timestamps
  const [expiresIn, setExpiresIn] = useState<number>(() => {
    const session = authVerificationStorage.getSession();
    if (session && session.verification_id === verificationId) {
      return authVerificationStorage.getRemainingSeconds(session);
    }
    return initialExpiresIn;
  });

  const [resendCooldown, setResendCooldown] = useState<number>(() => {
    const session = authVerificationStorage.getSession();
    if (session && session.verification_id === verificationId) {
      return authVerificationStorage.getResendCooldownSeconds(session);
    }
    return initialResendAfter;
  });

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus the first input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Save / update safe session in storage
  useEffect(() => {
    if (verificationId) {
      authVerificationStorage.saveSession({
        verification_id: verificationId,
        masked_email: maskedEmail,
        purpose,
        expires_in: expiresIn,
        resend_after: resendCooldown,
      });
    }
  }, [verificationId, maskedEmail, purpose]);

  // Expiration countdown
  useEffect(() => {
    if (expiresIn <= 0) {
      setErrorMessage('This verification code has expired. Please request a new code.');
      return;
    }

    const interval = setInterval(() => {
      setExpiresIn((prev) => {
        if (prev <= 1) {
          setErrorMessage('This verification code has expired. Please request a new code.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresIn]);

  // Resend cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;

    const interval = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [resendCooldown]);

  const formatExpiryTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Submit verification code
  const handleVerify = async (codeToVerify?: string) => {
    const code = (codeToVerify || digits.join('')).trim();
    if (code.length !== 6 || !verificationId) {
      setErrorMessage('Please enter all 6 digits of the verification code.');
      return;
    }

    if (expiresIn <= 0) {
      setErrorMessage('This verification code has expired. Request a new code.');
      return;
    }

    setIsVerifying(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      let res: any;
      if (purpose === 'LOGIN') {
        res = await api.verifyLoginOTP({
          verification_id: verificationId,
          code,
        });
      } else {
        res = await api.verifyRegisterOTP({
          verification_id: verificationId,
          code,
        });
      }

      if (res && res.success) {
        authVerificationStorage.clearSession();
        setSuccessMessage(
          purpose === 'LOGIN'
            ? 'Identity confirmed. Setting up your workspace...'
            : 'Email verified successfully. Setting up your workspace...'
        );
        toast.success(
          purpose === 'LOGIN' ? 'Welcome back to MONVEX.' : 'Account successfully verified!'
        );
        setTimeout(() => {
          onSuccess(res);
        }, 600);
      } else {
        const errorText = res?.message || 'The verification code is incorrect. Please try again.';
        setErrorMessage(errorText);
        if (res?.attempts_remaining !== undefined) {
          setAttemptsRemaining(res.attempts_remaining);
        }
      }
    } catch (err: any) {
      const errorText = err.message || 'Verification failed. Please try again.';
      setErrorMessage(errorText);
      if (err.data?.attempts_remaining !== undefined) {
        setAttemptsRemaining(err.data.attempts_remaining);
      }
    } finally {
      setIsVerifying(false);
    }
  };

  // Resend code handler
  const handleResend = async () => {
    if (resendCooldown > 0 || isResending || !verificationId) return;

    setIsResending(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      let res: any;
      if (purpose === 'LOGIN') {
        res = await api.resendLoginOTP(verificationId);
      } else {
        res = await api.resendRegisterOTP(verificationId);
      }

      if (res && res.success) {
        const newCooldown = res.resend_after || 60;
        const newExpiry = res.expires_in || 600;
        setResendCooldown(newCooldown);
        setExpiresIn(newExpiry);
        setDigits(['', '', '', '', '', '']);
        setAttemptsRemaining(5);
        authVerificationStorage.updateAfterResend(newCooldown, newExpiry);
        setSuccessMessage('A fresh 6-digit verification code has been dispatched to your email.');
        toast.success('A new verification code has been sent. Check your inbox.');
        inputRefs.current[0]?.focus();
      } else {
        setErrorMessage(res?.message || 'Failed to resend code. Please wait a moment.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to resend code right now.');
    } finally {
      setIsResending(false);
    }
  };

  // Handle single digit input or 6-digit paste
  const handleDigitChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, '');

    // Handle full paste (or multiple digits typed)
    if (clean.length > 1) {
      const pasted = clean.slice(0, 6).split('');
      const next = [...digits];
      pasted.forEach((d, i) => {
        if (i < 6) next[i] = d;
      });
      setDigits(next);
      const nextFocus = Math.min(5, pasted.length);
      inputRefs.current[nextFocus]?.focus();
      if (pasted.length === 6) {
        handleVerify(pasted.join(''));
      }
      return;
    }

    const next = [...digits];
    next[index] = clean;
    setDigits(next);

    if (clean && index < 5) {
      inputRefs.current[index + 1]?.focus();
    } else if (clean && index === 5) {
      const fullCode = next.join('');
      if (fullCode.length === 6) {
        handleVerify(fullCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const next = [...digits];
    pasted.split('').forEach((d, i) => {
      if (i < 6) next[i] = d;
    });
    setDigits(next);

    const nextFocus = Math.min(5, pasted.length);
    inputRefs.current[nextFocus]?.focus();

    if (pasted.length === 6) {
      handleVerify(pasted);
    }
  };

  const isFullCodeEntered = digits.join('').length === 6;

  return (
    <div className="space-y-6 w-full">
      {/* Top Header & Context Pill */}
      <div className="flex items-center justify-between pb-1">
        <button
          type="button"
          onClick={onBack}
          disabled={isVerifying}
          className="inline-flex items-center gap-1.5 text-xs text-[#898390] hover:text-[#191522] transition-colors p-1 -ml-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#191522]/30 disabled:opacity-50"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{purpose === 'LOGIN' ? 'Use another account' : 'Back to registration'}</span>
        </button>
        <div className="flex items-center gap-1 text-[11px] font-mono text-[#898390] bg-[#ECEAE3] px-2 py-0.5 rounded-md">
          {purpose === 'LOGIN' ? (
            <>
              <ShieldCheck className="h-3 w-3 text-[#2563EB]" />
              <span>2-STAGE AUTH</span>
            </>
          ) : (
            <>
              <MailCheck className="h-3 w-3 text-[#10B981]" />
              <span>EMAIL VERIFY</span>
            </>
          )}
        </div>
      </div>

      <AuthHeader
        title={purpose === 'LOGIN' ? 'Verify your identity.' : 'Verify your email.'}
        subtitle={
          maskedEmail
            ? `We've sent a 6-digit verification code to ${maskedEmail}.`
            : 'We’ve sent a 6-digit verification code to your email address.'
        }
      />

      {/* Error & Success Feedback */}
      {errorMessage && <AuthFeedback type="error" message={errorMessage} />}
      {successMessage && <AuthFeedback type="success" message={successMessage} />}

      {/* Attempts remaining pill */}
      {attemptsRemaining !== null && attemptsRemaining < 5 && attemptsRemaining > 0 && (
        <div className="text-center text-xs font-medium text-amber-800 bg-amber-500/10 border border-amber-500/20 py-1.5 px-3 rounded-lg">
          {attemptsRemaining} attempt{attemptsRemaining > 1 ? 's' : ''} remaining before session lock.
        </div>
      )}

      {/* 6 Discrete OTP Input Boxes */}
      <div className="space-y-4">
        <div
          className="flex items-center justify-center gap-2 sm:gap-2.5"
          onPaste={handlePaste}
          role="group"
          aria-label="6-digit verification code"
        >
          {digits.map((digit, idx) => (
            <input
              key={idx}
              id={`otp-digit-${idx}`}
              name={`otp-digit-${idx}`}
              ref={(el) => {
                inputRefs.current[idx] = el;
              }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              disabled={isVerifying || expiresIn <= 0}
              aria-label={`Digit ${idx + 1} of 6`}
              autoComplete={idx === 0 ? 'one-time-code' : 'off'}
              className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold font-mono rounded-xl bg-white border border-[#DDD9D0] focus:border-[#191522] focus:ring-2 focus:ring-[#191522]/15 outline-none transition-all shadow-2xs text-[#191522] disabled:opacity-50 disabled:bg-[#F0EEE6]"
            />
          ))}
        </div>

        {/* Primary Verify Button */}
        <button
          type="button"
          onClick={() => handleVerify()}
          disabled={isVerifying || !isFullCodeEntered || expiresIn <= 0}
          className="w-full min-h-[46px] flex items-center justify-center gap-2 rounded-lg bg-[#191522] hover:bg-[#2A1F3D] active:bg-[#120E1A] text-white text-sm font-medium transition-colors duration-150 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#191522]/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isVerifying ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Verifying Code...</span>
            </>
          ) : (
            <span>{purpose === 'LOGIN' ? 'Authorize Sign In' : 'Verify Email & Continue'}</span>
          )}
        </button>

        {/* Expiry Timer & Resend Controls */}
        <div className="pt-2 flex flex-col items-center gap-2.5 text-xs text-[#898390]">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-[#898390]" />
            <span>
              {expiresIn > 0 ? (
                <>
                  Code expires in{' '}
                  <span className="font-mono font-medium text-[#191522]">
                    {formatExpiryTime(expiresIn)}
                  </span>
                </>
              ) : (
                <span className="text-red-600 font-medium">Code expired</span>
              )}
            </span>
          </div>

          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0 || isResending}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#191522] hover:text-[#2563EB] disabled:text-[#A09CA8] disabled:cursor-not-allowed transition-colors py-1 px-2 rounded"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isResending ? 'animate-spin' : ''}`} />
            <span>
              {resendCooldown > 0
                ? `Resend code in ${resendCooldown}s`
                : isResending
                ? 'Sending fresh code...'
                : "Didn't receive the code? Resend OTP"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
