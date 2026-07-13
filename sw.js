// KMMX Control Panel - Service Worker
// Version 1.0.14

const CACHE_NAME = 'kmmx-control-v1.0.14';

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.png',
  '/favicon-hidden.png',
  '/asset/maskable_icon.png',
  '/asset/css/styles-main.css',
  '/asset/css/high-refresh-rate.css',
  '/asset/css/splash.css',
  '/asset/css/control-panel.css',
  '/asset/css/navigation.css',
  '/asset/css/pages.css',
  '/asset/svg/control-icon.svg',
  '/asset/svg/dot-array.svg',
  '/asset/svg/wave-icon.svg',
  '/asset/svg/bulb.svg',
  '/src/config/ble-config.js',
  '/src/config/expressions.js',
  '/src/config/mouth-states.js',
  '/src/managers/ble-manager.js',
  '/src/core/app.js',
  '/src/core/control.js',
  '/src/core/ble.js',
  '/src/core/navigation.js',
  '/src/utils/helpers.js'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;
  if (event.request.url.includes('googleapis.com') ||
      event.request.url.includes('gstatic.com')) {
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    if (cached) return cached;
    try {
      const response = await fetch(event.request);
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(event.request, response.clone());
      }
      return response;
    } catch {
      if (event.request.destination === 'document') return caches.match('/index.html');
    }
  })());
});
