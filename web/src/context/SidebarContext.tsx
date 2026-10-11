'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const SIDEBAR_STORAGE_KEY = 'monvex-sidebar-collapsed';
const SIDEBAR_COOKIE_KEY = 'monvex-sidebar-collapsed';

interface SidebarContextType {
  isCollapsed: boolean;
  toggleCollapse: () => void;
  setCollapsed: (collapsed: boolean) => void;
  isMounted: boolean;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

interface SidebarProviderProps {
  children: React.ReactNode;
  initialCollapsed?: boolean;
}

export const SidebarProvider: React.FC<SidebarProviderProps> = ({
  children,
  initialCollapsed = false,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(initialCollapsed);
  const [isMounted, setIsMounted] = useState(false);

  // Synchronize with localStorage and update persistence cookie
  useEffect(() => {
    setIsMounted(true);
    try {
      const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (saved !== null) {
        const val = saved === 'true';
        if (val !== isCollapsed) {
          setIsCollapsed(val);
        }
        document.cookie = `${SIDEBAR_COOKIE_KEY}=${val}; path=/; max-age=31536000; SameSite=Lax`;
      } else if (initialCollapsed) {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(initialCollapsed));
      }
    } catch {
      // Storage access blocked or restricted
    }
  }, []);

  // Synchronize across tabs via cross-window storage event
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === SIDEBAR_STORAGE_KEY && event.newValue !== null) {
        const next = event.newValue === 'true';
        setIsCollapsed(next);
        try {
          document.cookie = `${SIDEBAR_COOKIE_KEY}=${next}; path=/; max-age=31536000; SameSite=Lax`;
        } catch {}
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const setCollapsed = useCallback((next: boolean) => {
    setIsCollapsed(next);
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      document.cookie = `${SIDEBAR_COOKIE_KEY}=${next}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {}
  }, []);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
        document.cookie = `${SIDEBAR_COOKIE_KEY}=${next}; path=/; max-age=31536000; SameSite=Lax`;
      } catch {}
      return next;
    });
  }, []);

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        toggleCollapse,
        setCollapsed,
        isMounted,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};
