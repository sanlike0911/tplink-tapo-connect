#!/usr/bin/env ts-node

/**
 * Test Runner for P105 Plug Tests
 * 
 * This script provides a comprehensive test suite runner for P105 plug functionality.
 * It can run different types of tests based on command line arguments.
 * 
 * Usage:
 *   npm run test:p105           - Run all P105 tests
 *   npm run test:p105:unit      - Run only unit tests
 *   npm run test:p105:integration - Run only integration tests
 *   npm run test:p105:errors    - Run only error scenario tests
 *   npm run test:p105:performance - Run only performance tests
 */

import { spawn } from 'child_process';
import { config } from 'dotenv';

// Load environment variables
config();

interface TestSuite {
  name: string;
  file: string;
  description: string;
  requiresDevice: boolean;
  estimatedTime: string;
}

const testSuites: TestSuite[] = [
  {
    name: 'unit',
    file: 'p105-plug-unit.test.ts',
    description: 'Unit tests with mocked dependencies',
    requiresDevice: false,
    estimatedTime: '~30 seconds'
  },
  {
    name: 'integration',
    file: 'p105-plug.test.ts',
    description: 'Integration tests with real device',
    requiresDevice: true,
    estimatedTime: '~2-5 minutes'
  },
  {
    name: 'errors',
    file: 'p105-error-scenarios.test.ts',
    description: 'Error handling and edge cases',
    requiresDevice: true,
    estimatedTime: '~3-7 minutes'
  },
  {
    name: 'performance',
    file: 'p105-performance.test.ts',
    description: 'Performance and load testing',
    requiresDevice: true,
    estimatedTime: '~5-10 minutes'
  }
];

function checkEnvironment(): { valid: boolean; missing: string[] } {
  const required = ['TAPO_USERNAME', 'TAPO_PASSWORD', 'PLUG_IP'];
  const missing = required.filter(key => !process.env[key]);
  
  return {
    valid: missing.length === 0,
    missing
  };
}

function printHeader() {
  console.log('┌─────────────────────────────────────────────────────────────────┐');
  console.log('│                    P105 Plug Test Suite                        │');
  console.log('└─────────────────────────────────────────────────────────────────┘');
  console.log();
}

function printTestSuites() {
  console.log('Available test suites:');
  console.log();
  
  testSuites.forEach((suite, index) => {
    const deviceReq = suite.requiresDevice ? '🔌 Device Required' : '🧪 Mock Only';
    console.log(`${index + 1}. ${suite.name.toUpperCase()}`);
    console.log(`   ${suite.description}`);
    console.log(`   ${deviceReq} | ${suite.estimatedTime}`);
    console.log();
  });
}

function printEnvironmentStatus() {
  const env = checkEnvironment();
  
  console.log('Environment Status:');
  console.log('─'.repeat(20));
  
  if (env.valid) {
    console.log('✅ All required environment variables are set');
    console.log(`   Device IP: ${process.env['PLUG_IP']}`);
    console.log(`   Username: ${process.env['TAPO_USERNAME']?.substring(0, 3)}***`);
  } else {
    console.log('❌ Missing required environment variables:');
    env.missing.forEach(key => console.log(`   - ${key}`));
    console.log();
    console.log('Please set these in your .env file or environment.');
    console.log('Device-dependent tests will be skipped.');
  }
  console.log();
}

function runJestTest(testFile: string, options: string[] = []): Promise<number> {
  return new Promise((resolve) => {
    console.log(`Running: ${testFile}`);
    console.log('─'.repeat(50));
    
    const args = [
      '--testPathPattern', testFile,
      '--verbose',
      '--detectOpenHandles',
      '--forceExit',
      ...options
    ];
    
    const jest = spawn('npx', ['jest', ...args], {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    jest.on('close', (code) => {
      console.log();
      if (code === 0) {
        console.log(`✅ ${testFile} completed successfully`);
      } else {
        console.log(`❌ ${testFile} failed with code ${code}`);
      }
      console.log();
      resolve(code || 0);
    });
    
    jest.on('error', (error) => {
      console.error(`Error running ${testFile}:`, error);
      resolve(1);
    });
  });
}

async function runTestSuite(suiteName: string): Promise<void> {
  const suite = testSuites.find(s => s.name === suiteName);
  
  if (!suite) {
    console.error(`❌ Unknown test suite: ${suiteName}`);
    console.log('Available suites:', testSuites.map(s => s.name).join(', '));
    return;
  }
  
  console.log(`\n🚀 Running ${suite.name.toUpperCase()} tests`);
  console.log(`📝 ${suite.description}`);
  console.log(`⏱️  Estimated time: ${suite.estimatedTime}`);
  console.log();
  
  if (suite.requiresDevice) {
    const env = checkEnvironment();
    if (!env.valid) {
      console.log('⚠️  Warning: Device required but environment not fully configured');
      console.log('Some tests may be skipped or fail');
      console.log();
    }
  }
  
  const startTime = Date.now();
  const exitCode = await runJestTest(suite.file);
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  
  console.log(`⏱️  Total time: ${duration}s`);
  
  if (exitCode !== 0) {
    process.exit(exitCode);
  }
}

async function runAllTests(): Promise<void> {
  console.log('🚀 Running ALL P105 tests');
  console.log();
  
  const env = checkEnvironment();
  if (!env.valid) {
    console.log('⚠️  Warning: Environment not fully configured');
    console.log('Device-dependent tests may be skipped or fail');
    console.log();
  }
  
  let totalFailures = 0;
  const startTime = Date.now();
  
  for (const suite of testSuites) {
    console.log(`\n📋 Running ${suite.name.toUpperCase()} tests...`);
    
    const suiteStartTime = Date.now();
    const exitCode = await runJestTest(suite.file);
    const suiteDuration = ((Date.now() - suiteStartTime) / 1000).toFixed(1);
    
    if (exitCode !== 0) {
      totalFailures++;
      console.log(`❌ ${suite.name} tests failed (${suiteDuration}s)`);
    } else {
      console.log(`✅ ${suite.name} tests passed (${suiteDuration}s)`);
    }
  }
  
  const totalDuration = ((Date.now() - startTime) / 60000).toFixed(1);
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total time: ${totalDuration} minutes`);
  console.log(`Test suites: ${testSuites.length - totalFailures}/${testSuites.length} passed`);
  
  if (totalFailures === 0) {
    console.log('🎉 All tests passed!');
  } else {
    console.log(`❌ ${totalFailures} test suite(s) failed`);
    process.exit(1);
  }
}

// Main execution
async function main() {
  printHeader();
  printEnvironmentStatus();
  
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command || command === 'help' || command === '--help' || command === '-h') {
    printTestSuites();
    console.log('Usage:');
    console.log('  ts-node test-runner.ts [suite-name]');
    console.log('  ts-node test-runner.ts all');
    console.log('  ts-node test-runner.ts help');
    console.log();
    console.log('Examples:');
    console.log('  ts-node test-runner.ts unit');
    console.log('  ts-node test-runner.ts integration');
    console.log('  ts-node test-runner.ts all');
    return;
  }
  
  if (command === 'all') {
    await runAllTests();
  } else {
    await runTestSuite(command);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Rejection:', reason);
  process.exit(1);
});

// Run the main function
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Test runner error:', error);
    process.exit(1);
  });
}

export { runTestSuite, runAllTests };