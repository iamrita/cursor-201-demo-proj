import tmdbService from './tmdb';
import { Actor, Movie, PathStep, PathResult, CastMember } from '../types';

interface QueueItem {
  actorId: number;
  path: PathStep[];
}

class PathfinderService {
  constructor() {
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

    // Get initial actor data
    const startActor = await tmdbService.getActorDetails(actor1Id);
    const endActor = await tmdbService.getActorDetails(actor2Id);

    // OPTIMIZATION: Check for direct connection first (same movie)
    // Use parallel checking for faster results
    try {
      const actor1Movies = await tmdbService.getActorFilmography(actor1Id);
      console.log(`[Pathfinder] Checking ${actor1Movies.length} movies for direct connection between ${startActor.name} (${actor1Id}) and ${endActor.name} (${actor2Id})...`);
      
      // Check first 30 movies in parallel (faster than sequential)
      const moviesToCheck = actor1Movies.slice(0, 30);
      const checkPromises = moviesToCheck.map(async (movie) => {
        try {
          const cast = await tmdbService.getMovieCast(movie.id);
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
        const enrichedMovie = await this.enrichMovie(foundMovie);
        return {
          path: [
            { type: 'actor', data: startActor },
            { type: 'movie', data: enrichedMovie },
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

    // BFS: Search from actor1 outward until we find actor2
    // Try with optimizations first, then fallback to comprehensive search if needed
    const tryBFS = async (
      maxMoviesPerActor: number,
      maxCastMembers: number,
      maxDepthLimit: number,
      maxIterationsLimit: number
    ): Promise<PathResult | null> => {
      const queue: QueueItem[] = [
        { actorId: actor1Id, path: [] }
      ];
      
      // Track visited actors to avoid cycles
      const visited = new Set<number>();
      visited.add(actor1Id);

      let iterations = 0;
      
      while (queue.length > 0 && iterations < maxIterationsLimit) {
        iterations++;
        const current = queue.shift()!;
        
        // Check depth limit
        const currentDepth = current.path.filter(s => s.type === 'actor').length;
        if (currentDepth >= maxDepthLimit) {
          continue;
        }
        
        // Fetch actor's filmography
        const actorMovies = await tmdbService.getActorFilmography(current.actorId);
        
        // Check up to maxMoviesPerActor movies
        const moviesToCheck = actorMovies.slice(0, maxMoviesPerActor);
        
        // OPTIMIZATION: Process movies in parallel batches
        const batchSize = 5;
        for (let i = 0; i < moviesToCheck.length; i += batchSize) {
          const batch = moviesToCheck.slice(i, i + batchSize);
          
          const batchPromises = batch.map(async (movie) => {
            try {
              const cast = await tmdbService.getMovieCast(movie.id);
              
              // Check up to maxCastMembers cast members
              const topCast = cast.slice(0, maxCastMembers);
              
              // Check if target actor is in this movie's cast
              const targetInCast = topCast.find(c => c.id === actor2Id);
              if (targetInCast) {
                // Found the target actor! Build the path
                const path: PathStep[] = [
                  ...current.path,
                  { type: 'movie', data: movie },
                ];
                
                // Add starting actor if path is empty
                if (current.path.length === 0) {
                  path.unshift({ type: 'actor', data: startActor });
                }
                
                // Add ending actor
                path.push({ type: 'actor', data: endActor });
                
                const degrees = Math.floor(path.filter(s => s.type === 'actor').length) - 1;
                return { path, degrees, found: true };
              }
              
              // Add unvisited cast members to queue
              for (const castMember of topCast) {
                if (castMember.id === current.actorId || visited.has(castMember.id)) {
                  continue;
                }
                
                const newPath: PathStep[] = [
                  ...current.path,
                  { type: 'movie', data: movie },
                ];
                
                // Add current actor if path is empty
                if (current.path.length === 0) {
                  newPath.unshift({ type: 'actor', data: startActor });
                }

                // Add next actor to path
                const nextActor = await tmdbService.getActorDetails(castMember.id);
                newPath.push({ type: 'actor', data: nextActor });

                visited.add(castMember.id);
                queue.push({
                  actorId: castMember.id,
                  path: newPath,
                });
              }
              
              return { found: false };
            } catch (error: any) {
              console.error(`Error loading cast for movie ${movie.id}:`, error.message);
              return { found: false };
            }
          });
          
          const batchResults = await Promise.all(batchPromises);
          
          // Check if any path was found
          const foundPath = batchResults.find(r => r.found === true);
          if (foundPath && foundPath.found && foundPath.path && foundPath.degrees !== undefined) {
            const finalPath = await this.buildFinalPath(foundPath.path);
            return { path: finalPath, degrees: foundPath.degrees };
          }
        }
      }

      // No path found in this attempt
      return null;
    };
    
    // Phase 1: Fast search with optimizations
    console.log(`[Pathfinder] Starting fast BFS (30 movies, 20 cast, depth 4)...`);
    let result = await tryBFS(30, 20, 4, 250);
    if (result) {
      return result;
    }
    
    // Phase 2: More comprehensive search if fast search failed
    console.log(`[Pathfinder] Fast search found no path, trying comprehensive search (all movies, all cast, depth 6)...`);
    result = await tryBFS(100, 100, 6, 1000);
    if (result) {
      return result;
    }
    
    // Phase 3: Final attempt with very relaxed constraints
    console.log(`[Pathfinder] Comprehensive search found no path, trying exhaustive search (all movies, all cast, depth 8)...`);
    result = await tryBFS(500, 500, 8, 2000);
    if (result) {
      return result;
    }

    // No path found after all attempts
    console.log(`[Pathfinder] ❌ No path found after exhaustive search`);
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
          const actor = await tmdbService.getActorDetails(actorData.id);
          finalPath.push({ type: 'actor', data: actor });
        } else {
          // It's already a full Actor object
          finalPath.push(step);
        }
      } else {
        const movieData = step.data as Movie;
        const enrichedMovie = await this.enrichMovie(movieData);
        finalPath.push({ type: 'movie', data: enrichedMovie });
      }
    }
    return finalPath;
  }

  private async enrichMovie(movie: Movie): Promise<Movie> {
    if (movie.imdb_id) {
      return movie;
    }

    try {
      const movieDetails = await tmdbService.getMovieDetails(movie.id);
      return {
        ...movie,
        imdb_id: movieDetails.imdb_id || movie.imdb_id,
        poster_path: movie.poster_path || movieDetails.poster_path,
        release_date: movie.release_date || movieDetails.release_date,
        title: movie.title || movieDetails.title,
      };
    } catch (error: any) {
      console.error(`[Pathfinder] Error enriching movie ${movie.id}:`, error.message || error);
      return movie;
    }
  }

}

export default new PathfinderService();

