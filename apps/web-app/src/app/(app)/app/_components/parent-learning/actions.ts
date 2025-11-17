'use server';

import { auth } from '@clerk/nextjs/server';
import { PostpartumTips } from '@nugget/ai/react/server';
import { getApi } from '@nugget/api/server';
import { db } from '@nugget/db/client';
import { Activities } from '@nugget/db/schema';
import { differenceInDays, differenceInWeeks, subDays } from 'date-fns';
import { and, eq, gte } from 'drizzle-orm';
import { createSafeActionClient } from 'next-safe-action';

const action = createSafeActionClient();

// ============================================================================
// Timeout and Retry Utility
// ============================================================================

interface RetryOptions {
  maxAttempts?: number;
  timeoutMs?: number;
  baseDelayMs?: number;
}

/**
 * Wraps an async function with timeout and retry logic
 */
async function withTimeoutAndRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<{ data: T | null; error: string | null }> {
  const {
    maxAttempts = 3,
    timeoutMs = 30000, // 30 seconds
    baseDelayMs = 1000, // 1 second base delay
  } = options;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Request timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      });

      // Race between the actual function and the timeout
      const data = await Promise.race([fn(), timeoutPromise]);
      return { data, error: null };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      // If this was the last attempt, return the error
      if (attempt === maxAttempts) {
        console.error(`Failed after ${maxAttempts} attempts: ${errorMessage}`);
        return { data: null, error: errorMessage };
      }

      // Calculate exponential backoff delay
      const delay = baseDelayMs * 2 ** (attempt - 1);
      console.warn(
        `Attempt ${attempt} failed: ${errorMessage}. Retrying in ${delay}ms...`,
      );

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return { data: null, error: 'Max retry attempts exceeded' };
}

export interface LearningTip {
  category:
    | 'feeding'
    | 'sleep'
    | 'diaper'
    | 'development'
    | 'health'
    | 'postpartum';
  subtitle: string;
  summary: string;
  bulletPoints: string[];
  followUpQuestion: string;
}

/**
 * Get postpartum learning content for a parent
 */
export const getParentLearningContentAction = action.action(async () => {
  const api = await getApi();
  const authResult = await auth();

  // Check authentication
  if (!authResult?.userId || !authResult?.orgId) {
    return { babyName: '', error: null, postpartumDay: 0, tips: [] };
  }

  const { orgId } = authResult;

  // Get the primary baby
  const babies = await api.babies.list();
  const baby = babies[0];

  if (!baby || !baby.birthDate) {
    return { babyName: '', error: null, postpartumDay: 0, tips: [] };
  }

  // Calculate postpartum day (days since baby was born)
  const postpartumDay = differenceInDays(new Date(), baby.birthDate);
  const ageInWeeks = differenceInWeeks(new Date(), baby.birthDate);

  // Get baby's recent activities for context
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = subDays(new Date(), 7);

  // Fetch activities from last 24 hours
  const activities24h = await db.query.Activities.findMany({
    where: and(
      eq(Activities.familyId, orgId),
      gte(Activities.startTime, twentyFourHoursAgo),
    ),
  });

  // Fetch activities from last 7 days for patterns
  const activities7d = await db.query.Activities.findMany({
    where: and(
      eq(Activities.familyId, orgId),
      gte(Activities.startTime, sevenDaysAgo),
    ),
  });

  // Calculate 24h activity summaries
  const feedingCount24h = activities24h.filter(
    (a) => a.type === 'nursing' || a.type === 'bottle',
  ).length;

  const sleepActivities24h = activities24h.filter((a) => a.type === 'sleep');
  const sleepCount24h = sleepActivities24h.length;
  const totalSleepHours24h =
    sleepActivities24h.reduce((sum, a) => sum + (a.duration || 0), 0) / 3600;

  const diaperCount24h = activities24h.filter(
    (a) => a.type === 'diaper',
  ).length;

  // Calculate weekly patterns
  const feedingActivities7d = activities7d.filter(
    (a) => a.type === 'nursing' || a.type === 'bottle',
  );
  const avgFeedingsPerDay = feedingActivities7d.length / 7;

  const sleepActivities7d = activities7d.filter((a) => a.type === 'sleep');
  const totalSleepHours7d =
    sleepActivities7d.reduce((sum, a) => sum + (a.duration || 0), 0) / 3600;
  const avgSleepHoursPerDay = totalSleepHours7d / 7;

  const diaperActivities7d = activities7d.filter((a) => a.type === 'diaper');
  const avgDiaperChangesPerDay = diaperActivities7d.length / 7;

  // Calculate average feeding interval
  const feedingIntervals: number[] = [];
  const sortedFeedings = [...feedingActivities7d].sort(
    (a, b) => a.startTime.getTime() - b.startTime.getTime(),
  );
  for (let i = 1; i < sortedFeedings.length; i++) {
    const current = sortedFeedings[i];
    const previous = sortedFeedings[i - 1];
    if (current && previous) {
      const intervalMs =
        current.startTime.getTime() - previous.startTime.getTime();
      feedingIntervals.push(intervalMs / (1000 * 60 * 60)); // Convert to hours
    }
  }
  const avgFeedingInterval =
    feedingIntervals.length > 0
      ? feedingIntervals.reduce((sum, i) => sum + i, 0) /
        feedingIntervals.length
      : null;

  // Determine if this is a first pregnancy (simplified: assume first baby = first pregnancy)
  const firstPregnancy = babies.length === 1;

  // Use baby's first name only
  const babyName = baby.firstName || 'your baby';

  // Call BAML function for postpartum tips with timeout and retry
  const { data: result, error } = await withTimeoutAndRetry(
    () =>
      PostpartumTips({
        ageInDays: postpartumDay,
        ageInWeeks,
        avgDiaperChangesPerDay: avgDiaperChangesPerDay || null,
        avgFeedingInterval: avgFeedingInterval || null,
        avgFeedingsPerDay: avgFeedingsPerDay || null,
        avgSleepHoursPerDay: avgSleepHoursPerDay || null,
        babyName,
        babySex: baby.gender || null,
        birthWeightOz: baby.birthWeightOz || null,
        currentWeightOz: baby.currentWeightOz || null,
        day: postpartumDay,
        diaperCount24h: diaperCount24h || null,
        feedingCount24h: feedingCount24h || null,
        firstPregnancy,
        headCircumference: null,
        height: null,
        sleepCount24h: sleepCount24h || null,
        totalSleepHours24h: totalSleepHours24h || null,
      }),
    {
      maxAttempts: 3,
      timeoutMs: 30000, // 30 seconds
    },
  );

  // Handle error case
  if (error || !result) {
    console.error('Failed to fetch postpartum tips:', error);
    return {
      babyName: baby.firstName,
      error: error || 'Failed to load content',
      postpartumDay,
      tips: [],
    };
  }

  return {
    babyName: baby.firstName,
    error: null,
    postpartumDay,
    tips: result.tips,
  };
});
