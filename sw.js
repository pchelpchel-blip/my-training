const VERSION = 6;
const CACHE = `my-training-v${VERSION}`;
const SHELL = './index.html';
const ASSETS = [
  SHELL,
  `./style.css?v=${VERSION}`,
  `./app.js?v=${VERSION}`,
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];
const shellPaths = ['./', SHELL].map(path => new URL(path, self.registration.scope).pathname);

self.addEventListener('install', event => {
  const requests = ASSETS.map(path => new Request(path, { cache: 'reload' }));
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(requests)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => /^my-training-v\d+$/.test(key) && key !== CACHE).map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});

async function loadShell(request) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  try {
    const response = await fetch(request, { cache: 'no-cache', signal: controller.signal });
    if (response.status < 500) return response;
  } catch {
    // Use the precached version when the network is unavailable.
  } finally {
    clearTimeout(timeout);
  }
  const cache = await caches.open(CACHE);
  return (await cache.match(SHELL)) ?? Response.error();
}

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (request.mode === 'navigate' && shellPaths.includes(url.pathname)) {
    event.respondWith(loadShell(request));
    return;
  }
  event.respondWith(caches.open(CACHE).then(cache =>
    cache.match(request).then(response => response || fetch(request))
  ));
});
