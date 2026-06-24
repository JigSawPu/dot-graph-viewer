const CACHE_VERSION = 'dotcanvas-studio-v7-feature-panels';
const APP_SHELL = [
  './',
  './index.html',
  './styles.css?v=7',
  './app.js?v=7',
  './manifest.webmanifest',
  './offline.html',
  './sample.dot',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  'https://cdn.jsdelivr.net/npm/cytoscape@3.33.0/dist/cytoscape.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(async cache => {
      for (const url of APP_SHELL) {
        try { await cache.add(url); }
        catch (error) { console.warn('DotCanvas could not precache', url, error); }
      }
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_VERSION).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put('./index.html', copy));
          return response;
        })
        .catch(async () =>
          (await caches.match(event.request)) ||
          (await caches.match('./index.html')) ||
          (await caches.match('./offline.html'))
        )
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      const network = fetch(event.request).then(response => {
        if (response && (response.ok || response.type === 'opaque')) {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(event.request, copy));
        }
        return response;
      });
      return cached || network.catch(() => caches.match('./offline.html'));
    })
  );
});
