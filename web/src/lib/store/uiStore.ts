import { create } from 'zustand';

interface UIState {
  isMobileDrawerOpen: boolean;
  isCommandCenterOpen: boolean;
  activeWorkspace: string;
  currency: string;
  theme: 'light' | 'dark' | 'system';
  setMobileDrawerOpen: (open: boolean) => void;
  toggleMobileDrawer: () => void;
  setCommandCenterOpen: (open: boolean) => void;
  toggleCommandCenter: () => void;
  setActiveWorkspace: (workspace: string) => void;
  setCurrency: (currency: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isMobileDrawerOpen: false,
  isCommandCenterOpen: false,
  activeWorkspace: 'default',
  currency: 'INR',
  theme: 'light',
  setMobileDrawerOpen: (open) => set({ isMobileDrawerOpen: open }),
  toggleMobileDrawer: () => set((state) => ({ isMobileDrawerOpen: !state.isMobileDrawerOpen })),
  setCommandCenterOpen: (open) => set({ isCommandCenterOpen: open }),
  toggleCommandCenter: () => set((state) => ({ isCommandCenterOpen: !state.isCommandCenterOpen })),
  setActiveWorkspace: (workspace) => set({ activeWorkspace: workspace }),
  setCurrency: (currency) => set({ currency }),
}));
