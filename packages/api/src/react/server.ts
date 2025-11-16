import { createServerSideHelpers } from '@trpc/react-query/server';
import { headers } from 'next/headers';
import { cache } from 'react';
import superjson from 'superjson';
import { createTRPCContext } from '../context';
import { appRouter } from '../root';
import { createQueryClient } from './query-client';

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a tRPC call from a React Server Component.
 */
const createContext = cache(async () => {
  const heads = new Headers(await headers());
  heads.set('x-trpc-source', 'rsc');

  return createTRPCContext();
});

export const getQueryClient = cache(createQueryClient);

/**
 * Create tRPC helpers for React Server Components
 * Uses createServerSideHelpers which integrates with React Query for prefetching.
 *
 * Import from '@nugget/api/rsc' for React Server Components.
 *
 * Only supports queries with .fetch():
 *
 * @example
 * ```ts
 * import { getApi } from '@nugget/api/rsc';
 *
 * const api = await getApi();
 * const data = await api.activities.list.fetch({ ... });  // Queries only
 * ```
 */
export const getApi = cache(async () =>
  createServerSideHelpers({
    ctx: await createContext(),
    queryClient: getQueryClient(),
    router: appRouter,
    transformer: superjson,
  }),
);
