/**
 * Mutation tracking utility for monitoring activity mutations
 * Tracks mutations to detect incomplete requests and provide recovery
 * Integrates with PostHog for analytics
 */

import type { Activities } from '@nugget/db/schema';
import posthog from 'posthog-js';

const PENDING_MUTATIONS_KEY = 'nugget-pending-mutations';
const MAX_MUTATION_AGE_MS = 5 * 60 * 1000; // 5 minutes

export interface PendingMutation {
  id: string;
  activityType: typeof Activities.$inferSelect.type;
  source: string;
  startTime: number;
  data: Record<string, unknown>;
  retryCount: number;
}

export class MutationTracker {
  private static instance: MutationTracker;
  private pendingMutations: Map<string, PendingMutation> = new Map();
  private isPageVisible = true;

  private constructor() {
    this.loadPendingMutations();
    this.setupVisibilityTracking();
  }

  static getInstance(): MutationTracker {
    if (!MutationTracker.instance) {
      MutationTracker.instance = new MutationTracker();
    }
    return MutationTracker.instance;
  }

  private loadPendingMutations(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(PENDING_MUTATIONS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as PendingMutation[];
        const now = Date.now();

        // Filter out old mutations
        const validMutations = parsed.filter(
          (m) => now - m.startTime < MAX_MUTATION_AGE_MS,
        );

        validMutations.forEach((mutation) => {
          this.pendingMutations.set(mutation.id, mutation);
        });

        // Save cleaned up list
        if (validMutations.length !== parsed.length) {
          this.savePendingMutations();
        }
      }
    } catch (error) {
      console.error('Failed to load pending mutations:', error);
    }
  }

  private savePendingMutations(): void {
    if (typeof window === 'undefined') return;

    try {
      const mutations = Array.from(this.pendingMutations.values());
      localStorage.setItem(PENDING_MUTATIONS_KEY, JSON.stringify(mutations));
    } catch (error) {
      console.error('Failed to save pending mutations:', error);
    }
  }

  private setupVisibilityTracking(): void {
    if (typeof window === 'undefined') return;

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      const wasVisible = this.isPageVisible;
      this.isPageVisible = !document.hidden;

      if (wasVisible && !this.isPageVisible) {
        // Page became hidden
        const pendingCount = this.pendingMutations.size;
        if (pendingCount > 0) {
          const activityTypes = Array.from(
            new Set(
              Array.from(this.pendingMutations.values()).map(
                (m) => m.activityType,
              ),
            ),
          );

          posthog.capture('page_visibility_change', {
            activity_types: activityTypes,
            hidden: true,
            pending_mutations_count: pendingCount,
            platform: this.getPlatform(),
          });
        }
      } else if (!wasVisible && this.isPageVisible) {
        // Page became visible
        const pendingCount = this.pendingMutations.size;
        if (pendingCount > 0) {
          posthog.capture('page_visibility_change', {
            hidden: false,
            pending_mutations_count: pendingCount,
            platform: this.getPlatform(),
          });
        }
      }
    });

    // Track page unload
    window.addEventListener('beforeunload', () => {
      const pendingCount = this.pendingMutations.size;
      if (pendingCount > 0) {
        const activityTypes = Array.from(
          new Set(
            Array.from(this.pendingMutations.values()).map(
              (m) => m.activityType,
            ),
          ),
        );

        posthog.capture('page_unload_during_mutation', {
          activity_types: activityTypes,
          pending_mutations_count: pendingCount,
          platform: this.getPlatform(),
        });
      }
    });
  }

  private getPlatform(): string {
    if (typeof window === 'undefined') return 'unknown';

    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      // Check if it's a PWA
      if (
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as { standalone?: boolean }).standalone
      ) {
        return 'ios_pwa';
      }
      return 'ios_safari';
    }
    if (/android/.test(ua)) {
      if (
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as { standalone?: boolean }).standalone
      ) {
        return 'android_pwa';
      }
      return 'android_chrome';
    }
    return 'web';
  }

  /**
   * Track the start of a mutation
   */
  trackMutationStart(
    id: string,
    activityType: typeof Activities.$inferSelect.type,
    source: string,
    data: Record<string, unknown> = {},
  ): void {
    const mutation: PendingMutation = {
      activityType,
      data,
      id,
      retryCount: 0,
      source,
      startTime: Date.now(),
    };

    this.pendingMutations.set(id, mutation);
    this.savePendingMutations();

    posthog.capture('mutation_started', {
      activity_type: activityType,
      is_optimistic: true,
      mutation_id: id,
      platform: this.getPlatform(),
      source,
    });
  }

  /**
   * Track successful completion of a mutation
   */
  trackMutationComplete(
    id: string,
    activityType: typeof Activities.$inferSelect.type,
    source: string,
  ): void {
    const mutation = this.pendingMutations.get(id);
    const duration = mutation ? Date.now() - mutation.startTime : undefined;

    this.pendingMutations.delete(id);
    this.savePendingMutations();

    posthog.capture('mutation_completed', {
      activity_type: activityType,
      duration_ms: duration,
      mutation_id: id,
      platform: this.getPlatform(),
      source,
    });
  }

  /**
   * Track failed mutation
   */
  trackMutationFailed(
    id: string,
    activityType: typeof Activities.$inferSelect.type,
    source: string,
    errorMessage: string,
  ): void {
    const mutation = this.pendingMutations.get(id);
    const duration = mutation ? Date.now() - mutation.startTime : undefined;

    if (mutation) {
      mutation.retryCount += 1;
      this.pendingMutations.set(id, mutation);
      this.savePendingMutations();
    }

    posthog.capture('mutation_failed', {
      activity_type: activityType,
      duration_ms: duration,
      error_message: errorMessage,
      mutation_id: id,
      platform: this.getPlatform(),
      retry_count: mutation?.retryCount ?? 0,
      source,
    });
  }

  /**
   * Track queued mutation
   */
  trackMutationQueued(
    id: string,
    activityType: typeof Activities.$inferSelect.type,
    source: string,
    queueLength: number,
  ): void {
    posthog.capture('mutation_queued', {
      activity_type: activityType,
      mutation_id: id,
      platform: this.getPlatform(),
      queue_length: queueLength,
      source,
    });
  }

  /**
   * Get all pending mutations
   */
  getPendingMutations(): PendingMutation[] {
    const now = Date.now();
    const validMutations: PendingMutation[] = [];

    this.pendingMutations.forEach((mutation) => {
      if (now - mutation.startTime < MAX_MUTATION_AGE_MS) {
        validMutations.push(mutation);
      } else {
        // Remove expired mutations
        this.pendingMutations.delete(mutation.id);
      }
    });

    if (validMutations.length !== this.pendingMutations.size) {
      this.savePendingMutations();
    }

    return validMutations;
  }

  /**
   * Remove a mutation from tracking
   */
  removeMutation(id: string): void {
    this.pendingMutations.delete(id);
    this.savePendingMutations();
  }

  /**
   * Clear all pending mutations
   */
  clearPendingMutations(): void {
    this.pendingMutations.clear();
    this.savePendingMutations();
  }
}
