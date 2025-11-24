#!/usr/bin/env node

const http = require('http');
const { execSync } = require('child_process');

const actorPairs = [
  { name1: 'Kevin Bacon', id1: 4724, name2: 'Tom Hanks', id2: 31 },
  { name1: 'Emma Stone', id1: 54693, name2: 'Ryan Gosling', id2: 30614 },
  { name1: 'Meryl Streep', id1: 5064, name2: 'Robert De Niro', id2: 380 },
  { name1: 'Scarlett Johansson', id1: 1245, name2: 'Chris Evans', id2: 16828 },
  { name1: 'Brad Pitt', id1: 287, name2: 'Leonardo DiCaprio', id2: 6193 }
];

function makeRequest(actor1Id, actor2Id) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      actor1Id: actor1Id,
      actor2Id: actor2Id
    });

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/path',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 60000  // 60 second timeout
    };

    const startTime = Date.now();
    
    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const endTime = Date.now();
        const totalDuration = endTime - startTime;

        try {
          const result = JSON.parse(data);
          resolve({
            success: res.statusCode === 200,
            statusCode: res.statusCode,
            totalDuration,
            backendDuration: result.backendDurationMs || 0,
            networkDuration: totalDuration - (result.backendDurationMs || 0),
            degrees: result.degrees !== undefined ? result.degrees : 'N/A',
            error: result.error || null
          });
        } catch (e) {
          resolve({
            success: false,
            statusCode: res.statusCode,
            totalDuration,
            backendDuration: 0,
            networkDuration: totalDuration,
            degrees: 'N/A',
            error: `Parse error: ${data.substring(0, 100)}`
          });
        }
      });
    });

    req.on('error', (error) => {
      const endTime = Date.now();
      const totalDuration = endTime - startTime;
      resolve({
        success: false,
        statusCode: 0,
        totalDuration,
        backendDuration: 0,
        networkDuration: totalDuration,
        degrees: 'N/A',
        error: error.message
      });
    });

    req.on('timeout', () => {
      req.destroy();
      const endTime = Date.now();
      const totalDuration = endTime - startTime;
      resolve({
        success: false,
        statusCode: 0,
        totalDuration,
        backendDuration: 0,
        networkDuration: totalDuration,
        degrees: 'N/A',
        error: 'Request timeout'
      });
    });

    req.write(postData);
    req.end();
  });
}

