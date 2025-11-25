import axios from 'axios';
import { Actor, Movie, CastMember } from '../types';
import cache from './cache';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// Cache TTLs (in milliseconds)
const CACHE_TTL = {
  SEARCH: 3600000,        // 1 hour - search results can change
  ACTOR_DETAILS: 86400000,    // 24 hours - actor info is stable
  FILMOGRAPHY: 86400000,      // 24 hours - filmography is stable
  MOVIE_CAST: 86400000,       // 24 hours - cast doesn't change
  MOVIE_DETAILS: 86400000,    // 24 hours - movie info is stable
};

class TMDBService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.TMDB_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('TMDB_API_KEY environment variable is required');
    }
  }

  private async request<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
    try {
      const response = await axios.get<T>(`${TMDB_BASE_URL}${endpoint}`, {
        params: {
          api_key: this.apiKey,
          ...params,
        },
      });
      
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 429) {
        // Rate limited - wait a bit and retry
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.request<T>(endpoint, params);
      }
      throw error;
    }
  }

  async searchActors(query: string): Promise<Actor[]> {
    const cacheKey = `search:${query.toLowerCase().trim()}`;
    
    // Check cache first
    const cached = cache.get<Actor[]>(cacheKey);
    if (cached !== null) {
      console.log(`[Cache] Hit for actor search: "${query}"`);
      return cached;
    }

    console.log(`[Cache] Miss for actor search: "${query}"`);
    const response = await this.request<{
      results: Array<{
        id: number;
        name: string;
        profile_path: string | null;
        known_for: Array<{
          title?: string;
          name?: string;
          media_type: string;
        }>;
      }>;
    }>('/search/person', { query });

    const actors = response.results.map(actor => ({
      id: actor.id,
      name: actor.name,
      profile_path: actor.profile_path || undefined,
      known_for: actor.known_for,
    }));

    // Cache the results
    cache.set(cacheKey, actors, CACHE_TTL.SEARCH);
    return actors;
  }

  async getActorDetails(actorId: number): Promise<Actor> {
    const cacheKey = `actor:${actorId}`;
    
    // Check cache first
    const cached = cache.get<Actor>(cacheKey);
    if (cached !== null) {
      console.log(`[Cache] Hit for actor details: ${actorId}`);
      return cached;
    }

    console.log(`[Cache] Miss for actor details: ${actorId}`);
    const actor = await this.request<{
      id: number;
      name: string;
      profile_path: string | null;
    }>(`/person/${actorId}`);

    const actorDetails: Actor = {
      id: actor.id,
      name: actor.name,
      profile_path: actor.profile_path || undefined,
    };

    // Cache the result
    cache.set(cacheKey, actorDetails, CACHE_TTL.ACTOR_DETAILS);
    return actorDetails;
  }

  async getActorFilmography(actorId: number): Promise<Movie[]> {
    const cacheKey = `filmography:${actorId}`;
    
    // Check cache first
    const cached = cache.get<Movie[]>(cacheKey);
    if (cached !== null) {
      console.log(`[Cache] Hit for actor filmography: ${actorId}`);
      return cached;
    }

    console.log(`[Cache] Miss for actor filmography: ${actorId}`);
    const response = await this.request<{
      cast: Array<{
        id: number;
        title: string;
        release_date: string | null;
        poster_path: string | null;
        media_type?: string;
      }>;
    }>(`/person/${actorId}/movie_credits`);

    console.log(`[TMDB] Filmography response for actor ${actorId}: ${response.cast.length} items`);
    if (response.cast.length > 0) {
      console.log(`[TMDB] First item sample:`, JSON.stringify(response.cast[0], null, 2));
    }

    // The /movie_credits endpoint should only return movies, but filter just in case
    // If media_type is not present, assume it's a movie (since we're using movie_credits endpoint)
    const movies = response.cast
      .filter(item => {
        // If media_type exists, it must be 'movie', otherwise assume it's a movie
        const isMovie = !item.media_type || item.media_type === 'movie';
        const hasTitle = !!item.title;
        return isMovie && hasTitle;
      })
      .map(item => ({
        id: item.id,
        title: item.title,
        release_date: item.release_date || undefined,
        poster_path: item.poster_path || undefined,
      }));

    console.log(`[TMDB] Filtered to ${movies.length} movies`);
    
    // Cache the results
    cache.set(cacheKey, movies, CACHE_TTL.FILMOGRAPHY);
    return movies;
  }

  async getMovieCast(movieId: number): Promise<CastMember[]> {
    const cacheKey = `movie_cast:${movieId}`;
    
    // Check cache first
    const cached = cache.get<CastMember[]>(cacheKey);
    if (cached !== null) {
      console.log(`[Cache] Hit for movie cast: ${movieId}`);
      return cached;
    }

    console.log(`[Cache] Miss for movie cast: ${movieId}`);
    const response = await this.request<{
      cast: Array<{
        id: number;
        name: string;
        character: string | null;
        order: number;
      }>;
    }>(`/movie/${movieId}/credits`);

    const cast = response.cast.map(member => ({
      id: member.id,
      name: member.name,
      character: member.character || undefined,
      order: member.order,
    }));

    // Cache the results
    cache.set(cacheKey, cast, CACHE_TTL.MOVIE_CAST);
    return cast;
  }

  async getMovieDetails(movieId: number): Promise<Movie> {
    const cacheKey = `movie:${movieId}`;
    
    // Check cache first
    const cached = cache.get<Movie>(cacheKey);
    if (cached !== null) {
      console.log(`[Cache] Hit for movie details: ${movieId}`);
      return cached;
    }

    console.log(`[Cache] Miss for movie details: ${movieId}`);
    const movie = await this.request<{
      id: number;
      title: string;
      release_date: string | null;
      poster_path: string | null;
    }>(`/movie/${movieId}`);

    const movieDetails: Movie = {
      id: movie.id,
      title: movie.title,
      release_date: movie.release_date || undefined,
      poster_path: movie.poster_path || undefined,
    };

    // Cache the result
    cache.set(cacheKey, movieDetails, CACHE_TTL.MOVIE_DETAILS);
    return movieDetails;
  }
}

export default new TMDBService();

