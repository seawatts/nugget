'use server';

import { auth } from '@clerk/nextjs/server';
import { createCaller, createTRPCContext } from '@nugget/api';
import type { Activities } from '@nugget/db/schema';
import { revalidatePath } from 'next/cache';
import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';
import { type PumpingPrediction, predictNextPumping } from './prediction';
import { getPumpingGuidanceByAge } from './pumping-intervals';

const action = createSafeActionClient();

export interface UpcomingPumpingData {
  prediction: PumpingPrediction;
  guidanceMessage: string;
  babyAgeDays: number | null;
}

/**
 * Get upcoming pumping prediction
 */
export const getUpcomingPumpingAction = action.action(
  async (): Promise<UpcomingPumpingData> => {
    // Verify authentication
    const authResult = await auth();
    if (!authResult.userId || !authResult.orgId) {
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

    // Calculate baby's age in days
    let babyAgeDays: number | null = null;
    if (baby.birthDate) {
      const today = new Date();
      const birth = new Date(baby.birthDate);
      const diffTime = Math.abs(today.getTime() - birth.getTime());
      babyAgeDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }

    // Fetch recent activities (last 48 hours) for prediction
    const recentActivities = await caller.activities.list({
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
  },
);

const quickLogPumpingInputSchema = z.object({
  amount: z.number().optional(), // amount in ml
  time: z.string().datetime().optional(), // defaults to now
});

/**
 * Quick log a pumping activity (for when pumping is overdue)
 */
export const quickLogPumpingAction = action
  .schema(quickLogPumpingInputSchema)
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

      // Create the pumping activity
      const activity = await caller.activities.create({
        amount: parsedInput.amount || null,
        babyId: baby.id,
        details: null,
        isScheduled: false,
        startTime: parsedInput.time ? new Date(parsedInput.time) : new Date(),
        type: 'pumping',
      });

      // Revalidate pages
      revalidatePath('/app');

      return { activity };
    },
  );
