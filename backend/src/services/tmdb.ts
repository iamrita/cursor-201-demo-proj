import axios from 'axios';
import { Actor, Movie, CastMember } from '../types';
import cache from './cache';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// Cache TTL constants (in milliseconds)
const CACHE_TTL = {
  SEARCH: 3600000,        // 1 hour - search results can change
  ACTOR_DETAILS: 86400000, // 24 hours - actor info rarely changes
  FILMOGRAPHY: 43200000,   // 12 hours - filmography can change but not frequently
  MOVIE_CAST: 43200000,    // 12 hours - cast can change but not frequently
  MOVIE_DETAILS: 86400000, // 24 hours - movie info rarely changes
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
    return cache.getOrSet(
      'searchActors',
      async () => {
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

        return response.results.map(actor => ({
          id: actor.id,
          name: actor.name,
          profile_path: actor.profile_path || undefined,
          known_for: actor.known_for,
        }));
      },
      CACHE_TTL.SEARCH,
      query.toLowerCase().trim()
    );
  }

  async getActorDetails(actorId: number): Promise<Actor> {
    return cache.getOrSet(
      'actorDetails',
      async () => {
        const actor = await this.request<{
          id: number;
          name: string;
          profile_path: string | null;
        }>(`/person/${actorId}`);

        return {
          id: actor.id,
          name: actor.name,
          profile_path: actor.profile_path || undefined,
        };
      },
      CACHE_TTL.ACTOR_DETAILS,
      actorId
    );
  }

  async getActorFilmography(actorId: number): Promise<Movie[]> {
    return cache.getOrSet(
      'actorFilmography',
      async () => {
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
        return movies;
      },
      CACHE_TTL.FILMOGRAPHY,
      actorId
    );
  }

  async getMovieCast(movieId: number): Promise<CastMember[]> {
    return cache.getOrSet(
      'movieCast',
      async () => {
        const response = await this.request<{
          cast: Array<{
            id: number;
            name: string;
            character: string | null;
            order: number;
          }>;
        }>(`/movie/${movieId}/credits`);

        return response.cast.map(member => ({
          id: member.id,
          name: member.name,
          character: member.character || undefined,
          order: member.order,
        }));
      },
      CACHE_TTL.MOVIE_CAST,
      movieId
    );
  }

  async getMovieDetails(movieId: number): Promise<Movie> {
    return cache.getOrSet(
      'movieDetails',
      async () => {
        const movie = await this.request<{
          id: number;
          title: string;
          release_date: string | null;
          poster_path: string | null;
        }>(`/movie/${movieId}`);

        return {
          id: movie.id,
          title: movie.title,
          release_date: movie.release_date || undefined,
          poster_path: movie.poster_path || undefined,
        };
      },
      CACHE_TTL.MOVIE_DETAILS,
      movieId
    );
  }
}

export default new TMDBService();

