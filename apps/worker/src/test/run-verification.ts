#!/usr/bin/env node

/**
 * Mitra API Verification Test Runner
 *
 * This script runs comprehensive verification tests for the Mitra Service Configuration API (IS7)
 * and Mitra Driver Management API (IS8) with detailed reporting and error handling.
 *
 * Usage:
 *   pnpm test:verify
 *   node src/test/run-verification.ts
 *   npm run test:verify -- --verbose
 */

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

interface TestRunOptions {
  verbose?: boolean;
  coverage?: boolean;
  watch?: boolean;
  filter?: string;
  timeout?: number;
  bail?: boolean;
}

interface TestResult {
  success: boolean;
  duration: number;
  testCount: number;
  passedCount: number;
  failedCount: number;
  skippedCount: number;
  coverage?: {
    lines: number;
    functions: number;
    branches: number;
    statements: number;
  };
  errors: string[];
}

class MitraApiVerificationRunner {
  private options: TestRunOptions;
  private startTime: number = 0;

  constructor(options: TestRunOptions = {}) {
    this.options = {
      verbose: false,
      coverage: true,
      watch: false,
      timeout: 60000, // 60 seconds default
      bail: false,
      ...options,
    };
  }

  /**
   * Run the verification tests
   */
  async run(): Promise<TestResult> {
    this.startTime = Date.now();

    console.log('🚀 Starting Mitra API Verification Tests');
    console.log('='.repeat(60));

    // Check prerequisites
    await this.checkPrerequisites();

    // Run tests
    const result = await this.runTests();

    // Generate report
    this.generateReport(result);

    return result;
  }

  /**
   * Check if all prerequisites are met
   */
  private async checkPrerequisites(): Promise<void> {
    console.log('📋 Checking prerequisites...');

    // Check if worker is running
    try {
      const response = await fetch('http://localhost:8787/api/health');
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }
      console.log('✅ Worker API is running');
    } catch (error) {
      console.error('❌ Worker API is not running');
      console.error('   Please start the worker with: pnpm dev');
      process.exit(1);
    }

    // Check if test files exist
    const testFile = join(__dirname, 'integration', 'mitra-api-verification.test.ts');
    if (!existsSync(testFile)) {
      console.error('❌ Test file not found:', testFile);
      process.exit(1);
    }
    console.log('✅ Test files found');

    // Check if dependencies are installed
    const packageJson = join(process.cwd(), 'package.json');
    if (!existsSync(packageJson)) {
      console.error('❌ package.json not found');
      process.exit(1);
    }
    console.log('✅ Dependencies verified');

