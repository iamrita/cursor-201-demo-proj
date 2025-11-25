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

// Default actor pairs (used when no arguments provided)
const DEFAULT_ACTOR_PAIRS: ActorPair[] = [
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
    actor1Name: 'Hugh Jackman',
    actor1Id: 6968,
    actor2Name: 'Kate Winslet',
    actor2Id: 72129,
  },
  {
    actor1Name: 'Kate Winslet',
    actor1Id: 72129,
    actor2Name: 'Christian Bale',
    actor2Id: 3894,
  },
];

interface ActorSearchResult {
  id: number;
  name: string;
  profile_path?: string;
  known_for?: any[];
}

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const API_URL = `${API_BASE_URL}/api/path`;
const SEARCH_URL = `${API_BASE_URL}/api/search`;

/**
 * Parse actor pairs from command line arguments or environment variable
 * Format: "Actor1, Actor2 | Actor3, Actor4"
 */
function parseActorPairsFromInput(input?: string): string[] {
  if (!input || input.trim().length === 0) {
    return [];
  }
  
  // Split by pipe to get pairs
  return input.split('|').map(pair => pair.trim()).filter(pair => pair.length > 0);
}

/**
 * Parse a single actor pair string into actor names
 * Format: "Actor1, Actor2"
 */
function parseActorPair(pairStr: string): { actor1: string; actor2: string } | null {
  const parts = pairStr.split(',').map(s => s.trim()).filter(s => s.length > 0);
  if (parts.length !== 2) {
    return null;
  }
  return { actor1: parts[0], actor2: parts[1] };
}

/**
 * Look up actor ID by name using the search API
 */
async function lookupActorId(actorName: string): Promise<number | null> {
  try {
    const response = await fetch(`${SEARCH_URL}?q=${encodeURIComponent(actorName)}`);
    if (!response.ok) {
      console.error(`Failed to search for actor "${actorName}": HTTP ${response.status}`);
      return null;
    }
    
    const actors = await response.json() as ActorSearchResult[];
    if (actors.length === 0) {
      console.error(`No actors found for "${actorName}"`);
      return null;
    }
    
    // Return the first result (most relevant)
    return actors[0].id;
  } catch (error: any) {
    console.error(`Error looking up actor "${actorName}":`, error.message);
    return null;
  }
}

/**
 * Convert parsed actor pairs to ActorPair objects with IDs
 */
async function resolveActorPairs(pairStrings: string[]): Promise<ActorPair[]> {
  const resolvedPairs: ActorPair[] = [];
  
  for (const pairStr of pairStrings) {
    const parsed = parseActorPair(pairStr);
    if (!parsed) {
      console.warn(`Skipping invalid pair format: "${pairStr}"`);
      continue;
    }
    
    const actor1Id = await lookupActorId(parsed.actor1);
    const actor2Id = await lookupActorId(parsed.actor2);
    
    if (actor1Id === null || actor2Id === null) {
      console.error(`Failed to resolve IDs for pair: ${parsed.actor1}, ${parsed.actor2}`);
      continue;
    }
    
    resolvedPairs.push({
      actor1Name: parsed.actor1,
      actor1Id,
      actor2Name: parsed.actor2,
      actor2Id,
    });
  }
  
  return resolvedPairs;
}

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

  // Get actor pairs from command line args or environment variable
  // Handle input as a single string argument (from Cursor command) or multiple args
  const input = process.argv[2] || process.argv.slice(2).join(' ') || process.env.ACTOR_PAIRS || '';
  let actorPairs: ActorPair[];

  if (input.trim().length > 0) {
    console.log(`Parsing actor pairs from input: "${input}"\n`);
    const pairStrings = parseActorPairsFromInput(input);
    
    if (pairStrings.length === 0) {
      console.warn('No valid actor pairs found in input, using defaults...\n');
      actorPairs = DEFAULT_ACTOR_PAIRS;
    } else {
      console.log(`Resolving ${pairStrings.length} actor pair(s)...\n`);
      actorPairs = await resolveActorPairs(pairStrings);
      
      if (actorPairs.length === 0) {
        console.error('❌ Failed to resolve any actor pairs. Exiting.');
        process.exit(1);
      }
    }
  } else {
    console.log('No input provided, using default actor pairs...\n');
    actorPairs = DEFAULT_ACTOR_PAIRS;
  }

  console.log(`Testing ${actorPairs.length} actor connection(s)...\n`);

  const results: BenchmarkResult[] = [];

  for (let i = 0; i < actorPairs.length; i++) {
    const pair = actorPairs[i];
    console.log(`[${i + 1}/${actorPairs.length}] Testing ${pair.actor1Name} → ${pair.actor2Name}...`);
    
    const result = await benchmarkConnection(pair);
    results.push(result);

    if (result.success) {
      console.log(`  ✅ Success: ${result.degrees} degrees, ${result.totalDuration}ms total, ${result.backendDuration}ms backend`);
    } else {
      console.log(`  ❌ Failed: ${result.error}`);
    }

    // Small delay between requests to avoid overwhelming the server
    if (i < actorPairs.length - 1) {
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


