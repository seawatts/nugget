interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
  timestamp: number;
}

const SYNC_TAG = 'nugget-background-sync';
const QUEUE_KEY = 'nugget-sync-queue';

export class BackgroundSyncManager {
  private static instance: BackgroundSyncManager;
  private queue: QueuedRequest[] = [];

  private constructor() {
    this.loadQueue();
  }

  static getInstance(): BackgroundSyncManager {
    if (!BackgroundSyncManager.instance) {
      BackgroundSyncManager.instance = new BackgroundSyncManager();
    }
    return BackgroundSyncManager.instance;
  }

  private loadQueue(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(QUEUE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load sync queue:', error);
    }
  }

  private saveQueue(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save sync queue:', error);
    }
  }

  async queueRequest(url: string, options: RequestInit = {}): Promise<void> {
    const request: QueuedRequest = {
      body: options.body?.toString(),
      headers: this.extractHeaders(options.headers),
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      method: options.method || 'GET',
      timestamp: Date.now(),
      url,
    };

    this.queue.push(request);
    this.saveQueue();

    // Track background sync registration
    if (typeof window !== 'undefined') {
      try {
        const posthog = await import('posthog-js');
        posthog.default.capture('background_sync_registered', {
          method: request.method,
          queue_length: this.queue.length,
        });
      } catch {
        // PostHog not available, ignore
      }
    }

    // Try to register for background sync
    if (
      'serviceWorker' in navigator &&
      'sync' in ServiceWorkerRegistration.prototype
    ) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register(SYNC_TAG);
      } catch (error) {
        console.error('Failed to register background sync:', error);
        // Fallback: try to sync immediately
        this.processQueue();
      }
    } else {
      // Browser doesn't support background sync, process immediately
      this.processQueue();
    }
  }

  private extractHeaders(headers?: HeadersInit): Record<string, string> {
    if (!headers) return {};

    if (headers instanceof Headers) {
      const result: Record<string, string> = {};
      headers.forEach((value, key) => {
        result[key] = value;
      });
      return result;
    }

    if (Array.isArray(headers)) {
      return Object.fromEntries(headers);
    }

    return headers as Record<string, string>;
  }

  async processQueue(): Promise<void> {
    if (this.queue.length === 0) return;

    const failedRequests: QueuedRequest[] = [];
    let processedCount = 0;
    let failedCount = 0;

    for (const request of this.queue) {
      try {
        const response = await fetch(request.url, {
          body: request.body,
          credentials: 'include', // Include cookies for authentication
          headers: request.headers,
          method: request.method,
        });

        if (response.ok) {
          processedCount++;
        } else {
          // Keep failed requests in queue for retry
          failedRequests.push(request);
          failedCount++;
        }
      } catch (error) {
        console.error('Failed to process queued request:', error);
        // Keep failed requests in queue for retry
        failedRequests.push(request);
        failedCount++;
      }
    }

    // Update queue with only failed requests
    this.queue = failedRequests;
    this.saveQueue();

    // Track background sync completion
    if (typeof window !== 'undefined') {
      try {
        const posthog = await import('posthog-js');
        posthog.default.capture('background_sync_completed', {
          failed_count: failedCount,
          processed_count: processedCount,
          queue_length: this.queue.length,
        });
      } catch {
        // PostHog not available, ignore
      }
    }
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  clearQueue(): void {
    this.queue = [];
    this.saveQueue();
  }

  getQueue(): QueuedRequest[] {
    return [...this.queue];
  }

  /**
   * Remove a specific request from the queue
   */
  removeRequest(id: string): void {
    this.queue = this.queue.filter((req) => req.id !== id);
    this.saveQueue();
  }

  /**
   * Synchronously add a request to the queue
   * Safe to call from beforeunload handlers
   */
  addToQueueSync(request: QueuedRequest): void {
    this.queue.push(request);
    this.saveQueue();
  }
}

// Utility function to wrap fetch with background sync support
export async function fetchWithSync(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const syncManager = BackgroundSyncManager.getInstance();

  try {
    const response = await fetch(url, options);
    return response;
  } catch (error) {
    // If offline, queue the request
    if (!navigator.onLine) {
      await syncManager.queueRequest(url, options);

      // Return a synthetic response indicating the request was queued
      return new Response(
        JSON.stringify({
          message: "Request queued for when you're back online",
          queued: true,
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 202,
          statusText: 'Queued',
        },
      );
    }

    throw error;
  }
}

// Initialize sync listener when service worker is ready
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  // Process queue when coming back online
  window.addEventListener('online', () => {
    const syncManager = BackgroundSyncManager.getInstance();
    syncManager.processQueue();
  });

  // Listen for service worker messages requesting mutation queue
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'GET_MUTATION_QUEUE') {
      const syncManager = BackgroundSyncManager.getInstance();
      const queue = syncManager.getQueue();

      // Send queue back to service worker via MessageChannel port
      if (event.ports && event.ports.length > 0 && event.ports[0]) {
        event.ports[0].postMessage({
          queue,
          type: 'MUTATION_QUEUE_RESPONSE',
        });
      } else {
        // Fallback: use postMessage if MessageChannel ports not available
        navigator.serviceWorker.controller?.postMessage({
          queue,
          type: 'MUTATION_QUEUE_RESPONSE',
        });
      }
    } else if (event.data?.type === 'REMOVE_MUTATION_FROM_QUEUE') {
      const syncManager = BackgroundSyncManager.getInstance();
      syncManager.removeRequest(event.data.mutationId);
    }
  });
}
