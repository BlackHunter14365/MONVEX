'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

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
  variant?: 'rectangular' | 'circle';
}

type GisState = 'LOADING' | 'READY' | 'ERROR';

// Singleton promise for GIS script loading across component lifecycle
let gisScriptPromise: Promise<void> | null = null;

function loadGoogleIdentityServicesScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Window not available'));
  if (window.google?.accounts?.id) return Promise.resolve();
  if (gisScriptPromise) return gisScriptPromise;

  gisScriptPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById('google-gsi-client-script') as HTMLScriptElement | null;
    if (existingScript) {
      if (window.google?.accounts?.id) {
        resolve();
        return;
      }
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', (e) => reject(e));

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
  className = '',
  text = 'continue_with',
  variant = 'rectangular',
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

    loadGoogleIdentityServicesScript()
      .then(() => {
        if (!isMounted) return;

        if (!window.google?.accounts?.id) {
          throw new Error('Google Identity Services API not available');
        }

        if (!isInitializedRef.current) {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: (resp: any) => {
              handleCredentialCallback(resp);
            },
            auto_select: false,
            cancel_on_tap_outside: true,
          });
          isInitializedRef.current = true;
        }

        // Render GIS button inside container
        if (googleBtnContainerRef.current) {
          googleBtnContainerRef.current.innerHTML = '';
          const containerWidth = googleBtnContainerRef.current.offsetWidth || 380;
          const targetWidth = Math.min(400, Math.max(240, containerWidth));

          window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
            type: variant === 'circle' ? 'icon' : 'standard',
            theme: 'outline',
            size: 'large',
            text,
            shape: variant === 'circle' ? 'circle' : 'rectangular',
            logo_alignment: 'left',
            width: targetWidth,
          });
        }

        setGisState('READY');
        setErrorMessage(null);

        // Optional non-intrusive one-tap prompt
        try {
          window.google.accounts.id.prompt();
        } catch {
          // non-fatal
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        const msg = 'Google Sign-In could not be loaded.';
        setErrorMessage(msg);
        setGisState('ERROR');
        onError?.(msg);
      });

  return () => {
    isMounted = false;
  };
}, [clientId, handleCredentialCallback, onError, text, variant]);

  const buttonLabel =
    text === 'signup_with'
      ? 'Sign up with Google'
      : text === 'signin_with'
      ? 'Sign in with Google'
      : 'Continue with Google';

  // Render refined secondary action
  return (
    <div className={`relative w-full ${className}`}>
      {/* MONVEX Custom Designed Secondary Control */}
      <div
        className={`relative w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg border border-[#E4E2DC] bg-white hover:bg-[#FBFBFA] hover:border-[#D6D4CD] text-[#191522] text-sm font-medium transition-all duration-150 shadow-2xs min-h-[46px] select-none focus-within:ring-2 focus-within:ring-[#191522]/20 ${
          disabled || isLoading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
        }`}
      >
        {/* Official Google G Logo SVG */}
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
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

        <span>{isLoading ? 'Signing in with Google...' : buttonLabel}</span>

        {/* Loading spinner */}
        {(isLoading || gisState === 'LOADING') && (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-[#898390] ml-1" />
        )}

        {/* Transparent Google GSI iframe overlay (Handles click event securely & complies with GIS standards) */}
        {gisState === 'READY' && !disabled && !isLoading && (
          <div
            ref={googleBtnContainerRef}
            id="google-signin-btn-container"
            aria-label={buttonLabel}
            className="absolute inset-0 w-full h-full opacity-[0.001] overflow-hidden cursor-pointer flex items-center justify-center pointer-events-auto"
          />
        )}
      </div>

      {/* Error state if GIS failed to load */}
      {gisState === 'ERROR' && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-[#E11D48]">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{errorMessage || 'Google Sign-In could not be loaded.'}</span>
        </div>
      )}
    </div>
  );
};
