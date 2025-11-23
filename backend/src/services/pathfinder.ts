import tmdbService from './tmdb';
import cacheService from './cache';
import { Actor, Movie, PathStep, PathResult, CastMember } from '../types';

interface QueueItem {
  actorId: number;
  path: PathStep[];
}

class PathfinderService {
  // Clear cache (useful for testing or if you want fresh data)
  clearCache() {
    cacheService.clearCache();
  }

  private async getCachedActorDetails(actorId: number): Promise<Actor> {
    return cacheService.getActorDetails(actorId, () => tmdbService.getActorDetails(actorId));
  }

  private async getCachedActorFilmography(actorId: number): Promise<Movie[]> {
    return cacheService.getActorFilmography(actorId, () => tmdbService.getActorFilmography(actorId));
  }

  private async getCachedMovieCast(movieId: number): Promise<CastMember[]> {
    return cacheService.getMovieCast(movieId, () => tmdbService.getMovieCast(movieId));
  }

  async findPath(actor1Id: number, actor2Id: number): Promise<PathResult> {
    // Check cache first for path result (most important optimization)
    const cachedPath = cacheService.getPathResult(actor1Id, actor2Id);
    if (cachedPath) {
      console.log(`[Pathfinder] ✅ Returning cached path result`);
      return cachedPath;
    }

    // Handle edge case: same actor
    if (actor1Id === actor2Id) {
      const actor = await this.getCachedActorDetails(actor1Id);
      const result: PathResult = {
        path: [{ type: 'actor', data: actor }],
        degrees: 0,
      };
      cacheService.setPathResult(actor1Id, actor2Id, result);
      return result;
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
        const result: PathResult = {
          path: [
            { type: 'actor', data: startActor },
            { type: 'movie', data: foundMovie },
            { type: 'actor', data: endActor },
          ],
          degrees: 1,
        };
        cacheService.setPathResult(actor1Id, actor2Id, result);
        return result;
      }
      console.log(`[Pathfinder] No direct connection found in first 30 movies, trying BFS...`);
    } catch (error: any) {
      console.error('[Pathfinder] Error checking for direct connection:', error.message || error);
      // Continue with BFS
    }

