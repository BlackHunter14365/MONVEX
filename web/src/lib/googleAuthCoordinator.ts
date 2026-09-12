/**
 * MONVEX Centralized Google Identity Services (GIS) Coordinator
 * Enforces singleton initialization, FedCM concurrency protection,
 * double-submission prevention, and silent error isolation.
 */

type CredentialListener = (credential: string) => void;

class GoogleAuthCoordinator {
  private scriptPromise: Promise<void> | null = null;
  private isInitialized = false;
  private activeClientId = '';
  private isProcessing = false;
  private hasPromptedOneTap = false;
  private isPromptActive = false;
  private listeners = new Set<CredentialListener>();

  public loadScript(): Promise<void> {
    if (typeof window === 'undefined') {
      return Promise.reject(new Error('Window unavailable'));
    }
    if (window.google?.accounts?.id) {
      return Promise.resolve();
    }
    if (this.scriptPromise) {
      return this.scriptPromise;
    }

    this.scriptPromise = new Promise<void>((resolve, reject) => {
      const existing = document.getElementById('google-gsi-client-script') as HTMLScriptElement | null;
      if (existing) {
        if (window.google?.accounts?.id) {
          resolve();
          return;
        }
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', (err) => reject(err), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.id = 'google-gsi-client-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = (err) => {
        this.scriptPromise = null;
        reject(err);
      };
      document.head.appendChild(script);
    });

    return this.scriptPromise;
  }

  public initialize(clientId: string): void {
    if (typeof window === 'undefined' || !window.google?.accounts?.id) return;
    if (this.isInitialized && this.activeClientId === clientId) return;

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (resp: any) => {
          this.handleGlobalCredential(resp);
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      this.isInitialized = true;
      this.activeClientId = clientId;
    } catch (err) {
      console.warn('[MONVEX-GOOGLE] GIS initialization warning:', err);
    }
  }

  private handleGlobalCredential(resp: any): void {
    if (this.isProcessing) return; // Prevent double-click duplicate requests
    const credential = resp?.credential;
    if (!credential) return;

    this.isProcessing = true;
    try {
      this.listeners.forEach((listener) => {
        try {
          listener(credential);
        } catch (e) {
          console.error('[MONVEX-GOOGLE] Listener callback error:', e);
        }
      });
    } finally {
      setTimeout(() => {
        this.isProcessing = false;
      }, 1500);
    }
  }

  public addListener(listener: CredentialListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public renderButton(container: HTMLElement, options: any): void {
    if (typeof window === 'undefined' || !window.google?.accounts?.id) return;
    try {
      window.google.accounts.id.renderButton(container, options);
    } catch (err) {
      console.warn('[MONVEX-GOOGLE] Error rendering GIS button:', err);
    }
  }

  public maybePromptOneTap(): void {
    // Only prompt once per session, and never when a prompt is already in-flight
    if (this.hasPromptedOneTap || this.isPromptActive || this.isProcessing) return;
    if (typeof window === 'undefined' || !window.google?.accounts?.id) return;

    this.hasPromptedOneTap = true;
    this.isPromptActive = true;

    try {
      window.google.accounts.id.prompt((notification: any) => {
        this.isPromptActive = false;
        if (notification?.isNotDisplayed?.()) {
          const reason = notification.getNotDisplayedReason?.();
          if (reason && reason !== 'suppressed_by_user') {
            console.debug('[MONVEX-GOOGLE] One Tap notice:', reason);
          }
        }
      });
    } catch (err) {
      this.isPromptActive = false;
      // FedCM errors must not bubble or break other auth mechanisms
      console.debug('[MONVEX-GOOGLE] FedCM prompt suppressed:', err);
    }
  }

  public isBusy(): boolean {
    return this.isProcessing;
  }
}

export const googleAuthCoordinator = new GoogleAuthCoordinator();
