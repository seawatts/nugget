/**
 * Mutation recovery utility for recovering incomplete mutations on app startup
 * Checks for pending mutations and retries them automatically
 */

import posthog from 'posthog-js';
import { MutationQueue } from './mutation-queue';
import { MutationTracker } from './mutation-tracker';

export class MutationRecovery {
  private static instance: MutationRecovery;
  private tracker = MutationTracker.getInstance();
  private mutationQueue = MutationQueue.getInstance();

  private constructor() {}

  static getInstance(): MutationRecovery {
    if (!MutationRecovery.instance) {
      MutationRecovery.instance = new MutationRecovery();
    }
    return MutationRecovery.instance;
  }

  /**
   * Recover incomplete mutations on app startup
   */
  async recoverIncompleteMutations(): Promise<void> {
    const pendingMutations = this.tracker.getPendingMutations();
    const queuedMutations = this.mutationQueue.getQueuedMutations();

    if (pendingMutations.length === 0 && queuedMutations.length === 0) {
      return;
    }

    const pendingCount = pendingMutations.length;
    const queuedCount = queuedMutations.length;

    posthog.capture('mutation_recovery_started', {
      pending_count: pendingCount,
      queued_count: queuedCount,
    });

    let recoveredCount = 0;
    let failedCount = 0;

    // Process pending mutations (tracked but not completed)
    for (const mutation of pendingMutations) {
      try {
        const timeSinceStart = Date.now() - mutation.startTime;
        const maxAge = 5 * 60 * 1000; // 5 minutes

        // Skip mutations that are too old
        if (timeSinceStart > maxAge) {
          this.tracker.removeMutation(mutation.id);
          continue;
        }

        // Try to recover by queuing the mutation
        const baseUrl = window.location.origin;
        const trpcUrl = `${baseUrl}/api/trpc/activities.create`;

        const body = JSON.stringify({
          json: {
            ...mutation.data,
            type: mutation.activityType,
          },
        });

        const queued = await this.mutationQueue.queueMutation(
          mutation.id,
          trpcUrl,
          {
            body,
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
            method: 'POST',
          },
          mutation.activityType,
          mutation.source,
        );

        if (queued) {
          recoveredCount++;
          this.tracker.removeMutation(mutation.id);
        } else {
          failedCount++;
        }
      } catch (error) {
        console.error('Failed to recover mutation:', error);
        failedCount++;

        posthog.capture('mutation_recovery_failed', {
          activity_type: mutation.activityType,
          error_message: error instanceof Error ? error.message : String(error),
          mutation_id: mutation.id,
          retry_count: mutation.retryCount,
        });
      }
    }

    // Process queued mutations (already in Background Sync queue)
    // These will be processed by the service worker automatically
    // We just need to ensure the sync is registered
    if (queuedCount > 0) {
      try {
        if (
          'serviceWorker' in navigator &&
          'sync' in ServiceWorkerRegistration.prototype
        ) {
          const registration = await navigator.serviceWorker.ready;
          await registration.sync.register('nugget-background-sync');
        }
      } catch (error) {
        console.error(
          'Failed to register background sync for recovery:',
          error,
        );
      }
    }

    posthog.capture('mutation_recovery_completed', {
      failed_count: failedCount,
      pending_count: pendingCount,
      queued_count: queuedCount,
      recovered_count: recoveredCount,
    });

    // Show user notification if there were mutations to recover
    if (pendingCount > 0 || queuedCount > 0) {
      const totalRecovered = recoveredCount + queuedCount;
      if (totalRecovered > 0) {
        console.log(
          `Recovered ${totalRecovered} mutation(s) that were pending when the app closed`,
        );
        // Optionally show a toast notification
        // toast.info(`Recovered ${totalRecovered} activity(ies) from previous session`);
      }
    }
  }

  /**
   * Check if there are any incomplete mutations
   */
  hasIncompleteMutations(): boolean {
    const pendingMutations = this.tracker.getPendingMutations();
    const queuedMutations = this.mutationQueue.getQueuedMutations();
    return pendingMutations.length > 0 || queuedMutations.length > 0;
  }
}
