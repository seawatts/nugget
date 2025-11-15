import { beforeEach, describe, expect, it } from 'bun:test';
import { InMemoryCache, parseTTL } from '../src/cache-adapter';

describe('InMemoryCache', () => {
  let cache: InMemoryCache;

  beforeEach(() => {
    cache = new InMemoryCache();
  });

  it('should set and get values', async () => {
    await cache.set('key1', 'value1', 1000);
    const result = await cache.get('key1');
    expect(result).toBeDefined();
    expect(result?.val).toBe('value1');
  });

  it('should return undefined for non-existent keys', async () => {
    const result = await cache.get('nonexistent');
    expect(result).toBeUndefined();
  });

  it('should expire values after TTL', async () => {
    await cache.set('key1', 'value1', 50); // 50ms TTL
    const before = await cache.get('key1');
    expect(before).toBeDefined();

    // Wait for expiration
    await new Promise((resolve) => setTimeout(resolve, 100));

    const after = await cache.get('key1');
    expect(after).toBeUndefined();
  });

  it('should handle multiple values', async () => {
    await cache.set('key1', 'value1', 1000);
    await cache.set('key2', 'value2', 1000);

    expect((await cache.get('key1'))?.val).toBe('value1');
    expect((await cache.get('key2'))?.val).toBe('value2');
  });

  it('should support any value type', async () => {
    await cache.set('string', 'text', 1000);
    await cache.set('number', 42, 1000);
    await cache.set('object', { foo: 'bar' }, 1000);
    await cache.set('array', [1, 2, 3], 1000);

    expect((await cache.get('string'))?.val).toBe('text');
    expect((await cache.get('number'))?.val).toBe(42);
    expect((await cache.get('object'))?.val).toEqual({ foo: 'bar' });
    expect((await cache.get('array'))?.val).toEqual([1, 2, 3]);
  });

  it('should cleanup expired entries', async () => {
    await cache.set('key1', 'value1', 50);
    await cache.set('key2', 'value2', 2000);

    expect(cache.size()).toBe(2);

    // Wait for first to expire
    await new Promise((resolve) => setTimeout(resolve, 100));

    cache.cleanup();
    expect(cache.size()).toBe(1);
    expect((await cache.get('key2'))?.val).toBe('value2');
  });

  it('should clear all entries', async () => {
    await cache.set('key1', 'value1', 1000);
    await cache.set('key2', 'value2', 1000);

    expect(cache.size()).toBe(2);

    cache.clear();
    expect(cache.size()).toBe(0);
  });
});

describe('parseTTL', () => {
  it('should parse seconds', () => {
    expect(parseTTL('30s')).toBe(30 * 1000);
    expect(parseTTL('1s')).toBe(1000);
  });

  it('should parse minutes', () => {
    expect(parseTTL('5m')).toBe(5 * 60 * 1000);
    expect(parseTTL('1m')).toBe(60 * 1000);
  });

  it('should parse hours', () => {
    expect(parseTTL('2h')).toBe(2 * 60 * 60 * 1000);
    expect(parseTTL('1h')).toBe(60 * 60 * 1000);
  });

  it('should parse days', () => {
    expect(parseTTL('7d')).toBe(7 * 24 * 60 * 60 * 1000);
    expect(parseTTL('1d')).toBe(24 * 60 * 60 * 1000);
  });

  it('should throw error for invalid format', () => {
    expect(() => parseTTL('invalid')).toThrow('Invalid TTL format');
    expect(() => parseTTL('10')).toThrow('Invalid TTL format');
    expect(() => parseTTL('10x')).toThrow('Invalid TTL format');
  });
});
