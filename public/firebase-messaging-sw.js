/* Firebase Cloud Messaging Service Worker - firebase-messaging-sw.js */
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

let messagingInitialized = false;

// Receive Firebase config from the main app via postMessage
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG' && !messagingInitialized) {
    try {
      const config = event.data.config;
      if (!config || !config.apiKey || config.apiKey === 'mock-firebase-api-key') {
        console.log('[FCM SW] Mock config – skipping Firebase init');
        return;
      }
      firebase.initializeApp(config);
      const messaging = firebase.messaging();
      messagingInitialized = true;

      // Handle background messages (app is in background or closed)
      messaging.onBackgroundMessage((payload) => {
        const title = payload.notification?.title || 'PlayPoints';
        const body = payload.notification?.body || 'You have a new notification';
        const url = payload.data?.url || '/';
        const userId = payload.data?.userId || null;

        // Report delivery to server
        if (userId) {
          fetch('/make-server-549f93eb/notification-event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'delivered', userId, title, body, url }),
          }).catch(() => {});
        }

        self.registration.showNotification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          data: { url, userId },
          vibrate: [100, 50, 100],
        });
      });

      console.log('[FCM SW] Firebase Messaging initialized successfully');
    } catch (err) {
      console.error('[FCM SW] Failed to initialize Firebase:', err);
    }
  }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/offers';
  const userId = event.notification.data?.userId || null;

  // Report click event
  if (userId) {
    fetch('/make-server-549f93eb/notification-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'click',
        userId,
        title: event.notification.title,
        body: event.notification.body,
        url,
      }),
    }).catch(() => {});
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
