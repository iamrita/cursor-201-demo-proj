import { Router, Request, Response } from 'express';
import tmdbService from '../services/tmdb';
import pathfinderService from '../services/pathfinder';
import { actorCache, movieCache, filmographyCache, castCache, searchCache } from '../services/cache';

const router = Router();

// Search actors
router.get('/search', async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const actors = await tmdbService.searchActors(query);
    res.json(actors);
  } catch (error: any) {
    console.error('Error searching actors:', error);
    res.status(500).json({ 
      error: 'Failed to search actors',
      message: error.message 
    });
  }
});

// Find path between two actors
router.post('/path', async (req: Request, res: Response) => {
  try {
    const { actor1Id, actor2Id } = req.body;

    if (!actor1Id || !actor2Id) {
      return res.status(400).json({ 
        error: 'Both actor1Id and actor2Id are required' 
      });
    }

    if (typeof actor1Id !== 'number' || typeof actor2Id !== 'number') {
      return res.status(400).json({ 
        error: 'actor1Id and actor2Id must be numbers' 
      });
    }

    const startTime = Date.now();
    try {
      const result = await pathfinderService.findPath(actor1Id, actor2Id);
      const endTime = Date.now();
      const backendDurationMs = endTime - startTime;

      res.json({
        ...result,
        backendDurationMs,
      });
    } catch (pathError: any) {
      const endTime = Date.now();
      const backendDurationMs = endTime - startTime;
      
      console.error('Error finding path:', pathError);
      
      if (pathError.message === 'No path found between the two actors') {
        return res.status(404).json({ 
          error: 'No path found',
          message: pathError.message,
          backendDurationMs,
        });
      }

      res.status(500).json({ 
        error: 'Failed to find path',
        message: pathError.message,
        backendDurationMs,
      });
    }
  } catch (error: any) {
    console.error('Error in path route:', error);
    res.status(500).json({ 
      error: 'Failed to find path',
      message: error.message 
    });
  }
});

// Cache statistics endpoint
router.get('/cache/stats', (req: Request, res: Response) => {
  try {
    const stats = {
      actor: actorCache.getStats(),
      movie: movieCache.getStats(),
      filmography: filmographyCache.getStats(),
      cast: castCache.getStats(),
      search: searchCache.getStats(),
    };
    res.json(stats);
  } catch (error: any) {
    console.error('Error getting cache stats:', error);
    res.status(500).json({ 
      error: 'Failed to get cache stats',
      message: error.message 
    });
  }
});

export default router;

