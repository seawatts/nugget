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

interface DashboardDataState {
  baby: typeof Babies.$inferSelect | null;
  user: typeof Users.$inferSelect | null;
  activities: Array<typeof Activities.$inferSelect>;
  familyMembers: DashboardFamilyMember[];
  setBaby: (baby: typeof Babies.$inferSelect | null) => void;
  setUser: (user: typeof Users.$inferSelect | null) => void;
  setActivities: (activities: Array<typeof Activities.$inferSelect>) => void;
  setFamilyMembers: (members: DashboardFamilyMember[]) => void;
  clear: () => void;
}

/**
 * Global store for dashboard shared data
 * Populated by DashboardContainer to avoid redundant API calls
 *
 * Usage:
 * ```ts
 * // Set data in DashboardContainer
 * useDashboardDataStore.getState().setBaby(baby);
 *
 * // Access data in child components
 * const baby = useDashboardDataStore.use.baby();
 * const user = useDashboardDataStore.use.user();
 * const activities = useDashboardDataStore.use.activities();
 * const familyMembers = useDashboardDataStore.use.familyMembers();
 *
 * // Clear on unmount
 * useDashboardDataStore.getState().clear();
 * ```
 */
const useDashboardDataStoreBase = create<DashboardDataState>((set) => ({
  activities: [],
  baby: null,
  clear: () => {
    set({ activities: [], baby: null, familyMembers: [], user: null });
  },
  familyMembers: [],
  setActivities: (activities) => {
    set({ activities });
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
