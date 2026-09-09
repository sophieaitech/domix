/* Service worker de Domix.
   Buenaventura tiene zonas de señal débil, así que la app tiene que
   abrir aunque la red esté mala:
   - Lo propio de la app (páginas, estilos, iconos) se sirve de caché y
     se actualiza por detrás.
   - Los datos de Supabase NUNCA se cachean: un pedido viejo mostrado
     como actual es peor que un error honesto.
*/
const CACHE = 'domix-cliente-v1';
const BASICOS = ['/', '/manifest.json', '/icons/icon-192.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(BASICOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Datos en vivo: siempre de la red, nunca de caché.
  if (url.hostname.endsWith('supabase.co') || url.pathname.startsWith('/api/')) return;

  // Mapas y tipografías: sirve lo guardado y refresca por detrás.
  const externo = url.origin !== self.location.origin;

  e.respondWith(
    caches.match(req).then((guardado) => {
      const red = fetch(req)
        .then((res) => {
          if (res && res.status === 200 && (res.type === 'basic' || externo)) {
            const copia = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copia));
          }
          return res;
        })
        .catch(() => guardado);
      return guardado || red;
    })
  );
});
