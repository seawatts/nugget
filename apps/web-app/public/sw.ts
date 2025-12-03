/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

const CACHE_VERSION = 'v1';
const CACHE_NAME = `nugget-cache-${CACHE_VERSION}`;
const LAST_NOTIFICATION_KEY = 'last-overdue-notification';
const LAST_DASHBOARD_ROUTE_KEY = 'last-dashboard-route';
const LAST_BABY_ID_KEY = 'last-baby-id';
const LAST_ROUTE_MAX_AGE_MS = 12 * 60 * 60 * 1000; // 12 hours
const BABY_DASHBOARD_REGEX = /^\/app\/babies\/[^/]+\/dashboard/;
const FAMILY_ROUTE_REGEX = /^\/app\/family\/[^/]+/;
const LAST_ROUTE_MESSAGE = 'SET_LAST_ROUTE';
const LAST_BABY_ID_MESSAGE = 'SET_LAST_BABY_ID';

// Install event - cache essential assets
self.addEventListener('install', (event: ExtendableEvent) => {
  console.log('[Service Worker] Install');
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        // Cache essential shell assets
        await cache.addAll(['/app', '/offline']).catch((error) => {
          console.warn(
            '[Service Worker] Failed to precache some shell assets',
            error,
          );
        });

        // Try to cache dashboard route if we have babyId in IndexedDB
        // This is best-effort and won't block install if it fails
        try {
          const babyId = await getLastBabyId();
          if (babyId) {
            const dashboardUrl = `/app/babies/${babyId}/dashboard`;
            // Don't await - let it cache in background
            void cache
              .add(new URL(dashboardUrl, self.location.origin).toString())
              .catch(() => {
                // Silently fail - dashboard will be cached on first visit
              });
          }
        } catch {
          // Ignore - dashboard will be cached on first visit
        }
      } catch (error) {
        console.warn('[Service Worker] Failed to precache shell', error);
      }
    })(),
  );
  self.skipWaiting();
});

// Activate event - clean up old caches and clear HTML cache on update
// BUT preserve dashboard routes for instant loading
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
      // BUT preserve dashboard routes for instant PWA loading
      const cache = await caches.open(CACHE_NAME);
      const cachedRequests = await cache.keys();
      const htmlRequests = cachedRequests.filter((request) => {
        const url = new URL(request.url);
        // Keep dashboard routes cached for instant loading
        const isDashboardRoute = BABY_DASHBOARD_REGEX.test(url.pathname);
        return (
          !isDashboardRoute &&
          url.pathname.startsWith('/app') &&
          !url.pathname.startsWith('/api') &&
          !url.pathname.startsWith('/trpc')
        );
      });

      // Delete non-dashboard HTML pages so they're fetched fresh
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
  const isNavigationRequest = event.request.mode === 'navigate';

  if (isNavigationRequest && (pathname === '/app' || pathname === '/app/')) {
    event.respondWith(handleAppEntry(event));
    return;
  }

  // Strategy 1: CacheFirst for baby dashboard routes
  // Serves cached content instantly, updates in background
  // This ensures instant loading while keeping content fresh
  if (BABY_DASHBOARD_REGEX.test(pathname)) {
    rememberDashboardPath(pathname);
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);

        // Check cache first (instant serve)
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
          // Serve cached response immediately, update in background
          void (async () => {
            try {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 5000);
              const networkResponse = await fetch(event.request, {
                signal: controller.signal,
              }).catch(() => null);
              clearTimeout(timeoutId);

              if (networkResponse?.ok) {
                await cache.put(event.request, networkResponse.clone());
              }
            } catch (error) {
              // Ignore background update errors
              console.warn('[Service Worker] Background update failed', error);
            }
          })();

          return cachedResponse;
        }

        // No cache, fetch from network
        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse?.ok) {
            await cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        } catch (_error) {
          // Network failed, return error
          return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable',
          });
        }
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

/**
 * Extract babyId from cookie header (faster than IndexedDB)
 */
