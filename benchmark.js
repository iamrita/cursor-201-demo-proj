const http = require('http');

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
      }
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
            degrees: result.degrees || 'N/A',
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
            error: data
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

    req.write(postData);
    req.end();
  });
}

async function runBenchmarks() {
  console.log('Starting performance benchmarks...\n');
  const results = [];

  for (const pair of actorPairs) {
    console.log(`Testing: ${pair.name1} -> ${pair.name2}...`);
    const result = await makeRequest(pair.id1, pair.id2);
    results.push({
      ...pair,
      ...result
    });
    console.log(`  ✓ Total: ${result.totalDuration}ms, Backend: ${result.backendDuration}ms, Degrees: ${result.degrees}\n`);
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Calculate statistics
  const successfulResults = results.filter(r => r.success);
  const totalDurations = successfulResults.map(r => r.totalDuration);
  const backendDurations = successfulResults.map(r => r.backendDuration);
  const networkDurations = successfulResults.map(r => r.networkDuration);
  const degrees = successfulResults.map(r => typeof r.degrees === 'number' ? r.degrees : 0);

  const avg = arr => arr.reduce((a, b) => a + b, 0) / arr.length;

  const stats = {
    avgTotal: totalDurations.length > 0 ? Math.round(avg(totalDurations)) : 0,
    avgBackend: backendDurations.length > 0 ? Math.round(avg(backendDurations)) : 0,
    avgNetwork: networkDurations.length > 0 ? Math.round(avg(networkDurations)) : 0,
    successRate: successfulResults.length,
    avgDegrees: degrees.length > 0 ? (avg(degrees)).toFixed(1) : 'N/A'
  };

  // Output JSON for parsing
  console.log('\n=== RESULTS ===');
  console.log(JSON.stringify({ results, stats }, null, 2));
}

runBenchmarks().catch(console.error);
