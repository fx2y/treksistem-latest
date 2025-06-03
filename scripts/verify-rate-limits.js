#!/usr/bin/env node

/**
 * Rate Limit Verification Script
 * 
 * Tests rate limiting functionality for Treksistem API endpoints
 * Supports both staging and production environments
 * 
 * Usage:
 *   node scripts/verify-rate-limits.js --env staging --endpoint orders
 *   node scripts/verify-rate-limits.js --env production --endpoint all --dry-run
 */

const https = require('https');
const http = require('http');

// Configuration
const CONFIG = {
  environments: {
    staging: {
      baseUrl: 'https://treksistem-api-staging.abdullah-dev.workers.dev',
      // Alternative: 'https://staging-api.treksistem.com'
    },
    production: {
      baseUrl: 'https://treksistem-api.abdullah-dev.workers.dev',
      // Alternative: 'https://api.treksistem.com'
    },
    local: {
      baseUrl: 'http://localhost:8787',
    },
  },
  
  endpoints: {
    orders: {
      path: '/api/orders',
      method: 'POST',
      payload: {
        serviceId: 'test-service-id',
        ordererIdentifier: '+6281234567890',
        receiverWaNumber: '+6281234567891',
        paymentMethod: 'CASH',
        isBarangPenting: false,
        details: {
          pickupAddress: {
            text: 'Test Pickup Address',
            addressText: 'Jl. Test Pickup No. 1',
            lat: -6.2088,
            lon: 106.8456,
          },
          dropoffAddress: {
            text: 'Test Dropoff Address', 
            addressText: 'Jl. Test Dropoff No. 2',
            lat: -6.1751,
            lon: 106.8650,
          },
          notes: 'Test order for rate limiting verification',
        },
      },
      expectedLimit: 10,
      windowSeconds: 60,
    },
    
    mitraProfile: {
      path: '/api/mitra/profile',
      method: 'POST',
      payload: {
        name: 'Test Mitra Profile',
        description: 'Test mitra for rate limiting',
        contactInfo: {
          phone: '+6281234567890',
          email: 'test@example.com',
        },
      },
      expectedLimit: 2,
      windowSeconds: 600, // 10 minutes
      requiresAuth: true,
    },
    
    mitraServices: {
      path: '/api/mitra/services',
      method: 'POST',
      payload: {
        name: 'Test Service',
        serviceTypeKey: 'DELIVERY',
        description: 'Test service for rate limiting',
      },
      expectedLimit: 15,
      windowSeconds: 60,
      requiresAuth: true,
    },
    
    mitraDrivers: {
      path: '/api/mitra/drivers',
      method: 'POST',
      payload: {
        name: 'Test Driver',
        phone: '+6281234567890',
        vehicleInfo: {
          type: 'MOTORCYCLE',
          plateNumber: 'B1234XYZ',
        },
      },
      expectedLimit: 15,
      windowSeconds: 60,
      requiresAuth: true,
    },
    
    uploadUrl: {
      path: '/api/driver/test-driver-id/orders/test-order-id/request-upload-url',
      method: 'POST',
      payload: {
        filename: 'test-image.jpg',
        contentType: 'image/jpeg',
        photoType: 'PICKUP_CONFIRMATION',
      },
      expectedLimit: 20,
      windowSeconds: 60,
      requiresAuth: true,
    },
    
    generalApi: {
      path: '/api/admin/rate-limit-stats',
      method: 'GET',
      payload: null,
      expectedLimit: 200,
      windowSeconds: 60,
      requiresAuth: true,
    },
  },
};

// Utility functions
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    env: 'staging',
    endpoint: 'orders',
    dryRun: false,
    verbose: false,
    maxRequests: null,
    delay: 1000, // 1 second between requests
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--env':
        options.env = args[++i];
        break;
      case '--endpoint':
        options.endpoint = args[++i];
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--max-requests':
        options.maxRequests = parseInt(args[++i]);
        break;
      case '--delay':
        options.delay = parseInt(args[++i]);
        break;
      case '--help':
        printHelp();
        process.exit(0);
        break;
    }
  }

  return options;
}