function getBabyIdFromCookie(request: Request): string | null {
  try {
    const cookieHeader = request.headers.get('Cookie');
    if (!cookieHeader) return null;

    // Look for nugget:last-baby-id cookie
    const match = cookieHeader.match(/nugget:last-baby-id=([^;]+)/);
    return match?.[1] ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

async function handleAppEntry(event: FetchEvent): Promise<Response> {
  const cache = await caches.open(CACHE_NAME);

  // Strategy 1: Check for ANY cached dashboard route FIRST (instant, no async operations)
  // This is the fastest path - we check cache before any IndexedDB or cookie reads
  const cachedRequests = await cache.keys();
  for (const cachedRequest of cachedRequests) {
    const url = new URL(cachedRequest.url);
    if (BABY_DASHBOARD_REGEX.test(url.pathname)) {
      // Found a cached dashboard route - serve it instantly
      const cachedResponse = await cache.match(cachedRequest);
      if (cachedResponse) {
        // Serve cached dashboard immediately, update in background
        void (async () => {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            const networkResponse = await fetch(cachedRequest, {
              signal: controller.signal,
            }).catch(() => null);
            clearTimeout(timeoutId);

            if (networkResponse?.ok) {
              await cache.put(cachedRequest, networkResponse.clone());
            }
          } catch (error) {
            // Ignore background update errors
            console.warn('[Service Worker] Background update failed', error);
          }
        })();

        return cachedResponse;
      }
    }
  }

  // Strategy 2: Try to get babyId from cookie (faster than IndexedDB)
  const babyIdFromCookie = getBabyIdFromCookie(event.request);
  if (babyIdFromCookie) {
    const dashboardUrl = `/app/babies/${babyIdFromCookie}/dashboard`;
    const dashboardRequest = new Request(
      new URL(dashboardUrl, self.location.origin).toString(),
    );

    // Check cache for dashboard route - CacheFirst strategy (instant serve)
    const cachedDashboardResponse = await cache.match(dashboardRequest);
    if (cachedDashboardResponse) {
      // Serve cached dashboard immediately, update in background
      void (async () => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          const networkResponse = await fetch(dashboardRequest, {
            signal: controller.signal,
          }).catch(() => null);
          clearTimeout(timeoutId);

          if (networkResponse?.ok) {
            await cache.put(dashboardRequest, networkResponse.clone());
          }
        } catch (error) {
          // Ignore background update errors
          console.warn('[Service Worker] Background update failed', error);
        }
      })();

      return cachedDashboardResponse;
    }

    // No cache but we have babyId - redirect directly to dashboard
    return Response.redirect(
      new URL(dashboardUrl, self.location.origin).toString(),
      302,
    );
  }

  // Strategy 3: Fallback to IndexedDB (slower, but still faster than network)
  const babyId = await getLastBabyId();
  if (babyId) {
    const dashboardUrl = `/app/babies/${babyId}/dashboard`;
    const dashboardRequest = new Request(
      new URL(dashboardUrl, self.location.origin).toString(),
    );

    // Check cache for dashboard route - CacheFirst strategy (instant serve)
    const cachedDashboardResponse = await cache.match(dashboardRequest);
    if (cachedDashboardResponse) {
      // Serve cached dashboard immediately, update in background
      void (async () => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          const networkResponse = await fetch(dashboardRequest, {
            signal: controller.signal,
          }).catch(() => null);
          clearTimeout(timeoutId);

          if (networkResponse?.ok) {
            await cache.put(dashboardRequest, networkResponse.clone());
          }
        } catch (error) {
          // Ignore background update errors
          console.warn('[Service Worker] Background update failed', error);
        }
      })();

      return cachedDashboardResponse;
    }

    // No cache but we have babyId - redirect directly to dashboard
    return Response.redirect(
      new URL(dashboardUrl, self.location.origin).toString(),
      302,
    );
  }

  // Strategy 4: Try last dashboard route from IndexedDB
  const lastRoute = await getLastDashboardRoute();
  if (lastRoute) {
    const lastRouteRequest = new Request(
      new URL(lastRoute, self.location.origin).toString(),
    );
    const cachedRouteResponse = await cache.match(lastRouteRequest);
    if (cachedRouteResponse) {
      // Serve cached route immediately, update in background
      void (async () => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          const networkResponse = await fetch(lastRouteRequest, {
            signal: controller.signal,
          }).catch(() => null);
          clearTimeout(timeoutId);

          if (networkResponse?.ok) {
            await cache.put(lastRouteRequest, networkResponse.clone());
          }
        } catch (error) {
          // Ignore background update errors
          console.warn('[Service Worker] Background update failed', error);
        }
      })();

      return cachedRouteResponse;
    }

    // If we have a route but no cache, redirect to it
    return Response.redirect(
      new URL(lastRoute, self.location.origin).toString(),
      302,
    );
  }

  // Strategy 5: No cached route, fetch /app and let it redirect server-side
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  const networkResponse = await fetch(event.request, {
    signal: controller.signal,
  }).catch(() => null);
  clearTimeout(timeoutId);

  if (networkResponse?.ok) {
    await cache.put(event.request, networkResponse.clone());
    if (networkResponse.redirected) {
      const redirectedPath = extractPathFromUrl(networkResponse.url);
      if (redirectedPath && isPersistableDashboardPath(redirectedPath)) {
        void setLastDashboardRoute(redirectedPath);
      }
    }
    return networkResponse;
  }

  // Check for any cached /app response as last resort
  const cachedResponse = await cache.match(event.request);
  if (cachedResponse) {
    return cachedResponse;
  }

  return new Response('Offline', {
    status: 503,
    statusText: 'Service Unavailable',
  });
}

