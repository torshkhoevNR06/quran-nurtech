// Service worker: офлайн-доступ к прочитанным страницам + шелл/шрифты/данные.
// Стратегия: ассеты/шрифты — cache-first; данные — stale-while-revalidate;
// HTML/навигация — network-first (свежесть онлайн, кэш офлайн). Внешние (аудио CDN) не трогаем.
const V = 'quran-v1';
const ASSET = /\/(assets|fonts)\//;
const DATA = /\/data\//;

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (e) => {
  e.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== V).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // аудио-CDN и прочие внешние — мимо

  if (ASSET.test(url.pathname)) {
    e.respondWith(cacheFirst(req));
  } else if (DATA.test(url.pathname)) {
    e.respondWith(staleWhileRevalidate(req));
  } else if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    e.respondWith(networkFirst(req));
  } else {
    e.respondWith(cacheFirst(req));
  }
});

async function cacheFirst(req) {
  const c = await caches.open(V);
  const hit = await c.match(req);
  if (hit) return hit;
  try {
    const res = await fetch(req);
    if (res.ok) c.put(req, res.clone());
    return res;
  } catch {
    return hit || Response.error();
  }
}
async function networkFirst(req) {
  const c = await caches.open(V);
  try {
    const res = await fetch(req);
    if (res.ok) c.put(req, res.clone());
    return res;
  } catch {
    return (await c.match(req)) || (await c.match('/')) || Response.error();
  }
}
async function staleWhileRevalidate(req) {
  const c = await caches.open(V);
  const hit = await c.match(req);
  const net = fetch(req)
    .then((res) => {
      if (res.ok) c.put(req, res.clone());
      return res;
    })
    .catch(() => hit);
  return hit || net;
}
