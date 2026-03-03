// public/firebase-messaging-sw.js
// ✅ Firebase Cloud Messaging Service Worker
// Pastificio Nonna Claudia - Notifiche Push via FCM

// Import Firebase scripts (compat version per Service Worker)
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Configurazione Firebase
firebase.initializeApp({
  apiKey: "AIzaSyCyL4LWgD1dKiGRHmLrj2gJ9OFHdHDDZ-E",
  authDomain: "pastificio-nonna-claudia.firebaseapp.com",
  projectId: "pastificio-nonna-claudia",
  storageBucket: "pastificio-nonna-claudia.firebasestorage.app",
  messagingSenderId: "434978137418",
  appId: "1:434978137418:web:70936b4313e10a79ed0db3"
});

const messaging = firebase.messaging();
const FRONTEND_URL = self.location.origin;

// ═══════════════════════════════════════════════════════════════
// BACKGROUND MESSAGE HANDLER
// Gestisce le notifiche quando l'app NON è in primo piano
// ═══════════════════════════════════════════════════════════════
messaging.onBackgroundMessage((payload) => {
  console.log('[FCM-SW] Messaggio in background:', payload);

  const data = payload.data || {};
  const notification = payload.notification || {};

  // Tipo di notifica dal payload data
  const tipo = data.tipo || 'generico';

  const options = {
    body: data.corpo || notification.body || 'Nuova notifica',
    icon: data.icona || notification.icon || '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    tag: data.tag || `notifica-${Date.now()}`,
    renotify: true,
    requireInteraction: tipo === 'chiamata' || tipo === 'alert',
    vibrate: [200, 100, 200],
    data: {
      tipo: tipo,
      url: getUrlPerTipo(tipo, data),
      ...data
    },
    actions: getAzioniPerTipo(tipo)
  };

  const titolo = data.titolo || notification.title || '🍝 Pastificio Nonna Claudia';

  return self.registration.showNotification(titolo, options);
});

// ═══════════════════════════════════════════════════════════════
// NOTIFICATION CLICK - Click sulla notifica
// ═══════════════════════════════════════════════════════════════
self.addEventListener('notificationclick', (event) => {
  console.log('[FCM-SW] Click su notifica:', event.notification.tag);
  event.notification.close();

  const data = event.notification.data || {};
  const actionClicked = event.action;

  if (actionClicked === 'ignora') return;

  const targetUrl = data.url || FRONTEND_URL;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Se il gestionale è già aperto, focus e naviga
      for (const client of clients) {
        if (client.url.includes(FRONTEND_URL) && 'focus' in client) {
          client.postMessage({
            type: 'PUSH_NOTIFICATION_CLICK',
            data: data
          });
          return client.focus();
        }
      }
      // Altrimenti apri nuova tab
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════
function getUrlPerTipo(tipo, data) {
  switch (tipo) {
    case 'chiamata':
      return FRONTEND_URL + '/?action=chiamata';
    case 'alert':
      return FRONTEND_URL + '/?action=alert&id=' + (data.alertId || '');
    case 'nuovo_ordine':
    case 'ordine_modificato':
      return FRONTEND_URL + '/?action=ordine&id=' + (data.ordineId || '');
    default:
      return FRONTEND_URL;
  }
}

function getAzioniPerTipo(tipo) {
  switch (tipo) {
    case 'chiamata':
      return [
        { action: 'apri', title: '📞 Apri' },
        { action: 'ignora', title: 'Ignora' }
      ];
    case 'alert':
      return [
        { action: 'apri', title: '👀 Vedi' },
        { action: 'ignora', title: 'Ignora' }
      ];
    case 'nuovo_ordine':
    case 'ordine_modificato':
      return [
        { action: 'apri', title: '📦 Vedi ordine' },
        { action: 'ignora', title: 'Ignora' }
      ];
    default:
      return [{ action: 'apri', title: 'Apri' }];
  }
}