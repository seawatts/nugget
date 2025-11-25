/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

const CACHE_VERSION = 'v1';
const CACHE_NAME = `nugget-cache-${CACHE_VERSION}`;
const LAST_NOTIFICATION_KEY = 'last-overdue-notification';

// Install event - cache essential assets
self.addEventListener('install', (_event: ExtendableEvent) => {
  console.log('[Service Worker] Install');
  self.skipWaiting();
});

// Activate event - clean up old caches and clear HTML cache on update
self.addEventListener('activate', (event: ExtendableEvent) => {
  console.log('[Service Worker] Activate');
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();

      // Delete old caches
      await Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      );

      // Clear HTML pages from current cache to ensure fresh content after update
      // This ensures users see updated HTML after service worker updates
      const cache = await caches.open(CACHE_NAME);
      const cachedRequests = await cache.keys();
      const htmlRequests = cachedRequests.filter((request) => {
        const url = new URL(request.url);
        return (
          url.pathname.startsWith('/app') &&
          !url.pathname.startsWith('/api') &&
          !url.pathname.startsWith('/trpc')
        );
      });

      // Delete HTML pages so they're fetched fresh
      await Promise.all(htmlRequests.map((request) => cache.delete(request)));

      await self.clients.claim();
    })(),
  );
});

// Fetch event - optimized caching strategies for PWA performance
self.addEventListener('fetch', (event: FetchEvent) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);
  const pathname = url.pathname;

  // Strategy 1: NetworkFirst with short timeout for baby dashboard routes
  // Tries fresh content first, falls back to cache if network is slow
  // This ensures HTML updates are visible while still being fast
  if (/^\/app\/babies\/[^/]+\/dashboard/.test(pathname)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const timeoutPromise = new Promise<Response | null>((resolve) => {
          setTimeout(() => resolve(null), 800); // 800ms timeout for instant feel
        });

        try {
          // Try network first with timeout
          const networkResponse = await Promise.race([
            fetch(event.request),
            timeoutPromise,
          ]);

          if (networkResponse?.ok) {
            // Cache successful responses
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          }

          // Network failed or timed out, try cache
          const cachedResponse = await cache.match(event.request);
          if (cachedResponse) {
            // Update cache in background if we have cached response
            // Use AbortController to prevent hanging on slow networks
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

            fetch(event.request, { signal: controller.signal })
              .then((freshResponse) => {
                clearTimeout(timeoutId);
                if (freshResponse.ok) {
                  cache.put(event.request, freshResponse.clone());
                }
              })
              .catch(() => {
                clearTimeout(timeoutId);
                // Ignore network errors in background update
              });
            return cachedResponse;
          }

          // Both failed, return error
          return (
            networkResponse ||
            new Response('Offline', {
              status: 503,
              statusText: 'Service Unavailable',
            })
          );
        } catch (_error) {
          // Network error, try cache
          const cachedResponse = await cache.match(event.request);
          if (cachedResponse) {
            return cachedResponse;
          }

          return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable',
          });
        }
      })(),
    );
    return;
  }

  // Strategy 2: StaleWhileRevalidate for /app route - instant redirect, update in background
  // The redirect is just HTML, so we can serve from cache instantly
  // Updates happen in background so redirect logic changes are picked up
  if (pathname === '/app' || pathname === '/app/') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(event.request);

        // Fetch fresh content in background (don't block)
        // Use AbortController to prevent hanging on slow networks
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const fetchPromise = fetch(event.request, { signal: controller.signal })
          .then((networkResponse) => {
            clearTimeout(timeoutId);
            if (networkResponse.ok) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => {
            clearTimeout(timeoutId);
            // Ignore network errors in background
            return null;
          });

        // Return cached response immediately if available (instant redirect)
        if (cachedResponse) {
          // Update cache in background without blocking
          void fetchPromise;
          return cachedResponse;
        }

        // No cache, wait for network (first load)
        const networkResponse = await fetchPromise;
        if (networkResponse) {
          return networkResponse;
        }

        return new Response('Offline', {
          status: 503,
          statusText: 'Service Unavailable',
        });
      })(),
    );
    return;
  }

  // Strategy 3: NetworkFirst for API calls with short timeout
  if (/^\/(api|trpc)\//.test(pathname)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const timeoutPromise = new Promise<Response | null>((resolve) => {
          setTimeout(() => resolve(null), 3000); // 3 second timeout
        });

        try {
          const networkResponse = await Promise.race([
            fetch(event.request),
            timeoutPromise,
          ]);

          if (networkResponse?.ok) {
            // Cache successful API responses
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          }

          // Network failed or timed out, try cache
          const cachedResponse = await cache.match(event.request);
          if (cachedResponse) {
            return cachedResponse;
          }

          // Both failed
          return (
            networkResponse ||
            new Response('Offline', {
              status: 503,
              statusText: 'Service Unavailable',
            })
          );
        } catch (_error) {
          // Network error, try cache
          const cachedResponse = await cache.match(event.request);
          if (cachedResponse) {
            return cachedResponse;
          }

          return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable',
          });
        }
      })(),
    );
    return;
  }

  // Strategy 4: NetworkFirst for other routes (default behavior)
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const networkResponse = await fetch(event.request);

        // Cache successful responses
        if (networkResponse.ok) {
          cache.put(event.request, networkResponse.clone());
        }

        return networkResponse;
      } catch (_error) {
        // If network fails, try cache
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // If both fail, return error response
        return new Response('Offline', {
          status: 503,
          statusText: 'Service Unavailable',
        });
      }
    })(),
  );
});

