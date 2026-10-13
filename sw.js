/* MEMEVerso service worker — fuerza actualización de la app */
const SW_VERSION = '1.5.0';
const CACHE_NAME = 'memeverso-offline-v' + SW_VERSION;

const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './media-config.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => Promise.all(CORE.map((u) => cache.add(u).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() =>
        self.clients.matchAll({ type: 'window' }).then((clients) => {
          clients.forEach((c) => c.postMessage({ type: 'SW_ACTIVATED', version: SW_VERSION }));
        })
      )
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data && event.data.type === 'GET_VERSION') {
    event.source && event.source.postMessage({ type: 'SW_VERSION', version: SW_VERSION });
  }
});

function isHTMLRequest(req) {
  const url = new URL(req.url);
  if (req.mode === 'navigate') return true;
  if (url.pathname.endsWith('.html') || url.pathname.endsWith('/')) return true;
  const dest = req.destination;
  return dest === 'document' || dest === 'script' || dest === '';
}

function isMedia(req) {
  const p = new URL(req.url).pathname.toLowerCase();
  return /\.(mp3|mp4|webm|png|jpg|jpeg|webp|gif|svg|woff2?)$/.test(p) ||
    p.includes('/audio/') || p.includes('/video/') || p.includes('/icons/') || p.includes('/archivos/');
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // HTML / JS de la app: red primero (así se actualiza en el PC)
  if (isHTMLRequest(req) && !isMedia(req)) {
    event.respondWith(
      fetch(req)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return response;
        })
        .catch(() => caches.match(req).then((c) => c || caches.match('./index.html')))
    );
    return;
  }

  // Media y estáticos: caché primero, luego red
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        }
        return response;
      }).catch(() => cached);
    })
  );
});
