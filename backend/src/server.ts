// Load environment variables FIRST (must be before other imports)
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import actorsRouter from './routes/actors';
import cache from './services/cache';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Six Degrees API is running' });
});

// Cache statistics endpoint
app.get('/cache/stats', (req, res) => {
  res.json(cache.getStats());
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