function printHelp() {
  console.log(`
Rate Limit Verification Script

Usage: node scripts/verify-rate-limits.js [options]

Options:
  --env <environment>     Target environment (staging, production, local)
  --endpoint <endpoint>   Endpoint to test (orders, serviceConfig, mitraProfile, uploadUrl, all)
  --dry-run              Show what would be tested without making requests
  --verbose              Show detailed request/response information
  --max-requests <num>   Maximum requests to send (default: 2x expected limit)
  --delay <ms>           Delay between requests in milliseconds (default: 1000)
  --help                 Show this help message

Examples:
  node scripts/verify-rate-limits.js --env staging --endpoint orders
  node scripts/verify-rate-limits.js --env production --endpoint all --dry-run
  node scripts/verify-rate-limits.js --env local --endpoint serviceConfig --verbose
  `);
}

function makeRequest(url, method, payload, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Treksistem-RateLimit-Tester/1.0',
        ...headers,
      },
    };

    if (payload) {
      const data = JSON.stringify(payload);
      options.headers['Content-Length'] = Buffer.byteLength(data);
    }

    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: body,
          parsed: (() => {
            try {
              return JSON.parse(body);
            } catch {
              return null;
            }
          })(),
        });
      });
    });

    req.on('error', reject);
    
    if (payload) {
      req.write(JSON.stringify(payload));
    }
    
    req.end();
  });
}

async function testEndpoint(baseUrl, endpointConfig, options) {
  const url = baseUrl + endpointConfig.path;
  const maxRequests = options.maxRequests || (endpointConfig.expectedLimit * 2);
  
  console.log(`\n🧪 Testing ${endpointConfig.path}`);
  console.log(`   Expected limit: ${endpointConfig.expectedLimit} requests per ${endpointConfig.windowSeconds}s`);
  console.log(`   Will send: ${maxRequests} requests with ${options.delay}ms delay`);
  
  if (options.dryRun) {
    console.log(`   [DRY RUN] Would test: ${endpointConfig.method} ${url}`);
    return;
  }

  const results = [];
  let rateLimitHit = false;
  let firstRateLimitAt = null;

  for (let i = 1; i <= maxRequests; i++) {
    try {
      const startTime = Date.now();
      const response = await makeRequest(
        url,
        endpointConfig.method,
        endpointConfig.payload
      );
      const duration = Date.now() - startTime;

      const result = {
        requestNumber: i,
        status: response.status,
        duration,
        rateLimitHeaders: {
          limit: response.headers['x-ratelimit-limit'],
          remaining: response.headers['x-ratelimit-remaining'],
          reset: response.headers['x-ratelimit-reset'],
          retryAfter: response.headers['retry-after'],
        },
        isRateLimited: response.status === 429,
      };

      results.push(result);

      // Log progress
      const statusIcon = response.status === 429 ? '🚫' : 
                        response.status < 400 ? '✅' : '❌';
      
      console.log(`   ${statusIcon} Request ${i}: ${response.status} (${duration}ms)`);
      
      if (options.verbose) {
        console.log(`      Rate limit headers: ${JSON.stringify(result.rateLimitHeaders)}`);
        if (response.parsed?.error) {
          console.log(`      Error: ${response.parsed.error.message}`);
        }
      }

      // Track when rate limiting starts
      if (response.status === 429 && !rateLimitHit) {
        rateLimitHit = true;
        firstRateLimitAt = i;
        console.log(`   🎯 Rate limit triggered at request ${i}`);
      }

      // Stop if we've confirmed rate limiting works
      if (rateLimitHit && i > firstRateLimitAt + 2) {
        console.log(`   ⏹️  Stopping test - rate limiting confirmed`);
        break;
      }

    } catch (error) {
      console.log(`   ❌ Request ${i} failed: ${error.message}`);
      results.push({
        requestNumber: i,
        error: error.message,
        isRateLimited: false,
      });
    }

    // Wait between requests
    if (i < maxRequests) {
      await new Promise(resolve => setTimeout(resolve, options.delay));
    }
  }

  // Analyze results
  console.log(`\n📊 Results for ${endpointConfig.path}:`);
  
  const successfulRequests = results.filter(r => r.status && r.status < 400).length;
  const rateLimitedRequests = results.filter(r => r.isRateLimited).length;
  const errorRequests = results.filter(r => r.status && r.status >= 400 && r.status !== 429).length;
  
  console.log(`   ✅ Successful requests: ${successfulRequests}`);
  console.log(`   🚫 Rate limited requests: ${rateLimitedRequests}`);
  console.log(`   ❌ Error requests: ${errorRequests}`);
  
  if (firstRateLimitAt) {
    const effectiveness = firstRateLimitAt <= endpointConfig.expectedLimit + 2 ? '✅' : '⚠️';
    console.log(`   ${effectiveness} Rate limiting triggered at request ${firstRateLimitAt} (expected: ~${endpointConfig.expectedLimit})`);
  } else {
    console.log(`   ⚠️  Rate limiting not triggered (may need more requests or longer test)`);
  }

  return {
    endpoint: endpointConfig.path,
    expectedLimit: endpointConfig.expectedLimit,
    actualLimitAt: firstRateLimitAt,
    totalRequests: results.length,
    successfulRequests,
    rateLimitedRequests,
    errorRequests,
    results,
  };
}

