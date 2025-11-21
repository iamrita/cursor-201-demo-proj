import { Router, Request, Response } from 'express';
import tmdbService from '../services/tmdb';
import pathfinderService from '../services/pathfinder';

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

    const result = await pathfinderService.findPath(actor1Id, actor2Id);
    res.json(result);
  } catch (error: any) {
    console.error('Error finding path:', error);
    
    if (error.message === 'No path found between the two actors') {
      return res.status(404).json({ 
        error: 'No path found',
        message: error.message 
      });
    }

    res.status(500).json({ 
      error: 'Failed to find path',
      message: error.message 
    });
  }
});

export default router;

