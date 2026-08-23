/**
 * MONVEX Tauri Native Bridge
 * Seamlessly interfaces with Tauri native Windows APIs when running inside the desktop shell,
 * while falling back gracefully to standard Web APIs in browsers.
 */

declare global {
  interface Window {
    __TAURI__?: {
      invoke: (cmd: string, args?: Record<string, unknown>) => Promise<unknown>;
    };
    __TAURI_IPC__?: unknown;
  }
}

export const isTauri = (): boolean => {
  return typeof window !== 'undefined' && (Boolean(window.__TAURI__) || Boolean(window.__TAURI_IPC__));
};

export const sendNativeNotification = async (title: string, body: string): Promise<void> => {
  if (isTauri() && window.__TAURI__) {
    try {
      await window.__TAURI__.invoke('send_native_notification', { title, body });
      return;
    } catch (e) {
      console.warn('Tauri notification invoke error:', e);
    }
  }

  // Fallback to browser notification API if granted
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/logo.png' });
  }
};

export const triggerNativeQuickTransaction = async (): Promise<void> => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('monvex:open-add-transaction'));
  }
};

export const exportDataFile = (filename: string, content: string, mimeType: string = 'text/csv'): void => {
  if (typeof window === 'undefined') return;

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
