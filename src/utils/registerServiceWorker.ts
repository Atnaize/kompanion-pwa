import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { usePwaStore } from '@store/pwaStore';
import { useToastStore } from '@store/toastStore';

export const useServiceWorkerRegistration = () => {
  const { setNeedsRefresh: setStoreNeedsRefresh, setOfflineReady: setStoreOfflineReady } =
    usePwaStore();
  const { info, success } = useToastStore();

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration: ServiceWorkerRegistration | undefined) {
      console.log('Service Worker registered:', registration);

      // Check for updates every hour
      setInterval(
        () => {
          void registration?.update();
        },
        60 * 60 * 1000
      );
    },

    onRegisterError(error: Error) {
      console.error('Service Worker registration error:', error);
    },

    onNeedRefresh() {
      setStoreNeedsRefresh(true);
      info('New version available! Update to get the latest features.');
    },

    onOfflineReady() {
      setStoreOfflineReady(true);
      success('App ready to work offline!');
    },
  });

  // Update the store's updateServiceWorker function
  useEffect(() => {
    usePwaStore.setState({
      updateServiceWorker: async () => {
        await updateServiceWorker();
        setNeedRefresh(false);
        setStoreNeedsRefresh(false);
        window.location.reload();
      },
    });
  }, [updateServiceWorker, setNeedRefresh, setStoreNeedsRefresh]);

  return {
    needRefresh,
    offlineReady,
    updateServiceWorker,
  };
};
