/**
 * Test Setup for Vitest Integration Tests
 *
 * This file is executed before all tests and sets up the global test environment,
 * including database connections, API client configurations, and cleanup utilities.
 */

import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { TestApiClient } from './utils/test-api-client';
import { DatabaseTestHelper } from './utils/database-test-helper';

// Global test configuration
const TEST_CONFIG = {
  API_BASE_URL: process.env.TEST_API_URL || 'http://localhost:8787',
  DATABASE_URL: process.env.TEST_DATABASE_URL,
  CLEANUP_AFTER_TESTS: process.env.CLEANUP_AFTER_TESTS !== 'false',
  VERBOSE_LOGGING: process.env.VERBOSE_TEST_LOGS === 'true',
  TEST_TIMEOUT: parseInt(process.env.TEST_TIMEOUT || '30000'),
};

// Global test utilities - initialize immediately
const globalApiClient = new TestApiClient(TEST_CONFIG.API_BASE_URL);
const globalDbHelper = new DatabaseTestHelper();

// Test state tracking
const testState = {
  isSetupComplete: false,
  createdResources: new Set<string>(),
  testStartTime: 0,
};

/**
 * Global setup - runs once before all tests
 */
beforeAll(async () => {
  testState.testStartTime = Date.now();

  if (TEST_CONFIG.VERBOSE_LOGGING) {
    console.log('🚀 Starting Mitra API Integration Tests');
    console.log('📋 Test Configuration:', {
      apiUrl: TEST_CONFIG.API_BASE_URL,
      cleanup: TEST_CONFIG.CLEANUP_AFTER_TESTS,
      timeout: TEST_CONFIG.TEST_TIMEOUT,
    });
  }

  // Wait for API to be ready
  if (TEST_CONFIG.VERBOSE_LOGGING) {
    console.log('⏳ Waiting for API to be ready...');
  }

  const isReady = await globalApiClient.waitForReady(30, 1000);
  if (!isReady) {
    throw new Error('API is not ready for testing. Make sure the worker is running locally.');
  }

  // Initialize database helper
  await globalDbHelper.initialize();

  // Perform initial cleanup using the API endpoint
  if (TEST_CONFIG.CLEANUP_AFTER_TESTS) {
    try {
      const cleanupResponse = await globalApiClient.delete('/api/test/cleanup');
      if (TEST_CONFIG.VERBOSE_LOGGING) {
        console.log('🧹 Initial cleanup completed:', cleanupResponse.body);
      }
    } catch (error) {
      console.warn('⚠️ Initial cleanup failed:', error);
    }
  }

  testState.isSetupComplete = true;

  if (TEST_CONFIG.VERBOSE_LOGGING) {
    console.log('✅ Test setup completed');
  }
}, TEST_CONFIG.TEST_TIMEOUT);

/**
 * Global teardown - runs once after all tests
 */
afterAll(async () => {
  if (TEST_CONFIG.VERBOSE_LOGGING) {
    const duration = Date.now() - testState.testStartTime;
    console.log(`🏁 Test suite completed in ${duration}ms`);
  }

  // Final cleanup
  if (TEST_CONFIG.CLEANUP_AFTER_TESTS && testState.isSetupComplete) {
    if (TEST_CONFIG.VERBOSE_LOGGING) {
      console.log('🧹 Performing final cleanup...');
    }

    try {
      await globalApiClient.delete('/api/test/cleanup');

      if (TEST_CONFIG.VERBOSE_LOGGING) {
        console.log('✅ Final cleanup completed');
      }
    } catch (error) {
      console.error('❌ Final cleanup failed:', error);
    }
  }

  if (TEST_CONFIG.VERBOSE_LOGGING) {
    console.log('👋 Test teardown completed');
  }
}, TEST_CONFIG.TEST_TIMEOUT);

/**
 * Setup before each test file
 */
beforeEach(async () => {
  // Ensure clean state for each test
  if (TEST_CONFIG.CLEANUP_AFTER_TESTS) {
    try {
      await globalApiClient.delete('/api/test/cleanup');
    } catch (error) {
      if (TEST_CONFIG.VERBOSE_LOGGING) {
        console.warn('⚠️ Pre-test cleanup failed:', error);
      }
    }
  }
});

/**
 * Cleanup after each test file
 */
afterEach(async () => {
  // Optional: Add per-test cleanup logic here
  if (TEST_CONFIG.VERBOSE_LOGGING) {
    // Log test completion
  }
});

/**
 * Global test utilities available to all tests
 */
declare global {
  var testApiClient: TestApiClient;
  var testDbHelper: DatabaseTestHelper;
  var testConfig: typeof TEST_CONFIG;
}

// Make utilities globally available
globalThis.testApiClient = globalApiClient;
globalThis.testDbHelper = globalDbHelper;
globalThis.testConfig = TEST_CONFIG;

/**
 * Helper function to track created resources for cleanup
 */
export function trackResource(resourceId: string, type: 'mitra' | 'service' | 'driver' | 'order') {
  testState.createdResources.add(`${type}:${resourceId}`);
}

/**
 * Helper function to clean up tracked resources
 */
export async function cleanupTrackedResources() {
  const resources = Array.from(testState.createdResources);

  for (const resource of resources) {
    const [type, id] = resource.split(':');

    try {
      switch (type) {
        case 'mitra':
          // Cleanup will be handled by database helper
          break;
        case 'service':
          // Cleanup will be handled by database helper
          break;
        case 'driver':
          // Cleanup will be handled by database helper
          break;
        case 'order':
          // Cleanup will be handled by database helper
          break;
      }
    } catch (error) {
      if (TEST_CONFIG.VERBOSE_LOGGING) {
        console.warn(`Failed to cleanup ${type} ${id}:`, error);
      }
    }
  }

  testState.createdResources.clear();
}

/**
 * Helper function to create test isolation
 */
export function createTestIsolation() {
  return {
    async setup() {
      await globalDbHelper.cleanupTestData();
    },
    async teardown() {
      await cleanupTrackedResources();
      await globalDbHelper.cleanupTestData();
    },
  };
}

/**
 * Helper function to get database statistics for debugging
 */
export async function getTestDatabaseStats() {
  return await globalDbHelper.getDatabaseStats();
}

/**
 * Helper function to verify test environment
 */
export async function verifyTestEnvironment() {
  const checks = {
    apiReady: false,
    databaseConnected: false,
    cleanState: false,
  };

  try {
    // Check API
    const healthResponse = await globalApiClient.healthCheck();
    checks.apiReady = healthResponse.ok;

    // Check database
    const stats = await globalDbHelper.getDatabaseStats();
    checks.databaseConnected = stats.recordCounts !== null;

    // Check clean state
    const integrity = await globalDbHelper.verifyDataIntegrity();
    checks.cleanState = integrity.isValid;

    return {
      allPassed: Object.values(checks).every(Boolean),
      checks,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      allPassed: false,
      checks,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

// Export configuration for tests that need it
export { TEST_CONFIG };

// Log setup completion
if (TEST_CONFIG.VERBOSE_LOGGING) {
  console.log('📝 Test setup file loaded');
}
