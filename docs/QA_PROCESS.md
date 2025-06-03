# Treksistem QA Process & API Verification

This document outlines the complete quality assurance process for Treksistem, combining manual testing with programmatic API verification.

## Overview

The QA process consists of two complementary approaches:

1. **Manual Testing**: Critical user flows tested through the UI and direct API calls
2. **Programmatic API Verification**: Automated testing using Postman/Newman collections

## Prerequisites

### Required Tools

- **Postman Desktop App**: For collection development and manual API testing
- **Newman**: Command-line runner for Postman collections (installed as dev dependency)
- **Local Development Environment**: All services running via `pnpm turbo dev`

### Environment Setup

```bash
# Install dependencies (Newman included)
pnpm install

# Start all development servers
pnpm turbo dev

# Verify worker is running
curl http://localhost:8787/api/health
```

## Manual Testing Process

### 1. Pre-Testing Checklist

Follow the comprehensive checklist in [`QA_CHECKLIST_LOCAL.md`](./QA_CHECKLIST_LOCAL.md):

- [ ] Environment setup verification
- [ ] Mitra admin flow (profile, services, drivers, orders)
- [ ] End user flow (service discovery, order placement, tracking)
- [ ] Driver flow (order management, status updates, photo uploads)
- [ ] Security & error handling validation
- [ ] Frontend responsiveness testing
- [ ] Integration points verification
- [ ] Data consistency checks

### 2. Testing Protocol

1. **Execute relevant test cases** based on feature changes
2. **Document any issues** found during testing
3. **Verify error handling** for edge cases
4. **Test responsive behavior** on multiple viewport sizes
5. **Validate integration points** (WA deep links, file uploads)

## Programmatic API Verification

### Postman Collection Structure

The collection (`postman/Treksistem_API.postman_collection.json`) is organized by functional areas:

```
📁 Treksistem API Collection
├── 🏥 Health Check
├── 👤 Mitra Profile Management
├── 🛠️ Service Management
├── 🚗 Driver Management
├── 🌐 Public APIs
├── 📦 Order Placement & Tracking
├── 📊 Mitra Order Management
├── 🚀 Driver APIs
└── ❌ Error Handling Tests
```

### Key Features

#### Request Chaining

- **Dynamic Variables**: Test data flows between requests
- **Environment Variables**: IDs captured and reused (mitraId, serviceId, driverId, orderId)
- **Pre-request Scripts**: Timestamp generation, data preparation

#### Comprehensive Testing

- **Status Code Validation**: Each request verifies expected HTTP status
- **Response Structure**: JSON schema validation using Postman tests
- **Business Logic**: Specific data validation (cost calculation, status transitions)
- **Error Scenarios**: Invalid inputs, unauthorized access, missing resources

#### Real-world Test Data

- **Service Configuration**: Complete configJson with realistic pricing models
- **Order Placement**: Geographic coordinates (Monas to Grand Indonesia)
- **Driver Operations**: Photo upload simulation, status progression

### Running API Tests

#### Local Development Testing

```bash
# Run complete API test suite
pnpm test:api:local

# View detailed HTML report
open postman/report.html
```

#### Manual Postman Testing

1. **Import Collection**: Import `postman/Treksistem_API.postman_collection.json`
2. **Import Environment**: Import `postman/Local_Dev.postman_environment.json`
3. **Run Collection**: Execute entire collection or specific folders
4. **Review Results**: Check test results in Postman console

### Test Scenarios Covered

#### Happy Path Flow

1. **Setup**: Create Mitra profile, service, and driver
2. **Service Assignment**: Assign driver to service
3. **Order Creation**: Place order with talangan
4. **Order Assignment**: Mitra assigns qualified driver
5. **Driver Workflow**: Accept → Update statuses → Upload photos → Deliver
6. **Tracking**: Verify customer can track progress

#### Error Handling

- **Authentication**: Unauthorized access attempts
- **Validation**: Invalid data payloads
- **Business Rules**: Constraint violations
- **Not Found**: Nonexistent resource access

#### Edge Cases

- **Malformed JSON**: Invalid request payloads
- **Schema Violations**: Data not matching Zod schemas
- **State Transitions**: Invalid order status changes
- **File Uploads**: Large files, wrong types

## QA Sign-off Process

### Developer Responsibility

Before marking a feature branch as ready for review:

1. **Manual Testing**: Execute relevant QA checklist items
2. **API Verification**: Run `pnpm test:api:local` with all tests passing
3. **Documentation**: Update any affected documentation
4. **Pre-commit Hooks**: Ensure all automated checks pass

### Review Criteria

**✅ Ready for Review**

- All relevant manual tests passed
- Newman collection tests passing (100% success rate)
- No console errors during UI testing
- Error handling behaves as expected
- Responsive design verified on key viewports

**❌ Needs Additional Work**

- Failed test cases in manual or automated testing
- Console errors present
- Poor error messaging
- Responsive issues on mobile/tablet
- Integration points not working

## Continuous Improvement

### Collection Maintenance

- **Add tests** for new API endpoints
- **Update test data** when schemas change
- **Enhance error scenarios** based on production issues
- **Optimize test execution** time while maintaining coverage

### Process Enhancement

- **Expand manual checklist** for new features
- **Automate repetitive** manual test cases
- **Integrate with CI/CD** pipeline for automated verification
- **Add performance testing** for critical endpoints

## Troubleshooting

### Common Issues

#### Newman Test Failures

```bash
# Check if worker is running
curl http://localhost:8787/api/health

# Verify environment variables
cat postman/Local_Dev.postman_environment.json

# Run with verbose logging
pnpm test:api:local --verbose
```

#### Authentication Errors

- Verify `X-Mock-User-Email` header is set correctly
- Check local auth bypass is working in worker
- Ensure environment variables are populated

#### Test Data Issues

- Clear browser storage between test runs
- Reset local database if needed
- Verify test data follows current schema requirements

### Environment Variables

| Variable        | Purpose                        | Example                   |
| --------------- | ------------------------------ | ------------------------- |
| `baseUrl`       | Worker API endpoint            | `http://localhost:8787`   |
| `mockUserEmail` | Mock auth email                | `qa-admin@treksistem.com` |
| `mitraId`       | Dynamic - created during tests | `cm1abc123...`            |
| `serviceId`     | Dynamic - service creation     | `cm1xyz789...`            |
| `driverId`      | Dynamic - driver creation      | `cm1def456...`            |
| `orderId`       | Dynamic - order placement      | `cm1ghi123...`            |

## Integration with Development Workflow

### Git Hooks Integration

Consider adding to `.husky/pre-push`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run API tests before pushing
pnpm test:api:local
```

### CI/CD Pipeline

Future enhancement: Include Newman tests in GitHub Actions:

```yaml
- name: Run API Tests
  run: |
    pnpm install
    pnpm turbo dev &
    sleep 10  # Wait for services to start
    pnpm test:api:local
```

This QA process ensures consistent quality while maintaining developer velocity and providing comprehensive coverage of both UI/UX and API contract validation.
