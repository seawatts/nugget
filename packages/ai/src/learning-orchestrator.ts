/**
 * Learning Content Orchestrator
 *
 * Two-phase architecture:
 * 1. Planning Phase: Determines WHAT content to generate
 * 2. Execution Phase: Stage-specific prompts generate content in parallel
 */

import { b } from './baml_client';
import type { DailyLearningPlan, LearningPlanItem, LearningTip } from './baml_client/types';
import { determineStage, LEARNING_STAGES, type LearningStage } from './learning-stages';

/**
 * Retry a BAML call with exponential backoff on validation errors
 *
 * @param fn - The BAML function to call
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @returns The result or null if all retries fail
 */
async function retryBamlCall<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T | null> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Check if it's a BAML validation error
      const isBamlValidationError =
        error instanceof Error &&
        (error.message.includes('BamlValidationError') ||
         error.message.includes('Failed to parse LLM response') ||
         error.message.includes('Missing required field'));

      if (!isBamlValidationError || attempt === maxRetries) {
        // Not a validation error or out of retries
        console.error(`BAML call failed after ${attempt + 1} attempts:`, {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        return null;
      }

      // Calculate exponential backoff delay
      const delayMs = 100 * Math.pow(2, attempt); // 100ms, 200ms, 400ms
      console.warn(`BAML validation error (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delayMs}ms:`, {
        error: error instanceof Error ? error.message : String(error),
      });

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return null;
}

/**
 * Context required for generating daily learning content
 */
export interface DailyLearningContext {
  // Baby basics
  babyName: string;
  babySex?: string | null;
  ageInDays: number;
  ageInWeeks: number;
  firstTimeParent: boolean;

  // Growth metrics
  currentWeightOz?: number | null;
  birthWeightOz?: number | null;
  height?: number | null;

  // Recent activity (24h)
  feedingCount24h?: number | null;
  avgFeedingInterval?: number | null;
  sleepCount24h?: number | null;
  totalSleepHours24h?: number | null;
  diaperCount24h?: number | null;

  // Weekly patterns
  avgFeedingsPerDay?: number | null;
  avgSleepHoursPerDay?: number | null;
  avgDiaperChangesPerDay?: number | null;

  // Rich context
  recentChatTopics?: string | null;
  recentlyCoveredTopics?: string | null;
  achievedMilestones?: string | null;
  activitySummary?: string | null;
  parentWellness?: string | null;
  medicalContext?: string | null;
}

/**
 * Result from generating daily learning content
 */
export interface DailyLearningResult {
  tips: LearningTip[];
  plan: DailyLearningPlan;
  stage: LearningStage;
  executionTimeMs: number;
}

/**
 * Main orchestrator function for generating daily learning content
 *
 * @param context - Baby and parent context
 * @returns Generated learning tips with metadata
 */
export async function generateDailyLearning(
  context: DailyLearningContext
): Promise<DailyLearningResult> {
  const startTime = Date.now();

  // Step 1: Planning phase - determine WHAT to generate
  const plan = await b.DailyLearningPlanner(
    context.babyName,
    context.babySex,
    context.ageInDays,
    context.ageInWeeks,
    context.firstTimeParent,
    context.currentWeightOz,
    context.birthWeightOz,
    context.height,
    context.feedingCount24h,
    context.avgFeedingInterval,
    context.sleepCount24h,
    context.totalSleepHours24h,
    context.diaperCount24h,
    context.avgFeedingsPerDay,
    context.avgSleepHoursPerDay,
    context.avgDiaperChangesPerDay,
    context.recentChatTopics,
    context.recentlyCoveredTopics,
    context.achievedMilestones,
    context.activitySummary,
    context.parentWellness,
    context.medicalContext
  );

  // Step 2: Determine developmental stage
  const stage = determineStage(context.ageInDays);

  // Step 3: Execute stage-specific prompts in parallel
  const tipsOrNull = await Promise.all(
    plan.items.map((planItem) => executeStagePrompt(stage, planItem, context))
  );

  // Step 4: Filter out null results and validate
  const tips = tipsOrNull.filter((tip): tip is LearningTip => tip !== null);
  const validTips = validateTips(tips, context.babyName);

  const executionTimeMs = Date.now() - startTime;

  return {
    tips: validTips,
    plan,
    stage,
    executionTimeMs,
  };
}

/**
 * Routes to the appropriate stage-specific BAML function
 *
 * @param stage - Developmental stage
 * @param planItem - Planned learning item from planner
 * @param context - Baby context
 * @returns Generated learning tip
 */
async function executeStagePrompt(
  stage: LearningStage,
  planItem: LearningPlanItem,
  context: DailyLearningContext
): Promise<LearningTip | null> {
  // Route to appropriate stage function with individual parameters
  switch (stage) {
    case LEARNING_STAGES.IMMEDIATE_POSTBIRTH:
      return retryBamlCall(() =>
        b.GenerateLearningTip_ImmediatePostbirth(
          planItem.category,
          planItem.title,
          planItem.subtitle,
          planItem.relevance,
          planItem.recommendYesNo,
          context.babyName,
          context.babySex,
          context.ageInDays,
          context.currentWeightOz,
          context.birthWeightOz,
          context.feedingCount24h,
          context.avgFeedingInterval,
          context.sleepCount24h,
          context.diaperCount24h,
          context.recentChatTopics,
          context.achievedMilestones,
          context.medicalContext
        )
      );

    case LEARNING_STAGES.FIRST_WEEK:
      return retryBamlCall(() =>
        b.GenerateLearningTip_FirstWeek(
          planItem.category,
          planItem.title,
          planItem.subtitle,
          planItem.relevance,
          planItem.recommendYesNo,
          context.babyName,
          context.babySex,
          context.ageInDays,
          context.currentWeightOz,
          context.birthWeightOz,
          context.feedingCount24h,
          context.avgFeedingInterval,
          context.sleepCount24h,
          context.diaperCount24h,
          context.recentChatTopics,
          context.achievedMilestones,
          context.medicalContext
        )
      );

    case LEARNING_STAGES.SECOND_WEEK:
      return retryBamlCall(() =>
        b.GenerateLearningTip_SecondWeek(
          planItem.category,
          planItem.title,
          planItem.subtitle,
          planItem.relevance,
          planItem.recommendYesNo,
          context.babyName,
          context.babySex,
          context.ageInDays,
          context.currentWeightOz,
          context.birthWeightOz,
          context.feedingCount24h,
          context.avgFeedingInterval,
          context.sleepCount24h,
          context.diaperCount24h,
          context.recentChatTopics,
          context.achievedMilestones,
          context.medicalContext
        )
      );

    case LEARNING_STAGES.THIRD_WEEK:
      return retryBamlCall(() =>
        b.GenerateLearningTip_ThirdWeek(
          planItem.category,
          planItem.title,
          planItem.subtitle,
          planItem.relevance,
          planItem.recommendYesNo,
          context.babyName,
          context.babySex,
          context.ageInDays,
          context.currentWeightOz,
          context.birthWeightOz,
          context.feedingCount24h,
          context.avgFeedingInterval,
          context.sleepCount24h,
          context.diaperCount24h,
          context.recentChatTopics,
          context.achievedMilestones,
          context.medicalContext
        )
      );

    case LEARNING_STAGES.MONTH_ONE:
      return retryBamlCall(() =>
        b.GenerateLearningTip_MonthOne(
          planItem.category,
          planItem.title,
          planItem.subtitle,
          planItem.relevance,
          planItem.recommendYesNo,
          context.babyName,
          context.babySex,
          context.ageInDays,
          context.currentWeightOz,
          context.birthWeightOz,
          context.feedingCount24h,
          context.avgFeedingInterval,
          context.sleepCount24h,
          context.diaperCount24h,
          context.recentChatTopics,
          context.achievedMilestones,
          context.medicalContext
        )
      );

    case LEARNING_STAGES.MONTH_TWO:
      return retryBamlCall(() =>
        b.GenerateLearningTip_MonthTwo(
          planItem.category,
          planItem.title,
          planItem.subtitle,
          planItem.relevance,
          planItem.recommendYesNo,
          context.babyName,
          context.babySex,
          context.ageInDays,
          context.currentWeightOz,
          context.birthWeightOz,
          context.feedingCount24h,
          context.avgFeedingInterval,
          context.sleepCount24h,
          context.diaperCount24h,
          context.recentChatTopics,
          context.achievedMilestones,
          context.medicalContext
        )
      );

    case LEARNING_STAGES.MONTH_THREE_FOUR:
      return retryBamlCall(() =>
        b.GenerateLearningTip_MonthThreeFour(
          planItem.category,
          planItem.title,
          planItem.subtitle,
          planItem.relevance,
          planItem.recommendYesNo,
          context.babyName,
          context.babySex,
          context.ageInDays,
          context.currentWeightOz,
          context.birthWeightOz,
          context.feedingCount24h,
          context.avgFeedingInterval,
          context.sleepCount24h,
          context.diaperCount24h,
          context.recentChatTopics,
          context.achievedMilestones,
          context.medicalContext
        )
      );

    default:
      // Fallback to immediate postbirth if unknown stage
      return retryBamlCall(() =>
        b.GenerateLearningTip_ImmediatePostbirth(
          planItem.category,
          planItem.title,
          planItem.subtitle,
          planItem.relevance,
          planItem.recommendYesNo,
          context.babyName,
          context.babySex,
          context.ageInDays,
          context.currentWeightOz,
          context.birthWeightOz,
          context.feedingCount24h,
          context.avgFeedingInterval,
          context.sleepCount24h,
          context.diaperCount24h,
          context.recentChatTopics,
          context.achievedMilestones,
          context.medicalContext
        )
      );
  }
}

/**
 * Validates generated tips and adds default followUpQuestion if missing
 *
 * @param tips - Tips to validate
 * @param babyName - Baby's name for default question
 * @returns Valid tips with defaults applied
 */
function validateTips(tips: LearningTip[], babyName: string): LearningTip[] {
  return tips
    .map((tip) => {
      // Basic validation: must have required fields
      if (!tip.category || !tip.subtitle || !tip.summary) {
        console.warn('Invalid tip missing required fields:', tip);
        return null;
      }

      // Must have at least one bullet point
      if (!tip.bulletPoints || tip.bulletPoints.length === 0) {
        console.warn('Invalid tip missing bullet points:', tip);
        return null;
      }

      // Add default followUpQuestion if missing (handles optional field)
      if (!tip.followUpQuestion) {
        console.warn('Tip missing followUpQuestion, adding default:', {
          category: tip.category,
          subtitle: tip.subtitle,
        });
        tip.followUpQuestion = `How is ${babyName} doing with this?`;
      }

      // If yes/no question, must have proper fields
      if (tip.isYesNoQuestion) {
        if (!tip.openChatOnYes && !tip.openChatOnNo) {
          console.warn('Yes/no question missing openChatOn fields, setting defaults:', tip);
          // Default to opening chat on "no" for health/safety questions
          tip.openChatOnNo = true;
        }
      }

      return tip;
    })
    .filter((tip): tip is LearningTip => tip !== null);
}

/**
 * Helper to extract recently covered topic IDs from learning tips
 * This can be used to populate recentlyCoveredTopics for the next call
 *
 * @param tips - Previously generated tips
 * @param days - How many days back to consider
 * @returns Comma-separated topic IDs
 */
export function extractRecentTopicIds(tips: LearningTip[], days: number = 14): string {
  // This is a placeholder - in real implementation, you'd track when each tip was generated
  // and filter based on timestamp
  return tips.map((tip) => tip.subtitle.toLowerCase().replace(/\s+/g, '-')).join(', ');
}

