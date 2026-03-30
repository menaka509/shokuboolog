const CACHE_NAME = 'shokuboolog-v2';
const ASSETS = [
  'index.html',
  'css/app.css',
  'js/config.js',
  'js/state.js',
  'js/api.js',
  'js/ui.js',
  'js/map.js',
  'js/app.js',
  'manifest.json',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});
