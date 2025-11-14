'use server';

import { auth } from '@clerk/nextjs/server';
import { createCaller, createTRPCContext } from '@nugget/api';
import type { Activities } from '@nugget/db/schema';
import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';

const action = createSafeActionClient();

const getActivitiesInputSchema = z.object({
  activityTypes: z.array(z.string()).optional(),
  limit: z.number().min(1).max(100).default(30),
  offset: z.number().min(0).default(0),
  userIds: z.array(z.string()).optional(),
});

/**
 * Fetch paginated activities for the current user's baby
 */
export const getActivitiesAction = action
  .schema(getActivitiesInputSchema)
  .action(
    async ({
      parsedInput,
    }): Promise<{
      activities: Array<typeof Activities.$inferSelect>;
      hasMore: boolean;
    }> => {
      // Verify authentication
      const authResult = await auth();
      if (!authResult.userId) {
        throw new Error('Authentication required');
      }

      // Create tRPC caller
      const ctx = await createTRPCContext();
      const caller = createCaller(ctx);

      // Get the most recent baby
      const baby = await caller.babies.getMostRecent();

      if (!baby) {
        return { activities: [], hasMore: false };
      }

      // Fetch activities, filtering out scheduled ones
      const activities = await caller.activities.list({
        activityTypes: parsedInput.activityTypes,
        babyId: baby.id,
        isScheduled: false,
        limit: parsedInput.limit + 1, // Fetch one extra to check if there are more
        userIds: parsedInput.userIds,
      });

      // Check if there are more activities
      const hasMore = activities.length > parsedInput.limit;
      const returnActivities = hasMore
        ? activities.slice(0, parsedInput.limit)
        : activities;

      return { activities: returnActivities, hasMore };
    },
  );
