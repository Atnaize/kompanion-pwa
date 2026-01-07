import { useEffect } from 'react';
import { usePwaStore } from '@store/pwaStore';
import type { BeforeInstallPromptEvent } from '../types/pwa';

const isIos = () => {
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent);
};

const isInStandaloneMode = () => {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in window.navigator &&
      (window.navigator as { standalone?: boolean }).standalone === true)
  );
};

export const usePwa = () => {
  const { setDeferredPrompt, setInstallable } = usePwaStore();

  useEffect(() => {
    // Check if already installed
    if (isInStandaloneMode()) {
      usePwaStore.setState({ isInstalled: true });
      return;
    }

    // For iOS devices, show install instructions if not installed
    if (isIos()) {
      usePwaStore.setState({ isInstallable: true, isIos: true });
      return;
    }

    // Listen for install prompt (Android/Chrome)
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
