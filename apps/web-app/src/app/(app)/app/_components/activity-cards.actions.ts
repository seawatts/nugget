'use server';

import { auth } from '@clerk/nextjs/server';
import { createCaller, createTRPCContext } from '@nugget/api';
import type { Activities } from '@nugget/db/schema';
import { revalidatePath } from 'next/cache';
import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';
import { getDefaultActivityData } from './activity-utils';

const action = createSafeActionClient();

const createActivityInputSchema = z.object({
  activityType: z.enum([
    'sleep',
    'feeding',
    'bottle',
    'nursing',
    'pumping',
    'diaper',
    'wet',
    'dirty',
    'both',
    'solids',
    'bath',
    'medicine',
    'temperature',
    'tummy_time',
    'growth',
    'potty',
  ]),
});

/**
 * Create an activity with smart defaults based on activity type and baby age
 */
export const createActivityAction = action
  .schema(createActivityInputSchema)
  .action(
    async ({
      parsedInput,
    }): Promise<{ activity: typeof Activities.$inferSelect }> => {
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
        throw new Error('No baby found. Please complete onboarding first.');
      }

      // Get default activity data based on type and baby's birth date
      const defaultData = getDefaultActivityData(
        parsedInput.activityType,
        baby.birthDate,
      );

      // Create the activity
      const activity = await caller.activities.create({
        babyId: baby.id,
        details: null,
        ...defaultData,
      });

      // Revalidate any pages that might display activities
      revalidatePath('/app');
      revalidatePath('/app/timeline');
      revalidatePath('/app/activities');

      return { activity };
    },
  );
