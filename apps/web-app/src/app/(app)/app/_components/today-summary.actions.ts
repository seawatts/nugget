'use server';

import { auth } from '@clerk/nextjs/server';
import { getApi } from '@nugget/api/server';
import type { Activities, Milestone } from '@nugget/db/schema';
import { startOfDay } from 'date-fns';
import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';

const action = createSafeActionClient();

const getTodaySummaryInputSchema = z.object({
  babyId: z.string(),
});

/**
 * Fetch all activities and milestones from today for the current user's baby
 */
export const getTodaySummaryAction = action
  .schema(getTodaySummaryInputSchema)
  .action(
    async ({
      parsedInput,
    }): Promise<{
      activities: Array<typeof Activities.$inferSelect>;
      milestones: Array<Milestone>;
    }> => {
      // Verify authentication
      const authResult = await auth();
      if (!authResult.userId) {
        throw new Error('Authentication required');
      }

      // Create tRPC API helper
      const api = await getApi();

      const { babyId } = parsedInput;

      // Fetch all activities from today, filtering out scheduled ones
      const todayStart = startOfDay(new Date());
      const activities = await api.activities.list({
        babyId,
        isScheduled: false,
        limit: 100, // Maximum allowed by validation (should be plenty for a single day)
      });

      // Filter to only today's activities
      const todayActivities = activities.filter((activity) => {
        const activityDate = new Date(activity.startTime);
        return activityDate >= todayStart;
      });

      // Fetch milestones achieved today
      const milestones = await api.milestones.list({ babyId });
      const todayMilestones = milestones.filter((milestone) => {
        if (!milestone.achievedDate) return false;
        const achievedDate = new Date(milestone.achievedDate);
        return achievedDate >= todayStart;
      });

      return { activities: todayActivities, milestones: todayMilestones };
    },
  );
