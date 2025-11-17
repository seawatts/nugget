// Export BAML client
export { b, BamlAsyncClient } from './baml_client/async_client';
export * from './baml_client/types';

// Export context utilities
export { buildBamlContext } from './context-builder';
export type { BamlContextData } from './context-builder';
export {
  formatChatContext,
  formatMilestoneContext,
  formatActivityContext,
  formatParentWellnessContext,
  formatMedicalContext,
  formatAllContext,
  formatSelectiveContext,
} from './format-context';

// Export learning orchestrator
export { generateDailyLearning, extractRecentTopicIds } from './learning-orchestrator';
export type { DailyLearningContext, DailyLearningResult } from './learning-orchestrator';

// Export learning stages
export * from './learning-stages';

// Export milestone orchestrator
export { generateMilestoneSuggestions, extractRecentMilestoneIds } from './milestone-orchestrator';
export type { MilestoneContext, MilestoneResult } from './milestone-orchestrator';

