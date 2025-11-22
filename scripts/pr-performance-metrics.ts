#!/usr/bin/env ts-node

/**
 * PR Performance Metrics Script
 * 
 * This script runs performance benchmarks on the actor pathfinder service
 * and posts the results as a comment on the latest pull request.
 */

import axios from 'axios';

// Test cases for benchmarking
const TEST_CASES = [
  {
    name: 'Kevin Bacon → Tom Hanks',
    actor1Id: 4724,
    actor1Name: 'Kevin Bacon',
    actor2Id: 31,
    actor2Name: 'Tom Hanks',
    expectedDegrees: 1,
  },
  {
    name: 'Brad Pitt → Jennifer Aniston',
    actor1Id: 287,
    actor1Name: 'Brad Pitt',
    actor2Id: 4491,
    actor2Name: 'Jennifer Aniston',
    expectedDegrees: 1,
  },
  {
    name: 'Leonardo DiCaprio → Kate Winslet',
    actor1Id: 6193,
    actor1Name: 'Leonardo DiCaprio',
    actor2Id: 204,
    actor2Name: 'Kate Winslet',
    expectedDegrees: 1,
  },
  {
    name: 'Tom Cruise → Morgan Freeman',
    actor1Id: 500,
    actor1Name: 'Tom Cruise',
    actor2Id: 192,
    actor2Name: 'Morgan Freeman',
    expectedDegrees: 2,
  },
  {
    name: 'Scarlett Johansson → Samuel L. Jackson',
    actor1Id: 1245,
    actor1Name: 'Scarlett Johansson',
    actor2Id: 2231,
    actor2Name: 'Samuel L. Jackson',
    expectedDegrees: 1,
  },
];

interface BenchmarkResult {
  testName: string;
  actor1: string;
  actor2: string;
  degrees: number | null;
  latency: number;
  status: 'pass' | 'fail';
  error?: string;
}

interface Statistics {
  totalTests: number;
  successful: number;
  failed: number;
  averageLatency: number;
  minLatency: number;
  maxLatency: number;
  medianLatency: number;
}

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api';

/**
 * Run a single benchmark test
 */
async function runBenchmark(testCase: typeof TEST_CASES[0]): Promise<BenchmarkResult> {
  const startTime = Date.now();
  
  try {
    const response = await axios.post(`${API_BASE_URL}/path`, {
      actor1Id: testCase.actor1Id,
      actor2Id: testCase.actor2Id,
    }, {
      timeout: 30000, // 30 second timeout
    });
    
    const endTime = Date.now();
    const latency = endTime - startTime;
    
    return {
      testName: testCase.name,
      actor1: testCase.actor1Name,
      actor2: testCase.actor2Name,
      degrees: response.data.degrees,
      latency,
      status: 'pass',
    };
  } catch (error: any) {
    const endTime = Date.now();
    const latency = endTime - startTime;
    
    return {
      testName: testCase.name,
      actor1: testCase.actor1Name,
      actor2: testCase.actor2Name,
      degrees: null,
      latency,
      status: 'fail',
      error: error.message,
    };
  }
}

/**
 * Run all benchmark tests
 */
async function runAllBenchmarks(): Promise<BenchmarkResult[]> {
  console.log('🚀 Starting performance benchmarks...\n');
  
  const results: BenchmarkResult[] = [];
  
  for (const testCase of TEST_CASES) {
    console.log(`Testing: ${testCase.name}...`);
    const result = await runBenchmark(testCase);
    results.push(result);
    
    if (result.status === 'pass') {
      console.log(`✅ Completed in ${result.latency}ms (${result.degrees} degrees)\n`);
    } else {
      console.log(`❌ Failed: ${result.error}\n`);
    }
  }
  
  return results;
}

/**
 * Calculate statistics from benchmark results
 */
function calculateStatistics(results: BenchmarkResult[]): Statistics {
  const latencies = results.map(r => r.latency);
  const successful = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  
  const sortedLatencies = [...latencies].sort((a, b) => a - b);
  const median = sortedLatencies.length % 2 === 0
    ? (sortedLatencies[sortedLatencies.length / 2 - 1] + sortedLatencies[sortedLatencies.length / 2]) / 2
    : sortedLatencies[Math.floor(sortedLatencies.length / 2)];
  
  return {
    totalTests: results.length,
    successful,
    failed,
    averageLatency: Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length),
    minLatency: Math.min(...latencies),
    maxLatency: Math.max(...latencies),
    medianLatency: Math.round(median),
  };
}

