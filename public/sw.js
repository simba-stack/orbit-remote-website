// Orbit Remote bridge-chat service worker — minimal app-shell cache.
const CACHE = "orbit-chat-v1";
const SHELL = ["/chat", "/chat.html", "/styles.css", "/manifest.webmanifest", "/favicon.svg"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  let url;
  try { url = new URL(req.url); } catch (err) { return; }

  // Never touch the WebSocket or cross-origin / non-GET requests.
  if (req.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.protocol === "ws:" || url.protocol === "wss:") return;
  if (url.pathname.startsWith("/api") || url.pathname.startsWith("/dl") || url.pathname.startsWith("/download")) return;

  // Network-first, fall back to cache (offline app shell).
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match("/chat")))
  );
});
