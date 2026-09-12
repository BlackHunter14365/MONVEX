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
  shape?: 'pill' | 'rectangular' | 'circle';
}

type GisState = 'LOADING' | 'READY' | 'ERROR';

let gisScriptPromise: Promise<void> | null = null;
const gisActiveCallbacks = new Set<(resp: any) => void>();
let isGisGloballyInitialized = false;
let currentGisClientId = '';

function setupGlobalGis(clientId: string) {
  if (typeof window === 'undefined' || !window.google?.accounts?.id) return;
  if (!isGisGloballyInitialized || currentGisClientId !== clientId) {
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (resp: any) => {
        gisActiveCallbacks.forEach((cb) => cb(resp));
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    });
    isGisGloballyInitialized = true;
    currentGisClientId = clientId;
  }
}


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
  shape = 'pill',
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

  const computeButtonWidth = useCallback(() => {
    if (shape === 'pill') {
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 420;
      return isMobile ? 250 : 270;
    }
    if (!googleBtnContainerRef.current) return 270;
    const parentWidth = googleBtnContainerRef.current.parentElement?.offsetWidth || 0;
    const directWidth = googleBtnContainerRef.current.offsetWidth || 0;
    const availableWidth = directWidth || parentWidth || 380;
    return Math.min(400, Math.max(240, Math.floor(availableWidth)));
  }, [shape]);

  const renderGoogleButton = useCallback(() => {
    if (!googleBtnContainerRef.current || !window.google?.accounts?.id) return;

    try {
      googleBtnContainerRef.current.innerHTML = '';
      const targetWidth = computeButtonWidth();

      window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
        type: shape === 'circle' ? 'icon' : 'standard',
        theme: 'outline',
        size: 'large',
        text,
        shape: shape === 'circle' ? 'circle' : shape === 'pill' ? 'pill' : 'rectangular',
        logo_alignment: 'left',
        width: targetWidth,
      });
    } catch (err) {
      console.error('[MONVEX-GOOGLE] Error rendering button:', err);
    }
  }, [text, shape, computeButtonWidth]);

  useEffect(() => {
    let isMounted = true;
    let timer: NodeJS.Timeout | null = null;

    if (!clientId) {
      const err = 'Google Sign-In is not configured.';
      setErrorMessage(err);
      setGisState('ERROR');
      onError?.(err);
      return;
    }

    const callback = (resp: any) => {
      if (isMounted) {
        handleCredentialCallback(resp);
      }
    };
    gisActiveCallbacks.add(callback);

    loadGoogleIdentityServicesScript()
      .then(() => {
        if (!isMounted) return;

        if (!window.google?.accounts?.id) {
          throw new Error('Google Identity Services API not available');
        }

        // Initialize Google Identity Services singleton
        setupGlobalGis(clientId);
        isInitializedRef.current = true;

        // Render button immediately and after layout measurement tick
        renderGoogleButton();
        timer = setTimeout(() => {
          if (isMounted) renderGoogleButton();
        }, 80);

        setGisState('READY');
        setErrorMessage(null);

        // Optional non-intrusive one-tap prompt
        try {
          window.google.accounts.id.prompt((notification: any) => {
            if (notification?.isNotDisplayed?.()) {
              console.log('[MONVEX-GOOGLE] One-tap not displayed:', notification.getNotDisplayedReason?.());
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
      gisActiveCallbacks.delete(callback);
      if (timer) clearTimeout(timer);
    };
  }, [clientId, handleCredentialCallback, onError, renderGoogleButton]);

  // Re-render button on window resize to ensure crisp alignment
  useEffect(() => {
    if (gisState !== 'READY') return;

    let lastWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
    const handleResize = () => {
      const currentWidth = window.innerWidth;
      // Re-render if crossing responsive breakpoint
      if ((lastWidth < 420 && currentWidth >= 420) || (lastWidth >= 420 && currentWidth < 420)) {
        lastWidth = currentWidth;
        renderGoogleButton();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [gisState, renderGoogleButton]);

  const buttonTextLabel =
    text === 'signup_with'
      ? 'Sign up with Google'
      : text === 'signin_with'
      ? 'Sign in with Google'
      : 'Continue with Google';

  const targetWidth = computeButtonWidth();

  return (
    <div className={cn('relative w-full flex flex-col items-center justify-center', className)}>
      {/* Precision Frame for Google SSO Token (Unique Capsule Design) */}
      <div
        className={cn(
          'relative inline-flex items-center justify-center transition-all duration-200',
          shape === 'pill'
            ? 'p-0.5 rounded-full bg-white/70 border border-[#E4E2DC] shadow-2xs hover:shadow-xs hover:border-[#D6D4CD]'
            : 'w-full'
        )}
      >
        {/* Official Google GSI Rendered Button Container (ALWAYS MOUNTED IN DOM) */}
        <div
          ref={googleBtnContainerRef}
          id="google-signin-btn-container"
          className={cn(
            'flex justify-center items-center transition-all duration-200',
            gisState === 'READY' && !isLoading && !disabled
              ? 'opacity-100 min-h-[40px]'
              : 'opacity-0 h-0 overflow-hidden pointer-events-none'
          )}
        />

        {/* Loading State Pill */}
        {gisState === 'LOADING' && (
          <div
            aria-label="Connecting to Google"
            className="inline-flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-full border border-[#E4E2DC] bg-white text-[#625D69] text-xs font-medium shadow-2xs min-h-[40px] select-none"
            style={{ width: `${targetWidth}px` }}
          >
            <svg className="h-4 w-4 shrink-0 animate-pulse" viewBox="0 0 24 24" aria-hidden="true">
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
            <span>Connecting to Google...</span>
            <Loader2 className="h-3 w-3 animate-spin text-[#898390] ml-1" />
          </div>
        )}

        {/* Internal In-Flight Auth State Pill */}
        {gisState === 'READY' && isLoading && (
          <div
            aria-label="Signing you in with Google"
            className="inline-flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-full border border-[#E4E2DC] bg-[#FBFBFA] text-[#191522] text-xs font-medium shadow-2xs min-h-[40px] select-none"
            style={{ width: `${targetWidth}px` }}
          >
            <Loader2 className="h-4 w-4 animate-spin text-[#2563EB]" />
            <span>Signing in...</span>
          </div>
        )}

        {/* Disabled State Pill */}
        {gisState === 'READY' && disabled && !isLoading && (
          <div
            aria-label="Google Sign-In disabled"
            className="inline-flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-full border border-[#E4E2DC] bg-[#F6F5F1] opacity-50 text-[#898390] text-xs font-medium shadow-2xs min-h-[40px] cursor-not-allowed select-none"
            style={{ width: `${targetWidth}px` }}
          >
            <svg className="h-4 w-4 shrink-0 grayscale opacity-60" viewBox="0 0 24 24" aria-hidden="true">
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
            <span>{buttonTextLabel}</span>
          </div>
        )}
      </div>

      {/* Error State Banner */}
      {gisState === 'ERROR' && (
        <div className="w-full mt-2 flex items-center justify-between p-3 rounded-lg bg-[#FFF1F2] border border-[#FECDD3] text-[#E11D48] text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage || 'Google Sign-In could not be loaded.'}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setGisState('LOADING');
              gisScriptPromise = null;
              loadGoogleIdentityServicesScript();
            }}
            className="font-medium underline hover:text-[#BE123C]"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
};
