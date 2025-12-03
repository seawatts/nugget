/**
 * Analytics utilities for consistent event naming and property building
 */

// Event name prefixes
export const EVENT_PREFIX = {
  DASHBOARD: 'dashboard',
  SERVER_ACTION: 'server_action',
  TRPC: 'trpc',
} as const;

// Dashboard component names
export const DASHBOARD_COMPONENT = {
  ACTIVITY_CARD: 'activity_card',
  ACTIVITY_CARDS: 'activity_cards',
  ACTIVITY_TIMELINE: 'activity_timeline',
  BABY_STATS_DRAWER: 'baby_stats_drawer',
  BATH_STATS_DRAWER: 'bath_stats_drawer',
  CELEBRATIONS_CAROUSEL: 'celebrations_carousel',
  CONTAINER: 'container',
  DEVELOPMENTAL_PHASES_CAROUSEL: 'developmental_phases_carousel',
  DIAPER_STATS_DRAWER: 'diaper_stats_drawer',
  FEEDING_STATS_DRAWER: 'feeding_stats_drawer',
  LEARNING_CAROUSEL: 'learning_carousel',
  MILESTONES_CAROUSEL: 'milestones_carousel',
  NAIL_TRIMMING_STATS_DRAWER: 'nail_trimming_stats_drawer',
  PARENT_WELLNESS: 'parent_wellness',
  PARENT_WELLNESS_STATS_DRAWER: 'parent_wellness_stats_drawer',
  PUMPING_STATS_DRAWER: 'pumping_stats_drawer',
  SLEEP_STATS_DRAWER: 'sleep_stats_drawer',
  TODAY_SUMMARY: 'today_summary',
  VITAMIN_D_STATS_DRAWER: 'vitamin_d_stats_drawer',
} as const;

// Dashboard actions
export const DASHBOARD_ACTION = {
  ACTIVITY_LOGGED: 'activity_logged',
  CARD_CLICK: 'card_click',
  CAROUSEL_SCROLL: 'carousel_scroll',
  DISMISSED: 'dismissed',
  DRAWER_CLOSE: 'drawer_close',
  DRAWER_OPEN: 'drawer_open',
  ERROR: 'error',
  FILTER_CHANGE: 'filter_change',
  LOAD: 'load',
  QUESTION_ANSWERED: 'question_answered',
  VIEW: 'view',
} as const;

// tRPC procedure types
export const TRPC_TYPE = {
  MUTATION: 'mutation',
  QUERY: 'query',
} as const;

/**
 * Build a dashboard event name
 */
export function buildDashboardEvent(
  component:
    | (typeof DASHBOARD_COMPONENT)[keyof typeof DASHBOARD_COMPONENT]
    | string,
  action: (typeof DASHBOARD_ACTION)[keyof typeof DASHBOARD_ACTION],
): string {
  return `${EVENT_PREFIX.DASHBOARD}.${component}.${action}`;
}

/**
 * Build a tRPC event name
 */
export function buildTrpcEvent(
  procedure: string,
  type: (typeof TRPC_TYPE)[keyof typeof TRPC_TYPE],
): string {
  return `${EVENT_PREFIX.TRPC}.${procedure}.${type}`;
}

/**
 * Build a server action event name
 */
export function buildServerActionEvent(actionName: string): string {
  return `${EVENT_PREFIX.SERVER_ACTION}.${actionName}`;
}

/**
 * Common properties for dashboard events
 */
export interface DashboardEventProperties {
  baby_id?: string;
  user_id?: string;
  family_id?: string;
  component?: string;
  activity_type?: string;
  duration_ms?: number;
}

/**
 * Common properties for tRPC events
 */
export interface TrpcEventProperties {
  procedure: string;
  type: 'query' | 'mutation';
  duration_ms: number;
  success: boolean;
  user_id?: string;
  org_id?: string;
  error_message?: string;
  error_code?: string;
}

/**
 * Common properties for server action events
 */
export interface ServerActionEventProperties {
  action_name: string;
  duration_ms: number;
  success: boolean;
  user_id?: string;
  error_message?: string;
}

/**
 * Common properties for error events
 */
export interface ErrorEventProperties {
  error_message: string;
  error_stack?: string;
  component?: string;
  procedure?: string;
  action_name?: string;
  user_id?: string;
  family_id?: string;
  baby_id?: string;
}

/**
 * Truncate error stack to avoid sending too much data
 */
export function truncateStack(
  stack: string | undefined,
  maxLength = 1000,
): string | undefined {
  if (!stack) return undefined;
  return stack.length > maxLength ? `${stack.slice(0, maxLength)}...` : stack;
}

/**
 * Sanitize input data to remove sensitive information
 */
export function sanitizeInput(
  input: unknown,
): Record<string, unknown> | undefined {
  if (!input || typeof input !== 'object') return undefined;

  const sanitized: Record<string, unknown> = {};
  const sensitiveKeys = ['password', 'token', 'secret', 'key', 'authorization'];

  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeInput(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