function rememberDashboardPath(pathname: string): void {
  if (isPersistableDashboardPath(pathname)) {
    void setLastDashboardRoute(pathname);
  }
}

function isPersistableDashboardPath(pathname: string): boolean {
  if (BABY_DASHBOARD_REGEX.test(pathname)) {
    return true;
  }

  if (FAMILY_ROUTE_REGEX.test(pathname)) {
    return true;
  }

  return false;
}

function extractPathFromUrl(urlString: string): string | null {
  try {
    const parsed = new URL(urlString);
    const normalizedPath = `${parsed.pathname}${parsed.search}`;
    return normalizedPath.startsWith('/')
      ? normalizedPath
      : `/${normalizedPath}`;
  } catch {
    return null;
  }
}

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
  if (
    event.data &&
    event.data.type === LAST_ROUTE_MESSAGE &&
    typeof event.data.path === 'string' &&
    isPersistableDashboardPath(event.data.path)
  ) {
    event.waitUntil(setLastDashboardRoute(event.data.path));
  }

  if (
    event.data &&
    event.data.type === LAST_BABY_ID_MESSAGE &&
    typeof event.data.babyId === 'string'
  ) {
    event.waitUntil(setLastBabyId(event.data.babyId));
  }

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

async function getLastDashboardRoute(): Promise<string | null> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(['settings'], 'readonly');
    const store = transaction.objectStore('settings');
    const request = store.get(LAST_DASHBOARD_ROUTE_KEY);

    return await new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const record = request.result as {
          value?: { path?: string; updatedAt?: number };
        };
        const path = record?.value?.path;
        const updatedAt = record?.value?.updatedAt;

        if (
          typeof path === 'string' &&
          isPersistableDashboardPath(path) &&
          (!updatedAt || Date.now() - updatedAt <= LAST_ROUTE_MAX_AGE_MS)
        ) {
          resolve(path);
          return;
        }

        resolve(null);
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error(
      '[Service Worker] Error getting last dashboard route:',
      error,
    );
    return null;
  }
}

async function setLastDashboardRoute(path: string): Promise<void> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(['settings'], 'readwrite');
    const store = transaction.objectStore('settings');
    store.put({
      key: LAST_DASHBOARD_ROUTE_KEY,
      value: { path, updatedAt: Date.now() },
    });

    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error(
      '[Service Worker] Error setting last dashboard route:',
      error,
    );
  }
}

async function getLastBabyId(): Promise<string | null> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(['settings'], 'readonly');
    const store = transaction.objectStore('settings');
    const request = store.get(LAST_BABY_ID_KEY);

    return await new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const record = request.result as { value?: string };
        const babyId = record?.value;
        resolve(typeof babyId === 'string' ? babyId : null);
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('[Service Worker] Error getting last baby ID:', error);
    return null;
  }
}

async function setLastBabyId(babyId: string): Promise<void> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(['settings'], 'readwrite');
    const store = transaction.objectStore('settings');
    store.put({
      key: LAST_BABY_ID_KEY,
      value: babyId,
    });

    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error('[Service Worker] Error setting last baby ID:', error);
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
