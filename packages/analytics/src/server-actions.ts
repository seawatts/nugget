/**
 * Server action analytics wrapper for tracking server actions to PostHog
 */
import { posthog } from './posthog/server';
import {
  buildServerActionEvent,
  type ServerActionEventProperties,
  truncateStack,
} from './utils';

export interface TrackServerActionOptions {
  /** The name of the action being tracked */
  actionName: string;
  /** User ID for the action */
  userId?: string | null;
  /** Additional properties to include with the event */
  properties?: Record<string, unknown>;
}

export interface TrackServerActionResult<T> {
  /** The result of the action */
  result: T;
  /** Duration of the action in milliseconds */
  durationMs: number;
}

/**
 * Track a server action execution to PostHog
 * Captures action name, duration, success/failure, and user context
 */
export async function trackServerAction<T>(
  options: TrackServerActionOptions,
  action: () => Promise<T>,
): Promise<T> {
  const { actionName, userId, properties = {} } = options;
  const start = Date.now();
  let success = true;
  let errorMessage: string | undefined;
  let errorStack: string | undefined;

  try {
    const result = await action();
    return result;
  } catch (error) {
    success = false;
    if (error instanceof Error) {
      errorMessage = error.message;
      errorStack = truncateStack(error.stack);
    } else {
      errorMessage = String(error);
    }
    throw error;
  } finally {
    const duration = Date.now() - start;

    const eventProperties: ServerActionEventProperties &
      Record<string, unknown> = {
      action_name: actionName,
      duration_ms: duration,
      error_message: errorMessage,
      error_stack: errorStack,
      success,
      user_id: userId ?? undefined,
      ...properties,
    };

    posthog.capture({
      distinctId: userId || 'anonymous',
      event: buildServerActionEvent(actionName),
      properties: eventProperties,
    });

    // If there was an error, also capture it as a separate error event
    if (!success && errorMessage) {
      posthog.captureException(new Error(errorMessage), userId || 'anonymous', {
        action_name: actionName,
        duration_ms: duration,
        ...properties,
      });
    }
  }
}

/**
 * Create a tracked version of a server action
 * Returns a function that wraps the action with analytics tracking
 */
export function createTrackedAction<TInput, TOutput>(
  actionName: string,
  action: (input: TInput, userId?: string | null) => Promise<TOutput>,
  getProperties?: (input: TInput) => Record<string, unknown>,
): (input: TInput, userId?: string | null) => Promise<TOutput> {
  return async (input: TInput, userId?: string | null) => {
    const properties = getProperties ? getProperties(input) : {};

    return trackServerAction(
      {
        actionName,
        properties,
        userId,
      },
      () => action(input, userId),
    );
  };
}

/**
 * Capture a server action error to PostHog
 * Use this for manual error tracking in server actions
 */
export function captureServerActionError(
  actionName: string,
  error: Error,
  userId?: string | null,
  properties?: Record<string, unknown>,
): void {
  posthog.captureException(error, userId || 'anonymous', {
    action_name: actionName,
    error_message: error.message,
    error_stack: truncateStack(error.stack),
    ...properties,
  });
}
