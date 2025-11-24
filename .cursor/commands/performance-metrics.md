---
description: Run performance benchmarks on sample actor connections and post results to GitHub PR
---

Using the Github MCP server, check all open pull requests. 

For any open pull request that makes a backend change, run performance benchmarks on the following actor pairs using `benchmark.ts` and post the results as a table in a GitHub PR comment:


1. **Christian Bale** (ID: 3894) to **Heath Ledger** (ID: 1810)
2. **Hugh Jackman** (ID: 6968) to **Heath Ledger** (ID: 1810)
3. **Christian Bale** (ID: 3894) to **Kate Winslet** (ID: 72129)
4. **Kate Winslet** (ID: 72129) to **Hugh Jackman** (ID: 6968)

The table should be in markdown with the following format:

```markdown
## 🎯 Performance Benchmark Results

**Test Date:** [Current timestamp]
**API Endpoint:** `POST /api/path`
**Measurement Method:** Similar to `frontend/src/services/performance.ts` (total operation time)

| Actor 1 | Actor 2 | Degrees | Total Duration (ms) | Backend Duration (ms) | Network Duration (ms) | Status |
|---------|---------|---------|---------------------|----------------------|----------------------|--------|
| Christian Bale | Kate Winslet | X | XXXms | XXXms | XXXms | ✅/❌ |
| Hugh Jackman | Heath Ledger | X | XXXms | XXXms | XXXms | ✅/❌ |
| Christian Bale | Heath Ledger | X | XXXms | XXXms | XXXms | ✅/❌ |
| Kate Winslet | Hugh Jackman | X | XXXms | XXXms | XXXms | ✅/❌ |

### Summary Statistics
- **Average Total Duration:** XXXms
- **Average Backend Duration:** XXXms
- **Average Network Duration:** XXXms
- **Success Rate:** X/4 (XX%)
- **Average Degrees:** X.X

### Performance Breakdown
- **Total Duration:** Complete time from request initiation to response completion (user experience)
- **Backend Duration:** Time spent in server processing (pathfinding + TMDB API calls)
- **Network Duration:** Time spent in network overhead and data transfer

### Notes
- Times may vary based on TMDB API response times and network conditions
- Backend time includes TMDB API calls and pathfinding algorithm execution
```

Then post this table as a comment to the latest open pull request in the repository using the GitHub MCP tools.