async function main() {
  const options = parseArgs();
  
  console.log('🚀 Treksistem Rate Limit Verification');
  console.log(`Environment: ${options.env}`);
  console.log(`Endpoint(s): ${options.endpoint}`);
  
  if (!CONFIG.environments[options.env]) {
    console.error(`❌ Unknown environment: ${options.env}`);
    console.error(`Available environments: ${Object.keys(CONFIG.environments).join(', ')}`);
    process.exit(1);
  }

  const baseUrl = CONFIG.environments[options.env].baseUrl;
  console.log(`Base URL: ${baseUrl}`);

  if (options.dryRun) {
    console.log('\n🔍 DRY RUN MODE - No actual requests will be made');
  }

  // Determine which endpoints to test
  const endpointsToTest = options.endpoint === 'all' 
    ? Object.keys(CONFIG.endpoints)
    : [options.endpoint];

  if (options.endpoint !== 'all' && !CONFIG.endpoints[options.endpoint]) {
    console.error(`❌ Unknown endpoint: ${options.endpoint}`);
    console.error(`Available endpoints: ${Object.keys(CONFIG.endpoints).join(', ')}, all`);
    process.exit(1);
  }

  const allResults = [];

  // Test each endpoint
  for (const endpointName of endpointsToTest) {
    const endpointConfig = CONFIG.endpoints[endpointName];
    
    if (endpointConfig.requiresAuth && options.env === 'production') {
      console.log(`\n⚠️  Skipping ${endpointName} in production (requires authentication)`);
      continue;
    }

    try {
      const result = await testEndpoint(baseUrl, endpointConfig, options);
      if (result) {
        allResults.push(result);
      }
    } catch (error) {
      console.error(`❌ Failed to test ${endpointName}: ${error.message}`);
    }
  }

  // Summary
  if (allResults.length > 0 && !options.dryRun) {
    console.log('\n📋 Summary:');
    allResults.forEach(result => {
      const status = result.actualLimitAt && 
        Math.abs(result.actualLimitAt - result.expectedLimit) <= 2 ? '✅' : '⚠️';
      console.log(`   ${status} ${result.endpoint}: Rate limited at ${result.actualLimitAt || 'N/A'} (expected: ${result.expectedLimit})`);
    });
  }

  console.log('\n✨ Rate limit verification complete!');
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error.message);
  process.exit(1);
});

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  });
}

module.exports = { testEndpoint, makeRequest, CONFIG }; 