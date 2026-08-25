const CACHE_NAME = 'samy-store-pwa-v5';

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

// Install event - Precache core app shell & static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate event - Claim clients immediately & purge old cache versions
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

// Fetch event - Smart Cache-First for static assets & Navigation Fallback for offline mode
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Exclude API requests (/api/sync, /api/auth) from SW cache to prevent stale data
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // 1. Static Assets (_next/static, images, icons, fonts) -> Cache First, Revalidate in background
  if (
    url.pathname.startsWith('/_next/static') || 
    url.pathname.startsWith('/icons/') || 
    url.pathname.startsWith('/images/') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js')
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        }).catch(() => null);

        // Return cached response instantly if available, else wait for network
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 2. Page Navigations & HTML Requests -> Network First with Instant Cache Fallback
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
        // Offline Fallback: return exact matched route or root PWA app shell
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          return caches.match('/') || caches.match('/app');
        });
      })
  );
});
