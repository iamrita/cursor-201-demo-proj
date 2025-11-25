---
description: Run performance benchmarks on actor connections and post results to GitHub PR
---

Parse the input parameter `{{input}}` to extract actor pairs. The input format should be:
- Actor pairs separated by `|` (pipe)
- Within each pair, actors separated by `,` (comma)
- Example: `Christian Bale, Heath Ledger | Hugh Jackman, Heath Ledger`

Stop running the backend server on the main branch, and instead checkout the branch that is associated with the Github PR in the current context window. Start the backend server on that branch and make sure it's running. 

Run the benchmark script with the parsed input:
1. Change to the scripts directory: `cd scripts`
2. Run the benchmark script with the input as arguments: `npx ts-node benchmark.ts "{{input}}"`

The script will:
- Parse the input to extract actor pairs
- Look up actor IDs using the search API for any actor names provided
- Run performance benchmarks on those actor pairs
- Output results to the console

Then format the results and post them as a table in a GitHub PR comment.

The table should be in markdown with the following format:

```markdown
## 🎯 Performance Benchmark Results

**Test Date:** [Current timestamp]
**API Endpoint:** `POST /api/path`

| Actor 1 | Actor 2 | Degrees | Total Duration (ms) | Backend Duration (ms) | Network Duration (ms) | Status |
|---------|---------|---------|---------------------|----------------------|----------------------|--------|

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

Then post this table as a comment to the PR mentioned in the current context window using the GitHub MCP tools.



