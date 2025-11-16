'use server';

import { auth } from '@clerk/nextjs/server';
import { getApi } from '@nugget/api/server';
import type { Activities } from '@nugget/db/schema';
import { startOfDay } from 'date-fns';
import { createSafeActionClient } from 'next-safe-action';

const action = createSafeActionClient();

/**
 * Fetch all activities from today for the current user's baby
 */
export const getTodaySummaryAction = action.action(
  async (): Promise<{
    activities: Array<typeof Activities.$inferSelect>;
  }> => {
    // Verify authentication
    const authResult = await auth();
    if (!authResult.userId) {
      throw new Error('Authentication required');
    }

    // Create tRPC API helper
    const api = await getApi();

    // Get the most recent baby
    const baby = await api.babies.getMostRecent.fetch();

    if (!baby) {
      return { activities: [] };
    }

    // Fetch all activities from today, filtering out scheduled ones
    const todayStart = startOfDay(new Date());
    const activities = await api.activities.list.fetch({
      babyId: baby.id,
      isScheduled: false,
      limit: 100, // Maximum allowed by validation (should be plenty for a single day)
    });

    // Filter to only today's activities
    const todayActivities = activities.filter((activity) => {
      const activityDate = new Date(activity.startTime);
      return activityDate >= todayStart;
    });

    return { activities: todayActivities };
  },
);
