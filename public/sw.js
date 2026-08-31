/**
 * FindBack PH service worker — deliberately minimal and conservative.
 *
 * Strategy: network-first for navigations with an offline fallback page, and
 * cache-first for same-origin static assets (/_next/static, /icons). We never
 * cache API routes, Supabase responses, or map tiles — this app is real-time
 * by design, so stale data would be worse than no data.
 *
 * Bump CACHE_VERSION whenever the offline shell or fallback changes.
 */

const CACHE_VERSION = "findback-ph-v1";
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.add(OFFLINE_URL))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Only ever handle same-origin requests; Supabase / tiles / CDNs pass through.
  if (url.origin !== self.location.origin) return;
  // Never intercept dynamic or authenticated data.
  if (url.pathname.startsWith("/api/") || url.pathname.includes("supabase")) return;

  // Navigations: network first, offline fallback page when the network fails.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => response)
        .catch(async () => {
          const cache = await caches.open(CACHE_VERSION);
          const cached = (await cache.match(request)) || (await cache.match(OFFLINE_URL));
          return cached || Response.error();
        })
    );
    return;
  }

  // Immutable build assets: cache-first (hashed filenames make this safe).
  const isStaticAsset =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.webmanifest";

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const copy = response.clone();
            caches
              .open(CACHE_VERSION)
              .then((cache) => cache.put(request, copy))
              .catch(() => {});
            return response;
          })
      )
    );
  }
});
