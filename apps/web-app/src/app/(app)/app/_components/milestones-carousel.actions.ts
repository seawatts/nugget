'use server';

import { auth } from '@clerk/nextjs/server';
import { b } from '@nugget/ai/async_client';
import { getApi } from '@nugget/api/server';
import {
  evalCond,
  type RuleContext,
  Scope,
  Screen,
  Slot,
} from '@nugget/content-rules';
import { DbCache } from '@nugget/content-rules/db-cache-adapter';
import { createMilestonesProgram } from '@nugget/content-rules/milestones-program';
import { db } from '@nugget/db/client';
import { Activities, Milestones } from '@nugget/db/schema';
import { createId } from '@nugget/id';
import {
  differenceInDays,
  differenceInWeeks,
  subDays,
  subWeeks,
} from 'date-fns';
import { and, eq, gte } from 'drizzle-orm';
import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';

const action = createSafeActionClient();

export interface MilestoneCardData {
  id: string;
  title: string;
  description: string;
  type: 'physical' | 'cognitive' | 'social' | 'language' | 'self_care';
  ageLabel: string;
  suggestedDay?: number;
  isCompleted: boolean;
}

interface MilestonesCarouselData {
  milestones: MilestoneCardData[];
}

/**
 * Fetch milestones carousel content based on baby's age
 */
export async function getMilestonesCarouselContent(
  babyId: string,
): Promise<MilestonesCarouselData> {
  try {
    // Verify authentication
    const authResult = await auth();
    if (!authResult.userId) {
      return { milestones: [] };
    }

    // Create tRPC API helper
    const api = await getApi();

    // Get the specific baby by ID
    const baby = await api.babies.getById.fetch({ id: babyId });

    if (!baby) {
      return { milestones: [] };
    }

    // Get completed milestones for this baby
    const completedMilestones = await db
      .select()
      .from(Milestones)
      .where(
        and(eq(Milestones.babyId, baby.id), eq(Milestones.isSuggested, true)),
      )
      .execute();

    const completedTitles = new Set(
      completedMilestones
        .filter((m) => m.achievedDate !== null)
        .map((m) => m.title),
    );

    // Create database-backed cache for this baby
    const _cache = new DbCache(db, baby.id, baby.familyId, authResult.userId);

    // Build rule context
    const context = buildRuleContext(baby);

    // Create the milestones program with BAML client
    const program = createMilestonesProgram(b);
    const rules = program.build();

    // Get all matching rules for the Milestones screen, Header slot
    const matchingRules = rules
      .filter(
        (r) =>
          r.screen === Screen.Milestones &&
          r.slot === Slot.Header &&
          r.conditions.every((c) => evalCond(c, context)),
      )
      .sort((a, b) => b.priority - a.priority);

    // Convert matching rules to milestone cards
    const milestones: MilestoneCardData[] = [];

    for (const rule of matchingRules) {
      if (rule.render.template === 'Card.Milestone') {
        const props = rule.render.props as {
          title: string;
          description: string;
          type: 'physical' | 'cognitive' | 'social' | 'language' | 'self_care';
          ageLabel: string;
          suggestedDay?: number;
        };

        // Skip if already completed
        if (completedTitles.has(props.title)) {
          continue;
        }

        milestones.push({
          ageLabel: props.ageLabel,
          description: props.description,
          id: `milestone-${milestones.length}-${props.title.toLowerCase().replace(/\s+/g, '-')}`,
          isCompleted: false,
          suggestedDay: props.suggestedDay,
          title: props.title,
          type: props.type,
        });

        // Limit to 5 milestones
        if (milestones.length >= 5) break;
      }
    }

    return { milestones };
  } catch (error) {
    console.error('Error fetching milestones carousel content:', error);
    return { milestones: [] };
  }
}

/**
 * Build rule context from baby data
 */
function buildRuleContext(baby: {
  id: string;
  firstName: string;
  middleName: string | null;
  lastName: string | null;
  birthDate: Date | null;
  dueDate: Date | null;
  journeyStage: string | null;
  gender: string | null;
}): RuleContext {
  const now = new Date();
  let scope: Scope | undefined;
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
    // Pregnancy
    scope = Scope.Pregnancy;
  }

  return {
    baby: {
      ageInDays: baby.birthDate ? differenceInDays(now, baby.birthDate) : 0,
      firstName: baby.firstName,
      lastName: baby.lastName,
      middleName: baby.middleName,
      sex: baby.gender || 'U',
    },
    ppDay,
    ppWeek,
    scope,
  };
}

/**
 * Complete a milestone for a baby
 */
export const completeMilestoneAction = action
  .schema(
    z.object({
      babyId: z.string(),
      milestoneTitle: z.string(),
      milestoneType: z.enum([
        'physical',
        'cognitive',
        'social',
        'language',
        'self_care',
      ]),
      note: z.string().optional(),
      photoUrl: z.string().optional(),
      suggestedDay: z.number().optional(),
    }),
  )
  .action(async ({ parsedInput: input }) => {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    // Create tRPC API helper to get familyId
    const api = await getApi();
    const baby = await api.babies.getById.fetch({ id: input.babyId });

    if (!baby) {
      throw new Error('Baby not found');
    }

    // Insert milestone record
    const milestone = await db
      .insert(Milestones)
      .values({
        achievedDate: new Date(),
        babyId: input.babyId,
        description: input.note || null,
        familyId: baby.familyId,
        id: createId({ prefix: 'milestone' }),
        isSuggested: true,
        metadata: {},
        photoUrl: input.photoUrl || null,
        suggestedDay: input.suggestedDay || null,
        title: input.milestoneTitle,
        type: input.milestoneType,
        userId,
      })
      .returning()
      .execute();

    return {
      milestone: milestone[0],
      success: true,
    };
  });

/**
 * Get enhanced baby data with activities and growth records
 * Similar to learning carousel but focused on milestone-relevant data
 */
async function _getEnhancedBabyData(babyId: string, birthDate: Date | null) {
  if (!birthDate) {
    return null;
  }

  const now = new Date();
  const oneDayAgo = subDays(now, 1);
  const oneWeekAgo = subWeeks(now, 1);

  // Get activities from last 24 hours
  const activities24h = await db
    .select()
    .from(Activities)
    .where(
      and(eq(Activities.babyId, babyId), gte(Activities.startTime, oneDayAgo)),
    )
    .execute();

  // Get activities from last week
  const activitiesWeek = await db
    .select()
    .from(Activities)
    .where(
      and(eq(Activities.babyId, babyId), gte(Activities.startTime, oneWeekAgo)),
    )
    .execute();

  // Calculate activity summaries
  const feedingCount24h = activities24h.filter((a) =>
    ['feeding', 'nursing', 'bottle'].includes(a.type),
  ).length;
  const sleepCount24h = activities24h.filter((a) => a.type === 'sleep').length;
  const diaperCount24h = activities24h.filter((a) =>
    ['diaper', 'wet', 'dirty', 'both'].includes(a.type),
  ).length;

  const avgFeedingsPerDay =
    activitiesWeek.filter((a) =>
      ['feeding', 'nursing', 'bottle'].includes(a.type),
    ).length / 7;

  return {
    avgFeedingsPerDay,
    diaperCount24h,
    feedingCount24h,
    sleepCount24h,
  };
}
