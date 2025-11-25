/**
 * Simple in-memory cache with TTL (Time To Live) support
 */
class Cache {
  private cache: Map<string, { value: any; expiresAt: number }>;
  private defaultTTL: number;

  constructor(defaultTTL: number = 3600000) {
    // Default TTL: 1 hour (3600000 ms)
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
    
    // Clean up expired entries periodically (every 5 minutes)
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Get a value from cache
   * @param key Cache key
   * @returns Cached value or null if not found/expired
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
    
    return entry.value as T;
  }

  /**
   * Set a value in cache with optional custom TTL
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Optional TTL in milliseconds (defaults to instance default)
   */
  set(key: string, value: any, ttl?: number): void {
    const expiresAt = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { value, expiresAt });
  }

  /**
   * Check if a key exists and is not expired
   * @param key Cache key
   * @returns true if key exists and is valid
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
   * Delete a key from cache
   * @param key Cache key
   */
  delete(key: string): void {
    this.cache.delete(key);
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
  getStats() {
    // Clean up expired entries before returning stats
    this.cleanup();
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
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

// Export singleton instance with configurable TTL
// Default: 1 hour for most data, but can be overridden via environment variable
const defaultTTL = process.env.CACHE_TTL_MS
  ? parseInt(process.env.CACHE_TTL_MS, 10)
  : 3600000; // 1 hour

export default new Cache(defaultTTL);

