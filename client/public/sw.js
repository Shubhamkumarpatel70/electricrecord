const CACHE_NAME = 'electricity-record-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icon.svg'
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // Cache each URL individually to handle failures gracefully
        return Promise.allSettled(
          urlsToCache.map(url => 
            cache.add(url).catch(err => {
              console.log('Failed to cache:', url, err);
              return null;
            })
          )
        );
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Skip service worker for uploads, API calls, and external resources
  // These should always be fetched from network without service worker interference
  if (
    url.pathname.startsWith('/uploads/') ||
    url.pathname.startsWith('/api/') ||
    url.origin !== self.location.origin
  ) {
    // For uploads and API, bypass service worker completely
    // Don't call event.respondWith, let the browser handle it normally
    return;
  }
  
  // Only intercept requests for app resources (HTML, JS, CSS, etc.)
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        return fetch(event.request).catch(err => {
          console.error('Fetch failed:', err);
          // If fetch fails and we don't have a cache, return a basic error response
          return new Response('Network error', { 
            status: 408, 
            statusText: 'Request Timeout' 
          });
        });
      })
      .catch(err => {
        console.error('Service worker fetch error:', err);
        // Try to fetch from network as fallback
        return fetch(event.request).catch(() => {
          return new Response('Network error', { 
            status: 408, 
            statusText: 'Request Timeout' 
          });
        });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
}); 