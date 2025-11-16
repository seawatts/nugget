'use server';

import { DailyCheckInQuestions } from '@nugget/ai/react/server';
import { createTRPCContext } from '@nugget/api';
import { ParentCheckIns } from '@nugget/db/schema';
import { differenceInDays, subDays } from 'date-fns';
import { and, desc, eq, gte } from 'drizzle-orm';
import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';

const action = createSafeActionClient();

// ============================================================================
// Types
// ============================================================================

export interface CheckInQuestion {
  questionId: string;
  question: string;
  responseType: 'emoji_scale' | 'yes_no' | 'rating_1_5' | 'text_short';
  category: 'physical' | 'emotional' | 'support' | 'baby_concern' | 'self_care';
  priority: 'routine' | 'important' | 'urgent';
  followUpPrompt?: string;
}

export interface CheckInQuestionsOutput {
  questions: CheckInQuestion[];
  title: string;
}

export interface CheckInHistoryItem {
  date: Date;
  moodScore: number | null;
  concernsRaised: string[];
  responses: Array<{
    question: string;
    response: string | number | boolean;
    category: string;
  }>;
}

// ============================================================================
// Actions
// ============================================================================

/**
 * Get personalized daily check-in questions for a parent
 */
export const getDailyCheckInQuestionsAction = action
  .schema(z.object({ userId: z.string() }))
  .action(async ({ parsedInput }): Promise<CheckInQuestionsOutput> => {
    const ctx = await createTRPCContext();

    if (!ctx.auth?.orgId) {
      throw new Error('Authentication required.');
    }

    const { orgId } = ctx.auth;

    // Get baby data
    const baby = await ctx.db.query.Babies.findFirst({
      orderBy: (babies, { desc }) => [desc(babies.birthDate)],
      where: (babies, { eq }) => eq(babies.familyId, orgId),
    });

    if (!baby || !baby.birthDate) {
      return {
        questions: [],
        title: 'Daily Check-In',
      };
    }

    // Get parent's role from family members
    const familyMember = await ctx.db.query.FamilyMembers.findFirst({
      where: (members, { and, eq }) =>
        and(
          eq(members.userId, parsedInput.userId),
          eq(members.familyId, orgId),
        ),
    });

    const parentRole = familyMember?.userRole ?? 'primary';

    // Calculate postpartum day and baby age
    const ppDay = differenceInDays(new Date(), baby.birthDate);
    const ageInDays = ppDay;
    const ageInWeeks = Math.floor(ageInDays / 7);

    // Get parent's recent sleep data
    const oneDayAgo = subDays(new Date(), 1);
    const sleepActivities = await ctx.db.query.Activities.findMany({
      where: (activities, { and, eq, gte }) =>
        and(
          eq(activities.familyId, orgId),
          eq(activities.userId, parsedInput.userId),
          eq(activities.type, 'sleep'),
          gte(activities.startTime, oneDayAgo),
        ),
    });

    const parentSleepHours =
      sleepActivities.reduce((sum, a) => sum + (a.duration || 0), 0) / 3600;

    // Get baby's activity patterns
    const sevenDaysAgo = subDays(new Date(), 7);
    const recentActivities = await ctx.db.query.Activities.findMany({
      where: (activities, { and, eq, gte }) =>
        and(
          eq(activities.familyId, orgId),
          eq(activities.babyId, baby.id),
          gte(activities.startTime, sevenDaysAgo),
        ),
    });

    const feedingCount = recentActivities.filter(
      (a) => a.type === 'nursing' || a.type === 'bottle',
    ).length;
    const avgFeedingsPerDay = feedingCount / 7;

    const _sleepCount = recentActivities.filter(
      (a) => a.type === 'sleep',
    ).length;
    const avgSleepHours =
      recentActivities
        .filter((a) => a.type === 'sleep')
        .reduce((sum, a) => sum + (a.duration || 0), 0) /
      3600 /
      7;

    const diaperCount = recentActivities.filter(
      (a) => a.type === 'diaper',
    ).length;
    const avgDiaperChanges = diaperCount / 7;

    // Determine first pregnancy status
    const allBabies = await ctx.db.query.Babies.findMany({
      where: (babies, { eq }) => eq(babies.familyId, orgId),
    });
    const firstPregnancy = allBabies.length === 1;

    // Call BAML function for personalized questions
    const bamlResult = await DailyCheckInQuestions(
      ppDay,
      parentRole,
      parentSleepHours,
      ageInDays,
      ageInWeeks,
      firstPregnancy,
      avgFeedingsPerDay,
      avgSleepHours,
      avgDiaperChanges,
    );

    return {
      questions: bamlResult.questions.map((q, idx) => ({
        category: q.category as CheckInQuestion['category'],
        followUpPrompt: q.followUpPrompt ?? undefined,
        priority: q.priority as CheckInQuestion['priority'],
        question: q.question,
        questionId: `q${idx + 1}`,
        responseType:
          q.responseType.toLowerCase() as CheckInQuestion['responseType'],
      })),
      title: 'Daily Check-In',
    };
  });

