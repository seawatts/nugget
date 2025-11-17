// Database-backed cache implementation with TTL support
// Stores cache entries per baby in the database
//
// Note: We explicitly pass babyId, familyId, and userId instead of relying
// on database defaults (requesting_user_id() and requesting_family_id())
// because those functions require JWT claims that are only available when
// using Supabase's authenticated client. When using Drizzle directly,
// those claims are not set, so we must provide the values explicitly.

import type * as schema from '@nugget/db/schema';
import { ContentCache } from '@nugget/db/schema';
import { and, eq, lt } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { VercelPgDatabase } from 'drizzle-orm/vercel-postgres';
import type { Cache } from './dynamic';

// Union type for both database client types
type DbClient =
  | PostgresJsDatabase<typeof schema>
  | VercelPgDatabase<typeof schema>;

interface CacheEntry {
  val: unknown;
  exp: number;
}

export class DbCache implements Cache {
  constructor(
    private db: DbClient,
    private babyId: string,
    private familyId: string,
    private userId: string,
  ) {}

  async get(key: string): Promise<CacheEntry | undefined> {
    try {
      // Query by babyId + key
      const results = await this.db
        .select()
        .from(ContentCache)
        .where(
          and(eq(ContentCache.babyId, this.babyId), eq(ContentCache.key, key)),
        )
        .limit(1);

      const entry = results[0];
      if (!entry) return undefined;

      // Check if expired
      const expiresAtMs = entry.expiresAt.getTime();
      if (expiresAtMs < Date.now()) {
        // Entry is expired, optionally clean it up
        await this.db.delete(ContentCache).where(eq(ContentCache.id, entry.id));
        return undefined;
      }

      return {
        exp: expiresAtMs,
        val: entry.value,
      };
    } catch (error) {
      console.error('DbCache get error:', error);
      return undefined;
    }
  }

  /**
   * Check if a cache entry exists and is marked as pending
   * Returns true if entry exists and has pending status
   */
  async isPending(key: string): Promise<boolean> {
    try {
      const entry = await this.get(key);
      if (!entry) return false;

      // Check if the value is a pending marker
      const val = entry.val as { _status?: string; _timestamp?: number };
      return val?._status === 'pending';
    } catch (error) {
      console.error('DbCache isPending error:', error);
      return false;
    }
  }

  async set(key: string, val: unknown, ttlMs: number): Promise<void> {
    try {
      const expiresAt = new Date(Date.now() + ttlMs);

      // Upsert: insert or update if exists
      // First check if entry exists
      const existing = await this.db
        .select({ id: ContentCache.id })
        .from(ContentCache)
        .where(
          and(eq(ContentCache.babyId, this.babyId), eq(ContentCache.key, key)),
        )
        .limit(1);

      if (existing.length > 0) {
        // Update existing entry
        await this.db
          .update(ContentCache)
          .set({
            expiresAt,
            updatedAt: new Date(),
            value: val,
          })
          .where(
            and(
              eq(ContentCache.babyId, this.babyId),
              eq(ContentCache.key, key),
            ),
          );
      } else {
        // Insert new entry
        await this.db.insert(ContentCache).values({
          babyId: this.babyId,
          expiresAt,
          familyId: this.familyId,
          key,
          userId: this.userId,
          value: val,
        });
      }
    } catch (error) {
      console.error('DbCache set error:', error);
      // Don't throw - cache failures should not break the application
    }
  }

  // Optional: Clean up expired entries for this baby
  async cleanup(): Promise<void> {
    try {
      const now = new Date();
      await this.db
        .delete(ContentCache)
        .where(
          and(
            eq(ContentCache.babyId, this.babyId),
            lt(ContentCache.expiresAt, now),
          ),
        );
    } catch (error) {
      console.error('DbCache cleanup error:', error);
    }
  }

  // Optional: Clear all cache entries for this baby
  async clear(): Promise<void> {
    try {
      await this.db
        .delete(ContentCache)
        .where(eq(ContentCache.babyId, this.babyId));
    } catch (error) {
      console.error('DbCache clear error:', error);
    }
  }
}
