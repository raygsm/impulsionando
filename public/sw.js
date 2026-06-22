/* Impulsionando — Service Worker (PWA) v1
   Estratégia:
   - precache do app shell mínimo (manifest + ícones + offline.html)
   - network-first p/ navegações (fallback /offline.html)
   - stale-while-revalidate p/ assets estáticos (/_build/, /assets/, ícones)
   - bypass total p/ /api/, /auth, supabase, mercadopago e qualquer POST
   - handler de push notifications (payload JSON {title, body, url, tag})
   - click em notificação foca aba existente ou abre URL alvo
*/
const CACHE = "impulsionando-v1";
const SHELL = [
  "/offline.html",
  "/manifest.webmanifest",
  "/pwa-icon-192.png",
  "/pwa-icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  );
});

function bypass(url) {
  const u = new URL(url);
  if (u.origin !== self.location.origin) return true;
  if (u.pathname.startsWith("/api/")) return true;
  if (u.pathname.startsWith("/_serverFn/")) return true;
  if (u.pathname.startsWith("/auth")) return true;
  return false;
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  if (bypass(req.url)) return;

  // Navegações: network-first
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match("/offline.html")),
    );
    return;
  }

  // Assets estáticos: stale-while-revalidate
  const isStatic =
    req.url.includes("/_build/") ||
    req.url.includes("/assets/") ||
    /\.(?:js|css|woff2?|png|jpg|jpeg|svg|webp|ico)$/.test(new URL(req.url).pathname);

  if (!isStatic) return;

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req);
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200) cache.put(req, res.clone());
          return res;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});

self.addEventListener("push", (event) => {
  let payload = { title: "Impulsionando", body: "Você tem uma nova notificação.", url: "/" };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    if (event.data) payload.body = event.data.text();
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/pwa-icon-192.png",
      badge: "/pwa-icon-192.png",
      tag: payload.tag || "impulsionando",
      data: { url: payload.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        const u = new URL(client.url);
        if (u.origin === self.location.origin && "focus" in client) {
          client.navigate(target);
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
