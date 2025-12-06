/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core';
import { precacheAndRoute } from 'workbox-precaching';

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

// =============================================================================
// WORKBOX SETUP - Handles all caching strategies
// =============================================================================

// Precache and route all assets injected by next-pwa
precacheAndRoute(self.__WB_MANIFEST);

// Take control of all pages immediately
clientsClaim();

// Note: Workbox caching strategies are configured in next.config via workboxOptions
// This includes CacheFirst for static assets, NetworkFirst for API routes, etc.

// =============================================================================
// BACKGROUND SYNC - Process queued mutations
// =============================================================================

self.addEventListener('sync', ((event: ExtendableEvent & { tag: string }) => {
  if (event.tag === 'nugget-background-sync') {
    event.waitUntil(processMutationQueue());
  }
}) as EventListener);

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
});
