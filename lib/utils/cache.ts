/**
 * Simple in-memory cache with TTL support for Edge runtime
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class MemoryCache<T = unknown> {
  private cache = new Map<string, CacheEntry<T>>();
  private readonly defaultTTL: number;

  constructor(defaultTTL: number = 3600000) {
    // Default: 1 hour
    this.defaultTTL = defaultTTL;
  }

  /**
   * Get value from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set value in cache
   */
  set(key: string, data: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl || this.defaultTTL);

    this.cache.set(key, {
      data,
      expiresAt,
    });
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete key from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Remove expired entries
   */
  prune(): number {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        removed++;
      }
    }

    return removed;
  }

  /**
   * Get or set with a function (cache-aside pattern)
   */
  async getOrSet(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get(key);

    if (cached !== null) {
      return cached;
    }

    const data = await fetcher();
    this.set(key, data, ttl);

    return data;
  }

  /**
   * Get all keys (for debugging)
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache statistics
   */
  stats(): { size: number; expired: number } {
    const now = Date.now();
    let expired = 0;

    for (const entry of this.cache.values()) {
      if (now > entry.expiresAt) {
        expired++;
      }
    }

    return {
      size: this.cache.size,
      expired,
    };
  }
}

/**
 * Generate cache key from URL and params
 */
export function generateCacheKey(
  prefix: string,
  ...parts: (string | number | boolean | null | undefined)[]
): string {
  const cleanParts = parts
    .filter((p) => p !== null && p !== undefined)
    .map((p) => String(p).toLowerCase().replace(/\s+/g, '_'));

  return `${prefix}:${cleanParts.join(':')}`;
}

/**
 * Global cache instances for different services
 */
export const dataForSEOCache = new MemoryCache<unknown>(3600000); // 1 hour
export const perplexityCache = new MemoryCache<unknown>(1800000); // 30 minutes
export const jinaCache = new MemoryCache<unknown>(7200000); // 2 hours
export const apifyCache = new MemoryCache<unknown>(1800000); // 30 minutes

/**
 * Periodic cleanup of expired cache entries
 * Call this from a background job or API route
 */
export function pruneAllCaches(): {
  dataForSEO: number;
  perplexity: number;
  jina: number;
  apify: number;
} {
  return {
    dataForSEO: dataForSEOCache.prune(),
    perplexity: perplexityCache.prune(),
    jina: jinaCache.prune(),
    apify: apifyCache.prune(),
  };
}

/**
 * Get cache statistics for all services
 */
export function getAllCacheStats(): Record<
  string,
  { size: number; expired: number }
> {
  return {
    dataForSEO: dataForSEOCache.stats(),
    perplexity: perplexityCache.stats(),
    jina: jinaCache.stats(),
    apify: apifyCache.stats(),
  };
}
