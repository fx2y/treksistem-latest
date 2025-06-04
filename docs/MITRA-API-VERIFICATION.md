# Mitra API Verification System

This document provides comprehensive instructions for verifying the Mitra Service Configuration API (IS7) and Mitra Driver Management API (IS8) through programmatic testing.

## Overview

The verification system implements exhaustive testing of:

- **IS7: Mitra Service Configuration API** - Service CRUD operations, complex JSON validation, authorization
- **IS8: Mitra Driver Management API** - Driver CRUD operations, service assignments, data integrity
- **Business Logic Validation** - Authorization scoping, data constraints, relationship integrity
- **Edge Cases** - Invalid inputs, boundary conditions, error handling

## Quick Start

### Prerequisites

1. **Worker Running Locally**
   ```bash
   cd apps/worker
   pnpm dev
   ```
   The worker should be accessible at `http://localhost:8787`

2. **Dependencies Installed**
   ```bash
   pnpm install
   ```

3. **Database Migrations Applied**
   ```bash
   pnpm db:migrate:dev
   ```

### Running Verification Tests

#### Basic Verification
```bash
cd apps/worker
pnpm test:verify
```

#### Verbose Output
```bash
pnpm test:verify:verbose
```

#### Specific API Verification
```bash
# Service Configuration API (IS7) only
pnpm verify:is7

# Driver Management API (IS8) only  
pnpm verify:is8

# All APIs with full coverage
pnpm verify:all
```

#### Watch Mode for Development
```bash
pnpm test:verify:watch
```

## Test Structure

### Test Categories

#### I. Mitra Profile Prerequisites
- Profile creation and retrieval
- Duplicate profile handling
- Profile updates
- Authentication flow validation

#### II. Service Configuration API (IS7)
- **2.1-2.2**: Service creation with valid/invalid configurations
- **2.3-2.4**: Service listing with proper isolation
- **2.5-2.6**: Service retrieval with ownership validation
- **2.7-2.8**: Service updates with authorization checks
- **2.9-2.10**: Service deletion with constraint handling

#### III. Driver Management API (IS8)
- **3.1-3.3**: Driver creation with identifier uniqueness
- **3.4-3.6**: Driver listing and retrieval with ownership
- **3.7**: Driver updates
- **3.8-3.13**: Service assignment operations
- **3.14**: Driver deletion with cascade verification

#### IV. Data Integrity & Business Logic
- **4.1**: Complex service configuration validation
- **4.2**: Edge case handling
- **4.3**: Driver configuration validation
- **4.4**: Cross-resource relationship integrity

### Test Data Patterns

The verification system uses specific test data patterns:

```typescript
// Test user emails
const MITRA1_EMAIL = 'mitra-test-1@example.com';
const MITRA2_EMAIL = 'mitra-test-2@example.com';

// Service configurations
- Valid Ojek service with pricing models
- Complex ambulance service with specialized config
- Invalid configurations for validation testing

// Driver configurations  
- Basic motorcycle driver
- Complex ambulance driver with certifications
- Edge case configurations
```

## Verification Scenarios

### Authorization Testing

Each test verifies proper authorization scoping:

```typescript
// ✅ Should succeed - Mitra accessing own resources
GET /api/mitra/services (with Mitra1 auth) → Returns Mitra1's services only

// ❌ Should fail - Mitra accessing other's resources  
GET /api/mitra/services/service2_id (with Mitra1 auth, service2 owned by Mitra2) → 404
```

### Data Integrity Testing

```typescript
// Relationship integrity
POST /api/mitra/drivers/driver1/services { serviceId: service1 } → 201
DELETE /api/mitra/drivers/driver1 → 200
// Verify: driver_services records cascade deleted

// Constraint validation
POST /api/mitra/drivers { identifier: "duplicate@test.com" } → 201 (first time)
POST /api/mitra/drivers { identifier: "duplicate@test.com" } → 409 (duplicate)
```

### Complex Configuration Testing

