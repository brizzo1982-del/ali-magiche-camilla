// Funziona anche senza internet dopo la prima visita
const CACHE = 'ali-magiche-v2';
const FILES = ['./', 'index.html', 'css/style.css', 'manifest.json', 'icon.svg', 'icon-192.png', 'icon-512.png',
  'js/core.js', 'js/unicorn.js', 'js/data.js', 'js/world.js', 'js/play.js', 'js/screens.js', 'js/main.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  // cancella solo le vecchie cache di questo gioco: sullo stesso dominio ci sono anche gli altri giochi
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k.startsWith('ali-magiche')).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // chiede sempre al server se c'è una versione nuova (no-cache), così gli aggiornamenti arrivano subito
  e.respondWith(fetch(e.request, { cache: 'no-cache' }).then(r => {
    const copy = r.clone();
    if (r.ok || r.type === 'opaque') caches.open(CACHE).then(c => c.put(e.request, copy));
    return r;
  }).catch(() => caches.match(e.request).then(m => m || caches.match('index.html'))));
});
