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
import { differenceInDays, differenceInWeeks } from 'date-fns';

interface LearningCard {
  id: string;
  template: string;
  props: Record<string, unknown>;
  screen: Screen;
  slot: Slot;
}

/**
 * Fetch learning carousel content based on baby's age and family context
 */
export async function getLearningCarouselContent(): Promise<LearningCard[]> {
  try {
    // Verify authentication
    const authResult = await auth();
    if (!authResult.userId) {
      return [];
    }

    // Create tRPC caller
    const ctx = await createTRPCContext();
    const caller = createCaller(ctx);

    // Get the primary baby for the family
    const babies = await caller.babies.list();
    const baby = babies[0];

    if (!baby) {
      return [];
    }

    // Create database-backed cache for this baby
    const cache = new DbCache(
      ctx.db,
      baby.id,
      baby.familyId,
      authResult.userId,
    );

    // Build rule context
    const context = buildRuleContext(baby);

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
      if (cards.length >= 5) break;

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

        // Add age label based on context
        const ageLabel = getAgeLabel(context);

        cards.push({
          id: `${screen}-${slot}-${cards.length}`,
          props: {
            ...quickResolvedProps,
            ageLabel,
          },
          screen,
          slot,
          template: result.template,
        });
      }
    }

    return cards;
  } catch (error) {
    console.error('Error fetching learning carousel content:', error);
    return [];
  }
}

/**
 * Build rule context from baby data
 */
function buildRuleContext(baby: {
  id: string;
  birthDate: Date | null;
  dueDate: Date | null;
  journeyStage: string | null;
  gender: string | null;
}): RuleContext {
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
      sex: baby.gender || 'U',
    },
    done: {
      nursery_setup: false, // TODO: Get from actual completion tracking
    },
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
 * Get age label for display
 */
function getAgeLabel(context: RuleContext): string | undefined {
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

    // Create database-backed cache for this baby
    const cache = new DbCache(
      ctx.db,
      baby.id,
      baby.familyId,
      authResult.userId,
    );

    // Build rule context
    const context = buildRuleContext(baby);

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
