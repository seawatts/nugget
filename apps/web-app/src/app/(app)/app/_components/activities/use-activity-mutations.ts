/**
 * Custom hook for activity mutations with automatic tRPC cache invalidation
 * This replaces the manual refresh trigger pattern with proper cache management
 * Integrates with Zustand store for optimistic updates
 */
'use client';

import { api } from '@nugget/api/react';
import type { Activities, ActivityDetails } from '@nugget/db/schema';
import { toast } from '@nugget/ui/sonner';
import { useCallback } from 'react';
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

/**
 * Hook that provides activity mutation functions with automatic cache invalidation
 * Clears Zustand optimistic state and invalidates activity queries on success
 */
export function useActivityMutations() {
  const utils = api.useUtils();

  // Create activity mutation
  const createMutation = api.activities.create.useMutation({
    onError: (error) => {
      toast.error(error.message || 'Failed to create activity');
    },
    onSuccess: (_activity) => {
      toast.success('Activity created successfully');
      // Invalidate queries in background - don't await to avoid blocking mutateAsync
      utils.activities.invalidate(undefined, { type: 'all' });
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
      ]);
    },
  });

  /**
   * Create a new activity for a specific baby or the most recent baby
   */
  const createActivity = useCallback(
    async (
      input: CreateActivityInput,
    ): Promise<typeof Activities.$inferSelect> => {
      // Use provided babyId or get the most recent baby
      let babyId = input.babyId;

      if (!babyId) {
        const baby = await utils.babies.getMostRecent.fetch();
        if (!baby) {
          throw new Error('No baby found. Please complete onboarding first.');
        }
        babyId = baby.id;
      }

      // Create the activity
      const activity = await createMutation.mutateAsync({
        amountMl: input.amountMl,
        babyId,
        details: input.details || null,
        duration: input.duration,
        endTime: input.endTime,
        feedingSource: input.feedingSource,
        notes: input.notes,
        startTime: input.startTime || new Date(),
        type: input.activityType as typeof Activities.$inferSelect.type,
      });

      return activity;
    },
    [createMutation, utils.babies.getMostRecent],
  );

  /**
   * Update an existing activity
   */
  const updateActivity = useCallback(
    async (
      input: UpdateActivityInput,
    ): Promise<typeof Activities.$inferSelect> => {
      const activity = await updateMutation.mutateAsync(input);
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

  return {
    createActivity,
    deleteActivity,
    // Expose loading states
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isUpdating: updateMutation.isPending,
    updateActivity,
  };
}
