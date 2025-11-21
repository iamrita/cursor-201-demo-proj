import tmdbService from './tmdb';
import { Actor, Movie, PathStep, PathResult } from '../types';

interface QueueItem {
  actorId: number;
  path: PathStep[];
}

class PathfinderService {
  constructor() {
    // No caching - fetch fresh data each time
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
    // This will catch cases like Kate Winslet + Leonardo DiCaprio in Titanic
    try {
      const actor1Movies = await tmdbService.getActorFilmography(actor1Id);
      console.log(`[Pathfinder] Checking ${actor1Movies.length} movies for direct connection between ${startActor.name} (${actor1Id}) and ${endActor.name} (${actor2Id})...`);
      
      for (const movie of actor1Movies.slice(0, 20)) { // Check first 20 movies for speed
        try {
          console.log(`[Pathfinder] Checking movie: ${movie.title} (${movie.id})`);
          const cast = await tmdbService.getMovieCast(movie.id);
          console.log(`[Pathfinder] Movie ${movie.title} has ${cast.length} cast members`);
          
          const targetInCast = cast.find(c => c.id === actor2Id);
          
          if (targetInCast) {
            console.log(`[Pathfinder] ✅ Direct connection found! ${startActor.name} and ${endActor.name} both in ${movie.title}`);
            // Direct connection found!
            return {
              path: [
                { type: 'actor', data: startActor },
                { type: 'movie', data: movie },
                { type: 'actor', data: endActor },
              ],
              degrees: 1,
            };
          }
        } catch (error: any) {
          console.error(`[Pathfinder] Error checking movie ${movie.title}:`, error.message || error);
          // Continue checking other movies
          continue;
        }
      }
      console.log(`[Pathfinder] No direct connection found in first 20 movies, trying BFS...`);
    } catch (error: any) {
      console.error('[Pathfinder] Error checking for direct connection:', error.message || error);
      // Continue with BFS
    }

    // BFS to find shortest path
    const queue: QueueItem[] = [
      { actorId: actor1Id, path: [] }
    ];
    const visited = new Set<number>();
    visited.add(actor1Id);

    let iterations = 0;
    const maxIterations = 1000; // Safety limit
    
    while (queue.length > 0 && iterations < maxIterations) {
      iterations++;
      const current = queue.shift()!;
      
      // Fetch actor's filmography (no caching)
      const actorMovies = await tmdbService.getActorFilmography(current.actorId);
      console.log(`[Pathfinder] BFS iteration ${iterations}: Checking ${actorMovies.length} movies for actor ID ${current.actorId}`);
      
      // Check each movie this actor was in
      for (const movie of actorMovies) {
        const movieId = movie.id;

        // Get cast of this movie
        try {
          const cast = await tmdbService.getMovieCast(movieId);
          
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
                { type: 'movie', data: movie },
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
        } catch (error: any) {
          // Skip movies that fail to load, but log more details
          console.error(`Error loading cast for movie ${movieId} (${movie.title}):`, error.message || error);
          // Don't skip silently - this could be why we're missing connections
          continue;
        }
      }
    }

    // No path found
    console.log(`[Pathfinder] ❌ No path found after ${iterations} iterations. Queue length: ${queue.length}`);
    throw new Error('No path found between the two actors');
  }

}

export default new PathfinderService();

