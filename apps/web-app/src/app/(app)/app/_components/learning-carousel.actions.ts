'use server';

import { auth } from '@clerk/nextjs/server';
import { b } from '@nugget/ai/async_client';
import { createCaller, createTRPCContext } from '@nugget/api';
import {
  pickForSlot,
  type RuleContext,
  Scope,
  Screen,
  Slot,
} from '@nugget/content-rules';
import { DbCache } from '@nugget/content-rules/db-cache-adapter';
import { resolveAIProps } from '@nugget/content-rules/dynamic-baml';
import { createExampleProgram } from '@nugget/content-rules/example-program';
import { Activities, type Baby, GrowthRecords } from '@nugget/db/schema';
import {
  differenceInDays,
  differenceInWeeks,
  subDays,
  subWeeks,
} from 'date-fns';
import { and, desc, eq, gte } from 'drizzle-orm';

interface LearningCard {
  id: string;
  template: string;
  props: Record<string, unknown>;
  screen: Screen;
  slot: Slot;
}

interface BabyContext {
  ageInDays: number;
  ageInWeeks: number;
  currentWeightOz?: number;
  birthWeightOz?: number;
  height?: number;
  headCircumference?: number;
}

interface ActivitySummary {
  feedingCount: number;
  sleepCount: number;
  diaperCount: number;
  avgFeedingInterval: number;
  totalSleepHours: number;
}

interface WeeklyPatterns {
  avgFeedingsPerDay: number;
  avgSleepHours: number;
  avgDiaperChanges: number;
}

