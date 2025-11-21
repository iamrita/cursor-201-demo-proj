import tmdbService from './tmdb';
import { Actor, Movie, PathStep, PathResult } from '../types';

interface GraphNode {
  actorId: number;
  actorName: string;
  movies: number[];
}

interface QueueItem {
  actorId: number;
  path: PathStep[];
}

class PathfinderService {
  private actorCache: Map<number, GraphNode>;
  private movieCache: Map<number, Movie>;

  constructor() {
    this.actorCache = new Map();
    this.movieCache = new Map();
  }

  async findPath(actor1Id: number, actor2Id: number): Promise<PathResult> {
    // Handle edge case: same actor
    if (actor1Id === actor2Id) {
      const actor = await tmdbService.getActorDetails(actor1Id);
      return {
        path: [{ type: 'actor', data: actor }],
        degrees: 0,
      };
    }

    // BFS to find shortest path
    const queue: QueueItem[] = [
      { actorId: actor1Id, path: [] }
    ];
    const visited = new Set<number>();
    visited.add(actor1Id);

    // Get initial actor data
    const startActor = await tmdbService.getActorDetails(actor1Id);
    const endActor = await tmdbService.getActorDetails(actor2Id);

    while (queue.length > 0) {
      const current = queue.shift()!;
      
      // Get or cache actor's movies
      let node = this.actorCache.get(current.actorId);
      if (!node) {
        const movies = await tmdbService.getActorFilmography(current.actorId);
        node = {
          actorId: current.actorId,
          actorName: current.actorId === actor1Id ? startActor.name : 
                     current.actorId === actor2Id ? endActor.name : 
                     (await tmdbService.getActorDetails(current.actorId)).name,
          movies: movies.map(m => m.id),
        };
        this.actorCache.set(current.actorId, node);
      }

      // Check each movie this actor was in
      for (const movieId of node.movies) {
        // Get or cache movie data
        let movie = this.movieCache.get(movieId);
        if (!movie) {
          // Try to get from actor's filmography first
          const movies = await tmdbService.getActorFilmography(current.actorId);
          const foundMovie = movies.find(m => m.id === movieId);
          if (foundMovie) {
            movie = foundMovie;
            this.movieCache.set(movieId, movie);
          } else {
            // Fallback: fetch movie details directly
            try {
              movie = await tmdbService.getMovieDetails(movieId);
              this.movieCache.set(movieId, movie);
            } catch {
              // Skip movies that can't be loaded
              continue;
            }
          }
        }

        // Get cast of this movie
        try {
          const cast = await tmdbService.getMovieCast(movieId);
          
          // Check if target actor is in this movie
          const targetActorInCast = cast.find(c => c.id === actor2Id);
          if (targetActorInCast) {
            // Found the path!
            const path: PathStep[] = [
              ...current.path,
              { type: 'movie', data: movie! },
              { type: 'actor', data: endActor },
            ];
            
            // Add starting actor if path is empty
            if (current.path.length === 0) {
              path.unshift({ type: 'actor', data: startActor });
            }

            const degrees = Math.floor(path.filter(s => s.type === 'actor').length) - 1;
            return { path, degrees };
          }

          // Add all actors from this movie to queue (if not visited)
          for (const castMember of cast) {
            if (!visited.has(castMember.id) && castMember.id !== current.actorId) {
              visited.add(castMember.id);
              
              const newPath: PathStep[] = [
                ...current.path,
                { type: 'movie', data: movie! },
              ];
              
              // Add current actor if path is empty
              if (current.path.length === 0) {
                const currentActorData = current.actorId === actor1Id 
                  ? startActor 
                  : await tmdbService.getActorDetails(current.actorId);
                newPath.unshift({ type: 'actor', data: currentActorData });
              }

              const nextActor = await tmdbService.getActorDetails(castMember.id);
              newPath.push({ type: 'actor', data: nextActor });

              queue.push({
                actorId: castMember.id,
                path: newPath,
              });
            }
          }
        } catch (error) {
          // Skip movies that fail to load
          console.error(`Error loading cast for movie ${movieId}:`, error);
          continue;
        }
      }
    }

    // No path found
    throw new Error('No path found between the two actors');
  }

}

export default new PathfinderService();

