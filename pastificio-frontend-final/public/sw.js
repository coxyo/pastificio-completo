// sw.js - ✅ FIX 19/01/2026: Rimossi file non esistenti dalla cache
const CACHE_NAME = 'pastificio-v2'; // ✅ Cambiato versione per forzare update
const urlsToCache = [
  '/'
  // ✅ RIMOSSI: manifest.json, icon-192x192.png, icon-512x512.png
  // Questi file causavano errore 'addAll' perché non esistono
];

// Installazione Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cache opened');
        return cache.addAll(urlsToCache).catch((err) => {
          console.error('[SW] Cache addAll failed:', err);
          // Non bloccare l'installazione se fallisce
          return Promise.resolve();
        });
      })
  );
  // Forza attivazione immediata
  self.skipWaiting();
});

// Attivazione Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Prendi controllo di tutti i client immediatamente
      return self.clients.claim();
    })
  );
});

// Intercettazione richieste
self.addEventListener('fetch', (event) => {
  // Skip per richieste non-GET
  if (event.request.method !== 'GET') return;
  
  // Skip per API calls
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - ritorna risposta
        if (response) {
          console.log('[SW] Cache hit:', event.request.url);
          return response;
        }

        // Cache miss - fetch from network
        return fetch(event.request).then((response) => {
          // Controlla se risposta valida
          if (!response || response.status !== 200) {
            return response;
          }

          // Clona la risposta
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            })
            .catch((err) => {
              console.error('[SW] Cache put failed:', err);
            });

          return response;
        }).catch((err) => {
          console.error('[SW] Fetch failed:', err);
          // Pagina offline
          return new Response('Offline - Connessione non disponibile', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain; charset=utf-8'
            })
          });
        });
      })
  );
});