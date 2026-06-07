/* Service Worker for Push Notifications */
self.addEventListener('push', function (event) {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'PlayPoints', body: event.data?.text() || 'You have a new offer' };
  }

  // Get userId from localStorage (set by app on login)
  const userId = data.userId || null;

  const title = data.title || 'PlayPoints Offers';
  const options = {
    body: data.body || 'Check latest offers now!',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: { url: data.url || '/', userId },
    vibrate: [100, 50, 100]
  };

  // Report delivery event to server if userId is available
  if (userId) {
    try {
      fetch('/make-server-549f93eb/notification-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'delivered', userId, title: data.title, body: data.body, url: data.url })
      });
    } catch (e) {
      // ignore
    }
  }

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/offers';
  const userId = (event.notification.data && event.notification.data.userId) || null;

  // Report click event to server if userId present
  if (userId) {
    try {
      fetch('/make-server-549f93eb/notification-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'click', userId, title: event.notification.title, body: event.notification.body, url })
      });
    } catch (e) {
      // ignore
    }
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // Check if there's already a window/tab open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window if not found
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
