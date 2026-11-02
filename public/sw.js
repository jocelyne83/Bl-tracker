// public/sw.js
self.addEventListener('push', function (event) {
  const data = event.data ? event.data.json() : {};
  const title = data.title || '📺 ¡Nuevo capítulo hoy!';
  const options = {
    body: data.body || 'Hay una serie programada para transmitirse hoy.',
    icon: data.icon || '/favicon.ico',
    badge: '/favicon.ico',
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/') // Al hacer clic abre la app
  );
});