```typescript
// Valid complex service config
{
  serviceTypeAlias: "Ambulans Darurat",
  modelBisnis: "PUBLIC_3RD_PARTY",
  pricing: {
    modelHargaJarak: "ZONA_ASAL_TUJUAN",
    zonaHarga: [
      { asalZona: "Jakarta Pusat", tujuanZona: "Bogor", harga: 150000 }
    ]
  },
  typeSpecificConfig: {
    type: "AMBULANCE",
    config: {
      isEmergencyService: true,
      medicalEquipmentLevel: "ADVANCED"
    }
  }
}
```

## Running Tests

### Command Line Options

```bash
# Basic verification
pnpm test:verify

# With verbose logging
pnpm test:verify:verbose

# Stop on first failure
pnpm test:verify:bail

# Filter specific tests
pnpm test:verify --filter "Service Configuration"

# Custom timeout
pnpm test:verify --timeout 60000

# Watch mode
pnpm test:verify:watch
```

### Environment Variables

```bash
# Enable verbose test logging
VERBOSE_TEST_LOGS=true pnpm test:verify

# Custom API URL
TEST_API_URL=http://localhost:8787 pnpm test:verify

# Disable cleanup (for debugging)
CLEANUP_AFTER_TESTS=false pnpm test:verify

# Custom timeout
TEST_TIMEOUT=60000 pnpm test:verify
```

### Direct Vitest Commands

```bash
# Run specific test file
pnpm vitest src/test/integration/mitra-api-verification.test.ts

# Run with coverage
pnpm vitest --coverage src/test/integration/

# Run in UI mode
pnpm vitest --ui src/test/integration/
```

## Interpreting Results

### Success Output

```
🚀 Starting Mitra API Verification Tests
============================================================
📋 Checking prerequisites...
✅ Worker API is running
✅ Test files found
✅ Dependencies verified

🧪 Running tests...

📊 Test Results Summary
============================================================
✅ Overall Status: PASSED
⏱️  Duration: 45.23s

📈 Test Statistics:
   Total Tests: 28
   ✅ Passed: 28
   ❌ Failed: 0
   ⏭️  Skipped: 0

📊 Coverage Report:
   Statements: 85.4%
   Branches: 78.2%
   Functions: 92.1%
   Lines: 84.7%

✅ Verification Checklist:
   📋 Mitra Profile Management
   🔧 Service Configuration API (IS7)
   👥 Driver Management API (IS8)
   🔐 Authorization & Ownership
   📊 Data Integrity & Constraints
   🔄 Business Logic Validation

🎉 All verification tests passed!
   The Mitra Service & Driver Management APIs are working correctly.
```

### Failure Output

```
❌ Overall Status: FAILED
⏱️  Duration: 32.15s

📈 Test Statistics:
   Total Tests: 28
   ✅ Passed: 25
   ❌ Failed: 3
   ⏭️  Skipped: 0

❌ Errors and Failures:
   1. FAIL src/test/integration/mitra-api-verification.test.ts > Service Configuration API > Create Valid Service
   2. Expected status 201, received 400
   3. Validation error: configJson.pricing.biayaPerKm is required

🔧 Next Steps:
   1. Review failed tests above
   2. Check API implementation
   3. Verify database schema
   4. Run tests with --verbose for details
```

## Troubleshooting

### Common Issues

#### 1. Worker Not Running
```
❌ Worker API is not running
   Please start the worker with: pnpm dev
```

**Solution:**
```bash
cd apps/worker
pnpm dev
```

#### 2. Database Connection Issues
```
DatabaseTestHelper: No database connection, skipping cleanup
```

**Solution:**
- Ensure D1 database is properly configured
- Check wrangler.toml configuration
- Verify migrations are applied

#### 3. Test Timeouts
```
Test timeout of 30000ms exceeded
```

**Solution:**
```bash
# Increase timeout
pnpm test:verify --timeout 60000

# Or set environment variable
TEST_TIMEOUT=60000 pnpm test:verify
```

#### 4. Port Conflicts
```
Error: connect ECONNREFUSED 127.0.0.1:8787
```

**Solution:**
- Check if another process is using port 8787
- Update TEST_API_URL if using different port
- Restart the worker

#### 5. Validation Errors
```
Expected status 201, received 400
Validation error: configJson.pricing.biayaPerKm is required
```

**Solution:**
- Check Zod schema definitions in `@treksistem/shared-types`
- Verify test data factory generates valid configurations
- Review API validation logic

