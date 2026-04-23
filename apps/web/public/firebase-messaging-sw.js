// firebase-messaging-sw.js
// Service Worker para notificaciones push en background (iPhone Home Screen + Android)
// @intervention ARCH-20260423-01

importScripts('https://www.gstatic.com/firebasejs/11.0.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.0.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: self.FIREBASE_API_KEY || "placeholder",
  authDomain: self.FIREBASE_AUTH_DOMAIN || "placeholder",
  projectId: "frank-chat-elecsa",
  storageBucket: "frank-chat-elecsa.appspot.com",
  messagingSenderId: "40776791792",
  appId: "1:40776791792:web:4dfdcd78541403b79a7435",
});

const messaging = firebase.messaging();

// Manejar notificaciones en background (app cerrada o en segundo plano)
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Notificación en background recibida:', payload);

  const { title, body, icon } = payload.notification || {};

  self.registration.showNotification(title || '🔔 Nueva conversación', {
    body: body || 'Tienes una conversación que requiere tu atención.',
    icon: icon || '/elecsa-icon.png',
    badge: '/elecsa-icon.png',
    tag: 'elecsa-handoff',       // Agrupa notificaciones del mismo tipo
    renotify: true,               // Vuelve a notificar aunque ya haya una del mismo tag
    data: payload.data || {},
  });
});

// Al hacer clic en la notificación, abrir/enfocar la app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const convId = event.notification.data?.conversationId;
  const url = convId
    ? `https://frank-chat-elecsa.vercel.app/dashboard?conv=${convId}`
    : 'https://frank-chat-elecsa.vercel.app/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('frank-chat-elecsa') && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
