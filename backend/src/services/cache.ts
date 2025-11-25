interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  createdAt: number;
}

class CacheService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL: number = 60 * 60 * 1000; // 1 hour in milliseconds
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    evictions: 0,
  };

  /**
   * Get a value from cache
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
      this.stats.evictions++;
      return null;
    }

    this.stats.hits++;
    return entry.data as T;
  }

  /**
   * Set a value in cache with optional TTL
   */
  set<T>(key: string, value: T, ttl?: number): void {
    const now = Date.now();
    const expiresAt = now + (ttl || this.defaultTTL);
    
    this.cache.set(key, {
      data: value,
      expiresAt,
      createdAt: now,
    });
    
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
      this.stats.evictions++;
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
    this.stats.evictions += this.cache.size;
  }

  /**
   * Clear expired entries
   */
  clearExpired(): number {
    const now = Date.now();
    let cleared = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleared++;
        this.stats.evictions++;
      }
    }
    
    return cleared;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 
      ? (this.stats.hits / totalRequests * 100).toFixed(2) 
      : '0.00';
    
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: `${hitRate}%`,
      totalRequests,
    };
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Generate cache key for actor search
   */
  keyForActorSearch(query: string): string {
    return `actor:search:${query.toLowerCase().trim()}`;
  }

  /**
   * Generate cache key for actor details
   */
  keyForActorDetails(actorId: number): string {
    return `actor:details:${actorId}`;
  }

  /**
   * Generate cache key for actor filmography
   */
  keyForActorFilmography(actorId: number): string {
    return `actor:filmography:${actorId}`;
  }

  /**
   * Generate cache key for movie cast
   */
  keyForMovieCast(movieId: number): string {
    return `movie:cast:${movieId}`;
  }

  /**
   * Generate cache key for movie details
   */
  keyForMovieDetails(movieId: number): string {
    return `movie:details:${movieId}`;
  }

  /**
   * Generate cache key for path result
   */
  keyForPath(actor1Id: number, actor2Id: number): string {
    // Use sorted IDs to ensure same path regardless of order
    const [id1, id2] = [actor1Id, actor2Id].sort((a, b) => a - b);
    return `path:${id1}:${id2}`;
  }
}

// Create singleton instance
const cacheService = new CacheService();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const cleared = cacheService.clearExpired();
  if (cleared > 0) {
    console.log(`[Cache] Cleaned up ${cleared} expired entries`);
  }
}, 5 * 60 * 1000);

export default cacheService;

