import { useCallback, useEffect, useState } from 'react';

export interface NotificationDebug {
  permission: NotificationPermission | 'unsupported';
  swReady: boolean;
  swController: boolean;
  pushSubscription: string | null;
}

export const useNotificationDebug = () => {
  const [debug, setDebug] = useState<NotificationDebug | null>(null);

  const refresh = useCallback(async () => {
    const next: NotificationDebug = {
      permission: 'unsupported',
      swReady: false,
      swController: false,
      pushSubscription: null,
    };

    if ('Notification' in window) {
      next.permission = Notification.permission;
    }

    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        next.swReady = true;
        next.swController = !!navigator.serviceWorker.controller;

        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          next.pushSubscription = subscription.endpoint.substring(0, 60) + '...';
        }
      } catch (error) {
        console.error('Error checking SW:', error);
      }
    }

    setDebug(next);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { debug, refresh };
};
