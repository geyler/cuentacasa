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
        <link id="cuentacasa-app-favicon" rel="icon" href="/icons/icon-192.png" type="image/png" />
        <link id="cuentacasa-apple-touch-icon" rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Cinzel:wght@600;700;800;900&family=Dancing+Script:wght@700&family=Great+Vibes&family=Montserrat:wght@600;700;800;900&family=Playfair+Display:ital,wght@0,600;0,700;0,800;0,900;1,700&family=Poppins:wght@600;700;800;900&display=swap" rel="stylesheet" />
        {/* Inyección síncrona inmediata de la paleta, favicons, fuentes y textos de identidad antes del primer pintado (Cero FOUC) */}
        <script
          id="cuentacasa-instant-theme"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // 1. Restaurar paleta de colores CSS inmediatamente
                  var css = localStorage.getItem('cuentacasa_cached_theme_css');
                  if (!css) {
                    var p = localStorage.getItem('cuentacasa_theme_color');
                    if (!p && document.cookie) {
                      var mTheme = document.cookie.match(/cuentacasa_theme=([^;]+)/);
                      if (mTheme) {
                        try { p = decodeURIComponent(mTheme[1]); } catch(e) {}
                      }
                    }
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

                  // 2. Restaurar personalización de tienda, favicons y fuentes de logotipo inmediatamente
                  var rawCust = localStorage.getItem('cuentacasa_store_customization');
                  if (!rawCust && document.cookie) {
                    var match = document.cookie.match(/cuentacasa_customization=([^;]+)/);
                    if (match) {
                      try { rawCust = decodeURIComponent(match[1]); } catch(e) {}
                    }
                  }
                  if (!rawCust) {
                    var rawDb = localStorage.getItem('cuentacasa_db');
                    if (rawDb) {
                      var d2 = JSON.parse(rawDb);
                      if (d2 && d2.settings) {
                        rawCust = JSON.stringify({
                          storeName: d2.settings.storeName || d2.settings.appName,
                          logoSquareUrl: d2.settings.storeLogoSquare,
                          logoFontFamily: d2.settings.storeLogoFontFamily,
                          heroBadgeText: d2.settings.heroBadgeText,
                          heroTitle: d2.settings.heroTitle,
                          heroSubtitle: d2.settings.heroSubtitle
                        });
                      }
                    }
                  }

                  if (rawCust) {
                    var cust = JSON.parse(rawCust);
                    window.__CUENTACASA_STORE_CUSTOMIZATION__ = cust;

                    // Tipografía personalizada del logotipo
                    if (cust.logoFontFamily) {
                      document.documentElement.style.setProperty('--store-logo-font', cust.logoFontFamily);
                    }

                    // Título de la pestaña en el navegador
                    if (cust.storeName) {
                      document.title = cust.storeName;
                    }

                    // Favicon e icono de la app procesado
                    var iconUrl = cust.logoSquareUrl || localStorage.getItem('cuentacasa_app_favicon');
                    if (iconUrl) {
                      var fav = document.getElementById('cuentacasa-app-favicon');
                      if (fav) fav.href = iconUrl;
                      var apple = document.getElementById('cuentacasa-apple-touch-icon');
                      if (apple) apple.href = iconUrl;
                    }
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

