// public/sw.js - ✅ Service Worker per Web Push Notifications
// Pastificio Nonna Claudia - Notifiche native

const CACHE_VERSION = 'v1';
const FRONTEND_URL = self.location.origin;

// ═══════════════════════════════════════════════════════════════
// INSTALL
// ═══════════════════════════════════════════════════════════════
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker installato');
  self.skipWaiting(); // Attiva immediatamente
});

// ═══════════════════════════════════════════════════════════════
// ACTIVATE
// ═══════════════════════════════════════════════════════════════
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker attivato');
  event.waitUntil(self.clients.claim()); // Prendi controllo di tutte le pagine
});

// ═══════════════════════════════════════════════════════════════
// PUSH - Ricezione notifica dal server
// ═══════════════════════════════════════════════════════════════
self.addEventListener('push', (event) => {
  console.log('[SW] Push ricevuto:', event.data?.text());

  let payload;
  try {
    payload = event.data?.json();
  } catch (e) {
    payload = {
      titolo: '🍝 Pastificio Nonna Claudia',
      corpo: event.data?.text() || 'Nuova notifica',
      tipo: 'generico'
    };
  }

  const options = {
    body: payload.corpo || payload.body || 'Nuova notifica',
    icon: payload.icona || '/icons/icon-192.png',
    badge: payload.badge || '/icons/badge-72.png',
    tag: payload.tag || `notifica-${Date.now()}`,
    renotify: true,
    requireInteraction: payload.requireInteraction || false,
    vibrate: [200, 100, 200],
    data: {
      ...payload.data,
      tipo: payload.tipo,
      url: getUrlPerTipo(payload)
    },
    actions: getAzioniPerTipo(payload)
  };

  event.waitUntil(
    self.registration.showNotification(
      payload.titolo || '🍝 Pastificio Nonna Claudia',
      options
    )
  );
});

// ═══════════════════════════════════════════════════════════════
// NOTIFICATION CLICK - Click sulla notifica
// ═══════════════════════════════════════════════════════════════
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Click su notifica:', event.notification.tag);

  event.notification.close();

  const data = event.notification.data || {};
  const actionClicked = event.action;
  let targetUrl = FRONTEND_URL;

  // Determina URL in base all'azione/tipo
  if (actionClicked === 'apri' || !actionClicked) {
    targetUrl = data.url || FRONTEND_URL;
  } else if (actionClicked === 'ignora') {
    return; // Non fare nulla
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Se il gestionale è già aperto, focus su quella tab
      for (const client of clients) {
        if (client.url.includes(FRONTEND_URL) && 'focus' in client) {
          // Naviga alla pagina giusta
          client.postMessage({
            type: 'PUSH_NOTIFICATION_CLICK',
            data: data
          });
          return client.focus();
        }
      }

      // Altrimenti, apri nuova tab
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// ═══════════════════════════════════════════════════════════════
// NOTIFICATION CLOSE - Notifica chiusa/ignorata
// ═══════════════════════════════════════════════════════════════
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notifica chiusa:', event.notification.tag);
});

// ═══════════════════════════════════════════════════════════════
// MESSAGE - Messaggi dal frontend
// ═══════════════════════════════════════════════════════════════
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function getUrlPerTipo(payload) {
  const tipo = payload.tipo || payload.data?.action;
  
  switch (tipo) {
    case 'chiamata':
      return FRONTEND_URL + '/?action=chiamata';
    case 'alert':
      return FRONTEND_URL + '/?action=alert&id=' + (payload.data?.alertId || '');
    case 'nuovo_ordine':
    case 'ordine_modificato':
      return FRONTEND_URL + '/?action=ordine&id=' + (payload.data?.ordineId || '');
    default:
      return FRONTEND_URL;
  }
}

function getAzioniPerTipo(payload) {
  const tipo = payload.tipo;
  
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
      return [
        { action: 'apri', title: 'Apri' }
      ];
  }
}