### Debug Mode

Enable verbose logging for detailed debugging:

```bash
VERBOSE_TEST_LOGS=true pnpm test:verify:verbose
```

This provides:
- Detailed HTTP request/response logs
- Database operation logs
- Test setup/teardown information
- Timing information for each test

### Manual Testing

For manual verification, you can use the test utilities directly:

```typescript
import { TestApiClient } from './src/test/utils/test-api-client';
import { TestDataFactory } from './src/test/utils/test-data-factory';

const client = new TestApiClient('http://localhost:8787');
const factory = new TestDataFactory();

// Create test service
const servicePayload = factory.createValidServicePayload();
const response = await client.post('/api/mitra/services', servicePayload, {
  'Cf-Access-Authenticated-User-Email': 'test@example.com'
});

console.log('Response:', response.status, response.body);
```

## Integration with CI/CD

### GitHub Actions

```yaml
name: Mitra API Verification
on: [push, pull_request]

jobs:
  verify-apis:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Start worker
        run: |
          cd apps/worker
          pnpm dev &
          sleep 10
      
      - name: Run verification tests
        run: |
          cd apps/worker
          pnpm test:verify:bail
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./apps/worker/coverage/lcov.info
```

### Pre-commit Hooks

Add to `.husky/pre-commit`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run Mitra API verification
cd apps/worker && pnpm test:verify:bail
```

## Performance Considerations

### Test Execution Time

- **Full verification**: ~45-60 seconds
- **Individual API tests**: ~15-20 seconds
- **Single test**: ~2-5 seconds

### Optimization Tips

1. **Use bail mode** for faster feedback:
   ```bash
   pnpm test:verify:bail
   ```

2. **Filter specific tests** during development:
   ```bash
   pnpm test:verify --filter "Service API"
   ```

3. **Disable coverage** for faster runs:
   ```bash
   pnpm test:verify --no-coverage
   ```

4. **Use watch mode** for iterative development:
   ```bash
   pnpm test:verify:watch
   ```

## Extending the Verification System

### Adding New Test Cases

1. **Add to existing test file:**
   ```typescript
   test('2.11: New Service Validation', async () => {
     // Test implementation
   });
   ```

2. **Create new test utilities:**
   ```typescript
   // In TestDataFactory
   createSpecialServicePayload() {
     return {
       // Special configuration
     };
   }
   ```

3. **Add database verification:**
   ```typescript
   // In DatabaseTestHelper
   async checkSpecialConstraint(id: string): Promise<boolean> {
     // Database check implementation
   }
   ```

### Custom Verification Scripts

Create custom verification scripts for specific scenarios:

```typescript
// scripts/verify-production-readiness.ts
import { MitraApiVerificationRunner } from '../apps/worker/src/test/run-verification';

const runner = new MitraApiVerificationRunner({
  verbose: true,
  coverage: true,
  bail: true,
  timeout: 120000
});

const result = await runner.run();
if (!result.success) {
  console.error('Production readiness check failed');
  process.exit(1);
}
```

## Best Practices

### Test Development

1. **Follow the AAA pattern**: Arrange, Act, Assert
2. **Use descriptive test names** that explain the scenario
3. **Test both positive and negative cases**
4. **Verify data integrity** after operations
5. **Clean up test data** properly

### Data Management

1. **Use unique identifiers** for test data
2. **Implement proper cleanup** in teardown hooks
3. **Isolate tests** to prevent interference
4. **Use factories** for consistent test data generation

### Error Handling

1. **Test error conditions** explicitly
2. **Verify error response formats**
3. **Check HTTP status codes** and error messages
4. **Test edge cases** and boundary conditions

## Conclusion

The Mitra API Verification System provides comprehensive testing of the Service Configuration and Driver Management APIs, ensuring:

- ✅ **Functional Correctness** - All CRUD operations work as expected
- ✅ **Authorization Security** - Proper ownership and access control
- ✅ **Data Integrity** - Constraints and relationships are enforced
- ✅ **Business Logic** - Complex validation rules are applied
- ✅ **Error Handling** - Graceful handling of invalid inputs
- ✅ **Performance** - Reasonable response times under load

Run the verification tests regularly during development and before deployments to ensure API reliability and correctness. 