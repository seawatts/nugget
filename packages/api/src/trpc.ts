/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1)
 * 2. You want to create a new middleware or type of procedure (see Part 3)
 *
 * tl;dr - this is where all the tRPC server stuff is created and plugged in.
 * The pieces you will need to use are documented accordingly near the end
 */

import { posthog } from '@nugget/analytics/posthog/server';
import {
  buildTrpcEvent,
  sanitizeInput,
  TRPC_TYPE,
  truncateStack,
} from '@nugget/analytics/utils';
import { debug } from '@nugget/logger';
import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { ZodError } from 'zod';
import type { Context } from './context';

const log = debug('nugget:trpc');

/**
 * 2. INITIALIZATION
 *
 * This is where the trpc api is initialized, connecting the context and
 * transformer
 */
const t = initTRPC.context<Context>().create({
  errorFormatter: ({ shape, error, path, type }) => {
    // Capture error to PostHog
    const errorMessage = error.message || 'Unknown error';
    posthog.capture({
      distinctId: 'system',
      event: 'trpc.error',
      properties: {
        error_code: error.code,
        error_message: errorMessage,
        error_stack: truncateStack(error.stack),
        input: sanitizeInput(shape.data),
        procedure: path,
        type,
        zod_error:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    });

    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
  transformer: superjson,
});

/**
 * Create a server-side caller
 * @see https://trpc.io/docs/server/server-side-calls
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these
 * a lot in the /src/server/api/routers folder
 */

/**
 * This is how you create new routers and subrouters in your tRPC API
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Middleware for timing procedure execution and adding an articifial delay in development.
 *
 * You can remove this if you don't like it, but it can help catch unwanted waterfalls by simulating
 * network latency that would occur in production but not in local development.
 */
const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();
  const result = await next();

  const end = Date.now();
  log(`[TRPC] ${path} took ${end - start}ms to execute`);

  return result;
});

/**
 * Analytics middleware that tracks tRPC procedure calls to PostHog
 * Captures procedure name, duration, success/failure, and user context
 */
const analyticsMiddleware = t.middleware(async ({ next, path, type, ctx }) => {
  const start = Date.now();
  let success = true;
  let errorMessage: string | undefined;
  let errorCode: string | undefined;

  try {
    const result = await next();

    // Check if the result indicates an error
    if (!result.ok) {
      success = false;
      if (result.error) {
        errorMessage = result.error.message;
        errorCode = result.error.code;
      }
    }

    return result;
  } catch (error) {
    success = false;
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    if (error instanceof TRPCError) {
      errorCode = error.code;
    }
    throw error;
  } finally {
    const duration = Date.now() - start;
    const userId = ctx.auth?.userId;
    const orgId = ctx.auth?.orgId;

    // Determine procedure type for event naming
    const procedureType =
      type === 'mutation' ? TRPC_TYPE.MUTATION : TRPC_TYPE.QUERY;

    // Track to PostHog
    posthog.capture({
      distinctId: userId || 'anonymous',
      event: buildTrpcEvent(path, procedureType),
      properties: {
        duration_ms: duration,
        error_code: errorCode,
        error_message: errorMessage,
        org_id: orgId,
        procedure: path,
        success,
        type: procedureType,
        user_id: userId,
      },
    });

    log(`[TRPC] ${path} took ${duration}ms to execute`);
  }
});
/**
 * Public (unauthed) procedure
 *
 * This is the base piece you use to build new queries and mutations on your
 * tRPC API. It does not guarantee that a user querying is authorized, but you
 * can still access user session data if they are logged in
 */
export const publicProcedure = t.procedure
  .use(analyticsMiddleware)
  .use(timingMiddleware);

const isAuthed = t.middleware(({ next, ctx }) => {
  if (!ctx.auth?.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  return next({
    ctx: {
      auth: ctx.auth,
    },
  });
});

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use this. It verifies
 * the session is valid and guarantees `ctx.session.user` is not null.
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = t.procedure
  .use(analyticsMiddleware)
  .use(timingMiddleware)
  .use(isAuthed);
