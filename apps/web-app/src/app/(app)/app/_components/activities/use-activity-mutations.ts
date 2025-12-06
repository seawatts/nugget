/**
 * Custom hook for activity mutations with automatic tRPC cache invalidation
 * This replaces the manual refresh trigger pattern with proper cache management
 * Integrates with Zustand store for optimistic updates
 * Includes mutation tracking and persistence for iOS PWA
 */
'use client';

import { api } from '@nugget/api/react';
import type { Activities, ActivityDetails } from '@nugget/db/schema';
import { toast } from '@nugget/ui/sonner';
import { useCallback, useEffect, useRef } from 'react';
import { MutationQueue } from '~/lib/sync/mutation-queue';
import { MutationTracker } from '~/lib/sync/mutation-tracker';
import { useOptimisticActivitiesStore } from '~/stores/optimistic-activities';

interface CreateActivityInput {
  activityType: typeof Activities.$inferSelect.type;
  babyId?: string; // Optional babyId - if not provided, uses most recent baby
  amountMl?: number;
  duration?: number;
  feedingSource?: typeof Activities.$inferSelect.feedingSource;
  notes?: string;
  startTime?: Date;
  endTime?: Date;
  details?: ActivityDetails;
}

interface UpdateActivityInput {
  id: string;
  amountMl?: number;
  duration?: number;
  feedingSource?: typeof Activities.$inferSelect.feedingSource;
  notes?: string;
  startTime?: Date;
  endTime?: Date;
  type?: typeof Activities.$inferSelect.type;
  details?: ActivityDetails;
}

interface MutationVariables {
  __mutationId?: string;
  __source?: string;
  type: typeof Activities.$inferSelect.type;
  babyId: string;
  amountMl?: number | null;
  duration?: number | null;
  feedingSource?: typeof Activities.$inferSelect.feedingSource | null;
  notes?: string | null;
  startTime?: Date;
  endTime?: Date | null;
  details?: ActivityDetails | null;
  subjectType?: typeof Activities.$inferSelect.subjectType;
}

/**
 * Hook that provides activity mutation functions with automatic cache invalidation
 * Clears Zustand optimistic state and invalidates activity queries on success
 * Tracks mutations for iOS PWA persistence
 */
