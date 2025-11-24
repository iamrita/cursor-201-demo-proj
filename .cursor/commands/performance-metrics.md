---
description: Run performance benchmarks on sample actor connections and post results to GitHub PR
---

Run performance benchmarks on the following actor pairs and post the results as a table in the latest GitHub PR comment:

1. **Kevin Bacon** (ID: 4724) to **Tom Hanks** (ID: 31)
2. **Emma Stone** (ID: 54693) to **Ryan Gosling** (ID: 30614)
3. **Meryl Streep** (ID: 5064) to **Robert De Niro** (ID: 380)
4. **Scarlett Johansson** (ID: 1245) to **Chris Evans** (ID: 16828)
5. **Brad Pitt** (ID: 287) to **Leonardo DiCaprio** (ID: 6193)

For each pair, measure performance metrics similar to the frontend performance service (`frontend/src/services/performance.ts`):

**Performance Measurement Approach:**
- Record `startTime = Date.now()` before initiating the request
- Make a POST request to `http://localhost:3001/api/path` with body: `{ "actor1Id": X, "actor2Id": Y }`
- Record `endTime = Date.now()` after receiving the complete response
- Calculate `totalDuration = endTime - startTime` (this mirrors the frontend's total operation time)
- Extract `backendDurationMs` from the response body (the backend already provides this)
- Calculate `networkDuration = totalDuration - backendDurationMs` (time spent in network overhead, serialization, etc.)
- Record the number of degrees of separation from `result.degrees`
- Note if the request succeeded or failed

This measurement approach mirrors what users experience in the frontend (as implemented in `performance.ts`), measuring the complete operation from start to finish, not just network request time.

After running all benchmarks, create a markdown table with the following format:

```markdown
## 🎯 Performance Benchmark Results

**Test Date:** [Current timestamp]
**API Endpoint:** `POST /api/path`
**Measurement Method:** Similar to `frontend/src/services/performance.ts` (total operation time)

| Actor 1 | Actor 2 | Degrees | Total Duration (ms) | Backend Duration (ms) | Network Duration (ms) | Status |
|---------|---------|---------|---------------------|----------------------|----------------------|--------|
| Kevin Bacon | Tom Hanks | X | XXXms | XXXms | XXXms | ✅/❌ |
| Emma Stone | Ryan Gosling | X | XXXms | XXXms | XXXms | ✅/❌ |
| Meryl Streep | Robert De Niro | X | XXXms | XXXms | XXXms | ✅/❌ |
| Scarlett Johansson | Chris Evans | X | XXXms | XXXms | XXXms | ✅/❌ |
| Brad Pitt | Leonardo DiCaprio | X | XXXms | XXXms | XXXms | ✅/❌ |

### Summary Statistics
- **Average Total Duration:** XXXms
- **Average Backend Duration:** XXXms
- **Average Network Duration:** XXXms
- **Success Rate:** X/5 (XX%)
- **Average Degrees:** X.X

### Performance Breakdown
- **Total Duration:** Complete time from request initiation to response completion (user experience)
- **Backend Duration:** Time spent in server processing (pathfinding + TMDB API calls)
- **Network Duration:** Time spent in network overhead and data transfer

### Notes
- All tests performed against local development server
- Metrics mirror the frontend PerformanceMetrics interface (totalDuration, networkDuration, backendDuration)
- Times may vary based on TMDB API response times and network conditions
- Backend time includes TMDB API calls and pathfinding algorithm execution
```

Then post this table as a comment to the latest open pull request in the repository using the GitHub MCP tools.

Steps:
1. Check if the backend server is running on port 3001 (check terminals or start it if needed)
2. Run the 5 benchmark tests sequentially
3. Calculate summary statistics
4. Find the latest open PR for this repository
5. Post the formatted results as a PR comment

