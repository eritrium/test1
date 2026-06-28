const CACHE_NAME = 'taxi-gestionale-v2'; // Aggiornato a v2 per forzare il reset
const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// Installazione e attivazione immediata del nuovo Service Worker
self.addEventListener('install', (e) => {
  self.skipWaiting(); // Costringe il nuovo SW a prendere il controllo subito
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// Pulizia delle vecchie cache (cancella la v1 automaticamente)
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim()) // Prende il controllo immediato di tutte le schede/app aperte
  );
});

// Strategia Network-First con fallback su Cache (più sicura per gli aggiornamenti grafici)
self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // Se la rete risponde, aggiorna la cache e restituisce la risposta
        if (response.status === 200) {
          const resClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, resClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Se sei offline, usa la cache
        return caches.match(e.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (e.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});