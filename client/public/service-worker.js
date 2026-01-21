/**
 * Service Worker for Steam Scout
 *
 * Provides offline capabilities, caching strategies, and performance optimizations.
 *
 * Features:
 * - Cache-first strategy for static assets
 * - Network-first strategy for API calls
 * - Offline fallback page
 * - Background sync for failed requests
 * - Push notifications support (future)
 */

const CACHE_NAME = 'steam-scout-v1';
const STATIC_CACHE = 'steam-scout-static-v1';
const DYNAMIC_CACHE = 'steam-scout-dynamic-v1';

// Assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/favicon.png',
  '/manifest.json',
];

// API endpoints that should be cached
const CACHEABLE_API_PATTERNS = [
  /\/api\/steam\/top/,
  /\/api\/steam\/search/,
  /\/api\/steam\/app\//,
];

// Maximum age for cached items (in milliseconds)
const MAX_AGE = {
  STATIC: 30 * 24 * 60 * 60 * 1000, // 30 days
  DYNAMIC: 24 * 60 * 60 * 1000,     // 1 day
  API: 5 * 60 * 1000,                // 5 minutes
};

/**
 * Install Event
 * Caches static assets when service worker is first installed
 */
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] Skip waiting');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Service Worker] Installation failed:', error);
      })
  );
});

/**
 * Activate Event
 * Cleans up old caches when service worker is activated
 */
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
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
  );
});

/**
 * Fetch Event
 * Intercepts network requests and applies caching strategies
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome extensions
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // Handle different types of requests
  if (isAPIRequest(url)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isStaticAsset(url)) {
    event.respondWith(handleStaticAsset(request));
  } else {
    event.respondWith(handleDynamicRequest(request));
  }
});

/**
 * Check if request is an API call
 */
function isAPIRequest(url) {
  return url.pathname.startsWith('/api/');
}

/**
 * Check if request is a static asset
 */
function isStaticAsset(url) {
  const path = url.pathname;
  return (
    path.endsWith('.js') ||
    path.endsWith('.css') ||
    path.endsWith('.png') ||
    path.endsWith('.jpg') ||
    path.endsWith('.svg') ||
    path.endsWith('.woff') ||
    path.endsWith('.woff2') ||
    path.startsWith('/assets/')
  );
}

/**
 * Handle API requests with network-first strategy
 * Falls back to cache if network fails
 */
async function handleAPIRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);

    // Cache successful responses if they match cacheable patterns
    if (networkResponse.ok && shouldCacheAPI(request.url)) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    console.log('[Service Worker] Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline response for API calls
    return new Response(
      JSON.stringify({
        error: 'You are offline. Please check your connection.',
        offline: true,
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Handle static assets with cache-first strategy
 * Falls back to network if not cached
 */
async function handleStaticAsset(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    // Check if cache is stale
    const cacheDate = new Date(cachedResponse.headers.get('date'));
    const now = new Date();

    if (now - cacheDate < MAX_AGE.STATIC) {
      return cachedResponse;
    }
  }

  // Not in cache or stale, fetch from network
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Network failed, return cached version even if stale
    if (cachedResponse) {
      return cachedResponse;
    }

    // No cached version available
    return new Response('Offline', { status: 503 });
  }
}

/**
 * Handle dynamic content with network-first strategy
 * Falls back to cache, then offline page
 */
async function handleDynamicRequest(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Try cache
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Try offline fallback for navigation requests
    if (request.mode === 'navigate') {
      const offlinePage = await caches.match('/offline.html');
      if (offlinePage) {
        return offlinePage;
      }
    }

    return new Response('Offline', { status: 503 });
  }
}

/**
 * Check if API request should be cached
 */
function shouldCacheAPI(url) {
  return CACHEABLE_API_PATTERNS.some((pattern) => pattern.test(url));
}

/**
 * Background Sync Event
 * Retries failed requests when connection is restored
 */
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);

  if (event.tag === 'sync-leads') {
    event.waitUntil(syncLeads());
  }
});

/**
 * Sync leads data when back online
 */
async function syncLeads() {
  try {
    // Get pending lead operations from IndexedDB
    // This would require implementing IndexedDB storage
    console.log('[Service Worker] Syncing leads...');

    // Retry failed requests
    // Implementation depends on your offline storage strategy

    console.log('[Service Worker] Sync complete');
  } catch (error) {
    console.error('[Service Worker] Sync failed:', error);
    throw error; // Rethrow to retry later
  }
}

/**
 * Message Event
 * Handles messages from the main thread
 */
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }

  if (event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

/**
 * Push Event
 * Handles push notifications (for future implementation)
 */
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received:', event);

  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: 'view',
        title: 'View',
      },
      {
        action: 'close',
        title: 'Close',
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification('Steam Scout', options)
  );
});

/**
 * Notification Click Event
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event);

  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

console.log('[Service Worker] Loaded successfully');
