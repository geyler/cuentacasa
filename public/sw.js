const CACHE_NAME = 'samy-store-pwa-v1.6.0';

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

// Helper: Fetch with strict timeout (e.g. 1.2 seconds for slow network fallback)
function fetchWithTimeout(request, timeoutMs = 1200) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('SW Fetch Timeout'));
    }, timeoutMs);

    fetch(request)
      .then((response) => {
        clearTimeout(timer);
        resolve(response);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// Fetch event:
// 1. Exclude API requests (/api/)
// 2. Static Assets (/_next/, images, fonts, css, js): Cache-First / Stale-While-Revalidate for 0ms loading
// 3. Navigation / HTML pages: Fast Network-First with 1.2s timeout fallback to cache
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Exclude API requests from SW cache
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Static Assets: Serve from cache immediately, update cache in background
  const isStaticAsset = url.pathname.startsWith('/_next/') || 
                        url.pathname.startsWith('/icons/') || 
                        url.pathname.startsWith('/images/') ||
                        url.pathname.endsWith('.png') ||
                        url.pathname.endsWith('.jpg') ||
                        url.pathname.endsWith('.jpeg') ||
                        url.pathname.endsWith('.webp') ||
                        url.pathname.endsWith('.svg') ||
                        url.pathname.endsWith('.css') ||
                        url.pathname.endsWith('.js') ||
                        url.pathname.endsWith('.woff2');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
            }
            return networkResponse;
          })
          .catch(() => {});

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // HTML Page Navigation: Try network with 1.2s timeout, fallback to cache instantly if connection is slow
  event.respondWith(
    fetchWithTimeout(event.request, 1200)
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
        // Slow network or offline: return matched cached asset or app shell immediately
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          return caches.match('/app') || caches.match('/') || caches.match('/login');
        });
      })
  );
});

