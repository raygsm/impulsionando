const VERSION = "grupo-evr-pwa-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Privacy-first policy: intentionally no fetch interception or caching here.
// Clinical, auth, payment and pharmacy data must remain network-controlled.
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
