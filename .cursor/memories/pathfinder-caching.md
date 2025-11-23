# Pathfinder Backend Caching Implementation

## Overview
Added comprehensive backend caching to the pathfinder service to improve performance, especially for repeated queries.

## Implementation Details

### Cache Service (`backend/src/services/cache.ts`)
- **Native Map-based caching** with TTL support (no external dependencies)
- Caches:
  - Actor details: 24 hour TTL
  - Actor filmography: 1 hour TTL
  - Movie cast: 1 hour TTL
  - Movie details: 24 hour TTL
  - **Path results: 1 hour TTL** (most important optimization)
- Automatic cleanup of expired entries every 10 minutes
- Uses `CacheEntry<T>` interface with `data` and `expiresAt` timestamp

### Pathfinder Integration (`backend/src/services/pathfinder.ts`)
- Path result caching checked at start of `findPath()` method
- All computed paths are cached for future requests
- Cache-aware methods for actor details, filmography, and movie cast
- Path cache keys use sorted actor IDs to ensure same key regardless of order

### API Endpoints (`backend/src/routes/actors.ts`)
- `GET /api/cache/stats` - View cache statistics
- `POST /api/cache/clear` - Manually clear cache

## Performance Notes
- Initial implementation used `node-cache` library but was slower due to overhead
- Optimized to use native JavaScript `Map` objects for faster lookups
- Removed excessive logging that was adding overhead
- Cache hits are near-instant (direct Map lookup)
- Most significant performance gain comes from caching entire path results

## Key Files Modified
- `backend/src/services/cache.ts` (new file)
- `backend/src/services/pathfinder.ts` (updated)
- `backend/src/routes/actors.ts` (added cache endpoints)
