// BAML integration with TTL caching for AI-powered content
// Provides aiTextBaml helper for dynamic text generation

import { parseTTL } from './cache-adapter';
import type { Cache, ComputeFn, PropValue, RuleContext } from './dynamic';

// Type for BAML function call config - accepts any async function
// The fn property infers TOutput from its return type
export interface BAMLCallConfig<TOutput = unknown> {
  fn: () => Promise<TOutput>;
  pick: (output: TOutput) => unknown;
}

// Helper to create a BAML call config with proper type inference
export function bamlCall<TOutput>(
  fn: () => Promise<TOutput>,
  pick: (output: TOutput) => unknown,
): BAMLCallConfig<TOutput> {
  return { fn, pick };
}

// Configuration for AI text with BAML
export interface AITextBAMLConfig {
  key: (ctx: RuleContext) => string;
  ttl: string; // e.g., '7d', '1h', '30m'
  // Accept any BAMLCallConfig with any output type
  // biome-ignore lint/suspicious/noExplicitAny: Type erasure at interface boundary needed for flexibility
  call: (ctx: RuleContext) => BAMLCallConfig<any>;
}

// Create an AI text prop that uses BAML
export function aiTextBaml(config: AITextBAMLConfig): PropValue<string> {
  return {
    _type: 'aiTextBaml',
    config,
  };
}

// Pending marker for cache entries that are being generated
interface PendingMarker {
  _status: 'pending';
  _timestamp: number;
}

// TTL for pending entries (5 minutes)
const PENDING_TTL_MS = 5 * 60 * 1000;

// Resolve all props including AI text, compute functions, and regular values
export async function resolveAIProps<T extends Record<string, PropValue>>(
  props: T,
  ctx: RuleContext,
  cache: Cache,
): Promise<Record<string, unknown>> {
  const resolved: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(props)) {
    if (value && typeof value === 'object' && '_type' in value) {
      if (value._type === 'compute') {
        // Handle compute functions
        resolved[key] = (value as unknown as { fn: ComputeFn<unknown> }).fn(
          ctx,
        );
      } else if (value._type === 'aiTextBaml') {
        // Handle AI text with BAML
        const config = (value as unknown as { config: unknown })
          .config as AITextBAMLConfig;
        const cacheKey = config.key(ctx);
        const ttlMs = parseTTL(config.ttl);

        // Check cache first
        const cached = await cache.get(cacheKey);
        if (cached && cached.exp > Date.now()) {
          // Check if this is a pending entry
          const val = cached.val as Partial<PendingMarker>;
          if (val?._status === 'pending') {
            // Check if pending entry is stale (older than 5 minutes)
            const pendingAge = Date.now() - (val._timestamp || 0);
            if (pendingAge > PENDING_TTL_MS) {
              // Pending entry is stale, regenerate
              console.warn(
                `Stale pending entry for key ${cacheKey}, regenerating...`,
              );
            } else {
              // Still pending, return pending marker
              resolved[key] = '[AI_PENDING]';
              continue;
            }
          } else {
            // Valid cached result
            resolved[key] = cached.val;
            continue;
          }
        }

        // No valid cache entry, create pending marker before calling BAML
        const pendingMarker: PendingMarker = {
          _status: 'pending',
          _timestamp: Date.now(),
        };
        await cache.set(cacheKey, pendingMarker, PENDING_TTL_MS);

        // Call BAML function
        try {
          const callConfig = config.call(ctx);
          const output = await callConfig.fn();
          const result = callConfig.pick(output);

          // Cache the result with full TTL
          await cache.set(cacheKey, result, ttlMs);
          resolved[key] = result;
        } catch (error) {
          console.error('BAML call failed:', error);
          // Remove pending marker on error so it can be retried
          await cache.set(cacheKey, { _status: 'error' }, 1000); // 1 second TTL for errors
          resolved[key] = '[AI_ERROR]';
        }
      } else {
        // Unknown special type - just pass through
        resolved[key] = value;
      }
    } else {
      // Regular value
      resolved[key] = value;
    }
  }

  return resolved;
}

// Helper to create array-based prompt lists (for Carousel.PromptList)
export function aiPromptList(config: AITextBAMLConfig): PropValue<string[]> {
  return {
    _type: 'aiTextBaml',
    config: {
      ...config,
      // Wrap the pick function to split on || if result is a string
      call: (ctx: RuleContext) => {
        const callConfig = config.call(ctx);
        return {
          ...callConfig,
          pick: (output: unknown) => {
            const result = callConfig.pick(output);
            if (typeof result === 'string') {
              return result.split('||').map((s) => s.trim());
            }
            return result;
          },
        };
      },
    },
  } as PropValue<string[]>;
}
