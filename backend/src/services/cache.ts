interface CacheEntry<T> {
  data: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  maxSize: number;
  hitRate: number;
}

class InMemoryCache {
  private cache: Map<string, CacheEntry<any>>;
  private defaultTTL: number; // in milliseconds
  private maxSize: number;
  private stats: {
    hits: number;
    misses: number;
  };

  constructor(defaultTTL: number = 3600000, maxSize: number = 10000) {
    // Default TTL: 1 hour (3600000 ms)
    // Default max size: 10000 entries
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
    this.maxSize = maxSize;
    this.stats = {
      hits: 0,
      misses: 0,
    };

    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 300000);
  }

  /**
   * Generate a cache key from a prefix and parameters
   */
  private generateKey(prefix: string, ...params: any[]): string {
    return `${prefix}:${params.map(p => String(p)).join(':')}`;
  }

  /**
   * Check if an entry is expired
   */
  private isExpired(entry: CacheEntry<any>, ttl?: number): boolean {
    const entryTTL = ttl || this.defaultTTL;
    return Date.now() - entry.timestamp > entryTTL;
  }

  /**
   * Evict least recently used entries when cache is full
   */
  private evictLRU(): void {
    if (this.cache.size < this.maxSize) {
      return;
    }

    // Sort entries by last accessed time and remove oldest 10%
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
    
    const toRemove = Math.ceil(this.maxSize * 0.1); // Remove 10%
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  /**
   * Get a value from cache
   */
  get<T>(prefix: string, ...params: any[]): T | null {
    const key = this.generateKey(prefix, ...params);
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update access info
    entry.lastAccessed = Date.now();
    entry.accessCount++;
    this.stats.hits++;

    return entry.data as T;
  }

  /**
   * Set a value in cache
   */
  set<T>(prefix: string, value: T, ttl?: number, ...params: any[]): void {
    const key = this.generateKey(prefix, ...params);

    // Evict if needed before adding
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data: value,
      timestamp: Date.now(),
      accessCount: 0,
      lastAccessed: Date.now(),
    });
  }

  /**
   * Check if a key exists in cache (without updating access time)
   */
  has(prefix: string, ...params: any[]): boolean {
    const key = this.generateKey(prefix, ...params);
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete a specific entry
   */
  delete(prefix: string, ...params: any[]): boolean {
    const key = this.generateKey(prefix, ...params);
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.stats.hits = 0;
    this.stats.misses = 0;
  }

  /**
   * Remove expired entries
   */
  cleanup(): void {
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      console.log(`[Cache] Cleaned up ${removed} expired entries`);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: Math.round(hitRate * 100) / 100,
    };
  }

  /**
   * Get or set a value using a callback function
   * This is a convenience method that handles the cache logic
   */
  async getOrSet<T>(
    prefix: string,
    fetchFn: () => Promise<T>,
    ttl?: number,
    ...params: any[]
  ): Promise<T> {
    // Try to get from cache
    const cached = this.get<T>(prefix, ...params);
    if (cached !== null) {
      return cached;
    }

    // Fetch and cache
    const value = await fetchFn();
    this.set(prefix, value, ttl, ...params);
    return value;
  }
}

// Export singleton instance
export default new InMemoryCache();

