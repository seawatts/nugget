'use server';

import { auth } from '@clerk/nextjs/server';
import { getApi } from '@nugget/api/server';
import type { Activities } from '@nugget/db/schema';
import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';
import { revalidateAppPaths } from '~/app/(app)/app/_utils/revalidation';
import { type PumpingPrediction, predictNextPumping } from './prediction';
import { getPumpingGuidanceByAge } from './pumping-intervals';

const action = createSafeActionClient();

export interface UpcomingPumpingData {
  prediction: PumpingPrediction;
  guidanceMessage: string;
  babyAgeDays: number | null;
}

const getUpcomingPumpingInputSchema = z.object({
  babyId: z.string(),
});

/**
 * Get upcoming pumping prediction
 */
export const getUpcomingPumpingAction = action
  .schema(getUpcomingPumpingInputSchema)
  .action(async ({ parsedInput }): Promise<UpcomingPumpingData> => {
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

    // Fetch recent activities (last 48 hours) for prediction
    const recentActivities = await api.activities.list({
      babyId: baby.id,
      limit: 50,
    });

    // Filter to only recent pumping activities
    const fortyEightHoursAgo = new Date();
    fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);

    const recentPumpings = recentActivities.filter((activity) => {
      const activityDate = new Date(activity.startTime);
      return activityDate >= fortyEightHoursAgo && activity.type === 'pumping';
    });

    // Calculate pumping prediction
    const prediction = predictNextPumping(recentPumpings, baby.birthDate);

    // Get age-appropriate guidance
    const guidanceMessage =
      babyAgeDays !== null
        ? getPumpingGuidanceByAge(babyAgeDays)
        : 'Pump regularly to establish and maintain milk supply.';

    return {
      babyAgeDays,
      guidanceMessage,
      prediction,
    };
  });

const quickLogPumpingInputSchema = z.object({
  amountMl: z.number().optional(), // amount in ml
  babyId: z.string(),
  time: z.string().datetime().optional(), // defaults to now
});

/**
 * Quick log a pumping activity
 */
export const quickLogPumpingAction = action
  .schema(quickLogPumpingInputSchema)
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

      // Create the pumping activity
      const activity = await api.activities.create({
        amountMl: parsedInput.amountMl || null,
        babyId,
        details: null,
        isScheduled: false,
        startTime: parsedInput.time ? new Date(parsedInput.time) : new Date(),
        type: 'pumping',
      });

      // Revalidate pages
      revalidateAppPaths();

      return { activity };
    },
  );
