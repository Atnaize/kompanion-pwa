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
    console.log('[PWA] Initializing PWA hook');
    console.log('[PWA] Is standalone mode:', isInStandaloneMode());
    console.log('[PWA] Is iOS:', isIos());

    // Check if already installed
    if (isInStandaloneMode()) {
      console.log('[PWA] App is already installed');
      usePwaStore.setState({ isInstalled: true });
      return;
    }

    // For iOS devices, show install instructions if not installed
    if (isIos()) {
      console.log('[PWA] iOS detected, showing manual install instructions');
      usePwaStore.setState({ isInstallable: true, isIos: true });
      return;
    }

    console.log('[PWA] Setting up beforeinstallprompt listener for Android/Chrome');

    // Listen for install prompt (Android/Chrome)
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      console.log('[PWA] beforeinstallprompt event fired!', e);
      e.preventDefault();
      setDeferredPrompt(e);
      setInstallable(true);
      console.log('[PWA] Install prompt captured and ready');
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      console.log('[PWA] App installed successfully');
      usePwaStore.setState({
        isInstalled: true,
        isInstallable: false,
        deferredPrompt: null,
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Debug: Check PWA criteria
    console.log('[PWA] Waiting for beforeinstallprompt event...');
    console.log('[PWA] Service Worker registered:', 'serviceWorker' in navigator);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [setDeferredPrompt, setInstallable]);
};
