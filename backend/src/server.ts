// Load environment variables FIRST (must be before other imports)
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import actorsRouter from './routes/actors';
import cacheService from './services/cache';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Six Degrees API is running' });
});

// Cache stats endpoint
app.get('/cache/stats', (req, res) => {
  const stats = cacheService.getStats();
  res.json({
    cacheSize: stats.size,
    cachedKeys: stats.keys,
  });
});

// Clear cache endpoint (useful for testing/debugging)
app.post('/cache/clear', (req, res) => {
  cacheService.clear();
  res.json({ message: 'Cache cleared successfully' });
});

// API routes
app.use('/api', actorsRouter);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📡 API endpoints available at http://localhost:${PORT}/api`);
});

