'use client';

import { createSelectors } from '@nugget/zustand';
import { create } from 'zustand';

/**
 * Optimistic milestone completion tracking
 */
interface OptimisticMilestonesState {
  completedMilestones: Set<string>; // Set of milestone IDs that are optimistically marked as complete
  markComplete: (milestoneId: string) => void;
  unmarkComplete: (milestoneId: string) => void;
  isOptimisticallyCompleted: (milestoneId: string) => boolean;
  clear: () => void;
}

/**
 * Global store for optimistic milestone completion updates
 *
 * Usage:
 * ```ts
 * // Mark milestone as complete optimistically
 * useOptimisticMilestonesStore.getState().markComplete(milestoneId);
 *
 * // Check if milestone is optimistically completed
 * const isCompleted = useOptimisticMilestonesStore.use.isOptimisticallyCompleted()(milestoneId);
 *
 * // Clear after mutation succeeds
 * useOptimisticMilestonesStore.getState().clear();
 * ```
 */
const useOptimisticMilestonesStoreBase = create<OptimisticMilestonesState>(
  (set, get) => ({
    clear: () => {
      set({ completedMilestones: new Set<string>() });
    },
    completedMilestones: new Set<string>(),
    isOptimisticallyCompleted: (milestoneId: string) => {
      return get().completedMilestones.has(milestoneId);
    },
    markComplete: (milestoneId: string) => {
      set((state) => {
        const newSet = new Set(state.completedMilestones);
        newSet.add(milestoneId);
        return { completedMilestones: newSet };
      });
    },
    unmarkComplete: (milestoneId: string) => {
      set((state) => {
        const newSet = new Set(state.completedMilestones);
        newSet.delete(milestoneId);
        return { completedMilestones: newSet };
      });
    },
  }),
);

/**
 * Zustand store with auto-generated selectors
 * Use: useOptimisticMilestonesStore.use.completedMilestones() instead of manual selectors
 */
export const useOptimisticMilestonesStore = createSelectors(
  useOptimisticMilestonesStoreBase,
);
