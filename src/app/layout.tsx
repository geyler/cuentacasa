import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Samy Store - POS & Gestión de Tienda PWA",
  description: "Aplicación PWA / WebAPK 100% offline para POS, ventas, gestión de inventario y finanzas de Samy Store.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Samy Store",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#1A73E8",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/icons/icon-192.png" type="image/png" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        {/* Inyección síncrona inmediata de la paleta seleccionada antes del primer renderizado para evitar cualquier destello (FOUC) */}
        <script
          id="cuentacasa-instant-theme"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var css = localStorage.getItem('cuentacasa_cached_theme_css');
                  if (!css) {
                    var p = localStorage.getItem('cuentacasa_theme_color');
                    if (!p) {
                      var raw = localStorage.getItem('cuentacasa_db');
                      if (raw) {
                        var d = JSON.parse(raw);
                        if (d && d.settings && d.settings.primaryColor) p = d.settings.primaryColor;
                      }
                    }
                    if (p) {
                      css = ':root { --brand-primary: ' + p + ' !important; --md-sys-color-primary: ' + p + ' !important; }';
                    }
                  }
                  if (css) {
                    var s = document.createElement('style');
                    s.id = 'cuentacasa-theme-style';
                    s.textContent = css;
                    document.head.appendChild(s);
                  }
                } catch(e) {}
              })();
            `
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('error', function(e) {
                if (typeof navigator !== 'undefined' && !navigator.onLine) return;
                if (e.message && (e.message.includes('Loading chunk') || e.message.includes('Failed to fetch dynamically imported module'))) {
                  window.location.reload();
                }
              });
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  var isLocalhost = Boolean(
                    window.location.hostname === 'localhost' ||
                    window.location.hostname === '[::1]' ||
                    window.location.hostname === '127.0.0.1'
                  );

                  if (isLocalhost) {
                    // Desactivar caché y service worker en desarrollo local para trabajo 100% fluido
                    navigator.serviceWorker.getRegistrations().then(function(registrations) {
                      for (var i = 0; i < registrations.length; i++) {
                        registrations[i].unregister();
                      }
                    });
                    if (typeof caches !== 'undefined') {
                      caches.keys().then(function(keys) {
                        keys.forEach(function(key) {
                          caches.delete(key);
                        });
                      });
                    }
                    console.log('⚡ Desarrollo local en localhost: Service Worker y Caché desactivados para trabajo fluido.');
                    return;
                  }

                  // Producción / PWA instalada: registrar service worker offline
                  if (typeof caches !== 'undefined') {
                    caches.keys().then(function(keys) {
                      keys.forEach(function(key) {
                        if (key !== 'samy-store-pwa-v1.9.2') {
                          caches.delete(key);
                        }
                      });
                    });
                  }
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('Samy Store PWA Service Worker registered with scope: ', registration.scope);
                      registration.update();
                    },
                    function(err) {
                      console.log('ServiceWorker registration failed: ', err);
                    }
                  );
                });
              }
            `
          }}
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}

