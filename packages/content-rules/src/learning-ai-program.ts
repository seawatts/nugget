// AI-powered learning program for dynamic content generation
// Integrates learning-orchestrator with content-rules DSL

import type { BamlAsyncClient } from '@nugget/ai';
import {
  type DailyLearningContext,
  type DailyLearningResult,
  generateDailyLearning,
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
 * Convert RuleContext to DailyLearningContext for the orchestrator
 */
function buildLearningContext(ctx: RuleContext): DailyLearningContext {
  const baby = ctx.baby;
  const enhanced = ctx.enhancedBabyData;
  const traits = ctx.traits;

  return {
    // Rich context - these would need to be provided by the caller
    achievedMilestones: null,
    activitySummary: null,
    // Baby basics
    ageInDays: baby?.ageInDays ?? 0,
    ageInWeeks: enhanced?.baby?.ageInWeeks ?? 0,

    // Weekly patterns
    avgDiaperChangesPerDay: enhanced?.weeklyPatterns?.avgDiaperChanges ?? null,

    // Recent activity (24h)
    avgFeedingInterval: enhanced?.activities24h?.avgFeedingInterval ?? null,
    avgFeedingsPerDay: enhanced?.weeklyPatterns?.avgFeedingsPerDay ?? null,
    avgSleepHoursPerDay: enhanced?.weeklyPatterns?.avgSleepHours ?? null,
    babyName: baby?.firstName ?? 'Baby',
    babySex: baby?.sex ?? null,

    // Growth metrics
    birthWeightOz: enhanced?.baby?.birthWeightOz ?? null,
    currentWeightOz: enhanced?.baby?.currentWeightOz ?? null,
    diaperCount24h: enhanced?.activities24h?.diaperCount ?? null,
    feedingCount24h: enhanced?.activities24h?.feedingCount ?? null,
    firstTimeParent: traits?.firstPregnancy ?? false,
    height: enhanced?.baby?.height ?? null,
    medicalContext: null,
    parentWellness: null,
    recentChatTopics: null,
    recentlyCoveredTopics: null,
    sleepCount24h: enhanced?.activities24h?.sleepCount ?? null,
    totalSleepHours24h: enhanced?.activities24h?.totalSleepHours ?? null,
  };
}

/**
 * Factory function to create the AI-powered learning program
 * Uses generateDailyLearning orchestrator for dynamic content
 */
export function createLearningAIProgram(_b: BamlAsyncClient) {
  const P = new Program();

  // Generate learning content for postpartum days 0-112 (16 weeks / ~4 months)
  P.series.ppDays(0, 112, ({ day }) =>
    P.rule()
      .slot(Screen.Learning, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(day))
      .show({
        props: {
          // AI-generated learning tips cached for 1 day
          tips: aiTextBaml({
            call: (ctx: RuleContext) => {
              const learningContext = buildLearningContext(ctx);
              return bamlCall(
                () => generateDailyLearning(learningContext),
                (result: DailyLearningResult) => result.tips,
              );
            },
            // Cache key includes userId and date for daily regeneration per user
            key: (ctx: RuleContext) =>
              `learning:${ctx.traits?.userId ?? 'anon'}:d${day}:${getDateKey()}`,
            // 1-day TTL for fresh daily content
            ttl: '1d',
          }),
        },
        template: 'Tips.Carousel',
      })
      .priority(50)
      .build(),
  );

  // Generate learning content for postpartum weeks 0-16 (beyond day 112)
  // This provides longer-term content structure
  P.series.ppWeeks(17, 52, ({ week }) =>
    P.rule()
      .slot(Screen.Learning, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.week.eq(week))
      .show({
        props: {
          tips: aiTextBaml({
            call: (ctx: RuleContext) => {
              const learningContext = buildLearningContext(ctx);
              return bamlCall(
                () => generateDailyLearning(learningContext),
                (result: DailyLearningResult) => result.tips,
              );
            },
            key: (ctx: RuleContext) =>
              `learning:${ctx.traits?.userId ?? 'anon'}:w${week}:${getDateKey()}`,
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
