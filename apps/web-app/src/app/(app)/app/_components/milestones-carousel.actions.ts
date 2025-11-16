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
import {
  aiTextBaml,
  bamlCall,
  resolveAIProps,
} from '@nugget/content-rules/dynamic-baml';
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
  bulletPoints: string[];
  followUpQuestion: string;
  summary?: string;
}

interface MilestonesCarouselData {
  milestones: MilestoneCardData[];
  babyName: string;
  ageInDays: number;
  nextMilestoneDay?: number;
  baby: {
    id: string;
    firstName: string;
    middleName: string | null;
    lastName: string | null;
    birthDate: Date | null;
    dueDate: Date | null;
    journeyStage: string | null;
    gender: string | null;
  } | null;
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
      return { ageInDays: 0, baby: null, babyName: '', milestones: [] };
    }

    // Create tRPC API helper
    const api = await getApi();

    // Get the specific baby by ID
    const baby = await api.babies.getById({ id: babyId });

    if (!baby) {
      return { ageInDays: 0, baby: null, babyName: '', milestones: [] };
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
    const baseMilestones: Array<{
      title: string;
      description: string;
      type: 'physical' | 'cognitive' | 'social' | 'language' | 'self_care';
      ageLabel: string;
      suggestedDay?: number;
    }> = [];

    for (const rule of matchingRules) {
      if (rule.render.template === 'Card.Milestone') {
        const props = rule.render.props as {
          title: string;
          description: string;
          type: 'physical' | 'cognitive' | 'social' | 'language' | 'self_care';
          ageLabel: string;
          suggestedDay?: number;
        };

        baseMilestones.push(props);

        // Limit to 5 milestones
        if (baseMilestones.length >= 5) break;
      }
    }

    // Calculate baby's age in days
    const ageInDays = baby.birthDate
      ? differenceInDays(new Date(), baby.birthDate)
      : undefined;

    // Return base milestones immediately with placeholder content
    // AI enhancement will happen progressively on the client side
    const milestones: MilestoneCardData[] = baseMilestones.map(
      (props, index) => ({
        ageLabel: props.ageLabel,
        bulletPoints: [
          props.description,
          'Every baby develops at their own pace.',
          'Consult your pediatrician if you have concerns.',
        ],
        description: props.description,
        followUpQuestion: `What have you noticed about ${baby.firstName ?? 'your baby'}'s development recently?`,
        id: `milestone-${index}-${props.title.toLowerCase().replace(/\s+/g, '-')}`,
        isCompleted: completedTitles.has(props.title),
        suggestedDay: props.suggestedDay,
        summary: props.description,
        title: props.title,
        type: props.type,
      }),
    );

    // Find the next upcoming milestone
    let nextMilestoneDay: number | undefined;
    if (ageInDays !== undefined) {
      // Get all milestone rules (not just matching ones)
      const allMilestoneRules = rules.filter(
        (r) =>
          r.screen === Screen.Milestones &&
          r.slot === Slot.Header &&
          r.render.template === 'Card.Milestone',
      );

      // Filter for future milestones with suggestedDay
      const futureMilestones = allMilestoneRules
        .map((rule) => {
          const props = rule.render.props as {
            suggestedDay?: number;
          };
          return props.suggestedDay;
        })
        .filter((day): day is number => day !== undefined && day > ageInDays)
        .sort((a, b) => a - b);

      // Take the first (soonest) future milestone
      nextMilestoneDay = futureMilestones[0];
    }

    return {
      ageInDays: ageInDays ?? 0,
      baby,
      babyName: baby.firstName ?? 'Baby',
      milestones,
      nextMilestoneDay,
    };
  } catch (error) {
    console.error('Error fetching milestones carousel content:', error);
    return {
      ageInDays: 0,
      baby: null,
      babyName: 'Baby',
      milestones: [],
      nextMilestoneDay: undefined,
    };
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
    const baby = await api.babies.getById({ id: input.babyId });

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
 * Enhance a single milestone with AI-generated content
 * This is called progressively on the client side
 * Uses database caching to avoid regenerating content
 */
export const enhanceMilestoneAction = action
  .schema(
    z.object({
      ageInDays: z.number().optional(),
      ageLabel: z.string(),
      babyId: z.string(),
      description: z.string(),
      title: z.string(),
      type: z.enum([
        'physical',
        'cognitive',
        'social',
        'language',
        'self_care',
      ]),
    }),
  )
  .action(async ({ parsedInput: input }) => {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    // Get baby info for AI context
    const api = await getApi();
    const baby = await api.babies.getById({ id: input.babyId });

    if (!baby) {
      throw new Error('Baby not found');
    }

    // Create database-backed cache (same pattern as learning carousel)
    const cache = new DbCache(db, baby.id, baby.familyId, userId);

    // Build rule context for caching
    const context = buildRuleContext(baby);

    try {
      // Generate cache key
      const cacheKey = `milestone:${baby.id}:${input.type}:${input.title.toLowerCase().replace(/\s+/g, '-')}`;

      console.log(`[Milestone Cache] Checking cache for key: ${cacheKey}`);

      // Check cache manually first to log the result
      const cached = await cache.get(cacheKey);
      if (cached && cached.exp > Date.now()) {
        console.log(`[Milestone Cache] ✓ Cache HIT for "${input.title}"`);
        const enhancement = cached.val as {
          bulletPoints: string[];
          followUpQuestion: string;
          summary: string;
        };
        return {
          bulletPoints: enhancement.bulletPoints,
          followUpQuestion: enhancement.followUpQuestion,
          success: true,
          summary: enhancement.summary,
        };
      }

      console.log(
        `[Milestone Cache] ✗ Cache MISS for "${input.title}" - generating new content`,
      );

      // Structure the enhancement as an aiTextBaml prop for caching
      const enhancementProp = aiTextBaml({
        call: () =>
          bamlCall(
            () => {
              console.log(
                `[Milestone Cache] Calling BAML for "${input.title}"`,
              );
              return b.EnhanceMilestone(
                input.title,
                input.description,
                input.type,
                input.ageLabel,
                baby.firstName ?? null,
                input.ageInDays ?? null,
              );
            },
            (output) => output,
          ),
        // Cache key includes milestone title and type to uniquely identify content
        key: () => cacheKey,
        // Cache for 7 days (milestones don't change frequently)
        ttl: '7d',
      });

      // Resolve the prop using cache (will use cached value if available)
      const resolved = await resolveAIProps(
        { enhancement: enhancementProp },
        context,
        cache,
      );

      const enhancement = resolved.enhancement as {
        bulletPoints: string[];
        followUpQuestion: string;
        summary: string;
      };

      console.log(
        `[Milestone Cache] Successfully enhanced milestone "${input.title}" with ${enhancement.bulletPoints.length} bullet points`,
      );

      return {
        bulletPoints: enhancement.bulletPoints,
        followUpQuestion: enhancement.followUpQuestion,
        success: true,
        summary: enhancement.summary,
      };
    } catch (error) {
      console.error(`Error enhancing milestone "${input.title}":`, error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Return null to indicate enhancement failed - component will use fallback
      return {
        success: false,
      };
    }
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
