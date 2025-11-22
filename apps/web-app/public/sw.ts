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

// Activate event - clean up old caches
self.addEventListener('activate', (event: ExtendableEvent) => {
  console.log('[Service Worker] Activate');
  event.waitUntil(
    (async () => {
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

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event: FetchEvent) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    (async () => {
      try {
        // Try network first
        const networkResponse = await fetch(event.request);

        // Cache successful responses
        if (networkResponse.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, networkResponse.clone());
        }

        return networkResponse;
      } catch (_error) {
        // If network fails, try cache
        const cachedResponse = await caches.match(event.request);
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
    return;
  }

  const data = event.data.json();
  const options = {
    actions: data.actions || [],
    badge: '/favicon-32x32.png',
    body: data.body,
    data: data.data || {},
    icon: '/android-chrome-192x192.png',
    vibrate: [200, 100, 200],
  } as NotificationOptions;

  event.waitUntil(
    self.registration.showNotification(data.title || 'Nugget', options),
  );
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

  const options = {
    actions: [
      {
        action: 'log',
        title: `Log ${activityName}`,
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
      },
    ],
    badge: '/favicon-32x32.png',
    body,
    data: {
      activityType: activity.activityType,
      babyId: activity.babyId,
      url: `/app/babies/${activity.babyId}`,
    },
    icon: '/android-chrome-192x192.png',
    requireInteraction: true,
    tag: `overdue-${activity.activityType}-${activity.babyId}`,
    vibrate: [200, 100, 200, 100, 200],
  } as NotificationOptions;

  await self.registration.showNotification(title, options);
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
