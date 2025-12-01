'use server';

import { auth } from '@clerk/nextjs/server';
import { getApi } from '@nugget/api/server';
import type { Activities } from '@nugget/db/schema';
import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';
import { revalidateAppPaths } from '~/app/(app)/app/_utils/revalidation';
import { getDiaperGuidanceByAge } from './diaper-intervals';
import { type DiaperPrediction, predictNextDiaper } from './prediction';

const action = createSafeActionClient();

export interface UpcomingDiaperData {
  prediction: DiaperPrediction;
  guidanceMessage: string;
  babyAgeDays: number | null;
}

const getUpcomingDiaperInputSchema = z.object({
  babyId: z.string(),
});

/**
 * Get upcoming diaper change prediction
 */
export const getUpcomingDiaperAction = action
  .schema(getUpcomingDiaperInputSchema)
  .action(async ({ parsedInput }): Promise<UpcomingDiaperData> => {
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
    // We need more activities to analyze feeding/sleep correlations
    const recentActivities = await api.activities.list({
      babyId: baby.id,
      limit: 100,
    });

    // Filter to only recent activities (last 72 hours)
    const seventyTwoHoursAgo = new Date();
    seventyTwoHoursAgo.setHours(seventyTwoHoursAgo.getHours() - 72);

    const recentActivityList = recentActivities.filter((activity) => {
      const activityDate = new Date(activity.startTime);
      return activityDate >= seventyTwoHoursAgo;
    });

    const recentDiapers = recentActivityList.filter(
      (activity) => activity.type === 'diaper',
    );

    // Calculate diaper prediction with feeding and sleep correlation
    const prediction = predictNextDiaper(
      recentDiapers,
      baby.birthDate,
      recentActivityList, // Pass all activities for correlation analysis
    );

    // Get age-appropriate guidance
    const guidanceMessage =
      babyAgeDays !== null
        ? getDiaperGuidanceByAge(babyAgeDays)
        : 'Check diaper regularly and change when wet or soiled.';

    return {
      babyAgeDays,
      guidanceMessage,
      prediction,
    };
  });

const quickLogDiaperInputSchema = z.object({
  babyId: z.string(),
  time: z.string().datetime().optional(), // defaults to now
  type: z.enum(['wet', 'dirty', 'both']).optional(), // defaults to wet
});

/**
 * Quick log a diaper change activity
 */
export const quickLogDiaperAction = action
  .schema(quickLogDiaperInputSchema)
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

      // Create the diaper activity with type details
      const diaperType = parsedInput.type || 'wet';
      const activity = await api.activities.create({
        babyId,
        details: {
          type: diaperType,
        },
        isScheduled: false,
        startTime: parsedInput.time ? new Date(parsedInput.time) : new Date(),
        type: 'diaper',
      });

      // Revalidate pages
      revalidateAppPaths();

      return { activity };
    },
  );
