## 🎯 Performance Benchmark Results

**Test Date:** 2025-11-24T02:28:19.958Z
**API Endpoint:** `POST /api/path`
**Measurement Method:** Similar to `frontend/src/services/performance.ts` (total operation time)

| Actor 1 | Actor 2 | Degrees | Total Duration (ms) | Backend Duration (ms) | Network Duration (ms) | Status |
|---------|---------|---------|---------------------|----------------------|----------------------|--------|
| Kevin Bacon | Tom Hanks | 1 | 823ms | 800ms | 23ms | ✅ |
| Emma Stone | Ryan Gosling | 1 | 577ms | 573ms | 4ms | ✅ |
| Meryl Streep | Robert De Niro | 1 | 645ms | 640ms | 5ms | ✅ |
| Scarlett Johansson | Chris Evans | 1 | 449ms | 445ms | 4ms | ✅ |
| Brad Pitt | Leonardo DiCaprio | 2 | 79134ms | 79129ms | 5ms | ✅ |

### Summary Statistics
- **Average Total Duration:** 16326ms
- **Average Backend Duration:** 16317ms
- **Average Network Duration:** 8ms
- **Success Rate:** 5/5 (100%)
- **Average Degrees:** 1.2

### Performance Breakdown
- **Total Duration:** Complete time from request initiation to response completion (user experience)
- **Backend Duration:** Time spent in server processing (pathfinding + TMDB API calls)
- **Network Duration:** Time spent in network overhead and data transfer

### Notes
- All tests performed against local development server
- Metrics mirror the frontend PerformanceMetrics interface (totalDuration, networkDuration, backendDuration)
- Times may vary based on TMDB API response times and network conditions
- Backend time includes TMDB API calls and pathfinding algorithm execution
