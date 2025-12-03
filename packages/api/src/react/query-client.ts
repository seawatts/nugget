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
      },
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 30 * 1000,
      },
    },
  });
