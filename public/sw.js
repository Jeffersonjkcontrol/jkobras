// Service worker mínimo do Obras Gestão.
// Estratégia conservadora: só faz cache de ASSETS ESTÁTICOS (nunca HTML autenticado,
// para não servir página de outro usuário em aparelho compartilhado). Habilita a
// instalação do PWA (precisa de um handler de fetch) e acelera o carregamento offline
// dos assets já visitados.
const CACHE = "obras-static-v1";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((chaves) => Promise.all(chaves.filter((c) => c !== CACHE).map((c) => caches.delete(c))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const ehAssetEstatico = url.pathname.startsWith("/_next/static") || url.pathname.startsWith("/icons");
  if (!ehAssetEstatico) return; // navegações e /api sempre vão à rede

  event.respondWith(
    caches.match(req).then(
      (cacheado) =>
        cacheado ||
        fetch(req).then((res) => {
          const copia = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copia)).catch(() => {});
          return res;
        })
    )
  );
});
