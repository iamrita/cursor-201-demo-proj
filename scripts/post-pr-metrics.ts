#!/usr/bin/env ts-node

/**
 * Post PR Performance Metrics
 * 
 * This script runs performance benchmarks and posts the results
 * to the latest pull request using GitHub MCP tools.
 * 
 * Usage:
 *   ts-node scripts/post-pr-metrics.ts <owner> <repo> <pr-number>
 * 
 * Or to auto-detect the latest PR:
 *   ts-node scripts/post-pr-metrics.ts <owner> <repo>
 */

import { runAllBenchmarks, calculateStatistics, formatMarkdownTable } from './pr-performance-metrics';

interface PRInfo {
  owner: string;
  repo: string;
  pullNumber: number;
}

/**
 * Parse command line arguments
 */
function parseArgs(): PRInfo {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('Usage: ts-node scripts/post-pr-metrics.ts <owner> <repo> [pr-number]');
    console.error('');
    console.error('Example:');
    console.error('  ts-node scripts/post-pr-metrics.ts iamrita cursor-201-demo-proj 123');
    console.error('  ts-node scripts/post-pr-metrics.ts iamrita cursor-201-demo-proj');
    process.exit(1);
  }
  
  const owner = args[0];
  const repo = args[1];
  const pullNumber = args[2] ? parseInt(args[2], 10) : 0;
  
  return { owner, repo, pullNumber };
}

/**
 * Instructions for posting to PR
 */
function printPostingInstructions(prInfo: PRInfo, markdown: string): void {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  Post to GitHub PR');
  console.log('═══════════════════════════════════════════════════════\n');
  
  console.log('To post these metrics to a PR, use the following GitHub MCP tool call:\n');
  
  if (prInfo.pullNumber > 0) {
    console.log('Tool: mcp_github_add_issue_comment');
    console.log('Parameters:');
    console.log(`  owner: "${prInfo.owner}"`);
    console.log(`  repo: "${prInfo.repo}"`);
    console.log(`  issue_number: ${prInfo.pullNumber}`);
    console.log(`  body: <markdown content>`);
  } else {
    console.log('⚠️  PR number not provided. Please specify the PR number.');
    console.log('');
    console.log('First, list open PRs:');
    console.log('  Tool: mcp_github_list_pull_requests');
    console.log(`  Parameters: { owner: "${prInfo.owner}", repo: "${prInfo.repo}", state: "open" }`);
    console.log('');
    console.log('Then, post the comment:');
    console.log('  Tool: mcp_github_add_issue_comment');
    console.log(`  Parameters: { owner: "${prInfo.owner}", repo: "${prInfo.repo}", issue_number: <pr_number>, body: <markdown> }`);
  }
  
  console.log('\n═══════════════════════════════════════════════════════\n');
}

/**
 * Main execution
 */
async function main() {
  const prInfo = parseArgs();
  
  console.log('═══════════════════════════════════════════════════════');
  console.log('  PR Performance Metrics - GitHub Integration');
  console.log('═══════════════════════════════════════════════════════\n');
  console.log(`Repository: ${prInfo.owner}/${prInfo.repo}`);
  if (prInfo.pullNumber > 0) {
    console.log(`Pull Request: #${prInfo.pullNumber}`);
  } else {
    console.log('Pull Request: Will need to specify');
  }
  console.log('');
  
  // Run benchmarks
  console.log('Running performance benchmarks...\n');
  const results = await runAllBenchmarks();
  
  // Calculate statistics
  const stats = calculateStatistics(results);
  
  // Format markdown
  const markdown = formatMarkdownTable(results, stats);
  
  // Save to file
  const fs = require('fs');
  const path = require('path');
  const outputPath = path.join(process.cwd(), 'performance-metrics.md');
  fs.writeFileSync(outputPath, markdown);
  
  console.log('\n✅ Performance metrics generated successfully!');
  console.log(`📄 Results saved to: ${outputPath}\n`);
  
  // Print instructions for posting
  printPostingInstructions(prInfo, markdown);
  
  // Exit with appropriate code
  process.exit(stats.failed > 0 ? 1 : 0);
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
}