/**
 * Submit check-in responses
 */
const submitCheckInSchema = z.object({
  concernsRaised: z.array(z.string()).default([]),
  moodScore: z.number().min(1).max(5).optional(),
  responses: z.array(
    z.object({
      category: z.enum([
        'physical',
        'emotional',
        'support',
        'baby_concern',
        'self_care',
      ]),
      question: z.string(),
      questionId: z.string(),
      response: z.union([z.string(), z.number(), z.boolean()]),
      responseType: z.enum([
        'emoji_scale',
        'yes_no',
        'rating_1_5',
        'text_short',
      ]),
    }),
  ),
  userId: z.string(),
});

export const submitCheckInResponsesAction = action
  .schema(submitCheckInSchema)
  .action(async ({ parsedInput }) => {
    const ctx = await createTRPCContext();

    if (!ctx.auth?.orgId) {
      throw new Error('Authentication required.');
    }

    const { orgId } = ctx.auth;

    // Get baby data for context
    const baby = await ctx.db.query.Babies.findFirst({
      orderBy: (babies, { desc }) => [desc(babies.birthDate)],
      where: (babies, { eq }) => eq(babies.familyId, orgId),
    });

    // Get parent's role
    const familyMember = await ctx.db.query.FamilyMembers.findFirst({
      where: (members, { and, eq }) =>
        and(
          eq(members.userId, parsedInput.userId),
          eq(members.familyId, orgId),
        ),
    });

    const parentRole = familyMember?.userRole ?? 'primary';

    // Calculate context
    const ppDay = baby?.birthDate
      ? differenceInDays(new Date(), baby.birthDate)
      : null;
    const babyAgeInDays = ppDay;

    // Get parent's recent sleep
    const oneDayAgo = subDays(new Date(), 1);
    const sleepActivities = await ctx.db.query.Activities.findMany({
      where: (activities, { and, eq, gte }) =>
        and(
          eq(activities.familyId, orgId),
          eq(activities.userId, parsedInput.userId),
          eq(activities.type, 'sleep'),
          gte(activities.startTime, oneDayAgo),
        ),
    });

    const parentSleepHours =
      sleepActivities.reduce((sum, a) => sum + (a.duration || 0), 0) / 3600;

    // Save check-in
    const [checkIn] = await ctx.db
      .insert(ParentCheckIns)
      .values({
        aiGeneratedQuestions: true,
        concernsRaised: parsedInput.concernsRaised,
        date: new Date(),
        familyId: orgId,
        moodScore: parsedInput.moodScore ?? null,
        questionContext: {
          babyAgeInDays: babyAgeInDays ?? undefined,
          parentRole,
          parentSleepHours,
          ppDay: ppDay ?? undefined,
        },
        responses: parsedInput.responses,
        userId: parsedInput.userId,
      })
      .returning();

    if (!checkIn) {
      throw new Error('Failed to save check-in.');
    }

    return { checkIn, success: true };
  });

/**
 * Get check-in history for a parent
 */
export const getCheckInHistoryAction = action
  .schema(z.object({ days: z.number().default(7), userId: z.string() }))
  .action(async ({ parsedInput }): Promise<CheckInHistoryItem[]> => {
    const ctx = await createTRPCContext();

    if (!ctx.auth?.orgId) {
      throw new Error('Authentication required.');
    }

    const { orgId } = ctx.auth;

    const since = subDays(new Date(), parsedInput.days);

    const checkIns = await ctx.db.query.ParentCheckIns.findMany({
      orderBy: [desc(ParentCheckIns.date)],
      where: and(
        eq(ParentCheckIns.familyId, orgId),
        eq(ParentCheckIns.userId, parsedInput.userId),
        gte(ParentCheckIns.date, since),
      ),
    });

    return checkIns.map((checkIn) => ({
      concernsRaised: (checkIn.concernsRaised as string[]) ?? [],
      date: checkIn.date,
      moodScore: checkIn.moodScore,
      responses:
        (checkIn.responses as Array<{
          question: string;
          response: string | number | boolean;
          category: string;
        }>) ?? [],
    }));
  });