/**
 * Format results as a markdown table
 */
function formatMarkdownTable(results: BenchmarkResult[], stats: Statistics): string {
  const timestamp = new Date().toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  
  let markdown = `## 🚀 Performance Metrics - Actor Pathfinder\n\n`;
  markdown += `**Generated**: ${timestamp}\n\n`;
  markdown += `| Test Case | Actor 1 → Actor 2 | Degrees | Latency (ms) | Status |\n`;
  markdown += `|-----------|-------------------|---------|--------------|--------|\n`;
  
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const testNum = i + 1;
    const statusIcon = result.status === 'pass' ? '✅ Pass' : '❌ Fail';
    const degrees = result.degrees !== null ? result.degrees.toString() : 'N/A';
    const latency = result.latency.toLocaleString();
    
    markdown += `| Test ${testNum} | ${result.actor1} → ${result.actor2} | ${degrees} | ${latency} | ${statusIcon} |\n`;
  }
  
  markdown += `\n### 📊 Summary Statistics\n\n`;
  markdown += `- **Total Tests**: ${stats.totalTests}\n`;
  markdown += `- **Successful**: ${stats.successful} ✅\n`;
  markdown += `- **Failed**: ${stats.failed} ❌\n`;
  markdown += `- **Average Latency**: ${stats.averageLatency.toLocaleString()} ms\n`;
  markdown += `- **Min Latency**: ${stats.minLatency.toLocaleString()} ms\n`;
  markdown += `- **Max Latency**: ${stats.maxLatency.toLocaleString()} ms\n`;
  markdown += `- **Median Latency**: ${stats.medianLatency.toLocaleString()} ms\n`;
  
  // Add performance insights
  markdown += `\n### 💡 Performance Insights\n\n`;
  
  if (stats.averageLatency < 2000) {
    markdown += `- 🎉 Excellent performance! Average latency under 2 seconds.\n`;
  } else if (stats.averageLatency < 5000) {
    markdown += `- ✅ Good performance. Average latency under 5 seconds.\n`;
  } else {
    markdown += `- ⚠️ Performance could be improved. Average latency over 5 seconds.\n`;
  }
  
  const successRate = (stats.successful / stats.totalTests) * 100;
  markdown += `- Success Rate: ${successRate.toFixed(1)}%\n`;
  
  if (stats.failed > 0) {
    markdown += `- ⚠️ ${stats.failed} test(s) failed. Check error logs for details.\n`;
  }
  
  markdown += `\n---\n`;
  markdown += `*Automated performance metrics generated on PR*\n`;
  
  return markdown;
}

/**
 * Check if backend server is running
 */
async function checkBackendHealth(): Promise<boolean> {
  try {
    await axios.get(`${API_BASE_URL.replace('/api', '')}/health`, {
      timeout: 5000,
    });
    return true;
  } catch (error) {
    // Try alternative health check
    try {
      await axios.get(`${API_BASE_URL}/search?q=test`, {
        timeout: 5000,
      });
      return true;
    } catch (e) {
      return false;
    }
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  PR Performance Metrics Generator');
  console.log('═══════════════════════════════════════════════════════\n');
  
  // Check if backend is running
  console.log('Checking backend server health...');
  const isHealthy = await checkBackendHealth();
  
  if (!isHealthy) {
    console.error('❌ Backend server is not running or not accessible.');
    console.error(`   Expected backend at: ${API_BASE_URL}`);
    console.error('   Please start the backend server with: cd backend && npm run dev');
    process.exit(1);
  }
  
  console.log('✅ Backend server is healthy\n');
  
  // Run benchmarks
  const results = await runAllBenchmarks();
  
  // Calculate statistics
  const stats = calculateStatistics(results);
  
  // Format markdown
  const markdown = formatMarkdownTable(results, stats);
  
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  Results');
  console.log('═══════════════════════════════════════════════════════\n');
  console.log(markdown);
  
  // Output results to file for GitHub Action or manual posting
  const fs = require('fs');
  const path = require('path');
  const outputPath = path.join(process.cwd(), 'performance-metrics.md');
  fs.writeFileSync(outputPath, markdown);
  console.log(`\n✅ Results saved to: ${outputPath}`);
  console.log('\nTo post this to a PR, use the GitHub MCP tools in Cursor.');
  
  // Exit with error code if any tests failed
  if (stats.failed > 0) {
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error running performance metrics:', error.message);
    process.exit(1);
  });
}

export { runAllBenchmarks, calculateStatistics, formatMarkdownTable };

