import {
  defaultShouldDehydrateQuery,
  QueryClient,
} from '@tanstack/react-query';
import SuperJSON from 'superjson';

/**
 * Capture query/mutation errors to PostHog on the client side
 * This function is called for all failed queries and mutations
 */
function captureQueryError(error: Error, query?: { queryKey?: unknown }) {
  // Only capture on client side
  if (typeof window !== 'undefined') {
    // Dynamically import posthog to avoid SSR issues
    import('posthog-js')
      .then((posthog) => {
        posthog.default.captureException(error, {
          query_key: query?.queryKey
            ? JSON.stringify(query.queryKey)
            : undefined,
          source: 'react_query',
        });
      })
      .catch(() => {
        // Silently fail if posthog import fails
      });
  }
}

/**
 * Determine if an error should be retried
 * Returns false for auth errors and validation errors that won't succeed on retry
 */
function shouldRetryMutation(failureCount: number, error: unknown): boolean {
  // Don't retry more than 3 times
  if (failureCount >= 3) {
    return false;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Don't retry authentication errors - user needs to sign in
    if (
      message.includes('authentication') ||
      message.includes('unauthorized') ||
      message.includes('unauthenticated') ||
      message.includes('sign in') ||
      message.includes('login')
    ) {
      return false;
    }

    // Don't retry validation errors - they won't succeed on retry
    if (
      message.includes('validation') ||
      message.includes('invalid') ||
      message.includes('required')
    ) {
      return false;
    }

    // Don't retry "not found" errors
    if (message.includes('not found')) {
      return false;
    }
  }

  // Retry network errors, timeouts, and other transient failures
  return true;
}

/**
 * Calculate retry delay with exponential backoff
 * 1st retry: 1s, 2nd retry: 2s, 3rd retry: 4s (max 30s)
 */
function getMutationRetryDelay(attemptIndex: number): number {
  return Math.min(1000 * 2 ** attemptIndex, 30000);
}

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      dehydrate: {
        serializeData: SuperJSON.serialize,
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === 'pending',
      },
      hydrate: {
        deserializeData: SuperJSON.deserialize,
      },
      mutations: {
        onError: (error) => {
          captureQueryError(error as Error);
        },
        // Retry mutations up to 3 times with exponential backoff
        // This helps with network issues and transient failures
        retry: shouldRetryMutation,
        retryDelay: getMutationRetryDelay,
      },
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 30 * 1000,
      },
    },
  });
