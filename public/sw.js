// Service Worker for Game Bird PWA
// Use timestamp in cache name to force cache bust on every deploy
const CACHE_VERSION = 'v' + Math.floor(Date.now() / 60000); // Changes every minute
const CACHE_NAME = 'game-bird-' + CACHE_VERSION;

// Don't cache HTML - always fetch from network
const urlsToCache = [
  '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('SW installing with cache:', CACHE_NAME);
  // Skip waiting - activate immediately
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache:', CACHE_NAME);
        return cache.addAll(urlsToCache).catch((err) => {
          console.log('Cache.addAll error (expected for dynamic URLs):', err);
          // Don't fail install if some URLs can't be cached
          return Promise.resolve();
        });
      })
  );
});

// Fetch event - network first for HTML, cache for assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // For HTML - always fetch from network (never cache)
  if (url.pathname === '/' || url.pathname === '/index.html') {
    event.respondWith(
      fetch(request).catch(() => {
        console.log('Offline - no cached HTML');
        return new Response('Offline');
      })
    );
    return;
  }
  
  // For assets - try cache first, fallback to network
  event.respondWith(
    caches.match(request)
      .then((response) => {
        return response || fetch(request);
      })
      .catch(() => fetch(request))
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('SW activating, cleaning old caches');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheName.includes(CACHE_VERSION)) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
