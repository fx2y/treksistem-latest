# Treksistem Development Workflow & QA Integration

This document outlines the complete development workflow for Treksistem, integrating quality assurance throughout the feature development lifecycle.

## Quick Start for Developers

### Daily Development Setup

```bash
# 1. Start development environment
pnpm turbo dev

# 2. Verify everything is running
pnpm health:check

# 3. Run API verification (optional, but recommended)
pnpm test:api:local
```

### Pre-Commit Workflow

```bash
# Before committing any changes
pnpm ci:pre-commit     # Type check + lint
pnpm test:api:local    # Verify API contracts
git add .
git commit -m "feat: your changes"
```

## Feature Development Lifecycle

### 1. 🚀 Feature Branch Creation

```bash
git checkout -b feature/your-feature-name
# Start making changes...
```

### 2. 🔄 During Development

#### Continuous Verification

- **Hot reload testing**: Use UI to test changes immediately
- **API endpoint testing**: Use Postman collection for rapid API testing
- **Error handling**: Test edge cases as you develop

#### Quick Health Checks

```bash
# Verify worker health
curl http://localhost:8787/api/health

# Test specific endpoint manually
curl -H "X-Mock-User-Email: qa-admin@treksistem.com" \
     http://localhost:8787/api/mitra/profile
```

### 3. 🧪 Pre-Review QA Process

#### Automated API Verification

```bash
# Full API test suite with detailed reporting
pnpm test:api:local

# View detailed HTML report
open postman/report.html
```

#### Manual Testing Checklist

Follow relevant sections in [`QA_CHECKLIST_LOCAL.md`](./QA_CHECKLIST_LOCAL.md) based on your changes:

**For Backend API Changes:**

- [ ] Health check passes
- [ ] Authentication flows work
- [ ] New endpoints validate correctly
- [ ] Error handling behaves as expected
- [ ] Database operations are atomic

**For Frontend Changes:**

- [ ] Mobile responsive design
- [ ] Desktop layout integrity
- [ ] Form validation works
- [ ] Error states display correctly
- [ ] Integration with backend APIs

**For Business Logic Changes:**

- [ ] Service configuration validation
- [ ] Order placement flow
- [ ] Driver workflow integration
- [ ] File upload functionality
- [ ] Status tracking accuracy

### 4. ✅ Ready for Review Criteria

**Must Pass:**

- [ ] `pnpm test:api:local` shows 100% success rate
- [ ] No console errors during manual testing
- [ ] Relevant QA checklist items completed
- [ ] Pre-commit hooks pass
- [ ] Documentation updated (if needed)

**Quality Gates:**

```bash
# All of these should pass
pnpm ci:pre-commit     # ✅ Linting & type checking
pnpm test:api:local    # ✅ API contract verification
pnpm ci:build-check    # ✅ Build verification
```

## API Testing Strategies

### 1. **Rapid Development Testing**

Use Postman Desktop for interactive API testing:

- Import `postman/Treksistem_API_Working.postman_collection.json`
- Use `postman/Local_Dev.postman_environment.json`
- Run individual requests or folders as needed

### 2. **Comprehensive Verification**

Use Newman for full automated testing:

```bash
pnpm test:api:local
```

### 3. **Custom Endpoint Testing**

For new endpoints, add to the Postman collection:

```javascript
// Test template for new endpoints
pm.test('New endpoint works', () => {
  pm.response.to.have.status(200);
  const response = pm.response.json();
  pm.expect(response.success).to.be.true;
  // Add specific validations
});
```

## Common Development Scenarios

### 🔧 Adding a New API Endpoint

1. **Implement endpoint** in worker
2. **Add to Postman collection** for testing
3. **Update QA checklist** if needed
4. **Run API verification**: `pnpm test:api:local`
5. **Update documentation**

### 🎨 Frontend Component Changes

1. **Test responsive behavior** on multiple viewports
2. **Verify API integration** still works
3. **Check error handling** displays correctly
4. **Test with real data** using development APIs

### 🔄 Business Logic Updates

1. **Test happy path** scenarios
2. **Verify edge cases** and error conditions
3. **Check data consistency** across services
4. **Validate integration points** (WA links, file uploads)

## Troubleshooting Common Issues

### API Tests Failing

```bash
# Check if services are running
pnpm health:check

# Restart development environment
# Kill any existing processes, then:
pnpm turbo dev

# Wait for services to start
sleep 15 && pnpm test:api:local
```

### Authentication Issues

```bash
# Verify mock authentication is working
curl -H "X-Mock-User-Email: test@example.com" \
     http://localhost:8787/api/mitra/profile

# Check wrangler.jsonc has WORKER_ENV: "development"
```

### Database State Issues

```bash
# Clear local D1 database if needed
rm -rf .wrangler/state/v3/d1/miniflare-D1DatabaseObject/*

# Restart worker to recreate schema
pnpm turbo dev
```

## Team Collaboration

### Code Review Guidelines

**For Reviewers:**

1. Check that API tests pass: `pnpm test:api:local`
2. Review relevant QA checklist completion
3. Test critical user flows manually
4. Verify responsive design on mobile

**For Authors:**

1. Include test results in PR description
2. Document any breaking changes
3. Update API collection if endpoints changed
4. Note any manual testing completed

### CI/CD Integration

Future enhancement - add to GitHub Actions:

```yaml
- name: API Verification
  run: |
    pnpm install
    pnpm turbo dev &
    sleep 15
    pnpm test:api:local
```

## Quality Metrics

### Success Criteria

- **API Tests**: 100% pass rate
- **Manual Tests**: All relevant checklist items ✅
- **Build Process**: Clean build with no warnings
- **Performance**: Response times < 500ms for critical endpoints

### Monitoring

- **Test Reports**: Generated in `postman/report.html`
- **Error Tracking**: Console errors during manual testing
- **Performance**: Response times in Newman output

## Advanced Testing Techniques

### Load Testing (Future)

```bash
# Example for load testing critical endpoints
newman run postman/Treksistem_API_Working.postman_collection.json \
  -e postman/Local_Dev.postman_environment.json \
  --iteration-count 100 \
  --delay-request 100
```

### Data-Driven Testing

- Use CSV files for test data variation
- Test with different user roles and permissions
- Validate with various geographic coordinates

### Security Testing

- Test CORS behavior
- Verify authentication bypass protection
- Check input sanitization
- Validate file upload security

## Continuous Improvement

### Collection Maintenance

- **Weekly**: Review and update test assertions
- **Monthly**: Add tests for common bug patterns
- **Per Release**: Expand coverage for new features

### Process Optimization

- **Identify repetitive manual tests** → Automate in collection
- **Track common failure patterns** → Add preventive tests
- **Monitor test execution time** → Optimize slow tests

This workflow ensures high-quality deliverables while maintaining development velocity and providing comprehensive coverage of both functional and integration testing scenarios.
