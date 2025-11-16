'use server';

import { PostpartumTips } from '@nugget/ai/react/server';
import { createCaller, createTRPCContext } from '@nugget/api';
import { Activities } from '@nugget/db/schema';
import { differenceInDays, differenceInWeeks, subDays } from 'date-fns';
import { and, eq, gte } from 'drizzle-orm';
import { createSafeActionClient } from 'next-safe-action';

const action = createSafeActionClient();

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
  const ctx = await createTRPCContext();

  // Check authentication
  if (!ctx.auth?.userId || !ctx.auth?.orgId) {
    return { babyName: '', postpartumDay: 0, tips: [] };
  }

  const { orgId } = ctx.auth;

  const caller = createCaller(ctx);

  // Get the primary baby
  const babies = await caller.babies.list();
  const baby = babies[0];

  if (!baby || !baby.birthDate) {
    return { babyName: '', postpartumDay: 0, tips: [] };
  }

  // Calculate postpartum day (days since baby was born)
  const postpartumDay = differenceInDays(new Date(), baby.birthDate);
  const ageInWeeks = differenceInWeeks(new Date(), baby.birthDate);

  // Get baby's recent activities for context
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = subDays(new Date(), 7);

  // Fetch activities from last 24 hours
  const activities24h = await ctx.db.query.Activities.findMany({
    where: and(
      eq(Activities.familyId, orgId),
      gte(Activities.startTime, twentyFourHoursAgo),
    ),
  });

  // Fetch activities from last 7 days for patterns
  const activities7d = await ctx.db.query.Activities.findMany({
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

  // Call BAML function for postpartum tips
  const result = await PostpartumTips(
    babyName,
    postpartumDay,
    firstPregnancy,
    postpartumDay, // ageInDays
    ageInWeeks,
    baby.currentWeightOz || null,
    baby.birthWeightOz || null,
    null, // height
    null, // headCircumference
    feedingCount24h || null,
    avgFeedingInterval || null,
    sleepCount24h || null,
    totalSleepHours24h || null,
    diaperCount24h || null,
    avgFeedingsPerDay || null,
    avgSleepHoursPerDay || null,
    avgDiaperChangesPerDay || null,
  );

  return {
    babyName: baby.firstName,
    postpartumDay,
    tips: result.tips,
  };
});
