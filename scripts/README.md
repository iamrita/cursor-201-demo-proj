# Scripts

Utility scripts for the Actor Connection project.

## Benchmark Script

The `benchmark.ts` script runs performance tests against the local backend API to measure actor connection pathfinding performance.

### Prerequisites

1. Backend server must be running on `http://localhost:3001`
2. Install dependencies: `npm install`

### Usage

```bash
cd scripts
npm install
npm run benchmark
```

### What it tests

The benchmark script tests 5 actor connection pairs:

1. **Kevin Bacon** → **Tom Hanks**
2. **Emma Stone** → **Ryan Gosling**
3. **Meryl Streep** → **Robert De Niro**
4. **Scarlett Johansson** → **Chris Evans**
5. **Brad Pitt** → **Leonardo DiCaprio**

### Metrics Measured

For each connection, the script measures:

- **Total Duration**: Complete time from request initiation to response completion (user experience)
- **Backend Duration**: Time spent in server processing (pathfinding + TMDB API calls)
- **Network Duration**: Time spent in network overhead and data transfer (calculated as Total - Backend)
- **Degrees of Separation**: Number of hops between actors
- **Success/Failure Status**: Whether the connection was found

### Output

The script outputs:

1. Real-time progress to the console
2. A formatted markdown table with all results and summary statistics
3. Results saved to `benchmark-results.md`

### Example Output

```
🚀 Starting Performance Benchmark Tests

Checking server health...
✅ Server is running

Testing 5 actor connections...

[1/5] Testing Kevin Bacon → Tom Hanks...
  ✅ Success: 2 degrees, 1234ms total, 1100ms backend
[2/5] Testing Emma Stone → Ryan Gosling...
  ✅ Success: 1 degrees, 890ms total, 750ms backend
...
```

### Notes

- The measurement approach mirrors the frontend's PerformanceMetrics interface
- Tests are run sequentially with a 500ms delay between requests
- Results may vary based on TMDB API response times and network conditions

