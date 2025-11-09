import { useEffect } from 'react';
import { usePwaStore } from '@store/pwaStore';
import type { BeforeInstallPromptEvent } from '../types/pwa';

export const usePwa = () => {
  const { setDeferredPrompt, setInstallable } = usePwaStore();

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      usePwaStore.setState({ isInstalled: true });
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setInstallable(true);
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      usePwaStore.setState({
        isInstalled: true,
        isInstallable: false,
        deferredPrompt: null,
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [setDeferredPrompt, setInstallable]);
};
