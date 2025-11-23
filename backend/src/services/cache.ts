import { Actor, Movie, CastMember, PathResult } from '../types';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

type CacheKey = string;

class CacheService {
  private cache: Map<CacheKey, CacheEntry<any>>;
  
  // TTL in milliseconds
  private readonly TTL = {
    ACTOR_DETAILS: 24 * 60 * 60 * 1000, // 24 hours - actor details rarely change
    ACTOR_FILMOGRAPHY: 7 * 24 * 60 * 60 * 1000, // 7 days - filmography changes infrequently
    MOVIE_CAST: 7 * 24 * 60 * 60 * 1000, // 7 days - cast rarely changes
    MOVIE_DETAILS: 30 * 24 * 60 * 60 * 1000, // 30 days - movie details don't change
    ACTOR_SEARCH: 60 * 60 * 1000, // 1 hour - search results can change
    PATH_RESULT: 60 * 60 * 1000, // 1 hour - paths might change as new movies are added
  };

  constructor() {
    this.cache = new Map();
    
    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  private getKey(prefix: string, ...parts: (string | number)[]): CacheKey {
    return `${prefix}:${parts.join(':')}`;
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() > entry.expiresAt;
  }

  get<T>(key: CacheKey): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: CacheKey, data: T, ttl: number): void {
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, { data, expiresAt });
  }

  delete(key: CacheKey): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  // TMDB API cache methods
  getActorDetails(actorId: number): Actor | null {
    return this.get<Actor>(this.getKey('actor', actorId));
  }

  setActorDetails(actorId: number, actor: Actor): void {
    this.set(this.getKey('actor', actorId), actor, this.TTL.ACTOR_DETAILS);
  }

  getActorFilmography(actorId: number): Movie[] | null {
    return this.get<Movie[]>(this.getKey('filmography', actorId));
  }

  setActorFilmography(actorId: number, movies: Movie[]): void {
    this.set(this.getKey('filmography', actorId), movies, this.TTL.ACTOR_FILMOGRAPHY);
  }

  getMovieCast(movieId: number): CastMember[] | null {
    return this.get<CastMember[]>(this.getKey('cast', movieId));
  }

  setMovieCast(movieId: number, cast: CastMember[]): void {
    this.set(this.getKey('cast', movieId), cast, this.TTL.MOVIE_CAST);
  }

  getMovieDetails(movieId: number): Movie | null {
    return this.get<Movie>(this.getKey('movie', movieId));
  }

  setMovieDetails(movieId: number, movie: Movie): void {
    this.set(this.getKey('movie', movieId), movie, this.TTL.MOVIE_DETAILS);
  }

  getActorSearch(query: string): Actor[] | null {
    // Normalize query for cache key (lowercase, trim)
    const normalizedQuery = query.toLowerCase().trim();
    return this.get<Actor[]>(this.getKey('search', normalizedQuery));
  }

  setActorSearch(query: string, actors: Actor[]): void {
    const normalizedQuery = query.toLowerCase().trim();
    this.set(this.getKey('search', normalizedQuery), actors, this.TTL.ACTOR_SEARCH);
  }

  // Pathfinder cache methods
  getPath(actor1Id: number, actor2Id: number): PathResult | null {
    // Ensure consistent key ordering (smaller ID first)
    const [id1, id2] = actor1Id < actor2Id ? [actor1Id, actor2Id] : [actor2Id, actor1Id];
    return this.get<PathResult>(this.getKey('path', id1, id2));
  }

  setPath(actor1Id: number, actor2Id: number, result: PathResult): void {
    // Ensure consistent key ordering (smaller ID first)
    const [id1, id2] = actor1Id < actor2Id ? [actor1Id, actor2Id] : [actor2Id, actor1Id];
    this.set(this.getKey('path', id1, id2), result, this.TTL.PATH_RESULT);
  }

  // Get cache statistics (useful for monitoring)
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

export default new CacheService();
