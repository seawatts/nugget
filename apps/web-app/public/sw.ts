/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

const CACHE_VERSION = 'v2';
const CACHE_NAME = `nugget-cache-${CACHE_VERSION}`;
const BABY_DASHBOARD_REGEX = /^\/app\/babies\/[^/]+\/dashboard/;

// IndexedDB key for notification tracking only
const LAST_NOTIFICATION_KEY = 'last-overdue-notification';

// =============================================================================
// INSTALL EVENT - Minimal setup
// =============================================================================
self.addEventListener('install', (event: ExtendableEvent) => {
  console.log('[Service Worker] Install');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(['/offline']).catch((error) => {
        console.warn('[Service Worker] Failed to precache offline page', error);
      }),
    ),
  );
  self.skipWaiting();
});

// =============================================================================
// ACTIVATE EVENT - Clean old caches, claim clients
// =============================================================================
self.addEventListener('activate', (event: ExtendableEvent) => {
  console.log('[Service Worker] Activate');
  event.waitUntil(
    (async () => {
      // Delete old caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

// =============================================================================
// FETCH EVENT - Simplified caching strategies
// =============================================================================
self.addEventListener('fetch', (event: FetchEvent) => {
  // Non-GET requests: pass through to network
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);
  const pathname = url.pathname;

  // Dashboard routes: CACHE-FIRST with background revalidation (instant PWA load)
  if (BABY_DASHBOARD_REGEX.test(pathname)) {
    event.respondWith(cacheFirstWithRevalidate(event.request));
    return;
  }

  // API/tRPC routes: Network-first with cache fallback
  if (/^\/(api|trpc)\//.test(pathname)) {
    event.respondWith(networkFirstWithCache(event.request));
    return;
  }

  // Static assets: Cache-first
  if (
    /\.(?:js|css|png|jpg|jpeg|svg|gif|webp|woff2?|ttf|eot)$/i.test(pathname)
  ) {
    event.respondWith(cacheFirstWithRevalidate(event.request));
    return;
  }

  // Everything else: Network-first with cache fallback
  event.respondWith(networkFirstWithCache(event.request));
});

// =============================================================================
// CACHING STRATEGIES
// =============================================================================

/**
 * Cache-first with background revalidation (stale-while-revalidate)
 * Returns cached content immediately, then updates cache in background
 */
async function cacheFirstWithRevalidate(request: Request): Promise<Response> {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  // Background revalidate (fire and forget)
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  // Return cache immediately if available, otherwise wait for network
  if (cached) {
    // Add header to indicate response is from cache
    const headers = new Headers(cached.headers);
    headers.set('X-Served-From-Cache', 'true');
    return new Response(cached.body, {
      headers,
      status: cached.status,
      statusText: cached.statusText,
    });
  }

  const networkResponse = await fetchPromise;
  if (networkResponse) {
    return networkResponse;
  }

  return new Response('Offline', {
    status: 503,
    statusText: 'Service Unavailable',
  });
}

/**
 * Network-first with cache fallback
 * Tries network first, falls back to cache if offline
 */
async function networkFirstWithCache(request: Request): Promise<Response> {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

// =============================================================================
// BACKGROUND SYNC - Process queued mutations
// =============================================================================
self.addEventListener('sync', ((event: ExtendableEvent & { tag: string }) => {
  if (event.tag === 'check-overdue-activities-sync') {
    event.waitUntil(checkOverdueActivities());
  } else if (event.tag === 'nugget-background-sync') {
    event.waitUntil(processMutationQueue());
  }
}) as EventListener);

// Periodic Background Sync for overdue activities
if ('periodicSync' in self.registration) {
  self.addEventListener('periodicsync', ((
    event: ExtendableEvent & { tag: string },
  ) => {
    if (event.tag === 'check-overdue-activities') {
      event.waitUntil(checkOverdueActivities());
    }
  }) as EventListener);
}

/**
 * Process queued mutations from BackgroundSyncManager
 */
async function processMutationQueue(): Promise<void> {
  try {
    const clients = await self.clients.matchAll({ includeUncontrolled: true });
    if (clients.length === 0) {
      return;
    }

    const messageChannel = new MessageChannel();
    interface QueuedRequest {
      id: string;
      url: string;
      method: string;
      headers: Record<string, string>;
      body?: string;
      timestamp: number;
    }

    const queuePromise = new Promise<QueuedRequest[]>((resolve) => {
      messageChannel.port1.onmessage = (event) => {
        if (event.data?.type === 'MUTATION_QUEUE_RESPONSE') {
          resolve((event.data.queue as QueuedRequest[]) || []);
        } else {
          resolve([]);
        }
      };
      setTimeout(() => resolve([]), 2000);
    });

    const client = clients[0];
    if (!client) return;

    client.postMessage({ type: 'GET_MUTATION_QUEUE' }, [messageChannel.port2]);
    const queueData = await queuePromise;

    if (queueData.length === 0) return;

    for (const queuedRequest of queueData) {
      try {
        const response = await fetch(queuedRequest.url, {
          body: queuedRequest.body,
          credentials: 'include',
          headers: queuedRequest.headers,
          method: queuedRequest.method,
        });

        if (response.ok && client) {
          client.postMessage({
            mutationId: queuedRequest.id,
            type: 'REMOVE_MUTATION_FROM_QUEUE',
          });
        }
      } catch (error) {
        console.error(
          '[Service Worker] Failed to process queued mutation:',
          error,
        );
      }
    }
  } catch (error) {
    console.error('[Service Worker] Error processing mutation queue:', error);
  }
}

// =============================================================================
// PUSH NOTIFICATIONS
// =============================================================================
self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
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

    if (data.actions?.length > 0) {
      options.actions = data.actions;
    }
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

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/app';

  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({
        includeUncontrolled: true,
        type: 'window',
      });

      for (const client of clients) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })(),
  );
});

