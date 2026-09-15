'use client';

import React, { useEffect, useRef, useState, useCallback, useId } from 'react';
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

import { googleAuthCoordinator } from '@/lib/googleAuthCoordinator';

interface GoogleSignInButtonProps {
  onSuccess: (credential: string) => void;
  onError?: (errorMsg: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  width?: number | string;
  theme?: 'outline' | 'filled_blue' | 'filled_black';
}

/** Official Google 4-color 'G' Logo SVG */
const GoogleGLogo: React.FC<{ className?: string }> = ({ className = 'w-[18px] h-[18px]' }) => (
  <svg
    className={cn('shrink-0', className)}
    viewBox="0 0 48 48"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <g>
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
      <path fill="none" d="M0 0h48v48H0z" />
    </g>
  </svg>
);

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  onError,
  isLoading = false,
  disabled = false,
  className = '',
  text = 'continue_with',
  shape = 'rectangular',
  width,
  theme = 'outline',
}) => {
  const containerAutoId = useId();
  const containerDomId = `google-signin-btn-${containerAutoId.replace(/:/g, '')}`;
  const [gisState, setGisState] = useState<'IDLE' | 'LOADING' | 'READY' | 'ERROR'>('IDLE');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const googleBtnContainerRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef<boolean>(false);

  const clientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    '1068232450695-drbp5fk2066qtl9j83s69kkgk1gbc984.apps.googleusercontent.com';

  const handleCredentialCallback = useCallback(
    (credential: string) => {
      if (credential) {
        onSuccess(credential);
      } else {
        const err = 'Google credential was not returned.';
        setErrorMessage(err);
        onError?.(err);
      }
    },
    [onSuccess, onError]
  );

  const computeButtonWidth = useCallback(() => {
    if (width) return typeof width === 'number' ? width : parseInt(String(width), 10) || 270;
    if (shape === 'pill') {
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 420;
      return isMobile ? 250 : 270;
    }
    if (!googleBtnContainerRef.current) return 270;
    const parentWidth = googleBtnContainerRef.current.parentElement?.offsetWidth || 0;
    const directWidth = googleBtnContainerRef.current.offsetWidth || 0;
    const availableWidth = directWidth || parentWidth || 380;
    return Math.min(400, Math.max(240, Math.floor(availableWidth)));
  }, [shape, width]);

  const [targetWidth, setTargetWidth] = useState<number>(270);

  // Initialize and track target width on mount/resize
  useEffect(() => {
    setTargetWidth(computeButtonWidth());
  }, [computeButtonWidth]);

  const renderGoogleButton = useCallback(() => {
    if (!googleBtnContainerRef.current) return;

    try {
      googleBtnContainerRef.current.innerHTML = '';
      const w = computeButtonWidth();
      setTargetWidth(w);

      googleAuthCoordinator.renderButton(googleBtnContainerRef.current, {
        type: shape === 'circle' ? 'icon' : 'standard',
        theme: 'outline',
        size: 'large',
        text,
        shape: shape === 'circle' ? 'circle' : shape === 'pill' ? 'pill' : 'rectangular',
        logo_alignment: 'left',
        width: w,
      });
    } catch (err) {
      console.warn('[MONVEX-GOOGLE] Error rendering button:', err);
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

    // Subscribe to centralized coordinator
    const unsubscribe = googleAuthCoordinator.addListener((credential) => {
      if (isMounted) {
        handleCredentialCallback(credential);
      }
    });

    googleAuthCoordinator.loadScript()
      .then(() => {
        if (!isMounted) return;

        // Initialize GIS singleton safely
        googleAuthCoordinator.initialize(clientId);
        isInitializedRef.current = true;

        // Render button immediately and after layout tick
        renderGoogleButton();
        timer = setTimeout(() => {
          if (isMounted) renderGoogleButton();
        }, 80);

        setGisState('READY');
        setErrorMessage(null);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('[MONVEX-GOOGLE] GIS load error:', err);
        const msg = 'Google Sign-In could not be loaded.';
        setErrorMessage(msg);
        setGisState('ERROR');
        onError?.(msg);
      });

    return () => {
      isMounted = false;
      unsubscribe();
      if (timer) clearTimeout(timer);
    };
  }, [clientId, handleCredentialCallback, onError, renderGoogleButton]);

  // Re-render button on window resize to ensure crisp alignment
  useEffect(() => {
    if (gisState !== 'READY') return;

    let lastWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
    const handleResize = () => {
      const currentWidth = window.innerWidth;
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

  const isPill = shape === 'pill';
  const borderRadiusClass = isPill ? 'rounded-full' : 'rounded-md';

  return (
    <div className={cn('relative w-full flex flex-col items-center justify-center', className)}>
      {/*
        STRICT FIXED GEOMETRY CONTAINER:
        Guarantees 100% identical bounding rectangle before, during, and after authentication.
        Zero width stretching, zero leftward movement, zero double-border artifacts.
      */}
      <div
        className={cn(
          'relative overflow-hidden select-none shadow-2xs hover:shadow-xs transition-shadow duration-150',
          borderRadiusClass
        )}
        style={{ width: `${targetWidth}px`, height: '40px' }}
      >
        {/* Official Google GSI Rendered Button (ALWAYS MOUNTED IN DOM TO PRESERVE GIS LIFECYCLE) */}
        <div
          ref={googleBtnContainerRef}
          id={containerDomId}
          className="w-full h-full flex justify-center items-center"
          style={{ width: `${targetWidth}px`, height: '40px' }}
        />

        {/* Initial GIS Script Load Placeholder (Exact Matching Geometry & Icon Anchor) */}
        {gisState === 'LOADING' && (
          <div
            aria-label="Connecting to Google"
            aria-live="polite"
            className={cn(
              'absolute inset-0 z-10 flex items-center bg-white border border-[#dadce0] pointer-events-auto select-none',
              borderRadiusClass
            )}
            style={{ width: `${targetWidth}px`, height: '40px', boxSizing: 'border-box' }}
          >
            {/* Stable Google G Icon Anchor: Exact 12px Left, 11px Top Offset */}
            <div className="absolute left-[12px] top-[11px] w-[18px] h-[18px] flex items-center justify-center shrink-0">
              <GoogleGLogo className="w-[18px] h-[18px] animate-pulse" />
            </div>

            {/* Stable Text Alignment: Exact 38px Left Offset */}
            <span className="absolute left-[38px] text-[14px] font-medium text-[#5f6368] leading-none select-none tracking-normal truncate max-w-[170px]">
              Connecting...
            </span>

            {/* Trailing Activity Indicator: Anchored on the Right */}
            <div className="absolute right-[14px] top-[12px] w-4 h-4 flex items-center justify-center shrink-0">
              <Loader2 className="h-4 w-4 animate-spin text-[#70757a]" />
            </div>
          </div>
        )}

        {/*
          IN-FLIGHT ACTIVE/LOADING OVERLAY:
          Mounts as an absolute overlay directly on top of the button frame.
          Prevents duplicate clicks, maintains EXACT 1:1 pixel alignment of the G icon,
          text start position, and button boundaries. Zero left/right expansion.
        */}
        {gisState === 'READY' && isLoading && (
          <div
            aria-label="Signing in with Google"
            aria-live="polite"
            className={cn(
              'absolute inset-0 z-10 flex items-center bg-white border border-[#dadce0] pointer-events-auto cursor-wait select-none',
              borderRadiusClass
            )}
            style={{ width: `${targetWidth}px`, height: '40px', boxSizing: 'border-box' }}
          >
            {/* Stable Google G Icon Anchor: Exact 12px Left, 11px Top Offset */}
            <div className="absolute left-[12px] top-[11px] w-[18px] h-[18px] flex items-center justify-center shrink-0">
              <GoogleGLogo className="w-[18px] h-[18px]" />
            </div>

            {/* Stable Text Alignment: Exact 38px Left Offset */}
            <span className="absolute left-[38px] text-[14px] font-medium text-[#3c4043] leading-none select-none tracking-normal truncate max-w-[170px]">
              Signing in...
            </span>

            {/* Trailing Activity Indicator: Anchored on the Right */}
            <div className="absolute right-[14px] top-[12px] w-4 h-4 flex items-center justify-center shrink-0">
              <Loader2 className="h-4 w-4 animate-spin text-[#1a73e8]" />
            </div>
          </div>
        )}

        {/* Disabled Overlay */}
        {gisState === 'READY' && disabled && !isLoading && (
          <div
            aria-label="Google Sign-In disabled"
            className={cn(
              'absolute inset-0 z-10 flex items-center bg-[#F8F9FA] border border-[#dadce0] opacity-60 cursor-not-allowed select-none',
              borderRadiusClass
            )}
            style={{ width: `${targetWidth}px`, height: '40px', boxSizing: 'border-box' }}
          >
            {/* Stable Google G Icon Anchor: Exact 12px Left, 11px Top Offset */}
            <div className="absolute left-[12px] top-[11px] w-[18px] h-[18px] flex items-center justify-center shrink-0 grayscale opacity-60">
              <GoogleGLogo className="w-[18px] h-[18px]" />
            </div>

            {/* Stable Text Alignment: Exact 38px Left Offset */}
            <span className="absolute left-[38px] text-[14px] font-medium text-[#70757a] leading-none select-none tracking-normal truncate max-w-[210px]">
              {buttonTextLabel}
            </span>
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
              setErrorMessage(null);
              googleAuthCoordinator.loadScript()
                .then(() => {
                  googleAuthCoordinator.initialize(clientId);
                  renderGoogleButton();
                  setGisState('READY');
                })
                .catch((err) => {
                  console.error('[MONVEX-GOOGLE] Retry failed:', err);
                  setErrorMessage('Google Sign-In could not be loaded.');
                  setGisState('ERROR');
                });
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
