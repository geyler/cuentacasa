const CACHE_NAME = 'samy-store-pwa-v11';

const PRECACHE_ASSETS = [
  '/',
  '/app',
  '/login',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/maskable-512.png',
  '/images/logo-loading.png',
  '/images/logo-nav.png',
  '/images/store_hero_bg.png'
];

// Install event - Precache core app shell so installed PWA works 100% offline
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('Precache partial fail, continuing:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate event - Purge old caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event:
// 1. Network-First for GET requests: Try network to get fresh code. If successful, update cache.
// 2. If network fails (Offline): Instantly return matched cached response or root PWA app shell!
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Exclude API requests (/api/) from SW cache
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Offline Fallback: return matched cached asset or app shell when offline!
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          return caches.match('/') || caches.match('/app');
        });
      })
  );
});
