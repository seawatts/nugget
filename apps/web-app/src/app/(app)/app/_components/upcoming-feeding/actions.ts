'use server';

import { auth } from '@clerk/nextjs/server';
import { getApi } from '@nugget/api/server';
import type { Activities } from '@nugget/db/schema';
import { revalidatePath } from 'next/cache';
import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';
import {
  type FamilyMemberScore,
  getAssignedMember,
  suggestFamilyMember,
} from './assignment';
import { getFeedingGuidanceByAge } from './feeding-intervals';
import { type FeedingPrediction, predictNextFeeding } from './prediction';

const action = createSafeActionClient();

export interface UpcomingFeedingData {
  prediction: FeedingPrediction;
  suggestedMember: FamilyMemberScore | null;
  assignedMember: FamilyMemberScore | null;
  scheduledFeeding: typeof Activities.$inferSelect | null;
  guidanceMessage: string;
  babyAgeDays: number | null;
  familyMemberCount: number;
}

/**
 * Get upcoming feeding prediction and suggested family member
 */
export const getUpcomingFeedingAction = action.action(
  async (): Promise<UpcomingFeedingData> => {
    // Verify authentication
    const authResult = await auth();
    if (!authResult.userId || !authResult.orgId) {
      throw new Error('Authentication required');
    }

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

    // Fetch recent activities (last 48 hours) for prediction
    const recentActivities = await api.activities.list.fetch({
      babyId: baby.id,
      limit: 50,
    });

    // Filter to only recent feedings
    const fortyEightHoursAgo = new Date();
    fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);

    const recentFeedings = recentActivities.filter((activity) => {
      const activityDate = new Date(activity.startTime);
      return activityDate >= fortyEightHoursAgo;
    });

    // Calculate feeding prediction
    const prediction = predictNextFeeding(
      recentFeedings,
      baby.birthDate,
      baby.feedIntervalHours,
    );

    // Check for existing scheduled feeding
    const scheduledFeeding = recentActivities.find(
      (a) =>
        a.isScheduled &&
        (a.type === 'bottle' || a.type === 'nursing') &&
        new Date(a.startTime) > new Date(),
    );

    // Get family members for suggestion
    const familyMembers = await api.familyMembers.all();

    // Suggest a family member or get assigned member
    let suggestedMember: FamilyMemberScore | null = null;
    let assignedMember: FamilyMemberScore | null = null;

    if (scheduledFeeding?.assignedUserId) {
      assignedMember = getAssignedMember(scheduledFeeding, familyMembers);
    } else {
      const suggestion = suggestFamilyMember(familyMembers, recentFeedings);
      suggestedMember = suggestion.suggestedMember;
    }

    // Get age-appropriate guidance
    const guidanceMessage =
      babyAgeDays !== null
        ? getFeedingGuidanceByAge(babyAgeDays)
        : "Follow your pediatrician's feeding recommendations.";

    return {
      assignedMember,
      babyAgeDays,
      familyMemberCount: familyMembers.length,
      guidanceMessage,
      prediction,
      scheduledFeeding: scheduledFeeding || null,
      suggestedMember,
    };
  },
);

const claimFeedingInputSchema = z.object({
  predictedTime: z.string(), // ISO date string
});

/**
 * Claim a feeding (assign it to the current user)
 */
export const claimFeedingAction = action
  .schema(claimFeedingInputSchema)
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
      const api = await getApi();

      // Get the most recent baby
      const baby = await api.babies.getMostRecent.fetch();

      if (!baby) {
        throw new Error('No baby found. Please complete onboarding first.');
      }

      // Check if there's already a scheduled feeding
      const recentActivities = await api.activities.list.fetch({
        babyId: baby.id,
        limit: 20,
      });

      const existingScheduled = recentActivities.find(
        (a) =>
          a.isScheduled &&
          (a.type === 'bottle' || a.type === 'nursing') &&
          new Date(a.startTime) > new Date(),
      );

      let activity: typeof Activities.$inferSelect;

      if (existingScheduled) {
        // Update existing scheduled feeding with new assignment
        activity = await api.activities.update.fetch({
          assignedUserId: authResult.userId,
          id: existingScheduled.id,
          startTime: new Date(parsedInput.predictedTime),
        });
      } else {
        // Create new scheduled feeding
        activity = await api.activities.create.fetch({
          assignedUserId: authResult.userId,
          babyId: baby.id,
          details: null,
          isScheduled: true,
          startTime: new Date(parsedInput.predictedTime),
          type: 'bottle', // Default to bottle, user can change when completing
        });
      }

      // Revalidate pages
      revalidatePath('/app');

      return { activity };
    },
  );

const completeFeedingInputSchema = z.object({
  activityId: z.string(),
});

/**
 * Mark a scheduled feeding as completed (convert to actual feeding)
 */
export const completeFeedingAction = action
  .schema(completeFeedingInputSchema)
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
      const api = await getApi();

      // Update the activity to mark as completed
      const activity = await api.activities.update.fetch({
        id: parsedInput.activityId,
        isScheduled: false,
        startTime: new Date(), // Update to actual completion time
      });

      // Revalidate pages
      revalidatePath('/app');

      return { activity };
    },
  );

const unclaimFeedingInputSchema = z.object({
  activityId: z.string(),
});

/**
 * Unclaim a feeding (remove assignment)
 */
export const unclaimFeedingAction = action
  .schema(unclaimFeedingInputSchema)
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
      const api = await getApi();

      // Update the activity to remove assignment
      const activity = await api.activities.update.fetch({
        assignedUserId: null,
        id: parsedInput.activityId,
      });

      // Revalidate pages
      revalidatePath('/app');

      return { activity };
    },
  );

const quickLogFeedingInputSchema = z.object({
  amount: z.number().optional(),
  time: z.string().datetime().optional(), // defaults to now
  type: z.enum(['bottle', 'nursing']).optional(), // defaults to bottle
});

/**
 * Quick log a feeding activity (for when feeding is overdue)
 */
export const quickLogFeedingAction = action
  .schema(quickLogFeedingInputSchema)
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
      const api = await getApi();

      // Get the most recent baby
      const baby = await api.babies.getMostRecent.fetch();

      if (!baby) {
        throw new Error('No baby found. Please complete onboarding first.');
      }

      // Create the feeding activity
      const activity = await api.activities.create.fetch({
        amount: parsedInput.amount,
        babyId: baby.id,
        details: null,
        isScheduled: false,
        startTime: parsedInput.time ? new Date(parsedInput.time) : new Date(),
        type: parsedInput.type || 'bottle',
      });

      // Revalidate pages
      revalidatePath('/app');

      return { activity };
    },
  );
