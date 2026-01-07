import { create } from 'zustand';
import type { BeforeInstallPromptEvent } from '../types/pwa';

interface PwaState {
  isInstallable: boolean;
  isInstalled: boolean;
  isIos: boolean;
  deferredPrompt: BeforeInstallPromptEvent | null;
  needsRefresh: boolean;
  offlineReady: boolean;
  updateServiceWorker: () => Promise<void>;
  setInstallable: (installable: boolean) => void;
  setDeferredPrompt: (prompt: BeforeInstallPromptEvent | null) => void;
  showInstallPrompt: () => Promise<void>;
  setNeedsRefresh: (needs: boolean) => void;
  setOfflineReady: (ready: boolean) => void;
}

export const usePwaStore = create<PwaState>((set, get) => ({
  isInstallable: false,
  isInstalled: false,
  isIos: false,
  deferredPrompt: null,
  needsRefresh: false,
  offlineReady: false,

  updateServiceWorker: async () => {
    // Implementation will be added when SW registration is created
    console.log('Update service worker placeholder');
  },

  setInstallable: (installable) => {
    set({ isInstallable: installable });
  },

  setDeferredPrompt: (prompt) => {
    set({ deferredPrompt: prompt, isInstallable: !!prompt });
  },

  showInstallPrompt: async () => {
    const { deferredPrompt } = get();
    if (!deferredPrompt) {
      console.log('No install prompt available');
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        set({ isInstalled: true, isInstallable: false, deferredPrompt: null });
      } else {
        set({ deferredPrompt: null, isInstallable: false });
      }
    } catch (error) {
      console.error('Install prompt error:', error);
      set({ deferredPrompt: null, isInstallable: false });
    }
  },

  setNeedsRefresh: (needs) => {
    set({ needsRefresh: needs });
  },

  setOfflineReady: (ready) => {
    set({ offlineReady: ready });
  },
}));
