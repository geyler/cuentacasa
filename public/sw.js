const CACHE_NAME = 'samy-store-pwa-v1.7.0';

const PRECACHE_ASSETS = [
  '/',
  '/app',
  '/login',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/maskable-512.png',
  '/images/logo-loading.png',
  '/images/logo-nav.png',
  '/images/store_hero_bg.png'
];

// Install event - Precache core app shell so installed PWA works 100% offline
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        PRECACHE_ASSETS.map((asset) => 
          cache.add(asset).catch((err) => console.warn('Precache skipped for asset:', asset, err))
        )
      );
    })
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

// Helper: Fetch with strict timeout (1.5 seconds for slow network fallback)
function fetchWithTimeout(request, timeoutMs = 1500) {
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
// 2. Navigation / HTML pages: Fast Network-First with 1.5s timeout, fallback to cached App Shell
// 3. Static Assets (/_next/, images, fonts, css, js): Cache-First / Stale-While-Revalidate with safe offline fallbacks
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Exclude API requests from SW cache
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  const isNavigation = event.request.mode === 'navigate' || 
                       (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html'));

  // 1. HTML Page Navigation Request Handling
  if (isNavigation) {
    event.respondWith(
      fetchWithTimeout(event.request, 1500)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // Slow network or offline: return exact URL match (ignoring query strings)
          const matched = await caches.match(event.request, { ignoreSearch: true });
          if (matched) return matched;

          // Otherwise return cached App Shell
          const appShell = (await caches.match('/app')) || (await caches.match('/')) || (await caches.match('/login'));
          if (appShell) return appShell;

          // Fallback offline HTML response
          return new Response(
            `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Samy Store - Offline</title><style>body{font-family:sans-serif;text-align:center;padding:40px;background:#F8FAFC;color:#0F172A}h1{color:#EC4899}button{padding:10px 20px;border-radius:99px;background:#EC4899;color:#fff;border:none;font-weight:bold;cursor:pointer}</style></head><body><h1>📶 Samy Store Offline</h1><p>La aplicación está operando 100% offline con tus datos guardados localmente.</p><button onclick="window.location.reload()">Reintentar Cargar</button></body></html>`,
            { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        })
    );
    return;
  }

  // 2. Static Assets (/_next/, icons, images, JS, CSS, fonts)
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
                        url.pathname.endsWith('.woff2') ||
                        url.pathname.endsWith('.ico');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          // Serve cached asset immediately, revalidate in background if online
          fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
              }
            })
            .catch(() => {});
          return cachedResponse;
        }

        // Asset not in cache yet: try fetching network
        return fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
            }
            return networkResponse;
          })
          .catch(() => {
            // Offline and asset missing: return safe 404 response instead of crashing respondWith
            return new Response('', { status: 404, statusText: 'Offline Asset Not Found' });
          });
      })
    );
    return;
  }
});
