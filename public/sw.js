/*
 * Service worker for the shop and admin apps.
 * - Makes both installable as full-screen apps (a fetch handler is required by some browsers).
 * - Caches build files and photos so repeat visits and page switches load instantly.
 * Pages and /api are always fetched fresh (orders, stock and admin data must never be stale).
 */
const VERSION = "v1";
const STATIC = `static-${VERSION}`;
const MEDIA = `media-${VERSION}`;

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([STATIC, MEDIA]);
      for (const key of await caches.keys()) if (!keep.has(key)) await caches.delete(key);
      await self.clients.claim();
    })(),
  );
});

const OFFLINE_HTML = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Offline</title><body style="margin:0;display:grid;place-items:center;min-height:100vh;background:#f6ede3;color:#3b2a20;font:16px system-ui;text-align:center;padding:24px">
<div><p style="font-size:22px;margin:0 0 8px">You're offline</p><p style="margin:0 0 20px;color:#6b5546">Check your internet connection and try again.</p>
<button onclick="location.reload()" style="border:0;border-radius:999px;padding:12px 24px;background:#3b2a20;color:#fff;font:inherit">Try again</button></div>`;

async function cacheFirst(request) {
  const cache = await caches.open(STATIC);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok) cache.put(request, res.clone());
  return res;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(MEDIA);
  const hit = await cache.match(request);
  const fresh = fetch(request)
    .then((res) => {
      if (res.ok) cache.put(request, res.clone());
      return res;
    })
    .catch(() => hit);
  return hit || fresh;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => new Response(OFFLINE_HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } })));
    return;
  }
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request));
    return;
  }
  if (/^\/(home|stock|demo|brand)\//.test(url.pathname) || /^\/api\/img\//.test(url.pathname) || /\.(png|webp|jpg|jpeg|svg|woff2)$/.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
