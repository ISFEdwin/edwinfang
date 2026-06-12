/**
 * Service Worker for ISFEdwin.github.io
 * Provides PWA support, caching, and offline functionality
 * Version: 2.4.0
 */

const CACHE_NAME = 'edwin-portfolio-v2.6';
const CACHE_VERSION = '2.4.0';

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
  '/i18n/zh-CN.json',
  '/images/main_placeholder.jpg',
  '/images/main_medium.jpg',
  '/images/logo.png',
  '/images/logo-192.png',
  '/images/logo-512.png',
  '/manifest.json'
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

  const url = new URL(event.request.url);

  // Explicitly skip Google Fonts — let the browser handle them directly
  // This avoids 408 timeouts and opaque response issues
  if (url.origin === 'https://fonts.googleapis.com' ||
      url.origin === 'https://fonts.gstatic.com') {
    return;
  }

  // Skip other cross-origin requests (except for allowed patterns)
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

// Helper: Fetch from network with fallback (never rejects for HTML, rejects for images)
const fetchFromNetwork = (request) => {
  const isHTML = request.headers.get('accept') && request.headers.get('accept').includes('text/html');

  // Fetch from network
  const fetchPromise = fetch(request.clone())
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
    });

  // Only add error handler for HTML requests (return offline fallback)
  if (isHTML) {
    return fetchPromise.catch(error => {
      console.warn('[Service Worker] Network fetch failed:', request.url, error.message);
      return caches.match('/index.html');
    });
  }

  // For non-HTML requests (images, fonts, etc.), let the error propagate naturally
  // The browser will handle the error (trigger onerror handler for images)
  return fetchPromise;
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
  // Don't intercept Google Fonts - let the browser handle them
  // This avoids CORS issues and opaque response errors
  if (url.origin === 'https://fonts.googleapis.com' ||
      url.origin === 'https://fonts.gstatic.com') {
    return false;
  }
  
  const allowedOrigins = [
    'https://ipapi.co'
  ];
  
  return allowedOrigins.includes(url.origin);
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