// Periodic Background Sync - Check for overdue activities
if ('periodicSync' in self.registration) {
  self.addEventListener('periodicsync', ((
    event: ExtendableEvent & { tag: string },
  ) => {
    if (event.tag === 'check-overdue-activities') {
      event.waitUntil(checkOverdueActivities());
    }
  }) as EventListener);
}

// Regular Background Sync fallback
self.addEventListener('sync', ((event: ExtendableEvent & { tag: string }) => {
  if (event.tag === 'check-overdue-activities-sync') {
    event.waitUntil(checkOverdueActivities());
  }
}) as EventListener);

// Push notification event
self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) {
    console.log('[Service Worker] Push event received but no data');
    return;
  }

  try {
    const data = event.data.json();

    // Build notification options compatible with iOS and other platforms
    // iOS may not support actions or vibrate, so we make them optional
    const options: NotificationOptions & {
      actions?: Array<{ action: string; title: string }>;
      vibrate?: number[];
    } = {
      badge: '/favicon-32x32.png',
      body: data.body,
      data: data.data || {},
      icon: '/android-chrome-192x192.png',
      tag: data.tag || 'nugget-notification',
    };

    // Add optional features that may not be supported on all platforms
    if (
      data.actions &&
      Array.isArray(data.actions) &&
      data.actions.length > 0
    ) {
      options.actions = data.actions;
    }

    // Vibrate is not supported on iOS, but we can include it for other platforms
    // The browser will ignore it if not supported
    if (data.vibrate !== false) {
      options.vibrate = [200, 100, 200];
    }

    event.waitUntil(
      self.registration
        .showNotification(data.title || 'Nugget', options)
        .catch((error) => {
          console.error('[Service Worker] Failed to show notification:', error);
        }),
    );
  } catch (error) {
    console.error(
      '[Service Worker] Error processing push notification:',
      error,
    );
  }
});

// Notification click event
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/app';

  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({
        includeUncontrolled: true,
        type: 'window',
      });

      // Check if there's already a window open
      for (const client of clients) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }

      // Open a new window if none exists
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })(),
  );
});

// Message event - handle messages from the app
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CHECK_OVERDUE_NOW') {
    event.waitUntil(checkOverdueActivities());
  }

  // Handle direct test notification requests (for iOS fallback)
  if (event.data && event.data.type === 'SHOW_TEST_NOTIFICATION') {
    event.waitUntil(
      self.registration
        .showNotification('🔔 Test Notification', {
          badge: '/favicon-32x32.png',
          body: event.data.body || 'This is a test notification from Nugget.',
          data: {
            url: '/app',
          },
          icon: '/android-chrome-192x192.png',
          tag: 'test-notification',
        })
        .catch((error) => {
          console.error(
            '[Service Worker] Failed to show test notification:',
            error,
          );
        }),
    );
  }
});

/**
 * Check for overdue activities and send notifications
 */
