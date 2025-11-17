/**
 * Aggregated stage-specific content rules for learning content
 */

export * from './first-week';
export * from './immediate-postbirth';
export * from './second-week';

import { firstWeekRules } from './first-week';
import type { StageContentRules } from './immediate-postbirth';
import { immediatePostbirthRules } from './immediate-postbirth';
import { secondWeekRules } from './second-week';

/**
 * All stage rules indexed by stage ID
 */
export const STAGE_RULES: Record<string, StageContentRules> = {
  'first-week': firstWeekRules,
  'immediate-postbirth': immediatePostbirthRules,
  'second-week': secondWeekRules,
  // Add more as they're created
};

/**
 * Gets content rules for a specific stage
 */
export function getStageRules(stageId: string): StageContentRules | undefined {
  return STAGE_RULES[stageId];
}

/**
 * Gets content rules for a baby's age in days
 */
export function getStageRulesForAge(
  ageInDays: number,
): StageContentRules | undefined {
  return Object.values(STAGE_RULES).find(
    (rules) =>
      ageInDays >= rules.ageRange.minDays &&
      ageInDays <= rules.ageRange.maxDays,
  );
}

/**
 * Validates if a topic is appropriate for a stage
 */
export function isTopicAppropriate(stageId: string, topicId: string): boolean {
  const rules = getStageRules(stageId);
  if (!rules) return false;

  // Check if it's in avoid list
  if (rules.avoidTopics.includes(topicId)) {
    return false;
  }

  return true;
}

/**
 * Gets priority for a topic in a stage
 */
export function getTopicPriority(stageId: string, topicId: string): number {
  const rules = getStageRules(stageId);
  if (!rules) return 1;

  const topic = rules.topics.find((t) => t.id === topicId);
  return topic?.priority ?? 1;
}
