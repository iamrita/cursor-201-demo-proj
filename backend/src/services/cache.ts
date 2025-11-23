import NodeCache from 'node-cache';
import { Actor, Movie, CastMember, PathResult } from '../types';

// Cache configuration
const DEFAULT_TTL = 3600; // 1 hour in seconds
const ACTOR_DETAILS_TTL = 86400; // 24 hours (actor details rarely change)
const MOVIE_DETAILS_TTL = 86400; // 24 hours (movie details rarely change)
const ACTOR_FILMOGRAPHY_TTL = 3600; // 1 hour (filmography can change)
const MOVIE_CAST_TTL = 3600; // 1 hour (cast can change)
const PATH_RESULT_TTL = 3600; // 1 hour (paths are expensive to compute)

class CacheService {
  private cache: NodeCache;

  constructor() {
    // Create cache with standard TTL and check period
    this.cache = new NodeCache({
      stdTTL: DEFAULT_TTL,
      checkperiod: 600, // Check for expired keys every 10 minutes
      useClones: false, // Better performance, but be careful with mutations
    });
  }

  // Actor details caching
  async getActorDetails(actorId: number, fetchFn: () => Promise<Actor>): Promise<Actor> {
    const key = `actor:details:${actorId}`;
    const cached = this.cache.get<Actor>(key);
    
    if (cached) {
      console.log(`[Cache] Hit: actor details ${actorId}`);
      return cached;
    }

    console.log(`[Cache] Miss: actor details ${actorId}`);
    const actor = await fetchFn();
    this.cache.set(key, actor, ACTOR_DETAILS_TTL);
    return actor;
  }

  // Actor filmography caching
  async getActorFilmography(actorId: number, fetchFn: () => Promise<Movie[]>): Promise<Movie[]> {
    const key = `actor:filmography:${actorId}`;
    const cached = this.cache.get<Movie[]>(key);
    
    if (cached) {
      console.log(`[Cache] Hit: actor filmography ${actorId}`);
      return cached;
    }

    console.log(`[Cache] Miss: actor filmography ${actorId}`);
    const movies = await fetchFn();
    this.cache.set(key, movies, ACTOR_FILMOGRAPHY_TTL);
    return movies;
  }

  // Movie cast caching
  async getMovieCast(movieId: number, fetchFn: () => Promise<CastMember[]>): Promise<CastMember[]> {
    const key = `movie:cast:${movieId}`;
    const cached = this.cache.get<CastMember[]>(key);
    
    if (cached) {
      console.log(`[Cache] Hit: movie cast ${movieId}`);
      return cached;
    }

    console.log(`[Cache] Miss: movie cast ${movieId}`);
    const cast = await fetchFn();
    this.cache.set(key, cast, MOVIE_CAST_TTL);
    return cast;
  }

  // Movie details caching
  async getMovieDetails(movieId: number, fetchFn: () => Promise<Movie>): Promise<Movie> {
    const key = `movie:details:${movieId}`;
    const cached = this.cache.get<Movie>(key);
    
    if (cached) {
      console.log(`[Cache] Hit: movie details ${movieId}`);
      return cached;
    }

    console.log(`[Cache] Miss: movie details ${movieId}`);
    const movie = await fetchFn();
    this.cache.set(key, movie, MOVIE_DETAILS_TTL);
    return movie;
  }

  // Path result caching (most important for performance)
  getPathResult(actor1Id: number, actor2Id: number): PathResult | undefined {
    // Use sorted IDs to ensure same cache key regardless of order
    const [id1, id2] = [actor1Id, actor2Id].sort((a, b) => a - b);
    const key = `path:${id1}:${id2}`;
    const cached = this.cache.get<PathResult>(key);
    
    if (cached) {
      console.log(`[Cache] Hit: path ${actor1Id} -> ${actor2Id}`);
      return cached;
    }

    console.log(`[Cache] Miss: path ${actor1Id} -> ${actor2Id}`);
    return undefined;
  }

  setPathResult(actor1Id: number, actor2Id: number, result: PathResult): void {
    // Use sorted IDs to ensure same cache key regardless of order
    const [id1, id2] = [actor1Id, actor2Id].sort((a, b) => a - b);
    const key = `path:${id1}:${id2}`;
    this.cache.set(key, result, PATH_RESULT_TTL);
    console.log(`[Cache] Set: path ${actor1Id} -> ${actor2Id}`);
  }

  // Clear all cache (useful for testing or manual invalidation)
  clearCache(): void {
    this.cache.flushAll();
    console.log('[Cache] All cache cleared');
  }

  // Get cache statistics
  getStats() {
    return {
      keys: this.cache.keys().length,
      hits: this.cache.getStats().hits,
      misses: this.cache.getStats().misses,
      ksize: this.cache.getStats().ksize,
      vsize: this.cache.getStats().vsize,
    };
  }
}

export default new CacheService();