interface EnhancedBabyData {
  baby: BabyContext;
  activities24h: ActivitySummary;
  weeklyPatterns: WeeklyPatterns;
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

export interface LearningCarouselData {
  cards: LearningCard[];
  baby: Baby | null;
}

/**
 * Fetch learning carousel content based on baby's age and family context
 */
export async function getLearningCarouselContent(
  babyId: string,
): Promise<LearningCarouselData> {
  try {
    // Verify authentication
    const authResult = await auth();
    if (!authResult.userId) {
      return { baby: null, cards: [] };
    }

    // Create tRPC caller
    const ctx = await createTRPCContext();
    const caller = createCaller(ctx);

    // Get the specific baby by ID
    const baby = await caller.babies.getById({ id: babyId });

    if (!baby) {
      return { baby: null, cards: [] };
    }

    // Get enhanced baby data (growth records, activities, patterns)
    const enhancedData = await getEnhancedBabyData(
      baby.id,
      baby.birthDate,
      baby.birthWeightOz,
      baby.currentWeightOz,
      ctx,
    );

    // Create database-backed cache for this baby
    const cache = new DbCache(
      ctx.db,
      baby.id,
      baby.familyId,
      authResult.userId,
    );

    // Build rule context with enhanced data
    const context = buildRuleContext(baby, enhancedData);

    // Create the rules program with BAML client
    const program = createExampleProgram(b);
    const rules = program.build();

    // Evaluate rules for the Learning screen, Header slot
    const cards: LearningCard[] = [];

    // Try to get up to 5 cards from different slots/screens
    const slots = [
      { screen: Screen.Learning, slot: Slot.Header },
      { screen: Screen.Learning, slot: Slot.Callout },
      { screen: Screen.Pregnancy, slot: Slot.Header },
      { screen: Screen.Pregnancy, slot: Slot.Callout },
      { screen: Screen.Hospital, slot: Slot.Callout },
    ];

    for (const { screen, slot } of slots) {
      if (cards.length >= 10) break; // Allow more cards since we're expanding tip arrays

      const result = await pickForSlot(rules, screen, slot, context, cache);

      if (result) {
        // Resolve non-AI props first (compute functions, regular values)
        // AI props will be resolved separately to avoid blocking
        const quickResolvedProps: Record<string, unknown> = {};

        for (const [key, value] of Object.entries(result.props)) {
          if (value && typeof value === 'object' && '_type' in value) {
            if (value._type === 'compute') {
              // Resolve compute functions immediately (they're fast)
              // biome-ignore lint/suspicious/noExplicitAny: PropValue type erasure requires any for compute fn access
              quickResolvedProps[key] = (value as any).fn(context);
            } else if (value._type === 'aiTextBaml') {
              // Mark AI props as pending - will be resolved later
              quickResolvedProps[key] = '[AI_PENDING]';
            } else {
              quickResolvedProps[key] = value;
            }
          } else {
            quickResolvedProps[key] = value;
          }
        }

        // Add age in days based on context (for display in card header)
        const ageInDays = context.baby?.ageInDays;

        cards.push({
          id: `${screen}-${slot}-${cards.length}`,
          props: {
            ...quickResolvedProps,
            ageInDays,
          },
          screen,
          slot,
          template: result.template,
        });
      }
    }

    return { baby, cards };
  } catch (error) {
    console.error('Error fetching learning carousel content:', error);
    return { baby: null, cards: [] };
  }
}

/**
 * Build rule context from baby data with enhanced information
 */
function buildRuleContext(
  baby: {
    id: string;
    firstName: string;
    middleName: string | null;
    lastName: string | null;
    birthDate: Date | null;
    dueDate: Date | null;
    journeyStage: string | null;
    gender: string | null;
  },
  enhancedData: EnhancedBabyData,
): RuleContext {
  const now = new Date();
  let scope: Scope | undefined;
  let week: number | undefined;
  let ppDay: number | undefined;
  let ppWeek: number | undefined;

  // Determine scope and time-based values
  if (baby.birthDate) {
    // Baby is born - postpartum
    scope = Scope.Postpartum;
    const ageInDays = differenceInDays(now, baby.birthDate);
    const ageInWeeks = differenceInWeeks(now, baby.birthDate);
    ppDay = ageInDays;
    ppWeek = ageInWeeks;
  } else if (baby.dueDate) {
    // Still pregnant
    scope = Scope.Pregnancy;
    const weeksPregnant = 40 - differenceInWeeks(baby.dueDate, now);
    week = Math.max(0, Math.min(42, weeksPregnant));
  }

  return {
    baby: {
      ageInDays: baby.birthDate
        ? differenceInDays(now, baby.birthDate)
        : undefined,
      firstName: baby.firstName,
      lastName: baby.lastName,
      middleName: baby.middleName,
      sex: baby.gender || 'U',
    },
    done: {
      nursery_setup: false, // TODO: Get from actual completion tracking
    },
    // Enhanced baby context
    enhancedBabyData: enhancedData,
    ppDay,
    ppWeek,
    progress: {
      hospital_bag: 0, // TODO: Get from actual progress tracking
      nursery_essentials: 0,
    },
    scope,
    season: getSeason(),
    stale: {},
    traits: {
      firstPregnancy: true, // TODO: Determine from user data
      userId: baby.id,
    },
    week,
  };
}

/**
 * Get current season
 */
function getSeason(): string {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'fall';
  return 'winter';
}

/**
 * Fetch enhanced baby data including growth records, activities, and patterns
 */
async function getEnhancedBabyData(
  babyId: string,
  birthDate: Date | null,
  birthWeightOz: number | null,
  currentWeightOz: number | null,
  ctx: Awaited<ReturnType<typeof createTRPCContext>>,
): Promise<EnhancedBabyData> {
  const now = new Date();
  const ageInDays = birthDate ? differenceInDays(now, birthDate) : 0;
  const ageInWeeks = birthDate ? differenceInWeeks(now, birthDate) : 0;

  // Fetch latest growth record
  const latestGrowth = await ctx.db.query.GrowthRecords.findFirst({
    orderBy: [desc(GrowthRecords.date)],
    where: eq(GrowthRecords.babyId, babyId),
  });

  // Fetch activities from last 24 hours
  const twentyFourHoursAgo = subDays(now, 1);
  const recentActivities = await ctx.db.query.Activities.findMany({
    orderBy: [desc(Activities.startTime)],
    where: and(
      eq(Activities.babyId, babyId),
      gte(Activities.startTime, twentyFourHoursAgo),
      eq(Activities.isScheduled, false),
    ),
  });

  // Fetch activities from last 7 days for weekly patterns
  const sevenDaysAgo = subWeeks(now, 1);
  const weeklyActivities = await ctx.db.query.Activities.findMany({
    orderBy: [desc(Activities.startTime)],
    where: and(
      eq(Activities.babyId, babyId),
      gte(Activities.startTime, sevenDaysAgo),
      eq(Activities.isScheduled, false),
    ),
  });

  // Calculate 24h activity summary
  const activities24h = calculateActivitySummary(recentActivities);

  // Calculate weekly patterns
  const weeklyPatterns = calculateWeeklyPatterns(weeklyActivities);

  return {
    activities24h,
    baby: {
      ageInDays,
      ageInWeeks,
      birthWeightOz: birthWeightOz ?? undefined,
      currentWeightOz: currentWeightOz ?? undefined,
      headCircumference: latestGrowth?.headCircumference ?? undefined,
      height: latestGrowth?.height ?? undefined,
    },
    weeklyPatterns,
  };
}

/**
 * Calculate activity summary for a given period
 */
function calculateActivitySummary(
  activities: Array<{
    type: string;
    startTime: Date;
    endTime: Date | null;
  }>,
): ActivitySummary {
  const feedingActivities = activities.filter((a) =>
    ['feeding', 'bottle', 'nursing'].includes(a.type),
  );
  const sleepActivities = activities.filter((a) => a.type === 'sleep');
  const diaperActivities = activities.filter((a) =>
    ['diaper', 'wet', 'dirty', 'both'].includes(a.type),
  );

  // Calculate average feeding interval
  let avgFeedingInterval = 0;
  if (feedingActivities.length > 1) {
    const intervals: number[] = [];
    for (let i = 1; i < feedingActivities.length; i++) {
      const prevActivity = feedingActivities[i - 1];
      const currActivity = feedingActivities[i];
      if (prevActivity?.startTime && currActivity?.startTime) {
        const interval = differenceInDays(
          prevActivity.startTime,
          currActivity.startTime,
        );
        intervals.push(interval * 24); // Convert to hours
      }
    }
    avgFeedingInterval =
      intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
  }

  // Calculate total sleep hours
  let totalSleepHours = 0;
  for (const activity of sleepActivities) {
    if (activity.endTime) {
      const hours =
        (activity.endTime.getTime() - activity.startTime.getTime()) /
        (1000 * 60 * 60);
      totalSleepHours += hours;
    }
  }

  return {
    avgFeedingInterval: Number(avgFeedingInterval.toFixed(1)),
    diaperCount: diaperActivities.length,
    feedingCount: feedingActivities.length,
    sleepCount: sleepActivities.length,
    totalSleepHours: Number(totalSleepHours.toFixed(1)),
  };
}

/**
 * Calculate weekly patterns from activities
 */
function calculateWeeklyPatterns(
  activities: Array<{
    type: string;
    startTime: Date;
    endTime: Date | null;
  }>,
): WeeklyPatterns {
  const feedingActivities = activities.filter((a) =>
    ['feeding', 'bottle', 'nursing'].includes(a.type),
  );
  const sleepActivities = activities.filter((a) => a.type === 'sleep');
  const diaperActivities = activities.filter((a) =>
    ['diaper', 'wet', 'dirty', 'both'].includes(a.type),
  );

  // Calculate average per day (over 7 days)
  const avgFeedingsPerDay = feedingActivities.length / 7;

  // Calculate total sleep hours
  let totalSleepHours = 0;
  for (const activity of sleepActivities) {
    if (activity.endTime) {
      const hours =
        (activity.endTime.getTime() - activity.startTime.getTime()) /
        (1000 * 60 * 60);
      totalSleepHours += hours;
    }
  }
  const avgSleepHours = totalSleepHours / 7;

  const avgDiaperChanges = diaperActivities.length / 7;

  return {
    avgDiaperChanges: Number(avgDiaperChanges.toFixed(1)),
    avgFeedingsPerDay: Number(avgFeedingsPerDay.toFixed(1)),
    avgSleepHours: Number(avgSleepHours.toFixed(1)),
  };
}

/**
 * Get age label for display
 */
function _getAgeLabel(context: RuleContext): string | undefined {
  if (context.scope === Scope.Postpartum) {
    if (context.ppDay !== undefined && context.ppDay <= 14) {
      return `Day ${context.ppDay}`;
    }
    if (context.ppWeek !== undefined) {
      return `Week ${context.ppWeek}`;
    }
  } else if (context.scope === Scope.Pregnancy && context.week !== undefined) {
    return `Week ${context.week}`;
  }
  return undefined;
}

/**
 * Resolve AI content for a specific card (non-blocking)
 */
export async function resolveCardAIContent(
  _cardId: string,
  screen: Screen,
  slot: Slot,
): Promise<Record<string, unknown> | null> {
  try {
    // Verify authentication
    const authResult = await auth();
    if (!authResult.userId) {
      return null;
    }

    // Create tRPC caller
    const ctx = await createTRPCContext();
    const caller = createCaller(ctx);

    // Get the primary baby for the family
    const babies = await caller.babies.list();
    const baby = babies[0];

    if (!baby) {
      return null;
    }

    // Get enhanced baby data (growth records, activities, patterns)
    const enhancedData = await getEnhancedBabyData(
      baby.id,
      baby.birthDate,
      baby.birthWeightOz,
      baby.currentWeightOz,
      ctx,
    );

    // Create database-backed cache for this baby
    const cache = new DbCache(
      ctx.db,
      baby.id,
      baby.familyId,
      authResult.userId,
    );

    // Build rule context with enhanced data
    const context = buildRuleContext(baby, enhancedData);

    // Create the rules program with BAML client
    const program = createExampleProgram(b);
    const rules = program.build();

    // Get the specific rule
    const result = await pickForSlot(rules, screen, slot, context, cache);

    if (!result) {
      return null;
    }

    // Resolve only AI props
    const aiResolvedProps: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(result.props)) {
      if (
        value &&
        typeof value === 'object' &&
        '_type' in value &&
        value._type === 'aiTextBaml'
      ) {
        // Resolve AI props using the full resolver
        const resolved = await resolveAIProps({ [key]: value }, context, cache);
        aiResolvedProps[key] = resolved[key];
      }
    }

    return aiResolvedProps;
  } catch (error) {
    console.error('Error resolving AI content:', error);
    return null;
  }
}
