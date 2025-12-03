/**
 * Mutation queue utility for queuing mutations when app is closing
 * Uses sendBeacon as primary method, falls back to Background Sync
 */

import type { Activities } from '@nugget/db/schema';
import { BackgroundSyncManager } from './background-sync';
import { MutationTracker } from './mutation-tracker';

interface QueuedMutation {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
  activityType: string;
  source: string;
}

interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
  timestamp: number;
}

export class MutationQueue {
  private static instance: MutationQueue;
  private tracker = MutationTracker.getInstance();
  private syncManager = BackgroundSyncManager.getInstance();

  private constructor() {}

  static getInstance(): MutationQueue {
    if (!MutationQueue.instance) {
      MutationQueue.instance = new MutationQueue();
    }
    return MutationQueue.instance;
  }

  /**
   * Queue a mutation using sendBeacon if available, otherwise use Background Sync
   */
  async queueMutation(
    mutationId: string,
    url: string,
    options: RequestInit,
    activityType: typeof Activities.$inferSelect.type,
    source: string,
  ): Promise<boolean> {
    const body = options.body?.toString() || '';
    const headers: Record<string, string> = {};

    // Extract headers
    if (options.headers) {
      if (options.headers instanceof Headers) {
        options.headers.forEach((value, key) => {
          headers[key] = value;
        });
      } else if (Array.isArray(options.headers)) {
        Object.assign(headers, Object.fromEntries(options.headers));
      } else {
        Object.assign(headers, options.headers);
      }
    }

    // Try sendBeacon first (works even after page unload)
    if (navigator.sendBeacon && options.method === 'POST') {
      try {
        const blob = new Blob([body], {
          type: headers['Content-Type'] || 'application/json',
        });

        // sendBeacon doesn't support custom headers well, but we can try
        // For tRPC, we'll need to include auth in the URL or use Background Sync
        const beaconSent = navigator.sendBeacon(url, blob);

        if (beaconSent) {
          // Track that we used sendBeacon
          this.tracker.trackMutationQueued(
            mutationId,
            activityType,
            source,
            this.syncManager.getQueueLength(),
          );
          return true;
        }
      } catch (error) {
        console.warn(
          'sendBeacon failed, falling back to Background Sync:',
          error,
        );
      }
    }

    // Fallback to Background Sync
    try {
      await this.syncManager.queueRequest(url, options);
      this.tracker.trackMutationQueued(
        mutationId,
        activityType,
        source,
        this.syncManager.getQueueLength(),
      );
      return true;
    } catch (error) {
      console.error('Failed to queue mutation:', error);
      return false;
    }
  }

  /**
   * Synchronously queue a mutation during page unload
   * Uses sendBeacon (synchronous) or localStorage as fallback
   * This is safe to call from beforeunload handlers
   */
  queueMutationSync(
    mutationId: string,
    url: string,
    body: string,
    activityType: typeof Activities.$inferSelect.type,
    source: string,
  ): boolean {
    // Try sendBeacon first (synchronous, works during page unload)
    if (navigator.sendBeacon) {
      try {
        const blob = new Blob([body], {
          type: 'application/json',
        });

        const beaconSent = navigator.sendBeacon(url, blob);

        if (beaconSent) {
          // Track synchronously using localStorage
          try {
            this.tracker.trackMutationQueued(
              mutationId,
              activityType,
              source,
              this.syncManager.getQueueLength(),
            );
          } catch {
            // Ignore tracking errors during unload
          }
          return true;
        }
      } catch (error) {
        console.warn('sendBeacon failed:', error);
      }
    }

    // Fallback: Store in BackgroundSyncManager's localStorage queue synchronously
    // This will be processed on next page load or by service worker
    try {
      const request: QueuedRequest = {
        body,
        headers: {
          'Content-Type': 'application/json',
        },
        id: mutationId,
        method: 'POST',
        timestamp: Date.now(),
        url,
      };

      // Synchronously add to queue and save to localStorage
      this.syncManager.addToQueueSync(request);
      return true;
    } catch (error) {
      console.error('Failed to queue mutation synchronously:', error);
      return false;
    }
  }

  /**
   * Get queued mutations for recovery
   */
  getQueuedMutations(): QueuedMutation[] {
    const queue = this.syncManager.getQueue();
    return queue.map((req) => ({
      activityType: 'unknown',
      body: req.body || '',
      headers: req.headers,
      id: req.id,
      method: req.method,
      source: 'queued',
      url: req.url,
    }));
  }
}