// =============================================================================
// MESSAGE HANDLING
// =============================================================================
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data?.type === 'CHECK_OVERDUE_NOW') {
    event.waitUntil(checkOverdueActivities());
  }

  if (event.data?.type === 'SHOW_TEST_NOTIFICATION') {
    event.waitUntil(
      self.registration
        .showNotification('🔔 Test Notification', {
          badge: '/favicon-32x32.png',
          body: event.data.body || 'This is a test notification from Nugget.',
          data: { url: '/app' },
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

// =============================================================================
// OVERDUE ACTIVITY CHECKING
// =============================================================================
async function checkOverdueActivities(): Promise<void> {
  try {
    const lastNotificationTime = await getLastNotificationTime();
    const now = Date.now();
    const MIN_INTERVAL = 15 * 60 * 1000; // 15 minutes

    if (lastNotificationTime && now - lastNotificationTime < MIN_INTERVAL) {
      return;
    }

    const response = await fetch('/api/activities/check-overdue', {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      method: 'GET',
    });

    if (!response.ok) return;

    const data = await response.json();
    const overdueActivities: Array<{
      activityType: 'feeding' | 'sleep' | 'diaper' | 'pumping';
      babyName: string;
      babyId: string;
      overdueMinutes: number;
    }> = data.overdueActivities || [];

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

async function sendOverdueNotification(activity: {
  activityType: 'feeding' | 'sleep' | 'diaper' | 'pumping';
  babyName: string;
  babyId: string;
  overdueMinutes: number;
}): Promise<void> {
  const names: Record<string, string> = {
    diaper: 'Diaper Change',
    feeding: 'Feeding',
    pumping: 'Pumping',
    sleep: 'Sleep',
  };
  const emojis: Record<string, string> = {
    diaper: '👶',
    feeding: '🍼',
    pumping: '🤱',
    sleep: '😴',
  };

  const name = names[activity.activityType];
  const emoji = emojis[activity.activityType];

  try {
    await self.registration.showNotification(`${emoji} ${name} Overdue`, {
      badge: '/favicon-32x32.png',
      body: `${activity.babyName} is ${activity.overdueMinutes} minutes overdue for ${name.toLowerCase()}`,
      data: {
        activityType: activity.activityType,
        babyId: activity.babyId,
        url: `/app/babies/${activity.babyId}/dashboard`,
      },
      icon: '/android-chrome-192x192.png',
      tag: `overdue-${activity.activityType}-${activity.babyId}`,
    });
  } catch (error) {
    console.error(
      '[Service Worker] Failed to show overdue notification:',
      error,
    );
  }
}

// =============================================================================
// INDEXEDDB - For notification tracking only
// =============================================================================
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('nugget-sw-db', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    };
  });
}

async function getLastNotificationTime(): Promise<number | null> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(['settings'], 'readonly');
    const store = transaction.objectStore('settings');
    const request = store.get(LAST_NOTIFICATION_KEY);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result?.value || null);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
}

async function setLastNotificationTime(time: number): Promise<void> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(['settings'], 'readwrite');
    const store = transaction.objectStore('settings');
    store.put({ key: LAST_NOTIFICATION_KEY, value: time });

    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch {
    // Silently fail - notification tracking is non-critical
  }
}

export {};
