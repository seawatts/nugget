'use server';

import { auth } from '@clerk/nextjs/server';
import { getApi } from '@nugget/api/server';
import type { Activities } from '@nugget/db/schema';
import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';
import { revalidateAppPaths } from '~/app/(app)/app/_utils/revalidation';
import { predictNextSleep, type SleepPrediction } from './prediction';
import { getSleepGuidanceByAge } from './sleep-intervals';

const action = createSafeActionClient();

export interface UpcomingSleepData {
  prediction: SleepPrediction;
  guidanceMessage: string;
  babyAgeDays: number | null;
}

const getUpcomingSleepInputSchema = z.object({
  babyId: z.string(),
});

/**
 * Get upcoming sleep prediction
 */
export const getUpcomingSleepAction = action
  .schema(getUpcomingSleepInputSchema)
  .action(async ({ parsedInput }): Promise<UpcomingSleepData> => {
    // Verify authentication
    const authResult = await auth();
    if (!authResult.userId || !authResult.orgId) {
      throw new Error('Authentication required');
    }

    // Create tRPC caller
    const api = await getApi();

    const { babyId } = parsedInput;

    // Get the baby to check birth date
    const baby = await api.babies.getByIdLight({ id: babyId });

    if (!baby) {
      throw new Error('Baby not found.');
    }

    // Calculate baby's age in days
    let babyAgeDays: number | null = null;
    if (baby.birthDate) {
      const today = new Date();
      const birth = new Date(baby.birthDate);
      const diffTime = Math.abs(today.getTime() - birth.getTime());
      babyAgeDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }

    // Fetch recent activities (last 72 hours) for prediction
    const recentActivities = await api.activities.list({
      babyId: baby.id,
      limit: 50,
    });

    // Filter to only recent sleep activities
    const seventyTwoHoursAgo = new Date();
    seventyTwoHoursAgo.setHours(seventyTwoHoursAgo.getHours() - 72);

    const recentSleeps = recentActivities.filter((activity) => {
      const activityDate = new Date(activity.startTime);
      return activityDate >= seventyTwoHoursAgo && activity.type === 'sleep';
    });

    // Calculate sleep prediction
    const prediction = predictNextSleep(recentSleeps, baby.birthDate);

    // Get age-appropriate guidance
    const guidanceMessage =
      babyAgeDays !== null
        ? getSleepGuidanceByAge(babyAgeDays)
        : "Follow your pediatrician's sleep recommendations.";

    return {
      babyAgeDays,
      guidanceMessage,
      prediction,
    };
  });

const quickLogSleepInputSchema = z.object({
  babyId: z.string(),
  duration: z.number().min(10).max(480), // duration in minutes, 10min to 8hr
  time: z.string().datetime().optional(), // defaults to now (as endTime)
});

/**
 * Quick log a sleep activity
 * Creates a completed sleep entry with start and end times
 */
export const quickLogSleepAction = action
  .schema(quickLogSleepInputSchema)
  .action(
    async ({
      parsedInput,
    }): Promise<{ activity: typeof Activities.$inferSelect }> => {
      const api = await getApi();

      // Verify authentication
      const authResult = await auth();
      if (!authResult.userId) {
        throw new Error('Authentication required');
      }

      const { babyId } = parsedInput;

      // Calculate start and end times for completed entry
      const endTime = parsedInput.time
        ? new Date(parsedInput.time)
        : new Date();
      const startTime = new Date(
        endTime.getTime() - parsedInput.duration * 60 * 1000,
      );

      // Determine sleep type based on time of day
      const hour = startTime.getHours();
      const sleepType: 'nap' | 'night' =
        hour >= 6 && hour < 18 ? 'nap' : 'night';

      console.log('[quickLogSleepAction] Creating activity with:', {
        babyId,
        duration: parsedInput.duration,
        endTime: endTime.toISOString(),
        parsedInputRaw: JSON.stringify(parsedInput),
        sleepType,
        startTime: startTime.toISOString(),
      });

      // Create the sleep activity as a completed entry
      const createInput = {
        babyId,
        details: {
          sleepType,
          type: 'sleep' as const,
        },
        duration: parsedInput.duration,
        endTime,
        isScheduled: false,
        startTime,
        type: 'sleep' as const,
      };

      console.log(
        '[quickLogSleepAction] About to call api.activities.create with:',
        JSON.stringify(createInput, null, 2),
      );

      const activity = await api.activities.create(createInput);

      console.log('[quickLogSleepAction] Created activity RESPONSE:', {
        duration: activity.duration,
        durationType: typeof activity.duration,
        endTime: activity.endTime,
        fullActivity: JSON.stringify(activity, null, 2),
        id: activity.id,
        startTime: activity.startTime,
      });

      // Revalidate pages
      revalidateAppPaths();

      return { activity };
    },
  );

const autoStopInProgressSleepInputSchema = z.object({
  babyId: z.string(),
});

/**
 * Auto-stop any in-progress sleep activity
 * Called when starting a feeding or diaper change
 * Returns the stopped activity if one was found, null otherwise
 */
export const autoStopInProgressSleepAction = action
  .schema(autoStopInProgressSleepInputSchema)
  .action(
    async ({
      parsedInput,
    }): Promise<{ activity: typeof Activities.$inferSelect | null }> => {
      const api = await getApi();

      // Verify authentication
      const authResult = await auth();
      if (!authResult.userId) {
        throw new Error('Authentication required');
      }

      const { babyId } = parsedInput;

      // Check for in-progress sleep activity
      const inProgressSleep = await api.activities.getInProgressActivity({
        activityType: 'sleep',
        babyId,
      });

      // If no in-progress sleep, return null
      if (!inProgressSleep) {
        return { activity: null };
      }

      // Stop the sleep by setting endTime to now
      const now = new Date();
      const startTime = new Date(inProgressSleep.startTime);
      const elapsedMinutes =
        (now.getTime() - startTime.getTime()) / (1000 * 60);
      const durationMinutes = Math.max(1, Math.ceil(elapsedMinutes));

      const stoppedActivity = await api.activities.update({
        duration: durationMinutes,
        endTime: now,
        id: inProgressSleep.id,
      });

      // Revalidate pages
      revalidateAppPaths();

      return { activity: stoppedActivity };
    },
  );
