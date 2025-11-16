import { cache } from 'react';
import { createTRPCContext } from '../context';
import { appRouter } from '../root';
import { createCallerFactory } from '../trpc';

/**
 * Create a tRPC caller for use in Server Actions
 * Uses createCaller which supports both queries and mutations.
 *
 * Import from '@nugget/api/server' for server actions.
 *
 * Call mutations directly without .fetch() or .mutate() wrappers:
 *
 * @example
 * ```ts
 * import { getApi } from '@nugget/api/server';
 *
 * const api = await getApi();
 * const result = await api.activities.create({ ... });  // Direct call
 * const data = await api.activities.list({ ... });      // Also works for queries
 * ```
 */
export const getApi = cache(async () => {
  const ctx = await createTRPCContext();
  return createCallerFactory(appRouter)(ctx);
});