async function runBenchmarks() {
  console.log('🎯 Starting performance benchmarks...\n');
  console.log('Testing against: http://localhost:3001/api/path\n');
  
  const results = [];

  for (const pair of actorPairs) {
    console.log(`Testing: ${pair.name1} (${pair.id1}) -> ${pair.name2} (${pair.id2})...`);
    const result = await makeRequest(pair.id1, pair.id2);
    results.push({
      ...pair,
      ...result
    });
    
    if (result.success) {
      console.log(`  ✅ Success - Total: ${result.totalDuration}ms, Backend: ${result.backendDuration}ms, Network: ${result.networkDuration}ms, Degrees: ${result.degrees}`);
    } else {
      console.log(`  ❌ Failed - ${result.error || 'Unknown error'}`);
    }
    console.log();
    
    // Small delay between requests to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Calculate statistics
  const successfulResults = results.filter(r => r.success);
  const totalDurations = successfulResults.map(r => r.totalDuration);
  const backendDurations = successfulResults.map(r => r.backendDuration);
  const networkDurations = successfulResults.map(r => r.networkDuration);
  const degrees = successfulResults.map(r => typeof r.degrees === 'number' ? r.degrees : 0);

  const avg = arr => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  const stats = {
    avgTotal: Math.round(avg(totalDurations)),
    avgBackend: Math.round(avg(backendDurations)),
    avgNetwork: Math.round(avg(networkDurations)),
    successCount: successfulResults.length,
    totalTests: results.length,
    successRate: ((successfulResults.length / results.length) * 100).toFixed(0),
    avgDegrees: degrees.length > 0 ? avg(degrees).toFixed(1) : 'N/A'
  };

  // Generate markdown table
  const timestamp = new Date().toISOString();
  let markdown = `## 🎯 Performance Benchmark Results

**Test Date:** ${timestamp}
**API Endpoint:** \`POST /api/path\`
**Measurement Method:** Similar to \`frontend/src/services/performance.ts\` (total operation time)

| Actor 1 | Actor 2 | Degrees | Total Duration (ms) | Backend Duration (ms) | Network Duration (ms) | Status |
|---------|---------|---------|---------------------|----------------------|----------------------|--------|
`;

  for (const result of results) {
    const status = result.success ? '✅' : '❌';
    const degrees = result.degrees !== 'N/A' ? result.degrees : 'N/A';
    const totalDur = result.totalDuration || 0;
    const backendDur = result.backendDuration || 0;
    const networkDur = result.networkDuration || 0;
    
    markdown += `| ${result.name1} | ${result.name2} | ${degrees} | ${totalDur}ms | ${backendDur}ms | ${networkDur}ms | ${status} |\n`;
  }

  markdown += `
### Summary Statistics
- **Average Total Duration:** ${stats.avgTotal}ms
- **Average Backend Duration:** ${stats.avgBackend}ms
- **Average Network Duration:** ${stats.avgNetwork}ms
- **Success Rate:** ${stats.successCount}/${stats.totalTests} (${stats.successRate}%)
- **Average Degrees:** ${stats.avgDegrees}

### Performance Breakdown
- **Total Duration:** Complete time from request initiation to response completion (user experience)
- **Backend Duration:** Time spent in server processing (pathfinding + TMDB API calls)
- **Network Duration:** Time spent in network overhead and data transfer

### Notes
- All tests performed against local development server
- Metrics mirror the frontend PerformanceMetrics interface (totalDuration, networkDuration, backendDuration)
- Times may vary based on TMDB API response times and network conditions
- Backend time includes TMDB API calls and pathfinding algorithm execution
`;

  console.log('\n' + '='.repeat(80));
  console.log('MARKDOWN TABLE FOR GITHUB PR:');
  console.log('='.repeat(80) + '\n');
  console.log(markdown);

  // Try to post to GitHub using gh CLI
  console.log('\n' + '='.repeat(80));
  console.log('Attempting to post to GitHub PR...');
  console.log('='.repeat(80) + '\n');

  try {
    // Check if gh CLI is available
    execSync('gh --version', { stdio: 'pipe' });
    
    // Get the latest PR number
    const prNumber = execSync('gh pr list --limit 1 --json number --jq ".[0].number"', { 
      encoding: 'utf-8',
      stdio: 'pipe'
    }).trim();

    if (prNumber) {
      console.log(`Found PR #${prNumber}`);
      
      // Create a temp file with the markdown
      const fs = require('fs');
      const tmpFile = '/tmp/benchmark-results.md';
      fs.writeFileSync(tmpFile, markdown);
      
      // Post comment
      execSync(`gh pr comment ${prNumber} --body-file ${tmpFile}`, { stdio: 'inherit' });
      console.log(`\n✅ Successfully posted results to PR #${prNumber}`);
      
      // Clean up
      fs.unlinkSync(tmpFile);
    } else {
      console.log('❌ No open PRs found');
      console.log('\nTo post manually, copy the markdown above and paste it as a PR comment.');
    }
  } catch (error) {
    console.log('❌ Could not post to GitHub automatically');
    console.log('Error:', error.message);
    console.log('\nTo post manually:');
    console.log('1. Copy the markdown table above');
    console.log('2. Go to your PR on GitHub');
    console.log('3. Paste it as a comment');
  }

  return { results, stats, markdown };
}

// Run the benchmarks
runBenchmarks()
  .then(() => {
    console.log('\n✨ Benchmarks complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Error running benchmarks:', error);
    process.exit(1);
  });
