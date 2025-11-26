'use client';

import type { Activities, Babies, Users } from '@nugget/db/schema';
import { createSelectors } from '@nugget/zustand';
import { create } from 'zustand';

// Simplified family member type for dashboard use
export interface DashboardFamilyMember {
  id: string;
  userId: string;
  name: string;
  avatarUrl: string | null;
  isCurrentUser: boolean;
  // Optional fields for backward compatibility
  firstName?: string | null;
  lastName?: string | null;
  role?: string;
}

// Activity types that we track separately in the store
type ActivityTypeKey =
  | 'bath'
  | 'pumping'
  | 'feeding' // Includes 'feeding', 'bottle', 'nursing'
  | 'sleep'
  | 'diaper' // Includes 'diaper', 'wet', 'dirty', 'both'
  | 'vitamin_d'
  | 'nail_trimming'
  | 'doctor_visit'
  | 'other'; // All other types

interface DashboardDataState {
  baby: typeof Babies.$inferSelect | null;
  user: typeof Users.$inferSelect | null;
  activitiesByType: Record<
    ActivityTypeKey,
    Array<typeof Activities.$inferSelect>
  >;
  activities: Array<typeof Activities.$inferSelect>; // Combined array of all activities
  familyMembers: DashboardFamilyMember[];
  setBaby: (baby: typeof Babies.$inferSelect | null) => void;
  setUser: (user: typeof Users.$inferSelect | null) => void;
  setActivitiesByType: (
    type: ActivityTypeKey,
    activities: Array<typeof Activities.$inferSelect>,
  ) => void;
  setActivities: (activities: Array<typeof Activities.$inferSelect>) => void; // Deprecated
  setFamilyMembers: (members: DashboardFamilyMember[]) => void;
  clear: () => void;
}

/**
 * Global store for dashboard shared data
 * Populated by DashboardContainer to avoid redundant API calls
 *
 * Activities are stored both by type (for efficient access) and as a combined array.
 *
 * Usage:
 * ```ts
 * // Set data in DashboardContainer
 * useDashboardDataStore.getState().setBaby(baby);
 * useDashboardDataStore.getState().setActivitiesByType('bath', bathActivities);
 *
 * // Access data in child components
 * const baby = useDashboardDataStore.use.baby();
 * const user = useDashboardDataStore.use.user();
 * const familyMembers = useDashboardDataStore.use.familyMembers();
 * const allActivities = useDashboardDataStore.use.activities(); // Combined array
 * const bathActivities = useDashboardDataStore.use.activitiesByType()['bath'];
 *
 * // Clear on unmount
 * useDashboardDataStore.getState().clear();
 * ```
 */
const useDashboardDataStoreBase = create<DashboardDataState>((set) => ({
  activities: [],
  activitiesByType: {
    bath: [],
    diaper: [],
    doctor_visit: [],
    feeding: [],
    nail_trimming: [],
    other: [],
    pumping: [],
    sleep: [],
    vitamin_d: [],
  },
  baby: null,
  clear: () => {
    set({
      activities: [],
      activitiesByType: {
        bath: [],
        diaper: [],
        doctor_visit: [],
        feeding: [],
        nail_trimming: [],
        other: [],
        pumping: [],
        sleep: [],
        vitamin_d: [],
      },
      baby: null,
      familyMembers: [],
      user: null,
    });
  },
  familyMembers: [],
  setActivities: (_activities) => {
    // Deprecated: This is kept for backward compatibility but does nothing
    // Components should use the activities selector instead
    console.warn(
      'setActivities is deprecated. Use setActivitiesByType or the activities selector.',
    );
  },
  setActivitiesByType: (type, activities) => {
    set((state) => {
      const updatedActivitiesByType = {
        ...state.activitiesByType,
        [type]: activities,
      };
      // Update combined activities array
      const combinedActivities = Object.values(updatedActivitiesByType).flat();
      return {
        activities: combinedActivities,
        activitiesByType: updatedActivitiesByType,
      };
    });
  },
  setBaby: (baby) => {
    set({ baby });
  },
  setFamilyMembers: (members) => {
    set({ familyMembers: members });
  },
  setUser: (user) => {
    set({ user });
  },
  user: null,
}));

/**
 * Zustand store with auto-generated selectors
 * Use: useDashboardDataStore.use.baby() instead of manual selectors
 */
export const useDashboardDataStore = createSelectors(useDashboardDataStoreBase);
