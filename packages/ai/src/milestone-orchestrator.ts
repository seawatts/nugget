/**
 * Milestone Orchestrator
 *
 * Two-phase milestone generation architecture:
 * 1. Planning Phase: Determine WHICH milestones to suggest
 * 2. Execution Phase: Generate milestone content in parallel using stage-specific prompts
 */

import { b } from './baml_client';
import type { LearningStage } from './learning-stages';
import { determineStage } from './learning-stages';

// ============================================================================
// Types
// ============================================================================

export interface MilestoneContext {
  // Baby basics
  babyName: string;
  babySex?: string;
  ageInDays: number;
  ageInWeeks: number;

  // Growth metrics
  currentWeightOz?: number;
  birthWeightOz?: number;
  height?: number;

  // Recent activity (24h)
  feedingCount24h?: number;
  avgFeedingInterval?: number;
  sleepCount24h?: number;
  totalSleepHours24h?: number;
  diaperCount24h?: number;

  // Weekly patterns
  avgFeedingsPerDay?: number;
  avgSleepHoursPerDay?: number;
  avgDiaperChangesPerDay?: number;

  // Rich context
  recentChatMessages?: Array<{ content: string; role: string }>;
  achievedMilestones?: Array<{ id: string; title: string; achievedAt: Date }>;
  recentlySuggestedMilestones?: Array<{ id: string; title: string; suggestedAt: Date }>;
  activityTrends?: {
    feeding?: string;
    sleep?: string;
    changes?: string[];
  };
  hasTummyTimeActivity?: boolean;
  medicalRecords?: Array<{ type: string; notes: string }>;
}

export interface MilestoneResult {
  plan: Awaited<ReturnType<typeof b.MilestonePlanner>>;
  milestones: Awaited<ReturnType<typeof b.ImmediatePostbirthMilestone>>[];
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract recent milestone IDs for deduplication
 */
export function extractRecentMilestoneIds(context: MilestoneContext): string[] {
  const recentIds: string[] = [];

  // Add achieved milestone IDs
  if (context.achievedMilestones) {
    recentIds.push(...context.achievedMilestones.map(m => m.id));
  }

  // Add recently suggested milestone IDs
  if (context.recentlySuggestedMilestones) {
    recentIds.push(...context.recentlySuggestedMilestones.map(m => m.id));
  }

  return recentIds;
}

/**
 * Build context strings for the planner
 */
function buildPlannerContext(context: MilestoneContext) {
  // Recent chat topics
  let recentChatTopics: string | undefined;
  if (context.recentChatMessages && context.recentChatMessages.length > 0) {
    const last5 = context.recentChatMessages.slice(-5);
    recentChatTopics = last5.map(msg => `- ${msg.role}: ${msg.content}`).join('\n');
  }

  // Achieved milestones
  let achievedMilestones: string | undefined;
  if (context.achievedMilestones && context.achievedMilestones.length > 0) {
    achievedMilestones = context.achievedMilestones
      .map(m => `${m.title} (achieved ${m.achievedAt.toLocaleDateString()})`)
      .join(', ');
  }

  // Recently suggested milestones
  let recentlySuggestedMilestones: string | undefined;
  if (context.recentlySuggestedMilestones && context.recentlySuggestedMilestones.length > 0) {
    recentlySuggestedMilestones = context.recentlySuggestedMilestones
      .map(m => `${m.title} (suggested ${m.suggestedAt.toLocaleDateString()})`)
      .join(', ');
  }

  // Activity summary
  let activitySummary: string | undefined;
  if (context.activityTrends) {
    const parts: string[] = [];
    if (context.activityTrends.feeding) parts.push(`Feeding: ${context.activityTrends.feeding}`);
    if (context.activityTrends.sleep) parts.push(`Sleep: ${context.activityTrends.sleep}`);
    if (context.activityTrends.changes) parts.push(`Changes: ${context.activityTrends.changes.join(', ')}`);
    activitySummary = parts.join('\n');
  }

  // Medical context
  let medicalContext: string | undefined;
  if (context.medicalRecords && context.medicalRecords.length > 0) {
    medicalContext = context.medicalRecords
      .map(r => `${r.type}: ${r.notes}`)
      .join('\n');
  }

  return {
    recentChatTopics,
    achievedMilestones,
    recentlySuggestedMilestones,
    activitySummary,
    medicalContext,
  };
}

/**
 * Get the correct stage-specific BAML function for milestone generation
 */
function getStageMilestoneFunction(stage: LearningStage) {
  switch (stage) {
    case 'immediate-postbirth':
      return b.ImmediatePostbirthMilestone;
    case 'first-week':
      return b.FirstWeekMilestone;
    case 'second-week':
      return b.SecondWeekMilestone;
    case 'third-week':
      return b.ThirdWeekMilestone;
    case 'month-one':
      return b.MonthOneMilestone;
    case 'month-two':
      return b.MonthTwoMilestone;
    case 'month-three-four':
      return b.MonthThreeFourMilestone;
    default:
      return b.MonthThreeFourMilestone; // Default for older babies
  }
}

// ============================================================================
// Main Orchestrator
// ============================================================================

/**
 * Generate milestone suggestions using two-phase architecture:
 * 1. Planning phase: Determine which milestones to suggest
 * 2. Execution phase: Generate milestone content in parallel
 */
export async function generateMilestoneSuggestions(
  context: MilestoneContext
): Promise<MilestoneResult> {
  // Build context strings for the planner
  const plannerContext = buildPlannerContext(context);

  // Step 1: Call the planner BAML function with individual parameters
  const plan = await b.MilestonePlanner(
    context.babyName,
    context.babySex,
    context.ageInDays,
    context.ageInWeeks,
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
    plannerContext.recentChatTopics,
    plannerContext.achievedMilestones,
    plannerContext.recentlySuggestedMilestones,
    plannerContext.activitySummary,
    context.hasTummyTimeActivity,
    plannerContext.medicalContext
  );

  // Step 2: Determine the correct stage-specific BAML function
  const stage = determineStage(context.ageInDays);
  const stageMilestoneFunction = getStageMilestoneFunction(stage);

  // Step 3: Prepare common input for all milestone generations
  const commonInput = {
    babyName: context.babyName,
    babySex: context.babySex,
    ageInDays: context.ageInDays,
    ageInWeeks: context.ageInWeeks,
    currentWeightOz: context.currentWeightOz,
    birthWeightOz: context.birthWeightOz,
    height: context.height,
    feedingCount24h: context.feedingCount24h,
    avgFeedingInterval: context.avgFeedingInterval,
    sleepCount24h: context.sleepCount24h,
    totalSleepHours24h: context.totalSleepHours24h,
    diaperCount24h: context.diaperCount24h,
    avgFeedingsPerDay: context.avgFeedingsPerDay,
    avgSleepHoursPerDay: context.avgSleepHoursPerDay,
    avgDiaperChangesPerDay: context.avgDiaperChangesPerDay,
    recentChatTopics: plannerContext.recentChatTopics,
    achievedMilestones: plannerContext.achievedMilestones,
    activitySummary: plannerContext.activitySummary,
    hasTummyTimeActivity: context.hasTummyTimeActivity,
    medicalContext: plannerContext.medicalContext,
  };

  // Step 4: Execute stage-specific BAML functions in parallel
  const milestonePromises = plan.items.map(async (item) => {
    const milestoneInput = {
      ...commonInput,
      plannedItem: item,
    };
    return stageMilestoneFunction(milestoneInput);
  });

  const milestones = await Promise.all(milestonePromises);

  return {
    plan,
    milestones,
  };
}

