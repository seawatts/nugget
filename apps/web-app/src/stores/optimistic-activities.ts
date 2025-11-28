'use client';

import type { Activities } from '@nugget/db/schema';
import { createSelectors } from '@nugget/zustand';
import { create } from 'zustand';
import { useDashboardDataStore } from './dashboard-data';

/**
 * User relation type matching timeline structure
 */
export type UserRelation = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  email: string;
} | null;

/**
 * Optimistic activity type with markers for client-side tracking
 */
export type OptimisticActivity = typeof Activities.$inferSelect & {
  _optimistic: true;
  _tempId: string;
  user?: UserRelation;
};

/**
 * Helper function to get user relation from dashboard store
 * Formats user data to match timeline structure
 */
export function getUserRelationFromStore(): UserRelation {
  const user = useDashboardDataStore.getState().user;
  if (!user) {
    return null;
  }
  return {
    avatarUrl: user.avatarUrl,
    email: user.email,
    firstName: user.firstName,
    id: user.id,
    lastName: user.lastName,
  };
}

interface OptimisticActivitiesState {
  activities: OptimisticActivity[];
  updatedActivities: Record<string, OptimisticActivity>;
  addActivity: (
    activity: Omit<OptimisticActivity, '_optimistic' | '_tempId'>,
  ) => string;
  updateActivity: (
    activityId: string,
    activity: Omit<OptimisticActivity, '_optimistic' | '_tempId'>,
  ) => void;
  removeActivity: (tempId: string) => void;
  removeUpdate: (activityId: string) => void;
  removeByMatch: (type: string, timestamp: Date, toleranceMs?: number) => void;
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
      set({ activities: [], updatedActivities: {} });
    },
    removeActivity: (tempId) => {
      set((state) => ({
        activities: state.activities.filter((a) => a._tempId !== tempId),
      }));
    },
    removeByMatch: (type, timestamp, toleranceMs = 1000) => {
      set((state) => ({
        activities: state.activities.filter((a) => {
          // Don't match if different type
          if (a.type !== type) return true;

          // Calculate time difference
          const activityTime = new Date(a.startTime).getTime();
          const targetTime = timestamp.getTime();
          const timeDiff = Math.abs(activityTime - targetTime);

          // Keep activities that don't match (time difference > tolerance)
          return timeDiff > toleranceMs;
        }),
      }));
    },
    removeUpdate: (activityId) => {
      set((state) => {
        const next = { ...state.updatedActivities };
        delete next[activityId];
        return { updatedActivities: next };
      });
    },
    updateActivity: (activityId, activity) => {
      const optimisticActivity: OptimisticActivity = {
        ...activity,
        _optimistic: true,
        _tempId: activityId,
      };
      set((state) => ({
        updatedActivities: {
          ...state.updatedActivities,
          [activityId]: optimisticActivity,
        },
      }));
    },
    updatedActivities: {},
  }),
);

/**
 * Zustand store with auto-generated selectors
 * Use: useOptimisticActivitiesStore.use.activities() instead of manual selectors
 */
export const useOptimisticActivitiesStore = createSelectors(
  useOptimisticActivitiesStoreBase,
);
