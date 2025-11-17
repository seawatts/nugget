'use server';

import { auth } from '@clerk/nextjs/server';
import { getApi } from '@nugget/api/server';
import type { Activities } from '@nugget/db/schema';
import { revalidatePath } from 'next/cache';
import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';
import { predictNextSleep, type SleepPrediction } from './prediction';
import { getSleepGuidanceByAge } from './sleep-intervals';

const action = createSafeActionClient();

export interface UpcomingSleepData {
  prediction: SleepPrediction;
  guidanceMessage: string;
  babyAgeDays: number | null;
}

/**
 * Get upcoming sleep prediction
 */
export const getUpcomingSleepAction = action.action(
  async (): Promise<UpcomingSleepData> => {
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
  },
);

const quickLogSleepInputSchema = z.object({
  duration: z.number().min(10).max(480), // duration in minutes, 10min to 8hr
  time: z.string().datetime().optional(), // defaults to now (as endTime)
});

/**
 * Quick log a sleep activity (for when sleep is overdue)
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

      // Get the most recent baby
      const baby = await api.babies.getMostRecent();

      if (!baby) {
        throw new Error('No baby found. Please complete onboarding first.');
      }

      // Calculate start and end times for completed entry
      const endTime = parsedInput.time
        ? new Date(parsedInput.time)
        : new Date();
      const startTime = new Date(
        endTime.getTime() - parsedInput.duration * 60 * 1000,
      );

      // Determine sleep type based on time of day
      const hour = startTime.getHours();
      const sleepType = hour >= 6 && hour < 18 ? 'nap' : 'night';

      // Create the sleep activity as a completed entry
      const activity = await api.activities.create({
        babyId: baby.id,
        details: {
          sleepType,
          type: 'sleep',
        },
        duration: parsedInput.duration,
        endTime,
        isScheduled: false,
        startTime,
        type: 'sleep',
      });

      // Revalidate pages
      revalidatePath('/app');

      return { activity };
    },
  );
