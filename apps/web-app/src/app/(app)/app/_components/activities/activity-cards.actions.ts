'use server';

import { auth } from '@clerk/nextjs/server';
import { getApi } from '@nugget/api/server';
import type { Activities } from '@nugget/db/schema';
import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';
import { revalidateAppPaths } from '~/app/(app)/app/_utils/revalidation';
import { getDefaultActivityData } from './shared/activity-utils';

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
    'doctor_visit',
  ]),
  babyId: z.string(),
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

      // Create tRPC API helper
      const api = await getApi();

      const { babyId } = parsedInput;

      // Get the baby to check birth date
      const baby = await api.babies.getByIdLight({ id: babyId });

      if (!baby) {
        throw new Error('Baby not found.');
      }

      // Get default activity data based on type and baby's birth date
      const defaultData = getDefaultActivityData(
        parsedInput.activityType,
        baby.birthDate,
      );

      // Create the activity
      const activity = await api.activities.create({
        babyId,
        details: null,
        ...defaultData,
      });

      // Revalidate any pages that might display activities
      revalidateAppPaths();

      return { activity };
    },
  );

const createActivityWithDetailsInputSchema = z.object({
  activityType: z.string(),
  amountMl: z.number().optional(),
  babyId: z.string(),
  details: z
    .union([
      z.object({
        coSleepingWith: z.array(z.string()).optional(),
        isCoSleeping: z.boolean().optional(),
        location: z
          .enum([
            'crib',
            'bassinet',
            'bed',
            'car_seat',
            'stroller',
            'arms',
            'swing',
            'bouncer',
          ])
          .optional(),
        quality: z.enum(['peaceful', 'restless', 'fussy', 'crying']).optional(),
        sleepType: z.enum(['nap', 'night']),
        type: z.literal('sleep'),
        wakeReason: z
          .enum(['hungry', 'diaper', 'crying', 'naturally', 'noise', 'unknown'])
          .optional(),
      }),
      z.object({
        color: z
          .enum(['yellow', 'brown', 'green', 'black', 'red', 'white', 'orange'])
          .optional(),
        consistency: z
          .enum([
            'solid',
            'loose',
            'runny',
            'mucousy',
            'hard',
            'pebbles',
            'diarrhea',
          ])
          .optional(),
        size: z.enum(['little', 'medium', 'large']).optional(),
        type: z.enum(['diaper', 'wet', 'dirty', 'both']),
      }),
    ])
    .optional(),
  duration: z.number().optional(),
  feedingSource: z.enum(['direct', 'pumped', 'formula', 'donor']).optional(),
  notes: z.string().optional(),
  startTime: z.date().optional(),
});

/**
 * Create an activity with full details (for feeding, etc.)
 */
export const createActivityWithDetailsAction = action
  .schema(createActivityWithDetailsInputSchema)
  .action(
    async ({
      parsedInput,
    }): Promise<{ activity: typeof Activities.$inferSelect }> => {
      // Verify authentication
      const authResult = await auth();
      if (!authResult.userId) {
        throw new Error('Authentication required');
      }

      // Create tRPC API helper
      const api = await getApi();

      const { babyId } = parsedInput;

      // Create the activity with provided details
      const activity = await api.activities.create({
        amountMl: parsedInput.amountMl,
        babyId,
        details: parsedInput.details || null,
        duration: parsedInput.duration,
        feedingSource: parsedInput.feedingSource,
        notes: parsedInput.notes,
        startTime: parsedInput.startTime || new Date(),
        type: parsedInput.activityType as typeof Activities.$inferSelect.type,
      });

      // Revalidate any pages that might display activities
      revalidateAppPaths();

      return { activity };
    },
  );

/**
 * Get in-progress sleep activity (one with startTime but no endTime)
 * Optimized: Uses server-side filtering instead of fetching all activities
 */
export const getInProgressSleepActivityAction = action
  .schema(z.object({ babyId: z.string() }))
  .action(
    async ({
      parsedInput,
    }): Promise<{ activity: typeof Activities.$inferSelect | null }> => {
      // Verify authentication
      const authResult = await auth();
      if (!authResult.userId) {
        throw new Error('Authentication required');
      }

      // Create tRPC API helper
      const api = await getApi();

      // Use optimized server-side query
      const activity = await api.activities.getInProgressActivity({
        activityType: 'sleep',
        babyId: parsedInput.babyId,
      });

      return { activity };
    },
  );

/**
 * Get in-progress feeding activity (one with startTime but no endTime)
 * Optimized: Uses server-side filtering instead of fetching all activities
 */
export const getInProgressFeedingActivityAction = action
  .schema(z.object({ babyId: z.string() }))
  .action(
    async ({
      parsedInput,
    }): Promise<{ activity: typeof Activities.$inferSelect | null }> => {
      // Verify authentication
      const authResult = await auth();
      if (!authResult.userId) {
        throw new Error('Authentication required');
      }

      // Create tRPC API helper
      const api = await getApi();

      // Use optimized server-side query
      const activity = await api.activities.getInProgressActivity({
        activityType: 'feeding',
        babyId: parsedInput.babyId,
      });

      return { activity };
    },
  );
