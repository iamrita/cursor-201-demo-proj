import tmdbService from './tmdb';
import { Actor, Movie, PathStep, PathResult, CastMember } from '../types';

interface QueueItem {
  actorId: number;
  path: PathStep[];
}

class PathfinderService {
  private actorFilmographyCache: Map<number, Movie[]>;
  private actorDetailsCache: Map<number, Actor>;
  private movieCastCache: Map<number, CastMember[]>;
  private movieDetailsCache: Map<number, Movie>;

  constructor() {
    this.actorFilmographyCache = new Map();
    this.actorDetailsCache = new Map();
    this.movieCastCache = new Map();
    this.movieDetailsCache = new Map();
  }

  // Clear cache (useful for testing or if you want fresh data)
  clearCache() {
    this.actorFilmographyCache.clear();
    this.actorDetailsCache.clear();
    this.movieCastCache.clear();
    this.movieDetailsCache.clear();
  }

  private async getCachedActorDetails(actorId: number): Promise<Actor> {
    if (this.actorDetailsCache.has(actorId)) {
      return this.actorDetailsCache.get(actorId)!;
    }
    const actor = await tmdbService.getActorDetails(actorId);
    this.actorDetailsCache.set(actorId, actor);
    return actor;
  }

  private async getCachedActorFilmography(actorId: number): Promise<Movie[]> {
    if (this.actorFilmographyCache.has(actorId)) {
      return this.actorFilmographyCache.get(actorId)!;
    }
    const movies = await tmdbService.getActorFilmography(actorId);
    this.actorFilmographyCache.set(actorId, movies);
    return movies;
  }

  private async getCachedMovieCast(movieId: number): Promise<CastMember[]> {
    if (this.movieCastCache.has(movieId)) {
      return this.movieCastCache.get(movieId)!;
    }
    const cast = await tmdbService.getMovieCast(movieId);
    this.movieCastCache.set(movieId, cast);
    return cast;
  }

