interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class InMemoryCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL: number; // in milliseconds
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
  };

  constructor(defaultTTL: number = 3600000) {
    // Default TTL: 1 hour (3600000 ms)
    this.defaultTTL = defaultTTL;
  }

  /**
   * Get a value from the cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if entry has expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.data as T;
  }

  /**
   * Set a value in the cache
   */
  set<T>(key: string, value: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { data: value, expiresAt });
    this.stats.sets++;
  }

  /**
   * Check if a key exists and is not expired
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
   * Delete a key from the cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all entries from the cache
   */
  clear(): void {
    this.cache.clear();
    this.stats.hits = 0;
    this.stats.misses = 0;
    this.stats.sets = 0;
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    return cleaned;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 
      ? ((this.stats.hits / totalRequests) * 100).toFixed(2) 
      : '0.00';
    
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: `${hitRate}%`,
    };
  }

  /**
   * Get the current cache size
   */
  size(): number {
    return this.cache.size;
  }
}

// Create a singleton instance with different TTLs for different data types
// Actor details and movie details: 24 hours (relatively static)
// Filmography and cast: 12 hours (can change but not frequently)
// Search results: 1 hour (more dynamic)
export const actorCache = new InMemoryCache(24 * 3600000); // 24 hours
export const movieCache = new InMemoryCache(24 * 3600000); // 24 hours
export const filmographyCache = new InMemoryCache(12 * 3600000); // 12 hours
export const castCache = new InMemoryCache(12 * 3600000); // 12 hours
export const searchCache = new InMemoryCache(3600000); // 1 hour

// Start periodic cleanup every 10 minutes
setInterval(() => {
  actorCache.cleanup();
  movieCache.cleanup();
  filmographyCache.cleanup();
  castCache.cleanup();
  searchCache.cleanup();
}, 10 * 60 * 1000);

// Log cache stats periodically (every 5 minutes)
setInterval(() => {
  const stats = {
    actor: actorCache.getStats(),
    movie: movieCache.getStats(),
    filmography: filmographyCache.getStats(),
    cast: castCache.getStats(),
    search: searchCache.getStats(),
  };
  console.log('[Cache Stats]', JSON.stringify(stats, null, 2));
}, 5 * 60 * 1000);
