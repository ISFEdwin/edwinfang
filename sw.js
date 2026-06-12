/**
 * Service Worker for ISFEdwin.github.io
 * Provides PWA support, caching, and offline functionality
 * Version: 2.0.0
 */

const CACHE_NAME = 'edwin-portfolio-v2.1';
const CACHE_VERSION = '2.1.0';

// Resources to cache immediately (precache)
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/photography.html',
  '/styles.css',
  '/i18n.js',
  '/terminal.js',
  '/visual-effects.js',
  '/i18n/en.json',
  '/i18n/zh-TW.json',
  '/i18n/zh-CN.json'
];

// Runtime cache patterns
const RUNTIME_CACHE_PATTERNS = [
  /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/,
  /\.(?:woff2?|eot|ttf|otf)$/,
  /\.(?:js|css)$/
];

// Install event - precache critical resources
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing version:', CACHE_VERSION);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Precaching resources');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        console.log('[Service Worker] Skip waiting');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[Service Worker] Precache failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating version:', CACHE_VERSION);
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] Claiming clients');
        return self.clients.claim();
      })
      .then(() => {
        // Notify all clients about the update
        return self.clients.matchAll();
      })
      .then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_UPDATED',
            version: CACHE_VERSION
          });
        });
      })
  );
});

// Fetch event - serve from cache with network fallback (Cache-first strategy)
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests (except for allowed patterns)
  const url = new URL(event.request.url);
  if (url.origin !== self.origin && !isAllowedCrossOrigin(url)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Return cached response if found
        if (cachedResponse) {
          console.log('[Service Worker] Serving from cache:', event.request.url);

          // Fetch in background to update cache (stale-while-revalidate)
          // safeBackgroundFetch never throws — fire and forget
          safeBackgroundFetch(event.request);

          return cachedResponse;
        }

        // Not in cache, fetch from network
        return fetchFromNetwork(event.request);
      })
  );
});

// Helper: Safe background fetch (stale-while-revalidate) — never throws
const safeBackgroundFetch = (request) => {
  const safeReq = request.clone();
  fetch(safeReq)
    .then(response => {
      if (!response || response.status !== 200 || response.type !== 'basic') {
        return;
      }
      if (shouldCache(safeReq.url)) {
        caches.open(CACHE_NAME)
          .then(cache => cache.put(safeReq, response.clone()))
          .catch(() => {});
      }
    })
    .catch(() => {}); // Silently ignore all background fetch failures
};

// Helper: Fetch from network with fallback (never rejects)
const fetchFromNetwork = (request) => {
  return fetch(request.clone())
    .then(response => {
      if (!response || response.status !== 200) {
        throw new Error('Network response was not ok');
      }

      // Cache the response if applicable
      if (response.type === 'basic' && shouldCache(request.url)) {
        const responseToCache = response.clone();
        caches.open(CACHE_NAME)
          .then(cache => cache.put(request, responseToCache))
          .catch(() => {});
      }

      return response;
    })
    .catch(error => {
      console.warn('[Service Worker] Network fetch failed:', request.url, error.message);

      // Return offline fallback for HTML requests
      if (request.headers.get('accept') && request.headers.get('accept').includes('text/html')) {
        return caches.match('/index.html');
      }

      // Return a fallback response for images
      if (request.url.match(/\.(?:png|jpg|jpeg|svg|gif|webp)$/)) {
        return createImageFallback();
      }

      return new Response('Network error', {
        status: 408,
        headers: { 'Content-Type': 'text/plain' }
      });
    });
};

// Helper: Check if URL should be cached
const shouldCache = (url) => {
  const parsedUrl = new URL(url);
  
  // Don't cache if it's a Chrome extension
  if (url.startsWith('chrome-extension://')) {
    return false;
  }
  
  // Don't cache analytics or external API calls
  if (url.includes('google-analytics.com') || 
      url.includes('analytics') ||
      url.includes('formspree.io')) {
    return false;
  }
  
  return true;
};

// Helper: Check if cross-origin is allowed
const isAllowedCrossOrigin = (url) => {
  const allowedOrigins = [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
    'https://ipapi.co'
  ];
  
  return allowedOrigins.includes(url.origin);
};

// Helper: Create image fallback
const createImageFallback = () => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">
      <rect width="400" height="300" fill="#0a0e17"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#5a5a5a" font-family="monospace">
        Image unavailable offline
      </text>
    </svg>
  `;
  
  return new Response(svg, {
    headers: { 'Content-Type': 'image/svg+xml' }
  });
};

// Listen for messages from the main thread
self.addEventListener('message', event => {
  console.log('[Service Worker] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[Service Worker] Skipping waiting');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME)
      .then(() => {
        console.log('[Service Worker] Cache cleared');
        event.ports[0].postMessage({ success: true });
      });
  }
});

// Push notification support (for future use)
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'New update available',
      icon: '/images/logo.png',
      badge: '/images/logo.png',
      vibrate: [200, 100, 200],
      data: {
        url: data.url || '/'
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'ISFEdwin', options)
    );
  }
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then(clientList => {
        const url = event.notification.data.url;
        
        // If a window is already open, focus it
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Otherwise, open a new window
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});
