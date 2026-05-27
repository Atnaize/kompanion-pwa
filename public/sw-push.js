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

    const { title, body, icon, badge, tag, data: notificationData } = data;

    // Tag precedence: explicit `tag` from the payload wins (lets the backend
    // route per-entity, e.g. `challenge:<uuid>` so all messages in one chat
    // collapse to a single banner instead of stacking per type).
    const resolvedTag = tag || notificationData?.type || 'default';

    event.waitUntil(
      (async () => {
        // Foreground suppression: if the user is already looking at the page
        // this push points to, skip the banner. The in-app view picks up the
        // change via its own polling/refresh — a banner on top would be
        // redundant and annoying (think: chat tab open while messages arrive).
        // Mentions still pop through; getting @'d is a "look at me NOW" signal
        // even when the page is open.
        const isMention = notificationData?.type === 'challenge_mention';
        if (!isMention) {
          const shouldSuppress = await isViewingTarget(notificationData);
          if (shouldSuppress) {
            console.log('[SW Push] Suppressed (foreground client on target URL)');
            return;
          }
        }

        const options = {
          body,
          icon: icon || '/pwa-192x192.svg',
          badge: badge || '/notification-badge.svg',
          data: notificationData,
          vibrate: [200, 100, 200],
          tag: resolvedTag,
          // Same-tag pushes are otherwise treated as separate banners on some
          // platforms — `renotify: false` is the default but spelling it out
          // makes the collapse contract explicit.
          renotify: false,
          requireInteraction: false,
        };

        console.log('[SW Push] Showing notification with options:', options);
        await self.registration.showNotification(title, options);
        console.log('[SW Push] Notification shown successfully');
      })()
    );
  } catch (error) {
    console.error('[SW Push] Error handling push notification:', error);
  }
});

/**
 * Returns true when at least one visible window client is already on the page
 * this notification would link to — meaning the user is staring at the very
 * thing being pushed and doesn't need a banner. Currently covers
 * challenge_message / challenge_invite / challenge_completed (path:
 * /challenges/<id>); extend the switch as new notification types deserve
 * suppression.
 */
async function isViewingTarget(notificationData) {
  if (!notificationData) return false;
  let targetPath = null;
  if (
    notificationData.type === 'challenge_message' &&
    typeof notificationData.challengeId === 'string'
  ) {
    targetPath = `/challenges/${notificationData.challengeId}`;
  } else if (
    notificationData.type === 'challenge_invite' &&
    typeof notificationData.challengeId === 'string'
  ) {
    targetPath = `/challenges/${notificationData.challengeId}`;
  }
  if (!targetPath) return false;

  const windowClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const client of windowClients) {
    // `visibilityState === 'visible'` is the spec-correct signal for "the
    // user can actually see this tab". `focused` is platform-flaky on
    // Android. We accept either as "foreground".
    const visible = client.visibilityState === 'visible' || client.focused === true;
    if (!visible) continue;
    try {
      const u = new URL(client.url);
      if (u.pathname === targetPath) return true;
    } catch {
      // Bad URL — ignore.
    }
  }
  return false;
}

self.addEventListener('notificationclick', (event) => {
  console.log('[SW Push] Notification clicked:', event.notification);
  event.notification.close();

  // Determine URL to open based on notification data
  const notificationData = event.notification.data;
  let urlPath = '/';

  if (notificationData?.type === 'challenge_invite') {
    urlPath = notificationData.challengeId
      ? `/challenges/${notificationData.challengeId}`
      : '/challenges';
  } else if (notificationData?.type === 'challenge_message') {
    urlPath = notificationData.challengeId
      ? `/challenges/${notificationData.challengeId}#chat`
      : '/challenges';
  } else if (notificationData?.type === 'challenge_mention') {
    urlPath = notificationData.challengeId
      ? `/challenges/${notificationData.challengeId}#chat`
      : '/challenges';
  } else if (notificationData?.type === 'challenge_joined') {
    urlPath = notificationData.challengeId
      ? `/challenges/${notificationData.challengeId}`
      : '/challenges';
  } else if (notificationData?.type === 'challenge_progress') {
    urlPath = '/challenges';
  } else if (notificationData?.type === 'challenge_activity') {
    urlPath = '/challenges';
  } else if (notificationData?.type === 'challenge_starting') {
    urlPath = '/challenges';
  } else if (notificationData?.type === 'challenge_ending') {
    urlPath = '/challenges';
  } else if (notificationData?.type === 'challenge_cancelled') {
    urlPath = '/challenges';
  } else if (notificationData?.type === 'challenge_completed') {
    urlPath = '/challenges';
  } else if (notificationData?.type === 'achievement_unlocked') {
    urlPath = '/achievements';
  } else if (notificationData?.type === 'achievement') {
    urlPath = '/achievements';
  } else if (notificationData?.type === 'friend_request') {
    urlPath = '/friends';
  } else if (notificationData?.type === 'friend_accepted') {
    urlPath = notificationData.userId ? `/users/${notificationData.userId}` : '/friends';
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
