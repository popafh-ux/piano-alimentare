/* piano-v11 — Da questa versione:
   - all'installazione i file vengono scaricati SEMPRE dalla rete (cache:"reload"),
     mai dalla cache HTTP del telefono: niente più versioni vecchie "congelate";
   - la pagina usa la strategia "prima la rete": se sei online vedi subito
     l'ultima versione pubblicata, la cache serve solo quando sei offline.
   Aggiorna comunque il numero di versione a ogni release per pulire le cache vecchie. */
const CACHE = "piano-v11";
const ASSETS = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS.map(u => new Request(u, {cache: "reload"}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;

  // Pagina (navigazioni): prima la rete, cache solo se offline
  if (e.request.mode === "navigate" || e.request.destination === "document") {
    e.respondWith(
      fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => { c.put(e.request, copy); c.put("./index.html", res.clone()); }).catch(() => {});
        return res;
      }).catch(() =>
        caches.match(e.request).then(hit => hit || caches.match("./index.html"))
      )
    );
    return;
  }

  // Altri file (icone, manifest…): prima la cache, poi la rete
  e.respondWith(
    caches.match(e.request).then(hit =>
      hit ||
      fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match("./index.html"))
    )
  );
});
