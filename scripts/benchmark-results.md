## 🎯 Performance Benchmark Results

**Test Date:** 2025-11-24T00:10:53.304Z
**API Endpoint:** `POST /api/path`
**Measurement Method:** Similar to `frontend/src/services/performance.ts` (total operation time)

| Actor 1 | Actor 2 | Degrees | Total Duration (ms) | Backend Duration (ms) | Network Duration (ms) | Status |
|---------|---------|---------|---------------------|----------------------|----------------------|--------|
| Kevin Bacon | Tom Hanks | 1 | 1188ms | 1178ms | 10ms | ✅ |
| Emma Stone | Ryan Gosling | 1 | 1224ms | 1219ms | 5ms | ✅ |
| Meryl Streep | Robert De Niro | 1 | 1017ms | 1010ms | 7ms | ✅ |
| Scarlett Johansson | Chris Evans | 1 | 1263ms | 1257ms | 6ms | ✅ |
| Brad Pitt | Leonardo DiCaprio | 2 | 132041ms | 132031ms | 10ms | ✅ |

### Summary Statistics
- **Average Total Duration:** 27347ms
- **Average Backend Duration:** 27339ms
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
