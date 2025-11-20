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
  amount?: number;
  duration?: number;
  feedingSource?: typeof Activities.$inferSelect.feedingSource;
  notes?: string;
  startTime?: Date;
  details?: ActivityDetails;
}

interface UpdateActivityInput {
  id: string;
  amount?: number;
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
    onSuccess: async () => {
      toast.success('Activity created successfully');
      // Clear optimistic state
      useOptimisticActivitiesStore.getState().clear();
      // Invalidate activity and baby queries - React Query handles the rest
      await utils.activities.invalidate();
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
      // Invalidate activity and baby queries - React Query handles the rest
      await utils.activities.invalidate();
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
      // Invalidate activity and baby queries - React Query handles the rest
      await utils.activities.invalidate();
      await utils.babies.invalidate();
    },
  });

  /**
   * Create a new activity with the most recent baby
   */
  const createActivity = useCallback(
    async (
      input: CreateActivityInput,
    ): Promise<typeof Activities.$inferSelect> => {
      // Get the most recent baby
      const baby = await utils.babies.getMostRecent.fetch();

      if (!baby) {
        throw new Error('No baby found. Please complete onboarding first.');
      }

      // Create the activity
      const activity = await createMutation.mutateAsync({
        amount: input.amount,
        babyId: baby.id,
        details: input.details || null,
        duration: input.duration,
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