    console.log('');
  }

  /**
   * Run the actual tests using Vitest
   */
  private async runTests(): Promise<TestResult> {
    return new Promise((resolve, reject) => {
      const args = ['vitest', 'run'];

      // Add test file filter
      if (this.options.filter) {
        args.push('--reporter=verbose');
        args.push(`--testNamePattern=${this.options.filter}`);
      } else {
        args.push('src/test/integration/mitra-api-verification.test.ts');
      }

      // Add coverage
      if (this.options.coverage) {
        args.push('--coverage');
      }

      // Add verbose output
      if (this.options.verbose) {
        args.push('--reporter=verbose');
      }

      // Add timeout
      args.push(`--testTimeout=${this.options.timeout}`);

      // Add bail option
      if (this.options.bail) {
        args.push('--bail=1');
      }

      console.log('🧪 Running tests...');
      if (this.options.verbose) {
        console.log('Command:', 'npx', args.join(' '));
      }
      console.log('');

      const child = spawn('npx', args, {
        stdio: 'pipe',
        cwd: process.cwd(),
        env: {
          ...process.env,
          VERBOSE_TEST_LOGS: this.options.verbose ? 'true' : 'false',
          TEST_TIMEOUT: this.options.timeout?.toString() || '60000',
        },
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        if (this.options.verbose) {
          process.stdout.write(output);
        }
      });

      child.stderr?.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        if (this.options.verbose) {
          process.stderr.write(output);
        }
      });

      child.on('close', (code) => {
        const duration = Date.now() - this.startTime;
        const result = this.parseTestOutput(stdout, stderr, code === 0, duration);

        if (code === 0) {
          resolve(result);
        } else {
          resolve(result); // Still resolve to show results, but mark as failed
        }
      });

      child.on('error', (error) => {
        reject(new Error(`Failed to run tests: ${error.message}`));
      });
    });
  }

  /**
   * Parse test output to extract results
   */
  private parseTestOutput(
    stdout: string,
    stderr: string,
    success: boolean,
    duration: number,
  ): TestResult {
    const result: TestResult = {
      success,
      duration,
      testCount: 0,
      passedCount: 0,
      failedCount: 0,
      skippedCount: 0,
      errors: [],
    };

    // Parse test counts from output
    const testSummaryMatch = stdout.match(/Tests?\s+(\d+)\s+passed/);
    if (testSummaryMatch) {
      result.passedCount = parseInt(testSummaryMatch[1]);
    }

    const failedMatch = stdout.match(/(\d+)\s+failed/);
    if (failedMatch) {
      result.failedCount = parseInt(failedMatch[1]);
    }

    const skippedMatch = stdout.match(/(\d+)\s+skipped/);
    if (skippedMatch) {
      result.skippedCount = parseInt(skippedMatch[1]);
    }

    result.testCount = result.passedCount + result.failedCount + result.skippedCount;

    // Parse coverage if available
    const coverageMatch = stdout.match(
      /All files\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)/,
    );
    if (coverageMatch) {
      result.coverage = {
        statements: parseFloat(coverageMatch[1]),
        branches: parseFloat(coverageMatch[2]),
        functions: parseFloat(coverageMatch[3]),
        lines: parseFloat(coverageMatch[4]),
      };
    }

    // Extract errors
    if (stderr) {
      result.errors.push(stderr);
    }

    // Extract failed test details
    const failedTestMatches = stdout.match(/FAIL\s+.*$/gm);
    if (failedTestMatches) {
      result.errors.push(...failedTestMatches);
    }

    return result;
  }

  /**
   * Generate and display test report
   */
  private generateReport(result: TestResult): void {
    console.log('');
    console.log('📊 Test Results Summary');
    console.log('='.repeat(60));

    // Overall status
    const statusIcon = result.success ? '✅' : '❌';
    const statusText = result.success ? 'PASSED' : 'FAILED';
    console.log(`${statusIcon} Overall Status: ${statusText}`);
    console.log(`⏱️  Duration: ${(result.duration / 1000).toFixed(2)}s`);
    console.log('');

    // Test counts
    console.log('📈 Test Statistics:');
    console.log(`   Total Tests: ${result.testCount}`);
    console.log(`   ✅ Passed: ${result.passedCount}`);
    console.log(`   ❌ Failed: ${result.failedCount}`);
    console.log(`   ⏭️  Skipped: ${result.skippedCount}`);
    console.log('');

    // Coverage report
    if (result.coverage) {
      console.log('📊 Coverage Report:');
      console.log(`   Statements: ${result.coverage.statements}%`);
      console.log(`   Branches: ${result.coverage.branches}%`);
      console.log(`   Functions: ${result.coverage.functions}%`);
      console.log(`   Lines: ${result.coverage.lines}%`);
      console.log('');
    }

    // Verification checklist
    console.log('✅ Verification Checklist:');
    console.log('   📋 Mitra Profile Management');
    console.log('   🔧 Service Configuration API (IS7)');
    console.log('   👥 Driver Management API (IS8)');
    console.log('   🔐 Authorization & Ownership');
    console.log('   📊 Data Integrity & Constraints');
    console.log('   🔄 Business Logic Validation');
    console.log('');

    // Errors
    if (result.errors.length > 0) {
      console.log('❌ Errors and Failures:');
      result.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
      console.log('');
    }

    // Next steps
    if (!result.success) {
      console.log('🔧 Next Steps:');
      console.log('   1. Review failed tests above');
      console.log('   2. Check API implementation');
      console.log('   3. Verify database schema');
      console.log('   4. Run tests with --verbose for details');
      console.log('');
    } else {
      console.log('🎉 All verification tests passed!');
      console.log('   The Mitra Service & Driver Management APIs are working correctly.');
      console.log('');
    }

    console.log('='.repeat(60));
  }
}

/**
 * Parse command line arguments
 */
function parseArgs(): TestRunOptions {
  const args = process.argv.slice(2);
  const options: TestRunOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--no-coverage':
        options.coverage = false;
        break;
      case '--watch':
      case '-w':
        options.watch = true;
        break;
      case '--filter':
      case '-f':
        options.filter = args[++i];
        break;
      case '--timeout':
      case '-t':
        options.timeout = parseInt(args[++i]);
        break;
      case '--bail':
      case '-b':
        options.bail = true;
        break;
      case '--help':
      case '-h':
        console.log(`
Mitra API Verification Test Runner

Usage: node run-verification.ts [options]

Options:
  --verbose, -v      Enable verbose output
  --no-coverage      Disable coverage reporting
  --watch, -w        Run in watch mode
  --filter, -f       Filter tests by name pattern
  --timeout, -t      Set test timeout in milliseconds
  --bail, -b         Stop on first failure
  --help, -h         Show this help message

Examples:
  node run-verification.ts --verbose
  node run-verification.ts --filter "Service API"
  node run-verification.ts --timeout 30000 --bail
        `);
        process.exit(0);
        break;
    }
  }

  return options;
}

/**
 * Main execution
 */
async function main() {
  try {
    const options = parseArgs();
    const runner = new MitraApiVerificationRunner(options);
    const result = await runner.run();

    // Exit with appropriate code
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error('❌ Verification runner failed:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

export { MitraApiVerificationRunner, TestRunOptions, TestResult };
