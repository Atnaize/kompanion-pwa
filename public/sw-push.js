/* eslint-env serviceworker */
/* global self, clients, console, URL */
// Push notification handler
// This file is included by the service worker via importScripts

console.log('[SW Push] Push handler loaded');

self.addEventListener('push', (event) => {
  console.log('[SW Push] Push event received:', event);

  if (!event.data) {
    console.warn('[SW Push] Push event has no data');
    return;
  }

  try {
    const data = event.data.json();
    console.log('[SW Push] Parsed push data:', data);

    const { title, body, icon, badge, data: notificationData } = data;

    const options = {
      body,
      icon: icon || '/pwa-192x192.svg',
      badge: badge || '/pwa-64x64.svg',
      data: notificationData,
      vibrate: [200, 100, 200],
      tag: notificationData?.type || 'default',
      requireInteraction: false,
    };

    console.log('[SW Push] Showing notification with options:', options);

    event.waitUntil(
      self.registration.showNotification(title, options).then(() => {
        console.log('[SW Push] Notification shown successfully');
      })
    );
  } catch (error) {
    console.error('[SW Push] Error handling push notification:', error);
  }
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW Push] Notification clicked:', event.notification);
  event.notification.close();

  // Determine URL to open based on notification data
  const notificationData = event.notification.data;
  let urlPath = '/';

  if (notificationData?.type === 'challenge_invite') {
    urlPath = '/challenges';
  } else if (notificationData?.type === 'challenge_progress') {
    urlPath = '/challenges';
  } else if (notificationData?.type === 'challenge_activity') {
    urlPath = '/challenges';
  } else if (notificationData?.type === 'challenge_starting') {
    urlPath = '/challenges';
  } else if (notificationData?.type === 'challenge_ending') {
    urlPath = '/challenges';
  } else if (notificationData?.type === 'achievement') {
    urlPath = '/achievements';
  }

  const urlToOpen = new URL(urlPath, self.location.origin).href;
  console.log('[SW Push] Opening URL:', urlToOpen);

  event.waitUntil(
    clients
      .matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      .then((windowClients) => {
        // Check if there is already a window/tab open with this path
        for (const client of windowClients) {
          const clientUrl = new URL(client.url);
          if (clientUrl.pathname === urlPath && 'focus' in client) {
            console.log('[SW Push] Focusing existing window');
            return client.focus();
          }
        }
        // Check if there's any window open, navigate it
        for (const client of windowClients) {
          if ('focus' in client && 'navigate' in client) {
            console.log('[SW Push] Navigating existing window');
            return client.focus().then((focusedClient) => focusedClient.navigate(urlToOpen));
          }
        }
        // If not, open a new window/tab
        if (clients.openWindow) {
          console.log('[SW Push] Opening new window');
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