async function checkOverdueActivities(): Promise<void> {
  try {
    console.log('[Service Worker] Checking for overdue activities');

    // Get the last notification time from IndexedDB
    const lastNotificationTime = await getLastNotificationTime();
    const now = Date.now();

    // Don't spam notifications - wait at least 15 minutes between checks
    const MIN_INTERVAL = 15 * 60 * 1000; // 15 minutes
    if (lastNotificationTime && now - lastNotificationTime < MIN_INTERVAL) {
      console.log(
        '[Service Worker] Skipping check - too soon since last notification',
      );
      return;
    }

    // Fetch overdue activities from the API
    const response = await fetch('/api/activities/check-overdue', {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'GET',
    });

    if (!response.ok) {
      console.error(
        '[Service Worker] Failed to fetch overdue activities:',
        response.status,
      );
      return;
    }

    const data = await response.json();
    const overdueActivities: Array<{
      activityType: 'feeding' | 'sleep' | 'diaper' | 'pumping';
      babyName: string;
      babyId: string;
      overdueMinutes: number;
      nextExpectedTime: string;
    }> = data.overdueActivities || [];

    console.log(
      '[Service Worker] Found overdue activities:',
      overdueActivities.length,
    );

    // Send notifications for overdue activities
    if (overdueActivities.length > 0) {
      await setLastNotificationTime(now);

      for (const activity of overdueActivities) {
        await sendOverdueNotification(activity);
      }
    }
  } catch (error) {
    console.error('[Service Worker] Error checking overdue activities:', error);
  }
}

/**
 * Send a notification for an overdue activity
 */
async function sendOverdueNotification(activity: {
  activityType: 'feeding' | 'sleep' | 'diaper' | 'pumping';
  babyName: string;
  babyId: string;
  overdueMinutes: number;
  nextExpectedTime: string;
}): Promise<void> {
  const activityNames = {
    diaper: 'Diaper Change',
    feeding: 'Feeding',
    pumping: 'Pumping',
    sleep: 'Sleep',
  };

  const activityEmojis = {
    diaper: '👶',
    feeding: '🍼',
    pumping: '🤱',
    sleep: '😴',
  };

  const activityName = activityNames[activity.activityType];
  const emoji = activityEmojis[activity.activityType];

  const title = `${emoji} ${activityName} Overdue`;
  const body = `${activity.babyName} is ${activity.overdueMinutes} minutes overdue for ${activityName.toLowerCase()}`;

  // Build notification options compatible with iOS and other platforms
  const options: NotificationOptions & {
    actions?: Array<{ action: string; title: string }>;
    vibrate?: number[];
  } = {
    badge: '/favicon-32x32.png',
    body,
    data: {
      activityType: activity.activityType,
      babyId: activity.babyId,
      url: `/app/babies/${activity.babyId}`,
    },
    icon: '/android-chrome-192x192.png',
    tag: `overdue-${activity.activityType}-${activity.babyId}`,
  };

  // Add actions (may not be supported on iOS, but browser will ignore if not supported)
  options.actions = [
    {
      action: 'log',
      title: `Log ${activityName}`,
    },
    {
      action: 'dismiss',
      title: 'Dismiss',
    },
  ];

  // Vibrate is not supported on iOS, but we can include it for other platforms
  // The browser will ignore it if not supported
  options.vibrate = [200, 100, 200, 100, 200];

  // requireInteraction may be too aggressive for iOS, so we set it conditionally
  // iOS will handle this appropriately
  options.requireInteraction = true;

  try {
    await self.registration.showNotification(title, options);
  } catch (error) {
    console.error(
      '[Service Worker] Failed to show overdue notification:',
      error,
    );
  }
}

/**
 * Get the last notification time from IndexedDB
 */
async function getLastNotificationTime(): Promise<number | null> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(['settings'], 'readonly');
    const store = transaction.objectStore('settings');
    const request = store.get(LAST_NOTIFICATION_KEY);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve(request.result?.value || null);
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error(
      '[Service Worker] Error getting last notification time:',
      error,
    );
    return null;
  }
}

/**
 * Set the last notification time in IndexedDB
 */
async function setLastNotificationTime(time: number): Promise<void> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(['settings'], 'readwrite');
    const store = transaction.objectStore('settings');
    store.put({ key: LAST_NOTIFICATION_KEY, value: time });

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        resolve();
      };
      transaction.onerror = () => {
        reject(transaction.error);
      };
    });
  } catch (error) {
    console.error(
      '[Service Worker] Error setting last notification time:',
      error,
    );
  }
}

/**
 * Open IndexedDB database
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('nugget-sw-db', 1);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    };
  });
}

export {};
