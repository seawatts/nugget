'use server';

import { auth } from '@clerk/nextjs/server';
import { DbCache } from '@nugget/content-rules/db-cache-adapter';
import { db } from '@nugget/db/client';

/**
 * Generic helper for cache-first content loading
 *
 * Usage:
 * const content = await withCache({
 *   cacheKey: 'learning:user123:day5:2024-01-01',
 *   ttlMs: 86400000, // 1 day
 *   generate: async () => {
 *     // Your AI generation logic here
 *     return generatedContent;
 *   }
 * });
 */
export async function withCache<T>({
  babyId,
  familyId,
  cacheKey,
  ttlMs,
  generate,
}: {
  babyId: string;
  familyId: string;
  cacheKey: string;
  ttlMs: number;
  generate: () => Promise<T>;
}): Promise<T | null> {
  try {
    const authResult = await auth();
    if (!authResult.userId) {
      console.error('[Cache] No authenticated user');
      return null;
    }

    // Initialize cache
    const cache = new DbCache(db, babyId, familyId, authResult.userId);

    console.log(`[Cache] Checking key: ${cacheKey}`);

    // Check cache first
    const cached = await cache.get(cacheKey);

    if (cached && cached.exp > Date.now()) {
      const val = cached.val as Record<string, unknown>;

      // Skip pending states - don't try to regenerate while generating
      if (val?._status === 'pending') {
        const pendingAge = Date.now() - ((val._timestamp as number) || 0);
        console.log(
          `[Cache] Entry is pending generation (${Math.round(pendingAge / 1000)}s ago)`,
        );
        return null;
      }

      // For error states, log the error and regenerate
      if (val?._status === 'error') {
        console.error('[Cache] Cached error found:', val._error);
        console.log('[Cache] Will regenerate after error');
        // Fall through to generation
      } else {
        // Valid cached content
        console.log('[Cache] Cache hit, returning immediately');
        return val as T;
      }
    }

    // Cache miss or error - generate new content
    console.log('[Cache] Cache miss, generating new content...');
    const startTime = Date.now();

    // Set pending marker
    await cache.set(
      cacheKey,
      { _status: 'pending', _timestamp: Date.now() },
      300000, // 5 min pending TTL
    );

    try {
      const content = await generate();
      const endTime = Date.now();

      console.log(`[Cache] Generation took ${endTime - startTime}ms`);

      // Cache the result
      await cache.set(cacheKey, content, ttlMs);

      return content;
    } catch (error) {
      console.error('[Cache] Generation failed:', error);

      // Mark as error with short TTL so we can retry
      await cache.set(
        cacheKey,
        {
          _error: String(error),
          _status: 'error',
          _timestamp: Date.now(),
        },
        60000, // 1 minute TTL for errors
      );

      return null;
    }
  } catch (error) {
    console.error('[Cache] withCache failed:', error);
    return null;
  }
}

/**
 * Generate a date-based cache key for daily regeneration
 * Note: Must be async because this file uses 'use server'
 */
export async function getDateKey(): Promise<string> {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
