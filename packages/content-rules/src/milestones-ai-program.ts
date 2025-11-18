// AI-powered milestones program for dynamic milestone generation
// Integrates milestone-orchestrator with content-rules DSL

import type { BamlAsyncClient } from '@nugget/ai';
import {
  generateMilestoneSuggestions,
  type MilestoneContext,
  type MilestoneResult,
} from '@nugget/ai';
import type { RuleContext } from './dynamic';
import { Program, postpartum, Scope, Screen, Slot, scope } from './dynamic';
import { aiTextBaml, bamlCall } from './dynamic-baml';

/**
 * Helper to get a date-based cache key for daily regeneration
 */
function getDateKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/**
 * Convert RuleContext to MilestoneContext for the orchestrator
 */
function buildMilestoneContext(ctx: RuleContext): MilestoneContext {
  const baby = ctx.baby;
  const enhanced = ctx.enhancedBabyData;

  return {
    // Rich context - would need to be provided by the caller in production
    achievedMilestones: undefined,
    activityTrends: undefined,
    // Baby basics
    ageInDays: baby?.ageInDays ?? 0,
    ageInWeeks: enhanced?.baby?.ageInWeeks ?? 0,

    // Weekly patterns
    avgDiaperChangesPerDay:
      enhanced?.weeklyPatterns?.avgDiaperChanges ?? undefined,

    // Recent activity (24h)
    avgFeedingInterval:
      enhanced?.activities24h?.avgFeedingInterval ?? undefined,
    avgFeedingsPerDay: enhanced?.weeklyPatterns?.avgFeedingsPerDay ?? undefined,
    avgSleepHoursPerDay: enhanced?.weeklyPatterns?.avgSleepHours ?? undefined,
    babyName: baby?.firstName ?? 'Baby',
    babySex: baby?.sex ?? undefined,

    // Growth metrics
    birthWeightOz: enhanced?.baby?.birthWeightOz ?? undefined,
    currentWeightOz: enhanced?.baby?.currentWeightOz ?? undefined,
    diaperCount24h: enhanced?.activities24h?.diaperCount ?? undefined,
    feedingCount24h: enhanced?.activities24h?.feedingCount ?? undefined,
    hasTummyTimeActivity: undefined,
    height: enhanced?.baby?.height ?? undefined,
    medicalRecords: undefined,
    recentChatMessages: undefined,
    recentlySuggestedMilestones: undefined,
    sleepCount24h: enhanced?.activities24h?.sleepCount ?? undefined,
    totalSleepHours24h: enhanced?.activities24h?.totalSleepHours ?? undefined,
  };
}

/**
 * Factory function to create the AI-powered milestones program
 * Uses generateMilestoneSuggestions orchestrator for dynamic milestone suggestions
 */
export function createMilestonesAIProgram(_b: BamlAsyncClient) {
  const P = new Program();

  // Generate milestone suggestions for postpartum days 0-112 (16 weeks / ~4 months)
  P.series.ppDays(0, 112, ({ day }) =>
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(day))
      .show({
        props: {
          // AI-generated milestone suggestions cached for 1 day
          tips: aiTextBaml({
            call: (ctx: RuleContext) => {
              const milestoneContext = buildMilestoneContext(ctx);
              return bamlCall(
                () => generateMilestoneSuggestions(milestoneContext),
                (result: MilestoneResult) => result.milestones,
              );
            },
            // Cache key includes baby age and date for daily regeneration
            key: (ctx: RuleContext) =>
              `milestones:${ctx.baby?.ageInDays ?? 0}:${getDateKey()}`,
            // 1-day TTL for fresh daily suggestions
            ttl: '1d',
          }),
        },
        template: 'Tips.Carousel',
      })
      .priority(50)
      .build(),
  );

  // Generate milestone suggestions for postpartum weeks 17-52 (beyond day 112)
  // This provides longer-term milestone tracking
  P.series.ppWeeks(17, 52, ({ week }) =>
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.week.eq(week))
      .show({
        props: {
          tips: aiTextBaml({
            call: (ctx: RuleContext) => {
              const milestoneContext = buildMilestoneContext(ctx);
              return bamlCall(
                () => generateMilestoneSuggestions(milestoneContext),
                (result: MilestoneResult) => result.milestones,
              );
            },
            key: (_ctx: RuleContext) => `milestones:w${week}:${getDateKey()}`,
            ttl: '1d',
          }),
        },
        template: 'Tips.Carousel',
      })
      .priority(50)
      .build(),
  );

  return P;
}

// Export the program builder
export { Program };
