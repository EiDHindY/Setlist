// ── SERVICE WORKER ──────────────────────────────────────────────────
// Minimal SW for PWA installability + basic caching

const CACHE_NAME = 'setlist-v2';

const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// Install: precache shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first with cache fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip API calls, Next.js assets/HMR, auth, and external domains
  if (
    request.url.includes('/api/') ||
    request.url.includes('/_next/') ||
    request.url.includes('/auth/callback') ||
    request.url.includes('supabase') ||
    request.url.includes('googleapis.com') ||
    request.url.includes('itunes.apple.com') ||
    request.url.includes('api.deezer.com') ||
    request.url.includes('youtube.com')
  ) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(request).then((cached) => cached || caches.match('/'));
      })
  );
});
