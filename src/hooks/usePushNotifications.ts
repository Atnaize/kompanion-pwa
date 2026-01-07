import { useState, useEffect } from 'react';
import { apiClient } from '@api/client';
import { useAuthStore } from '@store/authStore';

interface NotificationPreferences {
  challengeInvites: boolean;
  challengeProgress: boolean;
  challengeReminders: boolean;
}

export const usePushNotifications = () => {
  const { isAuthenticated } = useAuthStore();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);

  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);

    if (supported && isAuthenticated) {
      checkSubscription();
      loadPreferences();
    }
  }, [isAuthenticated]);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Error checking push subscription:', error);
    }
  };

  const loadPreferences = async () => {
    try {
      const response = await apiClient.get<NotificationPreferences>('/notifications/preferences');
      if (response.data) {
        setPreferences(response.data);
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
  };

  const subscribe = async (): Promise<boolean> => {
    if (!isSupported) {
      throw new Error('Push notifications are not supported in this browser');
    }

    setIsLoading(true);
    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      // Get VAPID public key from server
      const vapidResponse = await apiClient.get<{ publicKey: string }>(
        '/notifications/vapid-public-key'
      );
      if (!vapidResponse.data?.publicKey) {
        throw new Error('Failed to get VAPID public key');
      }
      const vapidPublicKey = vapidResponse.data.publicKey;

      // Subscribe to push notifications
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
      });

      // Send subscription to server
      await apiClient.post('/notifications/subscribe', { subscription });

      setIsSubscribed(true);
      return true;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async (): Promise<boolean> => {
    if (!isSupported) {
      throw new Error('Push notifications are not supported');
    }

    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Unsubscribe from browser
        await subscription.unsubscribe();

        // Remove from server
        await apiClient.post('/notifications/unsubscribe', {
          endpoint: subscription.endpoint,
        });
      }

      setIsSubscribed(false);
      return true;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<NotificationPreferences>): Promise<void> => {
    try {
      const response = await apiClient.put<NotificationPreferences>(
        '/notifications/preferences',
        updates
      );
      if (response.data) {
        setPreferences(response.data);
      }
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  };

  return {
    isSupported,
    isSubscribed,
    isLoading,
    preferences,
    subscribe,
    unsubscribe,
    updatePreferences,
    reload: loadPreferences,
  };
};

// Helper function to convert VAPID public key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
