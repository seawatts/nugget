'use server';

import { auth } from '@clerk/nextjs/server';
import { getApi } from '@nugget/api/server';
import type { Activities } from '@nugget/db/schema';
import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';

const action = createSafeActionClient();

export interface ActivityStats {
  lastActivity: typeof Activities.$inferSelect | null;
  todayCount: number;
  lastAmount: number | null;
  lastDuration: number | null;
}

const getActivityStatsInputSchema = z.object({
  activityType: z.enum(['pumping', 'solids', 'potty', 'tummy_time']),
});

/**
 * Get stats for a specific activity type
 * Returns last activity, today's count, and relevant metrics
 */
export const getActivityStatsAction = action
  .schema(getActivityStatsInputSchema)
  .action(async ({ parsedInput }): Promise<ActivityStats> => {
    // Verify authentication
    const authResult = await auth();
    if (!authResult.userId || !authResult.orgId) {
      throw new Error('Authentication required');
    }

    // Create tRPC API helper
    const api = await getApi();

    // Get the most recent baby
    const baby = await api.babies.getMostRecent.fetch();

    if (!baby) {
      throw new Error('No baby found. Please complete onboarding first.');
    }

    // Fetch recent activities
    const recentActivities = await api.activities.list.fetch({
      babyId: baby.id,
      limit: 50,
    });

    // Filter to the specific activity type
    const activities = recentActivities.filter(
      (a) => a.type === parsedInput.activityType,
    );

    // Get last activity
    const lastActivity =
      activities.length > 0 && activities[0] ? activities[0] : null;

    // Count today's activities
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = activities.filter((a) => {
      const activityDate = new Date(a.startTime);
      return activityDate >= today;
    }).length;

    // Extract metrics from last activity
    const lastAmount = lastActivity?.amount || null;
    const lastDuration = lastActivity?.duration || null;

    return {
      lastActivity,
      lastAmount,
      lastDuration,
      todayCount,
    };
  });