export function useActivityMutations() {
  const utils = api.useUtils();
  const tracker = MutationTracker.getInstance();
  const mutationQueue = MutationQueue.getInstance();
  const mutationSourceRef = useRef<string>('unknown');

  // Create activity mutation
  const createMutation = api.activities.create.useMutation({
    onError: (error, variables) => {
      const mutationVars = variables as MutationVariables;
      const mutationId = mutationVars.__mutationId;
      const activityType = variables.type;
      const source = mutationVars.__source || 'unknown';

      if (mutationId) {
        tracker.trackMutationFailed(
          mutationId,
          activityType,
          source,
          error.message || 'Unknown error',
        );
      }

      toast.error(error.message || 'Failed to create activity');
    },
    onMutate: async (variables) => {
      // Track mutation start
      const mutationId = `mutation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const activityType = variables.type;
      const source = mutationSourceRef.current || 'unknown';

      tracker.trackMutationStart(mutationId, activityType, source, {
        amountMl: variables.amountMl,
        babyId: variables.babyId,
        duration: variables.duration,
      });

      // Store mutation ID for tracking
      const mutationVars = variables as MutationVariables;
      mutationVars.__mutationId = mutationId;
      mutationVars.__source = source;
    },
    onSuccess: (_activity, variables) => {
      const mutationVars = variables as MutationVariables;
      const mutationId = mutationVars.__mutationId;
      const activityType = variables.type;
      const source = mutationVars.__source || 'unknown';

      if (mutationId) {
        tracker.trackMutationComplete(mutationId, activityType, source);
      }

      toast.success('Activity created successfully');
      // Invalidate queries in background - don't await to avoid blocking mutateAsync
      utils.activities.invalidate(undefined, { type: 'all' });
      utils.timeline.getItems.invalidate();
    },
  });

  // Update activity mutation
  const updateMutation = api.activities.update.useMutation({
    onError: (error) => {
      toast.error(error.message || 'Failed to update activity');
    },
    onSuccess: async () => {
      toast.success('Activity updated successfully');
      // Clear optimistic state
      useOptimisticActivitiesStore.getState().clear();

      // Invalidate with type: 'all' to force immediate refetch, bypassing staleTime
      await utils.activities.invalidate(undefined, { type: 'all' });
      await utils.timeline.getItems.invalidate();
    },
  });

  // Delete activity mutation
  const deleteMutation = api.activities.delete.useMutation({
    onError: (error) => {
      toast.error(error.message || 'Failed to delete activity');
    },
    onSuccess: async () => {
      toast.success('Activity deleted successfully');
      // Clear optimistic state
      useOptimisticActivitiesStore.getState().clear();

      // Invalidate with type: 'all' to force immediate refetch, bypassing staleTime
      await Promise.all([
        utils.activities.invalidate(undefined, { type: 'all' }),
        utils.babies.invalidate(undefined, { type: 'all' }),
        utils.timeline.getItems.invalidate(),
      ]);
    },
  });

  /**
   * Create a new activity for a specific baby or the most recent baby
   */
  const createActivity = useCallback(
    async (
      input: CreateActivityInput,
      source = 'unknown',
    ): Promise<typeof Activities.$inferSelect> => {
      // Set source for tracking
      mutationSourceRef.current = source;

      // Use provided babyId or get the most recent baby
      let babyId = input.babyId;

      if (!babyId) {
        const baby = await utils.babies.getMostRecent.fetch();
        if (!baby) {
          throw new Error('No baby found. Please complete onboarding first.');
        }
        babyId = baby.id;
      }

      // Check if page is unloading and queue mutation if needed
      const isPageUnloading = document.visibilityState === 'hidden';
      const mutationId = `mutation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      try {
        // Create the activity
        const mutationInput = {
          amountMl: input.amountMl,
          babyId,
          details: input.details || null,
          duration: input.duration,
          endTime: input.endTime,
          feedingSource: input.feedingSource,
          notes: input.notes,
          startTime: input.startTime || new Date(),
          type: input.activityType as typeof Activities.$inferSelect.type,
        };
        // Store mutation ID and source for tracking (used in onMutate, onSuccess, onError)
        (mutationInput as MutationVariables).__mutationId = mutationId;
        (mutationInput as MutationVariables).__source = source;
        const activity = await createMutation.mutateAsync(mutationInput);

        // Verify activity was created successfully
        // This ensures we don't silently lose data if the mutation returns invalid response
        if (!activity || !activity.id) {
          throw new Error('Activity creation returned invalid response');
        }

        return activity;
      } catch (error) {
        // If mutation fails and page is unloading, try to queue it
        if (isPageUnloading || document.visibilityState === 'hidden') {
          try {
            // Get the tRPC URL for this mutation
            const baseUrl = window.location.origin;
            const trpcUrl = `${baseUrl}/api/trpc/activities.create`;

            const body = JSON.stringify({
              json: {
                amountMl: input.amountMl,
                babyId,
                details: input.details || null,
                duration: input.duration,
                endTime: input.endTime,
                feedingSource: input.feedingSource,
                notes: input.notes,
                startTime: input.startTime || new Date(),
                type: input.activityType,
              },
            });

            await mutationQueue.queueMutation(
              mutationId,
              trpcUrl,
              {
                body,
                credentials: 'include',
                headers: {
                  'Content-Type': 'application/json',
                },
                method: 'POST',
              },
              input.activityType,
              source,
            );
          } catch (queueError) {
            console.error('Failed to queue mutation:', queueError);
          }
        }
        throw error;
      }
    },
    [createMutation, utils.babies.getMostRecent, mutationQueue],
  );

  /**
   * Update an existing activity
   */
  const updateActivity = useCallback(
    async (
      input: UpdateActivityInput,
    ): Promise<typeof Activities.$inferSelect> => {
      const activity = await updateMutation.mutateAsync(input);

      // Verify activity was updated successfully
      if (!activity || !activity.id) {
        throw new Error('Activity update returned invalid response');
      }

      return activity;
    },
    [updateMutation],
  );

  /**
   * Delete an activity
   */
  const deleteActivity = useCallback(
    async (id: string): Promise<void> => {
      await deleteMutation.mutateAsync({ id });
    },
    [deleteMutation],
  );

  // Set up page unload handlers to queue pending mutations
  useEffect(() => {
    // Handle page visibility change (when page becomes hidden but not unloading)
    // This gives us more time for async operations
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden') {
        const pendingMutations = tracker.getPendingMutations();
        if (pendingMutations.length > 0) {
          // Use async queueMutation for visibility change (has more time)
          for (const mutation of pendingMutations) {
            try {
              const baseUrl = window.location.origin;
              const trpcUrl = `${baseUrl}/api/trpc/activities.create`;

              const body = JSON.stringify({
                json: {
                  ...mutation.data,
                  type: mutation.activityType,
                },
              });

              await mutationQueue.queueMutation(
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
            } catch (error) {
              console.error(
                'Failed to queue mutation on visibility change:',
                error,
              );
            }
          }
        }
      }
    };

    // Handle beforeunload with synchronous operations only
    // beforeunload handlers must be synchronous - async operations won't complete
    const handleBeforeUnload = () => {
      const pendingMutations = tracker.getPendingMutations();
      if (pendingMutations.length > 0) {
        const baseUrl = window.location.origin;
        const trpcUrl = `${baseUrl}/api/trpc/activities.create`;

        // Queue mutations synchronously using sendBeacon or localStorage
        for (const mutation of pendingMutations) {
          try {
            const body = JSON.stringify({
              json: {
                ...mutation.data,
                type: mutation.activityType,
              },
            });

            // Use synchronous queue method (sendBeacon or localStorage)
            mutationQueue.queueMutationSync(
              mutation.id,
              trpcUrl,
              body,
              mutation.activityType,
              mutation.source,
            );
          } catch (error) {
            console.error('Failed to queue mutation on unload:', error);
          }
        }
      }
    };

    // Use visibilitychange for async operations (more reliable)
    document.addEventListener('visibilitychange', handleVisibilityChange);
    // Use beforeunload as fallback with synchronous operations only
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [tracker, mutationQueue]);

  return {
    createActivity,
    // Expose retry state for UI indicators
    createFailureCount: createMutation.failureCount,
    deleteActivity,
    deleteFailureCount: deleteMutation.failureCount,
    // Expose loading states
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isRetrying:
      createMutation.failureCount > 0 ||
      updateMutation.failureCount > 0 ||
      deleteMutation.failureCount > 0,
    isUpdating: updateMutation.isPending,
    updateActivity,
    updateFailureCount: updateMutation.failureCount,
  };
}
