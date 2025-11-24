#!/usr/bin/env ts-node

/**
 * Performance Benchmark Script
 * 
 * Tests actor connection pathfinding performance against the local backend.
 * Measures total duration, backend duration, and network overhead.
 */

interface ActorPair {
  actor1Name: string;
  actor1Id: number;
  actor2Name: string;
  actor2Id: number;
}

interface BenchmarkResult {
  actor1Name: string;
  actor2Name: string;
  degrees: number | null;
  totalDuration: number;
  backendDuration: number;
  networkDuration: number;
  success: boolean;
  error?: string;
}

interface PathResponse {
  path?: Array<{
    actor: { id: number; name: string };
    movie: { id: number; title: string };
  }>;
  degrees?: number;
  backendDurationMs: number;
  error?: string;
  message?: string;
}

// Test actor pairs
const ACTOR_PAIRS: ActorPair[] = [
  {
    actor1Name: 'Christian Bale',
    actor1Id: 3894,
    actor2Name: 'Heath Ledger',
    actor2Id: 1810,
  },
  {
    actor1Name: 'Hugh Jackman',
    actor1Id: 6968,
    actor2Name: 'Heath Ledger',
    actor2Id: 1810,
  },
  {
    actor1Name: 'Christian Bale',
    actor1Id: 3894,
    actor2Name: 'Kate Winslet',
    actor2Id: 72129,
  },
  {
    actor1Name: 'Kate Winslet',
    actor1Id: 72129,
    actor2Name: 'Hugh Jackman',
    actor2Id: 6968,
  },
];

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const API_URL = `${API_BASE_URL}/api/path`;

/**
 * Test a single actor connection
 */
async function benchmarkConnection(pair: ActorPair): Promise<BenchmarkResult> {
  const startTime = Date.now();
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        actor1Id: pair.actor1Id,
        actor2Id: pair.actor2Id,
      }),
    });

    const endTime = Date.now();
    const totalDuration = endTime - startTime;

    const data = await response.json() as PathResponse;

    if (!response.ok) {
      return {
        actor1Name: pair.actor1Name,
        actor2Name: pair.actor2Name,
        degrees: null,
        totalDuration,
        backendDuration: data.backendDurationMs || 0,
        networkDuration: totalDuration - (data.backendDurationMs || 0),
        success: false,
        error: data.error || data.message || `HTTP ${response.status}`,
      };
    }

    const backendDuration = data.backendDurationMs;
    const networkDuration = totalDuration - backendDuration;

    return {
      actor1Name: pair.actor1Name,
      actor2Name: pair.actor2Name,
      degrees: data.degrees || null,
      totalDuration,
      backendDuration,
      networkDuration,
      success: true,
    };
  } catch (error: any) {
    const endTime = Date.now();
    const totalDuration = endTime - startTime;

    return {
      actor1Name: pair.actor1Name,
      actor2Name: pair.actor2Name,
      degrees: null,
      totalDuration,
      backendDuration: 0,
      networkDuration: totalDuration,
      success: false,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Check if the backend server is running
 */
async function checkServerHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Format results as simple output
 */
function formatResults(results: BenchmarkResult[]): string {
  let output = '';
  
  for (const result of results) {
    output += `\n${result.actor1Name} → ${result.actor2Name}:\n`;
    
    if (result.success) {
      output += `  Degrees: ${result.degrees}\n`;
      output += `  Total Duration: ${result.totalDuration}ms\n`;
      output += `  Backend Duration: ${result.backendDuration}ms\n`;
      output += `  Network Duration: ${result.networkDuration}ms\n`;
    } else {
      output += `  ❌ Error: ${result.error}\n`;
      output += `  Total Duration: ${result.totalDuration}ms\n`;
    }
  }

  return output;
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting Performance Benchmark Tests\n');
  console.log('Checking server health...');

  const isServerRunning = await checkServerHealth();
  if (!isServerRunning) {
    console.error(`❌ Backend server is not running on ${API_BASE_URL}`);
    console.error('Please ensure the server is accessible at the configured URL.');
    console.error(`Current API_BASE_URL: ${API_BASE_URL}`);
    process.exit(1);
  }

  console.log('✅ Server is running\n');
  console.log(`Testing ${ACTOR_PAIRS.length} actor connections...\n`);

  const results: BenchmarkResult[] = [];

  for (let i = 0; i < ACTOR_PAIRS.length; i++) {
    const pair = ACTOR_PAIRS[i];
    console.log(`[${i + 1}/${ACTOR_PAIRS.length}] Testing ${pair.actor1Name} → ${pair.actor2Name}...`);
    
    const result = await benchmarkConnection(pair);
    results.push(result);

    if (result.success) {
      console.log(`  ✅ Success: ${result.degrees} degrees, ${result.totalDuration}ms total, ${result.backendDuration}ms backend`);
    } else {
      console.log(`  ❌ Failed: ${result.error}`);
    }

    // Small delay between requests to avoid overwhelming the server
    if (i < ACTOR_PAIRS.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  console.log('\n' + '='.repeat(80));
  const formattedResults = formatResults(results);
  console.log(formattedResults);
  console.log('='.repeat(80));
}

// Run the script
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});


