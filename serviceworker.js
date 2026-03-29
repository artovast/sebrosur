var CACHE_NAME = 'sebrosur-pwa';
var ASSETS = [
  '/sebrosur/',
  '/sebrosur/index.html',
  '/sebrosur/manifest.json',
  '/sebrosur/icon-192.png',
  '/sebrosur/icon-512.png',
];

// Install — cache semua asset statis
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate — hapus cache lama
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// Fetch — cache first untuk asset statis,
// network first untuk API call ke Apps Script
self.addEventListener('fetch', function(e) {
  var url = e.request.url;

  // API call ke Apps Script — selalu dari network
  if (url.indexOf('script.google.com') !== -1) {
    e.respondWith(
      fetch(e.request).catch(function() {
        return new Response(
          JSON.stringify({ error: 'Tidak ada koneksi internet.' }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  // Asset statis — cache first
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      return cached || fetch(e.request).then(function(response) {
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(e.request, clone);
        });
        return response;
      });
    }).catch(function() {
      // Offline fallback
      return caches.match('/sebrosur-app/index.html');
    })
  );
});
