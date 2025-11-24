/**
 * Simple in-memory cache with TTL support
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class CacheService {
  private cache: Map<string, CacheEntry<any>>;
  private hits: number = 0;
  private misses: number = 0;

  constructor() {
    this.cache = new Map();
    
    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanExpired(), 5 * 60 * 1000);
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.misses++;
      return null;
    }
    
    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }
    
    this.hits++;
    return entry.data as T;
  }

  /**
   * Set value in cache with TTL in seconds
   */
  set<T>(key: string, data: T, ttlSeconds: number = 3600): void {
    const expiresAt = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { data, expiresAt });
  }

  /**
   * Delete specific key from cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? (this.hits / total * 100).toFixed(2) : '0';
    
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: `${hitRate}%`,
    };
  }

  /**
   * Clean up expired entries
   */
  private cleanExpired(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`[Cache] Cleaned ${cleaned} expired entries`);
    }
  }

  /**
   * Helper method to wrap async operations with caching
   */
  async wrap<T>(
    key: string,
    ttlSeconds: number,
    fetcher: () => Promise<T>
  ): Promise<T> {
    // Check cache first
    const cached = this.get<T>(key);
    if (cached !== null) {
      console.log(`[Cache] HIT: ${key}`);
      return cached;
    }
    
    // Cache miss - fetch data
    console.log(`[Cache] MISS: ${key}`);
    const data = await fetcher();
    
    // Store in cache
    this.set(key, data, ttlSeconds);
    
    return data;
  }
}

export default new CacheService();
