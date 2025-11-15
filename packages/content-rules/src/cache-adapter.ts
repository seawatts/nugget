// In-memory cache implementation with TTL support
// For production, can be replaced with Redis/Upstash

import type { Cache } from './dynamic';

interface CacheEntry {
  val: unknown;
  exp: number;
}

export class InMemoryCache implements Cache {
  private store = new Map<string, CacheEntry>();

  async get(key: string): Promise<{ val: unknown; exp: number } | undefined> {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    // Check if expired
    if (entry.exp < Date.now()) {
      this.store.delete(key);
      return undefined;
    }

    return entry;
  }

  async set(key: string, val: unknown, ttlMs: number): Promise<void> {
    const exp = Date.now() + ttlMs;
    this.store.set(key, { exp, val });
  }

  // Utility to clear expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.exp < now) {
        this.store.delete(key);
      }
    }
  }

  // Clear all entries
  clear(): void {
    this.store.clear();
  }

  // Get cache size
  size(): number {
    return this.store.size;
  }
}

// Parse TTL string to milliseconds
export function parseTTL(ttl: string): number {
  const match = ttl.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error(`Invalid TTL format: ${ttl}`);

  const [, value, unit] = match;
  if (!value || !unit) throw new Error(`Invalid TTL format: ${ttl}`);
  const num = Number.parseInt(value, 10);

  switch (unit) {
    case 's':
      return num * 1000;
    case 'm':
      return num * 60 * 1000;
    case 'h':
      return num * 60 * 60 * 1000;
    case 'd':
      return num * 24 * 60 * 60 * 1000;
    default:
      throw new Error(`Unknown TTL unit: ${unit}`);
  }
}

// Singleton instance for convenience
export const defaultCache = new InMemoryCache();

// Periodic cleanup (runs every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(
    () => {
      defaultCache.cleanup();
    },
    5 * 60 * 1000,
  );
}
