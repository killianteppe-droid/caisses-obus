/* Service worker — Caisses d'Obus
   Met tous les fichiers en cache à l'installation, puis sert
   l'application depuis le cache : elle fonctionne sans Internet.
   Pour publier une mise à jour, changez simplement VERSION. */

const VERSION = "caisses-obus-v4";

const FICHIERS = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./apple-touch-icon.png",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(VERSION)
      .then((cache) => cache.addAll(FICHIERS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((cles) => Promise.all(cles.filter((c) => c !== VERSION).map((c) => caches.delete(c))))
      .then(() => self.clients.claim())
  );
});

/* Stratégie « cache d'abord » : instantané et 100 % hors ligne */
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Ouverture de l'app (navigation) : toujours la page en cache
  if (req.mode === "navigate") {
    event.respondWith(
      caches.match("./index.html").then((rep) => rep || fetch(req))
    );
    return;
  }

  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((rep) => {
      if (rep) return rep;
      return fetch(req).then((reseau) => {
        if (reseau && reseau.ok) {
          const copie = reseau.clone();
          caches.open(VERSION).then((cache) => cache.put(req, copie));
        }
        return reseau;
      });
    })
  );
});
