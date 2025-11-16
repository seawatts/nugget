import { cache } from 'react';
import { createTRPCContext } from '../context';
import { appRouter } from '../root';
import { createCallerFactory } from '../trpc';

/**
 * Create a tRPC caller for use in Server Actions
 * This is different from getApi() which uses createServerSideHelpers
 * and is meant for React Server Components (queries only).
 *
 * Use this when you need to call mutations from Server Actions.
 *
 * @example
 * ```ts
 * const caller = await getServerActionCaller();
 * const result = await caller.activities.create({ ... });
 * ```
 */
export const getServerActionCaller = cache(async () => {
  const ctx = await createTRPCContext();
  return createCallerFactory(appRouter)(ctx);
});
