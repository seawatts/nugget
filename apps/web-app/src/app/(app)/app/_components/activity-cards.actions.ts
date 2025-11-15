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

const createActivityWithDetailsInputSchema = z.object({
  activityType: z.string(),
  amount: z.number().optional(),
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

      // Create tRPC caller
      const ctx = await createTRPCContext();
      const caller = createCaller(ctx);

      // Get the most recent baby
      const baby = await caller.babies.getMostRecent();

      if (!baby) {
        throw new Error('No baby found. Please complete onboarding first.');
      }

      // Create the activity with provided details
      const activity = await caller.activities.create({
        amount: parsedInput.amount,
        babyId: baby.id,
        details: null,
        duration: parsedInput.duration,
        feedingSource: parsedInput.feedingSource,
        notes: parsedInput.notes,
        startTime: parsedInput.startTime || new Date(),
        type: parsedInput.activityType as typeof Activities.$inferSelect.type,
      });

      // Revalidate any pages that might display activities
      revalidatePath('/app');
      revalidatePath('/app/timeline');
      revalidatePath('/app/activities');

      return { activity };
    },
  );

/**
 * Get in-progress sleep activity (one with startTime but no endTime)
 */
export const getInProgressSleepActivityAction = action
  .schema(z.object({}))
  .action(
    async (): Promise<{ activity: typeof Activities.$inferSelect | null }> => {
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

      // Find in-progress sleep activity (has startTime but no endTime)
      const activities = await caller.activities.getRecent({
        babyId: baby.id,
        limit: 50,
      });

      // Find the most recent sleep activity without an endTime
      const inProgressSleep = activities.find(
        (activity) =>
          activity.type === 'sleep' &&
          activity.startTime &&
          !activity.endTime &&
          !activity.duration,
      );

      return { activity: inProgressSleep || null };
    },
  );
