'use server';

import { auth } from '@clerk/nextjs/server';
import { getApi } from '@nugget/api/server';
import type { Activities } from '@nugget/db/schema';
import { createSafeActionClient } from 'next-safe-action';

const action = createSafeActionClient();

export interface UpcomingDoctorVisitData {
  recentActivities: Array<typeof Activities.$inferSelect>;
  babyBirthDate: Date | null;
  babyAgeDays: number | null;
}

/**
 * Calculate baby's age in days from birth date
 */
function calculateBabyAgeDays(birthDate: Date | null): number | null {
  if (!birthDate) return null;
  const now = new Date();
  const diffTime = now.getTime() - new Date(birthDate).getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Get upcoming doctor visit prediction data
 * Returns recent activities and baby info for client-side prediction
 */
export const getUpcomingDoctorVisitAction = action.action(
  async (): Promise<UpcomingDoctorVisitData> => {
    // Verify authentication
    const authResult = await auth();
    if (!authResult.userId || !authResult.orgId) {
      throw new Error('Authentication required');
    }

    // Create tRPC caller
    const api = await getApi();

    // Get the most recent baby
    const baby = await api.babies.getMostRecent();

    if (!baby) {
      throw new Error('No baby found. Please complete onboarding first.');
    }

    // Calculate baby's age in days
    const babyAgeDays = calculateBabyAgeDays(baby.birthDate);

    // Fetch all doctor visit activities for first year
    // We want to see complete history to match against schedule
    const recentActivities = await api.activities.list({
      activityTypes: ['doctor_visit'],
      babyId: baby.id,
      limit: 100,
    });

    return {
      babyAgeDays,
      babyBirthDate: baby.birthDate,
      recentActivities,
    };
  },
);
