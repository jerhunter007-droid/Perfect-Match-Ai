// Perfect Match service worker.
//
// Scope: this exists to make the app installable ("Add to Home Screen")
// and to speed up repeat loads of hashed static assets. It deliberately
// does NOT cache pages, API calls, or Supabase responses — this app is
// real-time (chat, live match stacks, auth state), so stale cached data
// would be worse than no caching at all. Bump CACHE_NAME to force every
// client to drop old cached assets on the next deploy.
const CACHE_NAME = "pm-static-v1";
const STATIC_PATH_PATTERNS = [/^\/_next\/static\//, /^\/icon\.svg$/, /^\/manifest\.json$/];

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // never touch cross-origin (Supabase, etc.)
  if (!STATIC_PATH_PATTERNS.some((re) => re.test(url.pathname))) return; // pages/API go straight to network

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) cache.put(request, response.clone());
      return response;
    })()
  );
});
