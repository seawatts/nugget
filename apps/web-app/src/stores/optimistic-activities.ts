'use client';

import type { Activities } from '@nugget/db/schema';
import { createSelectors } from '@nugget/zustand';
import { create } from 'zustand';

/**
 * Optimistic activity type with markers for client-side tracking
 */
export type OptimisticActivity = typeof Activities.$inferSelect & {
  _optimistic: true;
  _tempId: string;
};

interface OptimisticActivitiesState {
  activities: OptimisticActivity[];
  addActivity: (
    activity: Omit<OptimisticActivity, '_optimistic' | '_tempId'>,
  ) => string;
  removeActivity: (tempId: string) => void;
  clear: () => void;
}

/**
 * Global store for optimistic activity updates
 *
 * Usage:
 * ```ts
 * // Add optimistic activity
 * const tempId = useOptimisticActivitiesStore.getState().addActivity(activity);
 *
 * // Access activities in component
 * const activities = useOptimisticActivitiesStore.use.activities();
 *
 * // Clear after mutation succeeds
 * useOptimisticActivitiesStore.getState().clear();
 * ```
 */
const useOptimisticActivitiesStoreBase = create<OptimisticActivitiesState>(
  (set) => ({
    activities: [],
    addActivity: (activity) => {
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      const optimisticActivity: OptimisticActivity = {
        ...activity,
        _optimistic: true,
        _tempId: tempId,
      };
      set((state) => ({
        activities: [...state.activities, optimisticActivity],
      }));
      return tempId;
    },
    clear: () => {
      set({ activities: [] });
    },
    removeActivity: (tempId) => {
      set((state) => ({
        activities: state.activities.filter((a) => a._tempId !== tempId),
      }));
    },
  }),
);

/**
 * Zustand store with auto-generated selectors
 * Use: useOptimisticActivitiesStore.use.activities() instead of manual selectors
 */
export const useOptimisticActivitiesStore = createSelectors(
  useOptimisticActivitiesStoreBase,
);
