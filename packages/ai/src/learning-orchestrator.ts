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
  const tips = await Promise.all(
    plan.items.map((planItem) => executeStagePrompt(stage, planItem, context))
  );

  // Step 4: Validate and deduplicate (basic validation)
  const validTips = validateTips(tips);

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
): Promise<LearningTip> {
  // Route to appropriate stage function with individual parameters
  switch (stage) {
    case LEARNING_STAGES.IMMEDIATE_POSTBIRTH:
      return b.GenerateLearningTip_ImmediatePostbirth(
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
      );

    case LEARNING_STAGES.FIRST_WEEK:
      return b.GenerateLearningTip_FirstWeek(
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
      );

    case LEARNING_STAGES.SECOND_WEEK:
      return b.GenerateLearningTip_SecondWeek(
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
      );

    case LEARNING_STAGES.THIRD_WEEK:
      return b.GenerateLearningTip_ThirdWeek(
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
      );

    case LEARNING_STAGES.MONTH_ONE:
      return b.GenerateLearningTip_MonthOne(
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
      );

    case LEARNING_STAGES.MONTH_TWO:
      return b.GenerateLearningTip_MonthTwo(
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
      );

    case LEARNING_STAGES.MONTH_THREE_FOUR:
      return b.GenerateLearningTip_MonthThreeFour(
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
      );

    default:
      // Fallback to immediate postbirth if unknown stage
      return b.GenerateLearningTip_ImmediatePostbirth(
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
      );
  }
}

/**
 * Validates generated tips
 *
 * @param tips - Tips to validate
 * @returns Valid tips only
 */
function validateTips(tips: LearningTip[]): LearningTip[] {
  return tips.filter((tip) => {
    // Basic validation: must have required fields
    if (!tip.category || !tip.subtitle || !tip.summary) {
      console.warn('Invalid tip missing required fields:', tip);
      return false;
    }

    // Must have at least one bullet point
    if (!tip.bulletPoints || tip.bulletPoints.length === 0) {
      console.warn('Invalid tip missing bullet points:', tip);
      return false;
    }

    // Must have follow-up question
    if (!tip.followUpQuestion) {
      console.warn('Invalid tip missing follow-up question:', tip);
      return false;
    }

    // If yes/no question, must have proper fields
    if (tip.isYesNoQuestion) {
      if (!tip.openChatOnYes && !tip.openChatOnNo) {
        console.warn('Yes/no question missing openChatOn fields:', tip);
        return false;
      }

    }

    return true;
  });
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

