'use server';

import { auth } from '@clerk/nextjs/server';
import { getApi } from '@nugget/api/server';
import type { Activities } from '@nugget/db/schema';
import { revalidatePath } from 'next/cache';
import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';
import { getDiaperGuidanceByAge } from './diaper-intervals';
import { type DiaperPrediction, predictNextDiaper } from './prediction';

const action = createSafeActionClient();

export interface UpcomingDiaperData {
  prediction: DiaperPrediction;
  guidanceMessage: string;
  babyAgeDays: number | null;
}

/**
 * Get upcoming diaper change prediction
 */
export const getUpcomingDiaperAction = action.action(
  async (): Promise<UpcomingDiaperData> => {
    // Verify authentication
    const authResult = await auth();
    if (!authResult.userId || !authResult.orgId) {
      throw new Error('Authentication required');
    }

    // Create tRPC caller
    const api = await getApi();

    // Get the most recent baby
    const baby = await api.babies.getMostRecent.fetch();

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
    // We need more activities to analyze feeding/sleep correlations
    const recentActivities = await api.activities.list.fetch({
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
  },
);

const quickLogDiaperInputSchema = z.object({
  time: z.string().datetime().optional(), // defaults to now
  type: z.enum(['wet', 'dirty', 'both']).optional(), // defaults to wet
});

/**
 * Quick log a diaper change activity (for when change is overdue)
 */
export const quickLogDiaperAction = action
  .schema(quickLogDiaperInputSchema)
  .action(
    async ({
      parsedInput,
    }): Promise<{ activity: typeof Activities.$inferSelect }> => {
      // Verify authentication
      const authResult = await auth();
      if (!authResult.userId) {
        throw new Error('Authentication required');
      }

      // Get the most recent baby
      const baby = await api.babies.getMostRecent.fetch();

      if (!baby) {
        throw new Error('No baby found. Please complete onboarding first.');
      }

      // Create the diaper activity with type details
      const diaperType = parsedInput.type || 'wet';
      const activity = await api.activities.create({
        babyId: baby.id,
        details: {
          type: diaperType,
        },
        isScheduled: false,
        startTime: parsedInput.time ? new Date(parsedInput.time) : new Date(),
        type: 'diaper',
      });

      // Revalidate pages
      revalidatePath('/app');

      return { activity };
    },
  );
