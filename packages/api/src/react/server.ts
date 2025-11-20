import 'server-only';

import { createServerSideHelpers } from '@trpc/react-query/server';
import { cache } from 'react';
import superjson from 'superjson';
import { createTRPCContext } from '../context';
import { appRouter } from '../root';
import { createQueryClient } from './query-client';

/**
 * Get tRPC context with Clerk auth for RSC
 *
 * CRITICAL: This must be wrapped in `cache()` so it's called per-request, not at module scope.
 * Clerk's auth() relies on Next.js's implicit request context (cookies, headers).
 * If called at module scope, auth() would run outside any request and userId would be null.
 */
const getContext = cache(createTRPCContext);

/**
 * Stable per-request QueryClient
 */
export const getQueryClient = cache(createQueryClient);

/**
 * Get tRPC server-side helpers for React Server Components
 *
 * This is cached per-request to ensure Clerk auth context is properly wired.
 * Each request gets its own instance with the correct auth() context.
 *
 * @example Server Component (prefetch)
 * ```tsx
 * import { api, HydrationBoundary } from '@nugget/api/rsc';
 *
 * export default async function Page() {
 *   const helpers = await api();
 *   void helpers.babies.list.prefetch();
 *
 *   return (
 *     <HydrationBoundary>
 *       <ClientComponent />
 *     </HydrationBoundary>
 *   );
 * }
 * ```
 *
 * @example Client Component (suspense)
 * ```tsx
 * 'use client';
 * import { api } from '@nugget/api/react';
 *
 * export function ClientComponent() {
 *   const [data] = api.babies.list.useSuspenseQuery();
 *   return <div>{data.length} babies</div>;
 * }
 * ```
 */
export const api = cache(async () =>
  createServerSideHelpers({
    ctx: await getContext(),
    queryClient: getQueryClient(),
    router: appRouter,
    transformer: superjson,
  }),
);

// Export HydrationBoundary for convenience
export { HydrationBoundary } from './hydration-boundary';
