const CACHE_NAME = 'lifelogger-v5';
const ASSETS = [
  '/',
  '/index.html',
  '/app.js'
];

self.addEventListener('install', (e) => {
  self.skipWaiting(); // Force waiting service worker to become active
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim()); // Force active service worker to control clients
  // Clean up old caches
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      }));
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request))
  );
});