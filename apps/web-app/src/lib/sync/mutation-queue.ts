/**
 * Mutation queue utility for queuing mutations when app is closing
 * Uses fetch with keepalive as primary method (supports credentials),
 * falls back to Background Sync for recovery on next page load
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
   * Queue a mutation using fetch with keepalive (supports credentials),
   * falls back to Background Sync if fetch fails
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

    // Try fetch with keepalive first - this works even during page unload
    // and properly sends credentials (unlike sendBeacon)
    try {
      const response = await fetch(url, {
        body,
        credentials: 'include', // Include cookies for authentication
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        keepalive: true, // Allows request to complete even if page unloads
        method: options.method || 'POST',
      });

      if (response.ok) {
        this.tracker.trackMutationQueued(
          mutationId,
          activityType,
          source,
          this.syncManager.getQueueLength(),
        );
        return true;
      }

      // If response is not ok, log the error and fall through to Background Sync
      console.warn(
        `Fetch with keepalive failed with status ${response.status}, falling back to Background Sync`,
      );
    } catch (error) {
      console.warn(
        'Fetch with keepalive failed, falling back to Background Sync:',
        error,
      );
    }

    // Fallback to Background Sync - will be processed on next page load
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
   * Uses fetch with keepalive (non-blocking, supports credentials) as primary method,
   * with localStorage as fallback for recovery on next page load.
   * This is safe to call from beforeunload handlers.
   */
  queueMutationSync(
    mutationId: string,
    url: string,
    body: string,
    activityType: typeof Activities.$inferSelect.type,
    source: string,
  ): boolean {
    // Try fetch with keepalive - this is non-blocking and supports credentials
    // Unlike sendBeacon, fetch with keepalive properly sends cookies
    try {
      // Fire and forget - we don't await since this is in beforeunload
      fetch(url, {
        body,
        credentials: 'include', // Include cookies for authentication
        headers: {
          'Content-Type': 'application/json',
        },
        keepalive: true, // Allows request to complete even if page unloads
        method: 'POST',
      }).catch(() => {
        // Silently fail - we have the localStorage fallback
      });

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
    } catch (error) {
      console.warn('Fetch with keepalive failed:', error);
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
