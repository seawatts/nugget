/**
 * Custom hook for milestone mutations with automatic tRPC cache invalidation
 * Integrates with Zustand store for optimistic updates
 */
'use client';

import { api } from '@nugget/api/react';
import { toast } from '@nugget/ui/sonner';
import { useCallback } from 'react';
import { useOptimisticMilestonesStore } from '~/stores/optimistic-milestones';

interface MarkCompleteInput {
  babyId: string;
  title: string;
  description: string;
  type: 'physical' | 'cognitive' | 'social' | 'language' | 'self_care';
  suggestedDay: number;
  milestoneId: string; // For optimistic tracking
}

/**
 * Hook that provides milestone mutation functions with automatic cache invalidation
 * Clears Zustand optimistic state and invalidates milestone queries on success
 */
export function useMilestoneMutations() {
  const utils = api.useUtils();

  // Mark milestone as complete mutation
  const markCompleteMutation = api.milestones.markComplete.useMutation({
    onError: (error) => {
      toast.error(error.message || 'Failed to mark milestone as complete');
    },
    onSuccess: async () => {
      // Clear optimistic state
      useOptimisticMilestonesStore.getState().clear();
      // Invalidate milestone queries - React Query handles the rest
      await utils.milestones.invalidate();
    },
  });

  /**
   * Mark a milestone as complete
   */
  const markComplete = useCallback(
    async (input: MarkCompleteInput) => {
      const { milestoneId, ...mutationInput } = input;

      // Optimistically mark as complete in Zustand store
      useOptimisticMilestonesStore.getState().markComplete(milestoneId);

      try {
        await markCompleteMutation.mutateAsync(mutationInput);
      } catch (error) {
        // Revert optimistic update on error
        useOptimisticMilestonesStore.getState().unmarkComplete(milestoneId);
        throw error;
      }
    },
    [markCompleteMutation],
  );

  return {
    isMarkingComplete: markCompleteMutation.isPending,
    markComplete,
  };
}
