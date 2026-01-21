/**
 * Service Worker Registration
 *
 * Handles registration, updates, and lifecycle of the service worker.
 * Provides user-friendly notifications for updates and offline status.
 */

interface ServiceWorkerConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onOffline?: () => void;
  onOnline?: () => void;
}

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

/**
 * Register service worker with configuration callbacks
 */
export function registerServiceWorker(config?: ServiceWorkerConfig) {
  // Only register in production or if explicitly enabled
  if (import.meta.env.MODE !== 'production' && !import.meta.env.VITE_SW_ENABLED) {
    console.log('[SW] Service worker disabled in development');
    return;
  }

  // Check for service worker support
  if (!('serviceWorker' in navigator)) {
    console.warn('[SW] Service workers not supported');
    return;
  }

  // Wait for page load
  window.addEventListener('load', () => {
    const swUrl = '/service-worker.js';

    if (isLocalhost) {
      checkValidServiceWorker(swUrl, config);
      navigator.serviceWorker.ready.then(() => {
        console.log('[SW] Service worker ready (localhost)');
      });
    } else {
      registerValidSW(swUrl, config);
    }

    // Setup online/offline listeners
    setupConnectionListeners(config);
  });
}

/**
 * Register a valid service worker
 */
function registerValidSW(swUrl: string, config?: ServiceWorkerConfig) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      console.log('[SW] Service worker registered:', registration.scope);

      // Check for updates on page focus
      window.addEventListener('focus', () => {
        registration.update();
      });

      // Check for updates periodically (every hour)
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000);

      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (!installingWorker) return;

        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // New service worker available
              console.log('[SW] New content available, please refresh');

              if (config?.onUpdate) {
                config.onUpdate(registration);
              } else {
                // Default: show notification
                showUpdateNotification(registration);
              }
            } else {
              // Content cached for offline use
              console.log('[SW] Content cached for offline use');

              if (config?.onSuccess) {
                config.onSuccess(registration);
              }
            }
          }
        };
      };
    })
    .catch((error) => {
      console.error('[SW] Registration failed:', error);
    });
}

/**
 * Check if service worker exists and is valid
 */
function checkValidServiceWorker(swUrl: string, config?: ServiceWorkerConfig) {
  fetch(swUrl, { headers: { 'Service-Worker': 'script' } })
    .then((response) => {
      const contentType = response.headers.get('content-type');

      if (
        response.status === 404 ||
        (contentType && contentType.indexOf('javascript') === -1)
      ) {
        // Service worker not found, unregister
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        // Service worker found, proceed
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log('[SW] No internet connection, running in offline mode');
    });
}

/**
 * Unregister service worker
 */
export function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        return registration.unregister();
      })
      .then(() => {
        console.log('[SW] Service worker unregistered');
      })
      .catch((error) => {
        console.error('[SW] Unregistration failed:', error);
      });
  }
}

/**
 * Show update notification to user
 */
function showUpdateNotification(registration: ServiceWorkerRegistration) {
  // Create notification element
  const notification = document.createElement('div');
  notification.id = 'sw-update-notification';
  notification.innerHTML = `
    <div style="
      position: fixed;
      bottom: 24px;
      right: 24px;
      max-width: 400px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      z-index: 9999;
      font-family: system-ui, -apple-system, sans-serif;
      animation: slideIn 0.3s ease-out;
    ">
      <div style="font-weight: 600; margin-bottom: 8px;">
        🎉 New version available!
      </div>
      <div style="font-size: 14px; opacity: 0.9; margin-bottom: 12px;">
        A new version of Steam Scout is ready. Refresh to get the latest features.
      </div>
      <div style="display: flex; gap: 8px;">
        <button id="sw-update-btn" style="
          flex: 1;
          padding: 8px 16px;
          background: white;
          color: #667eea;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s;
        " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
          Refresh Now
        </button>
        <button id="sw-dismiss-btn" style="
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: opacity 0.2s;
        " onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">
          Later
        </button>
      </div>
    </div>
    <style>
      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    </style>
  `;

  document.body.appendChild(notification);

  // Handle refresh button
  document.getElementById('sw-update-btn')?.addEventListener('click', () => {
    // Tell service worker to skip waiting
    registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  });

  // Handle dismiss button
  document.getElementById('sw-dismiss-btn')?.addEventListener('click', () => {
    notification.remove();
  });
}

/**
 * Setup online/offline connection listeners
 */
function setupConnectionListeners(config?: ServiceWorkerConfig) {
  let wasOffline = !navigator.onLine;

  window.addEventListener('online', () => {
    if (wasOffline) {
      console.log('[SW] Connection restored');

      if (config?.onOnline) {
        config.onOnline();
      } else {
        showConnectionNotification('online');
      }

      wasOffline = false;
    }
  });

  window.addEventListener('offline', () => {
    console.log('[SW] Connection lost');

    if (config?.onOffline) {
      config.onOffline();
    } else {
      showConnectionNotification('offline');
    }

    wasOffline = true;
  });

  // Initial check
  if (!navigator.onLine && config?.onOffline) {
    config.onOffline();
  }
}

/**
 * Show connection status notification
 */
function showConnectionNotification(status: 'online' | 'offline') {
  const isOnline = status === 'online';

  const notification = document.createElement('div');
  notification.className = 'sw-connection-notification';
  notification.innerHTML = `
    <div style="
      position: fixed;
      top: 24px;
      right: 24px;
      max-width: 320px;
      background: ${isOnline ? '#10b981' : '#ef4444'};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 9999;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 12px;
      animation: slideDown 0.3s ease-out;
    ">
      <span style="font-size: 20px;">
        ${isOnline ? '✓' : '⚠'}
      </span>
      <span style="font-weight: 500;">
        ${isOnline ? 'Back online' : 'You\'re offline'}
      </span>
    </div>
    <style>
      @keyframes slideDown {
        from {
          transform: translateY(-100px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
    </style>
  `;

  document.body.appendChild(notification);

  // Auto-remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideDown 0.3s ease-out reverse';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

/**
 * Clear all service worker caches
 */
export async function clearServiceWorkerCaches() {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    registration.active?.postMessage({ type: 'CLEAR_CACHE' });
    console.log('[SW] Cache clear requested');
  }
}

/**
 * Get service worker version
 */
export async function getServiceWorkerVersion(): Promise<string | null> {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();

      messageChannel.port1.onmessage = (event) => {
        resolve(event.data.version);
      };

      registration.active?.postMessage(
        { type: 'GET_VERSION' },
        [messageChannel.port2]
      );

      // Timeout after 1 second
      setTimeout(() => resolve(null), 1000);
    });
  }

  return null;
}
