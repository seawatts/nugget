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

