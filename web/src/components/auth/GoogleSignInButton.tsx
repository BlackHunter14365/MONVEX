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

          window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
            type: 'icon',
            theme: 'outline',
            size: 'large',
            shape: 'circle',
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
    <div className={cn('relative flex flex-col items-center justify-center', className)}>
      {/* Official Google GSI Rendered Circular Button Container */}
      <div
        ref={googleBtnContainerRef}
        id="google-signin-btn-container"
        onClick={handleContainerClick}
        className={cn(
          'flex items-center justify-center rounded-full transition-all duration-200',
          'h-10 w-10 min-h-[40px] min-w-[40px] max-h-[40px] max-w-[40px]',
          'hover:scale-105 active:scale-95 shadow-xs hover:shadow-sm',
          'focus-within:ring-2 focus-within:ring-[#2563EB]/40 focus-within:ring-offset-2',
          gisState === 'READY' && !isLoading && !disabled ? 'opacity-100' : 'hidden'
        )}
        style={{ borderRadius: '50%' }}
      />

      {/* Loading State Circular Button */}
      {gisState === 'LOADING' && (
        <button
          type="button"
          disabled
          aria-label="Connecting to Google"
          className="h-10 w-10 min-h-[40px] min-w-[40px] rounded-full border border-[#E4E2DC] bg-white shadow-xs flex items-center justify-center cursor-wait transition-all"
          style={{ borderRadius: '50%' }}
        >
          <svg className="h-5 w-5 animate-pulse" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
        </button>
      )}

      {/* Internal In-Flight Auth State Circular Button */}
      {gisState === 'READY' && isLoading && (
        <button
          type="button"
          disabled
          aria-label="Signing you in with Google"
          className="h-10 w-10 min-h-[40px] min-w-[40px] rounded-full border border-[#E4E2DC] bg-white shadow-xs flex items-center justify-center cursor-wait"
          style={{ borderRadius: '50%' }}
        >
          <Loader2 className="h-5 w-5 animate-spin text-[#2563EB]" />
        </button>
      )}

      {/* Disabled State Circular Button */}
      {gisState === 'READY' && disabled && !isLoading && (
        <button
          type="button"
          disabled
          aria-label="Google Sign-In disabled"
          className="h-10 w-10 min-h-[40px] min-w-[40px] rounded-full border border-[#E4E2DC] bg-[#F6F5F1] opacity-50 shadow-xs flex items-center justify-center cursor-not-allowed"
          style={{ borderRadius: '50%' }}
        >
          <svg className="h-5 w-5 grayscale opacity-60" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
        </button>
      )}

      {/* Error State */}
      {gisState === 'ERROR' && (
        <div className="flex flex-col items-center gap-1.5">
          <div
            className="h-10 w-10 min-h-[40px] min-w-[40px] rounded-full border border-[#FECDD3] bg-[#FFF1F2] shadow-xs flex items-center justify-center text-[#E11D48]"
            style={{ borderRadius: '50%' }}
            title={errorMessage || 'Google Sign-In error'}
          >
            <AlertCircle className="h-5 w-5" />
          </div>
          <span className="text-[11px] text-[#E11D48] text-center font-medium max-w-[260px]">
            {errorMessage || 'Google Sign-In could not be loaded.'}
          </span>
        </div>
      )}
    </div>
  );
};