  async findPath(actor1Id: number, actor2Id: number): Promise<PathResult> {
    // Handle edge case: same actor
    if (actor1Id === actor2Id) {
      const actor = await this.getCachedActorDetails(actor1Id);
      return {
        path: [{ type: 'actor', data: actor }],
        degrees: 0,
      };
    }

    // Get initial actor data (cached)
    const startActor = await this.getCachedActorDetails(actor1Id);
    const endActor = await this.getCachedActorDetails(actor2Id);

    // OPTIMIZATION: Check for direct connection first (same movie)
    // Use parallel checking for faster results
    try {
      const actor1Movies = await this.getCachedActorFilmography(actor1Id);
      console.log(`[Pathfinder] Checking ${actor1Movies.length} movies for direct connection between ${startActor.name} (${actor1Id}) and ${endActor.name} (${actor2Id})...`);
      
      // Check first 30 movies in parallel (faster than sequential)
      const moviesToCheck = actor1Movies.slice(0, 30);
      const checkPromises = moviesToCheck.map(async (movie) => {
        try {
          const cast = await this.getCachedMovieCast(movie.id);
          const targetInCast = cast.find(c => c.id === actor2Id);
          return targetInCast ? movie : null;
        } catch (error: any) {
          console.error(`[Pathfinder] Error checking movie ${movie.title}:`, error.message);
          return null;
        }
      });
      
      const results = await Promise.all(checkPromises);
      const foundMovie = results.find(m => m !== null);
      
      if (foundMovie) {
        console.log(`[Pathfinder] ✅ Direct connection found! ${startActor.name} and ${endActor.name} both in ${foundMovie.title}`);
        return {
          path: [
            { type: 'actor', data: startActor },
            { type: 'movie', data: foundMovie },
            { type: 'actor', data: endActor },
          ],
          degrees: 1,
        };
      }
      console.log(`[Pathfinder] No direct connection found in first 30 movies, trying BFS...`);
    } catch (error: any) {
      console.error('[Pathfinder] Error checking for direct connection:', error.message || error);
      // Continue with BFS
    }

    // BFS with optimizations
    const queue: QueueItem[] = [
      { actorId: actor1Id, path: [] }
    ];
    const visited = new Set<number>();
    visited.add(actor1Id);

    let iterations = 0;
    const maxIterations = 500; // Reduced from 1000 for faster termination
    const maxDepth = 4; // Limit to 4 degrees of separation
    
    while (queue.length > 0 && iterations < maxIterations) {
      iterations++;
      const current = queue.shift()!;
      
      // Check depth limit
      const currentDepth = current.path.filter(s => s.type === 'actor').length;
      if (currentDepth >= maxDepth) {
        continue; // Skip if too deep
      }
      
      // Fetch actor's filmography (cached)
      const actorMovies = await this.getCachedActorFilmography(current.actorId);
      console.log(`[Pathfinder] BFS iteration ${iterations}: Checking ${actorMovies.length} movies for actor ID ${current.actorId}`);
      
      // OPTIMIZATION: Only check top 30 movies per actor (most recent/popular)
      const moviesToCheck = actorMovies.slice(0, 30);
      
      // OPTIMIZATION: Process movies in parallel batches for speed
      const batchSize = 5;
      for (let i = 0; i < moviesToCheck.length; i += batchSize) {
        const batch = moviesToCheck.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (movie): Promise<{ path?: PathStep[]; degrees?: number; found: boolean; newActors?: number[]; movie?: Movie }> => {
          try {
            const cast = await this.getCachedMovieCast(movie.id);
            
            // Check if target actor is in this movie
            const targetActorInCast = cast.find(c => c.id === actor2Id);
            if (targetActorInCast) {
              console.log(`[Pathfinder] ✅ Path found! ${endActor.name} is in ${movie.title}`);
              // Found the path!
              const path: PathStep[] = [
                ...current.path,
                { type: 'movie', data: movie },
                { type: 'actor', data: endActor },
              ];
              
              if (current.path.length === 0) {
                path.unshift({ type: 'actor', data: startActor });
              }

              const degrees = Math.floor(path.filter(s => s.type === 'actor').length) - 1;
              return { path, degrees, found: true };
            }

            // OPTIMIZATION: Only add top 20 cast members to queue (by order/importance)
            const topCast = cast.slice(0, 20);
            
            // Add actors to queue
            const newActors: number[] = [];
            for (const castMember of topCast) {
              if (!visited.has(castMember.id) && castMember.id !== current.actorId) {
                visited.add(castMember.id);
                newActors.push(castMember.id);
              }
            }
            
            return { newActors, movie, found: false };
          } catch (error: any) {
            console.error(`Error loading cast for movie ${movie.id}:`, error.message);
            return { newActors: [], movie, found: false };
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        
        // Check if any path was found
        const foundPath = batchResults.find(r => r.found === true && r.path && r.degrees !== undefined);
        if (foundPath && foundPath.path && foundPath.degrees !== undefined) {
          // Build final path with all actor details
          const finalPath = await this.buildFinalPath(foundPath.path);
          return { path: finalPath, degrees: foundPath.degrees };
        }
        
        // Add new actors to queue
        for (const result of batchResults) {
          if (!result.found && 'newActors' in result && result.newActors && result.newActors.length > 0 && 'movie' in result && result.movie) {
            for (const actorId of result.newActors) {
              const newPath: PathStep[] = [
                ...current.path,
                { type: 'movie', data: result.movie },
              ];
              
              // Add current actor if path is empty
              if (current.path.length === 0) {
                const currentActorData = current.actorId === actor1Id 
                  ? startActor 
                  : await this.getCachedActorDetails(current.actorId);
                newPath.unshift({ type: 'actor', data: currentActorData });
              }

              // Add next actor to path
              const nextActor = await this.getCachedActorDetails(actorId);
              newPath.push({ type: 'actor', data: nextActor });

              queue.push({
                actorId: actorId,
                path: newPath,
              });
            }
          }
        }
      }
    }

    // No path found
    console.log(`[Pathfinder] ❌ No path found after ${iterations} iterations. Queue length: ${queue.length}`);
    throw new Error('No path found between the two actors');
  }

  // Helper method to build final path with actor details
  private async buildFinalPath(path: PathStep[]): Promise<PathStep[]> {
    const finalPath: PathStep[] = [];
    for (const step of path) {
      if (step.type === 'actor') {
        // If it's already an Actor object, use it; otherwise fetch by ID
        const actorData = step.data as any;
        if (actorData.id && !actorData.name) {
          // It's just an ID, fetch the actor
          const actor = await this.getCachedActorDetails(actorData.id);
          finalPath.push({ type: 'actor', data: actor });
        } else {
          // It's already a full Actor object
          finalPath.push(step);
        }
      } else {
        finalPath.push(step);
      }
    }
    return finalPath;
  }

}

export default new PathfinderService();

