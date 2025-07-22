
const CACHE_NAME = "ssk-pwa-v1";
const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./styles.css",
  "./script.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];
self.addEventListener("install", evt => {
  evt.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});
self.addEventListener("fetch", evt => {
  evt.respondWith(caches.match(evt.request).then(r => r || fetch(evt.request)));
});
self.addEventListener("activate", evt => {
  evt.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => k !== CACHE_NAME && caches.delete(k))))
  );
  self.clients.claim();
});
