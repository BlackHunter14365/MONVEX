'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
          prompt: (notification?: any) => void;
        };
      };
    };
  }
}

interface GoogleSignInButtonProps {
  onSuccess: (credential: string) => void;
  onError?: (errorMsg: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  text?: 'signin_with' | 'signup_with' | 'continue_with';
}

type GisState = 'LOADING' | 'READY' | 'ERROR';

// Singleton promise for GIS script loading across component lifecycle
let gisScriptPromise: Promise<void> | null = null;

function loadGoogleIdentityServicesScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Window not available'));
  if (window.google?.accounts?.id) return Promise.resolve();
  if (gisScriptPromise) return gisScriptPromise;

  gisScriptPromise = new Promise<void>((resolve, reject) => {
    console.log('[MONVEX-GOOGLE] Script loading');

    const existingScript = document.getElementById('google-gsi-client-script') as HTMLScriptElement | null;
    if (existingScript) {
      if (window.google?.accounts?.id) {
        resolve();
        return;
      }
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', (e) => reject(e));

      // Active polling in case script loaded before event listener was registered
      const poll = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(poll);
          resolve();
        }
      }, 50);

      setTimeout(() => {
        clearInterval(poll);
        if (window.google?.accounts?.id) resolve();
        else reject(new Error('Google Identity Services script load timed out'));
      }, 6000);
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-gsi-client-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      resolve();
    };
    script.onerror = (e) => {
      gisScriptPromise = null;
      reject(e);
    };
    document.head.appendChild(script);
  });

  return gisScriptPromise;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  onError,
  isLoading = false,
  disabled = false,
  className,
  text = 'continue_with',
}) => {
  const [gisState, setGisState] = useState<GisState>('LOADING');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const googleBtnContainerRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef<boolean>(false);

  const clientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    '1068232450695-drbp5fk2066qtl9j83s69kkgk1gbc984.apps.googleusercontent.com';

  const handleCredentialCallback = useCallback(
    (response: { credential?: string; select_by?: string }) => {
      if (response?.credential) {
        onSuccess(response.credential);
      } else {
        const err = 'Google credential was not returned.';
        setErrorMessage(err);
        onError?.(err);
      }
    },
    [onSuccess, onError]
  );

  useEffect(() => {
    let isMounted = true;

    if (!clientId) {
      const err = 'Google Sign-In is not configured.';
      setErrorMessage(err);
      setGisState('ERROR');
      onError?.(err);
      return;
    }

    console.log('[MONVEX-GOOGLE] Client ID configured');

    loadGoogleIdentityServicesScript()
      .then(() => {
        if (!isMounted) return;
        console.log('[MONVEX-GOOGLE] Script loaded');

        if (!window.google?.accounts?.id) {
          throw new Error('Google Identity Services API not available');
        }

        console.log('[MONVEX-GOOGLE] GIS API available');

        // Safe initialization guard against React StrictMode duplicate calls
        if (!isInitializedRef.current) {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: (resp: any) => {
              console.log('[MONVEX-GOOGLE] Google authentication response received');
              handleCredentialCallback(resp);
            },
            auto_select: false,
            cancel_on_tap_outside: true,
          });
          isInitializedRef.current = true;
          console.log('[MONVEX-GOOGLE] GIS initialized');
        }

        // Render official Google button into container
        if (googleBtnContainerRef.current) {
          googleBtnContainerRef.current.innerHTML = '';
          const containerWidth = googleBtnContainerRef.current.offsetWidth || 384;
          const targetWidth = Math.min(400, Math.max(240, containerWidth));

          window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text,
            shape: 'rectangular',
            logo_alignment: 'left',
            width: targetWidth,
          });
        }

        setGisState('READY');
        setErrorMessage(null);

        // Offer One Tap prompt if supported
        try {
          window.google.accounts.id.prompt((notification: any) => {
            if (notification?.isNotDisplayed?.()) {
              console.log('[MONVEX-GOOGLE] One-tap prompt not displayed:', notification.getNotDisplayedReason?.());
            }
          });
        } catch {
          // non-fatal
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('[MONVEX-GOOGLE] GIS load/init error:', err);
        const msg = 'Google Sign-In could not be loaded.';
        setErrorMessage(msg);
        setGisState('ERROR');
        onError?.(msg);
      });

    return () => {
      isMounted = false;
    };
  }, [clientId, handleCredentialCallback, onError, text]);

  const handleContainerClick = () => {
    console.log('[MONVEX-GOOGLE] Google authentication started');
  };

  return (
    <div className={cn('relative w-full flex flex-col items-center min-h-[44px]', className)}>
      {/* Official Google GSI Rendered Button Container (Always present in DOM) */}
      <div
        ref={googleBtnContainerRef}
        id="google-signin-btn-container"
        onClick={handleContainerClick}
        className={cn(
          'w-full flex justify-center items-center transition-opacity duration-200',
          gisState === 'READY' && !isLoading && !disabled ? 'opacity-100' : 'hidden'
        )}
      />

      {/* Loading State Button */}
      {gisState === 'LOADING' && (
        <button
          type="button"
          disabled
          aria-label="Connecting to Google"
          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-[#E4E2DC] bg-[#F6F5F1] text-[#5F6878] text-xs font-bold shadow-xs cursor-wait"
        >
          <Loader2 className="h-4 w-4 animate-spin text-[#2563EB]" />
          <span>Connecting to Google...</span>
        </button>
      )}

      {/* Internal In-Flight Auth State Button */}
      {gisState === 'READY' && isLoading && (
        <button
          type="button"
          disabled
          aria-label="Signing you in with Google"
          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-[#E4E2DC] bg-[#F6F5F1] text-[#172033] text-xs font-bold shadow-xs cursor-wait"
        >
          <Loader2 className="h-4 w-4 animate-spin text-[#2563EB]" />
          <span>Signing you in with Google...</span>
        </button>
      )}

      {/* Error State Banner / Retry */}
      {gisState === 'ERROR' && (
        <div className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-[#E11D48] text-xs font-bold">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage || 'Google Sign-In could not be loaded.'}</span>
        </div>
      )}
    </div>
  );
};
