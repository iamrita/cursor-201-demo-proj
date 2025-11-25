interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

/**
 * In-memory cache service with TTL support
 */
class CacheService {
  private cache: Map<string, CacheEntry<any>>;
  private defaultTTL: number; // in milliseconds

  constructor(defaultTTL: number = 3600000) { // Default 1 hour
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
    
    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Get a value from cache if it exists and hasn't expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set a value in cache with optional TTL
   */
  set<T>(key: string, value: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, {
      data: value,
      expiresAt,
    });
  }

  /**
   * Check if a key exists in cache and is not expired
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
   * Delete a specific key from cache
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
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Remove expired entries from cache
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    
    if (keysToDelete.length > 0) {
      console.log(`[Cache] Cleaned up ${keysToDelete.length} expired entries`);
    }
  }
}

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
  ACTOR_DETAILS: 24 * 60 * 60 * 1000,      // 24 hours
  ACTOR_FILMOGRAPHY: 6 * 60 * 60 * 1000,   // 6 hours
  MOVIE_DETAILS: 24 * 60 * 60 * 1000,      // 24 hours
  MOVIE_CAST: 6 * 60 * 60 * 1000,          // 6 hours
  SEARCH_RESULTS: 5 * 60 * 1000,            // 5 minutes
};

export default new CacheService();