    // BIDIRECTIONAL BFS: Search from both actors simultaneously
    // Try with optimizations first, then fallback to comprehensive search if needed
    const tryBidirectionalBFS = async (
      maxMoviesPerActor: number,
      maxCastMembers: number,
      maxDepthLimit: number,
      maxIterationsLimit: number
    ): Promise<PathResult | null> => {
      const queueForward: QueueItem[] = [
        { actorId: actor1Id, path: [] }
      ];
      const queueBackward: QueueItem[] = [
        { actorId: actor2Id, path: [] }
      ];
      
      // Track visited actors from each direction and their full paths
      const visitedForward = new Map<number, QueueItem>();
      const visitedBackward = new Map<number, QueueItem>();
      
      visitedForward.set(actor1Id, { actorId: actor1Id, path: [] });
      visitedBackward.set(actor2Id, { actorId: actor2Id, path: [] });

      let iterations = 0;
      
      // Helper function to expand from one direction
      const expandDirection = async (
        queue: QueueItem[],
        visited: Map<number, QueueItem>,
        otherVisited: Map<number, QueueItem>,
        isForward: boolean
      ): Promise<PathResult | null> => {
      if (queue.length === 0) return null;
      
      const current = queue.shift()!;
      
      // Check depth limit
      const currentDepth = current.path.filter(s => s.type === 'actor').length;
      if (currentDepth >= maxDepthLimit) {
        return null;
      }
      
      // Fetch actor's filmography (cached)
      const actorMovies = await this.getCachedActorFilmography(current.actorId);
      
      // Check up to maxMoviesPerActor movies
      const moviesToCheck = actorMovies.slice(0, maxMoviesPerActor);
      
      // OPTIMIZATION: Process movies in parallel batches
      const batchSize = 5;
      for (let i = 0; i < moviesToCheck.length; i += batchSize) {
        const batch = moviesToCheck.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (movie) => {
          try {
            const cast = await this.getCachedMovieCast(movie.id);
            
            // Check up to maxCastMembers cast members
            const topCast = cast.slice(0, maxCastMembers);
            
            // Check if any cast member has been visited from the other direction
            for (const castMember of topCast) {
              if (castMember.id === current.actorId) continue;
              
              // Check if this actor was reached from the other direction
              if (otherVisited.has(castMember.id)) {
                // Found meeting point! Combine paths
                const otherQueueItem = otherVisited.get(castMember.id)!;
                const pathFromOther = otherQueueItem.path;
                
                // Build path from start to meeting point (current direction)
                const pathToMeeting: PathStep[] = [
                  ...current.path,
                  { type: 'movie', data: movie },
                ];
                
                // Add starting actor if path is empty
                if (current.path.length === 0) {
                  const startActorData = isForward ? startActor : endActor;
                  pathToMeeting.unshift({ type: 'actor', data: startActorData });
                }
                
                // Get the actor details for the meeting point
                const meetingActor = await this.getCachedActorDetails(castMember.id);
                pathToMeeting.push({ type: 'actor', data: meetingActor });
                
                // Build path from meeting point to end (reverse the other path)
                // pathFromOther goes: [otherStart] -> ... -> [meetingActor]
                // We need: [meetingActor] -> ... -> [otherEnd]
                const pathFromMeeting: PathStep[] = [];
                const endActorData = isForward ? endActor : startActor;
                
                // Reverse pathFromOther, skipping the meeting actor and the destination actor
                for (let i = pathFromOther.length - 1; i >= 0; i--) {
                  const step = pathFromOther[i];
                  if (step.type === 'movie') {
                    pathFromMeeting.push(step);
                  } else if (step.type === 'actor') {
                    const actorData = step.data as Actor;
                    // Skip the meeting actor (we already added it) and skip the destination actor (we'll add it at the end)
                    if (actorData.id !== castMember.id && actorData.id !== endActorData.id) {
                      pathFromMeeting.push(step);
                    }
                  }
                }
                
                // Add the ending actor only if there was a path from the other direction
                // If pathFromOther is empty, the meeting point IS the end actor, so don't add it again
                if (pathFromOther.length > 0) {
                  pathFromMeeting.push({ type: 'actor', data: endActorData });
                }
                
                // Combine paths: pathToMeeting + pathFromMeeting
                const combinedPath = [...pathToMeeting, ...pathFromMeeting];
                
                const degrees = Math.floor(combinedPath.filter(s => s.type === 'actor').length) - 1;
                return { path: combinedPath, degrees, found: true };
              }
              
              // Add to queue if not visited in this direction
              if (!visited.has(castMember.id)) {
                const newPath: PathStep[] = [
                  ...current.path,
                  { type: 'movie', data: movie },
                ];
                
                // Add current actor if path is empty
                if (current.path.length === 0) {
                  const currentActorData = isForward 
                    ? startActor 
                    : endActor;
                  newPath.unshift({ type: 'actor', data: currentActorData });
                }

                // Add next actor to path
                const nextActor = await this.getCachedActorDetails(castMember.id);
                newPath.push({ type: 'actor', data: nextActor });

                const newQueueItem: QueueItem = {
                  actorId: castMember.id,
                  path: newPath,
                };
                
                visited.set(castMember.id, newQueueItem);
                queue.push(newQueueItem);
              }
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
      
      return null;
    };
    
    // Alternate expanding from both directions
    while ((queueForward.length > 0 || queueBackward.length > 0) && iterations < maxIterationsLimit) {
      iterations++;
      
      // Expand forward direction
      if (queueForward.length > 0) {
        const result = await expandDirection(
          queueForward,
          visitedForward,
          visitedBackward,
          true
        );
        if (result) {
          console.log(`[Pathfinder] ✅ Path found via bidirectional BFS after ${iterations} iterations!`);
          return result;
        }
      }
      
      // Expand backward direction
      if (queueBackward.length > 0) {
        const result = await expandDirection(
          queueBackward,
          visitedBackward,
          visitedForward,
          false
        );
        if (result) {
          console.log(`[Pathfinder] ✅ Path found via bidirectional BFS after ${iterations} iterations!`);
          return result;
        }
      }
    }

    // No path found in this attempt
    return null;
    };
    
    // Phase 1: Fast search with optimizations
    console.log(`[Pathfinder] Starting fast bidirectional BFS (30 movies, 20 cast, depth 4)...`);
    let result = await tryBidirectionalBFS(30, 20, 4, 250);
    if (result) {
      cacheService.setPathResult(actor1Id, actor2Id, result);
      return result;
    }
    
    // Phase 2: More comprehensive search if fast search failed
    console.log(`[Pathfinder] Fast search found no path, trying comprehensive search (all movies, all cast, depth 6)...`);
    result = await tryBidirectionalBFS(100, 100, 6, 1000);
    if (result) {
      cacheService.setPathResult(actor1Id, actor2Id, result);
      return result;
    }
    
    // Phase 3: Final attempt with very relaxed constraints
    console.log(`[Pathfinder] Comprehensive search found no path, trying exhaustive search (all movies, all cast, depth 8)...`);
    result = await tryBidirectionalBFS(500, 500, 8, 2000);
    if (result) {
      cacheService.setPathResult(actor1Id, actor2Id, result);
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

