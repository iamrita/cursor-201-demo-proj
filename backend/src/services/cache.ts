import { Actor, Movie, CastMember, PathResult } from '../types';

// Cache configuration (in milliseconds)
const ACTOR_DETAILS_TTL = 86400000; // 24 hours (actor details rarely change)
const MOVIE_DETAILS_TTL = 86400000; // 24 hours (movie details rarely change)
const ACTOR_FILMOGRAPHY_TTL = 3600000; // 1 hour (filmography can change)
const MOVIE_CAST_TTL = 3600000; // 1 hour (cast can change)
const PATH_RESULT_TTL = 3600000; // 1 hour (paths are expensive to compute)

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class CacheService {
  private actorDetailsCache: Map<number, CacheEntry<Actor>>;
  private actorFilmographyCache: Map<number, CacheEntry<Movie[]>>;
  private movieCastCache: Map<number, CacheEntry<CastMember[]>>;
  private movieDetailsCache: Map<number, CacheEntry<Movie>>;
  private pathResultCache: Map<string, CacheEntry<PathResult>>;

  constructor() {
    this.actorDetailsCache = new Map();
    this.actorFilmographyCache = new Map();
    this.movieCastCache = new Map();
    this.movieDetailsCache = new Map();
    this.pathResultCache = new Map();
    
    // Clean up expired entries every 10 minutes
    setInterval(() => this.cleanup(), 600000);
  }

  private cleanup(): void {
    const now = Date.now();
    
    // Clean actor details
    for (const [key, entry] of this.actorDetailsCache.entries()) {
      if (entry.expiresAt < now) this.actorDetailsCache.delete(key);
    }
    
    // Clean actor filmography
    for (const [key, entry] of this.actorFilmographyCache.entries()) {
      if (entry.expiresAt < now) this.actorFilmographyCache.delete(key);
    }
    
    // Clean movie cast
    for (const [key, entry] of this.movieCastCache.entries()) {
      if (entry.expiresAt < now) this.movieCastCache.delete(key);
    }
    
    // Clean movie details
    for (const [key, entry] of this.movieDetailsCache.entries()) {
      if (entry.expiresAt < now) this.movieDetailsCache.delete(key);
    }
    
    // Clean path results
    for (const [key, entry] of this.pathResultCache.entries()) {
      if (entry.expiresAt < now) this.pathResultCache.delete(key);
    }
  }

  private isExpired<T>(entry: CacheEntry<T> | undefined): boolean {
    if (!entry) return true;
    return entry.expiresAt < Date.now();
  }

  // Actor details caching
  async getActorDetails(actorId: number, fetchFn: () => Promise<Actor>): Promise<Actor> {
    const entry = this.actorDetailsCache.get(actorId);
    if (entry && !this.isExpired(entry)) {
      return entry.data;
    }

    const actor = await fetchFn();
    this.actorDetailsCache.set(actorId, {
      data: actor,
      expiresAt: Date.now() + ACTOR_DETAILS_TTL,
    });
    return actor;
  }

  // Actor filmography caching
  async getActorFilmography(actorId: number, fetchFn: () => Promise<Movie[]>): Promise<Movie[]> {
    const entry = this.actorFilmographyCache.get(actorId);
    if (entry && !this.isExpired(entry)) {
      return entry.data;
    }

    const movies = await fetchFn();
    this.actorFilmographyCache.set(actorId, {
      data: movies,
      expiresAt: Date.now() + ACTOR_FILMOGRAPHY_TTL,
    });
    return movies;
  }

  // Movie cast caching
  async getMovieCast(movieId: number, fetchFn: () => Promise<CastMember[]>): Promise<CastMember[]> {
    const entry = this.movieCastCache.get(movieId);
    if (entry && !this.isExpired(entry)) {
      return entry.data;
    }

    const cast = await fetchFn();
    this.movieCastCache.set(movieId, {
      data: cast,
      expiresAt: Date.now() + MOVIE_CAST_TTL,
    });
    return cast;
  }

  // Movie details caching
  async getMovieDetails(movieId: number, fetchFn: () => Promise<Movie>): Promise<Movie> {
    const entry = this.movieDetailsCache.get(movieId);
    if (entry && !this.isExpired(entry)) {
      return entry.data;
    }

    const movie = await fetchFn();
    this.movieDetailsCache.set(movieId, {
      data: movie,
      expiresAt: Date.now() + MOVIE_DETAILS_TTL,
    });
    return movie;
  }

  // Path result caching (most important for performance)
  getPathResult(actor1Id: number, actor2Id: number): PathResult | undefined {
    // Use sorted IDs to ensure same cache key regardless of order
    const [id1, id2] = [actor1Id, actor2Id].sort((a, b) => a - b);
    const key = `${id1}:${id2}`;
    const entry = this.pathResultCache.get(key);
    
    if (entry && !this.isExpired(entry)) {
      return entry.data;
    }
    
    return undefined;
  }

  setPathResult(actor1Id: number, actor2Id: number, result: PathResult): void {
    // Use sorted IDs to ensure same cache key regardless of order
    const [id1, id2] = [actor1Id, actor2Id].sort((a, b) => a - b);
    const key = `${id1}:${id2}`;
    this.pathResultCache.set(key, {
      data: result,
      expiresAt: Date.now() + PATH_RESULT_TTL,
    });
  }

  // Clear all cache (useful for testing or manual invalidation)
  clearCache(): void {
    this.actorDetailsCache.clear();
    this.actorFilmographyCache.clear();
    this.movieCastCache.clear();
    this.movieDetailsCache.clear();
    this.pathResultCache.clear();
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    let validKeys = 0;
    
    // Count valid entries
    for (const entry of this.actorDetailsCache.values()) {
      if (entry.expiresAt >= now) validKeys++;
    }
    for (const entry of this.actorFilmographyCache.values()) {
      if (entry.expiresAt >= now) validKeys++;
    }
    for (const entry of this.movieCastCache.values()) {
      if (entry.expiresAt >= now) validKeys++;
    }
    for (const entry of this.movieDetailsCache.values()) {
      if (entry.expiresAt >= now) validKeys++;
    }
    for (const entry of this.pathResultCache.values()) {
      if (entry.expiresAt >= now) validKeys++;
    }
    
    return {
      keys: validKeys,
      totalKeys: this.actorDetailsCache.size + this.actorFilmographyCache.size + 
                 this.movieCastCache.size + this.movieDetailsCache.size + 
                 this.pathResultCache.size,
    };
  }
}

export default new CacheService();
