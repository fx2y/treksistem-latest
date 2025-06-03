# Rate Limiting Deployment Checklist

## Pre-Deployment Verification

### 1. Code Review and Testing
- [ ] **TypeScript Compilation**: Ensure all TypeScript errors are resolved
  ```bash
  cd apps/worker && npm run type-check
  ```

- [ ] **Local Testing**: Test rate limiting middleware locally
  ```bash
  cd apps/worker && npm run dev
  # Test with: node scripts/verify-rate-limits.js --env local --endpoint orders --verbose
  ```

- [ ] **Unit Tests**: Run existing tests to ensure no regressions
  ```bash
  npm run test
  ```

### 2. Environment Configuration
- [ ] **Worker Names**: Verify correct worker names in `wrangler.jsonc`
  - Production: `treksistem-api`
  - Staging: `treksistem-api-staging`

- [ ] **Environment Variables**: Ensure all required environment variables are set
  - Database connection strings
  - R2 bucket configurations
  - Authentication secrets

## Deployment Steps

### Phase 1: Staging Deployment
- [ ] **Deploy to Staging**
  ```bash
  cd apps/worker
  npm run deploy:staging
  ```

- [ ] **Verify Staging Deployment**
  ```bash
  curl -I https://treksistem-api-staging.abdullah-dev.workers.dev/api/admin/health
  ```

- [ ] **Test Rate Limiting on Staging**
  ```bash
  node scripts/verify-rate-limits.js --env staging --endpoint orders --verbose
  node scripts/verify-rate-limits.js --env staging --endpoint generalApi --verbose
  ```

- [ ] **Monitor Staging Logs**
  ```bash
  wrangler tail treksistem-api-staging --format pretty
  ```

### Phase 2: Cloudflare WAF Configuration

#### Staging WAF Rules
- [ ] **Navigate to Cloudflare Dashboard** → Security → WAF → Custom Rules

- [ ] **Create Staging Rate Limiting Rules**:

  **Rule 1: Order Placement (Staging)**
  - Name: `Rate Limit - Order Placement - Staging`
  - Expression: `(http.request.uri.path eq "/api/orders" and http.request.method eq "POST" and http.host contains "staging")`
  - Action: `Block`
  - Rate Limiting: `20 requests per 1 minute`
  - Response: Custom JSON with 429 status

  **Rule 2: Mitra Profile Creation (Staging)**
  - Name: `Rate Limit - Mitra Profile - Staging`
  - Expression: `(http.request.uri.path eq "/api/mitra/profile" and http.request.method eq "POST" and http.host contains "staging")`
  - Action: `Block`
  - Rate Limiting: `4 requests per 10 minutes`

  **Rule 3: R2 Upload URLs (Staging)**
  - Name: `Rate Limit - Upload URLs - Staging`
  - Expression: `(http.request.uri.path matches "/api/driver/.*/orders/.*/request-upload-url" and http.request.method eq "POST" and http.host contains "staging")`
  - Action: `Block`
  - Rate Limiting: `40 requests per 1 minute`

  **Rule 4: Service Management (Staging)**
  - Name: `Rate Limit - Service Management - Staging`
  - Expression: `((http.request.uri.path eq "/api/mitra/services" or http.request.uri.path eq "/api/mitra/drivers") and http.request.method eq "POST" and http.host contains "staging")`
  - Action: `Block`
  - Rate Limiting: `30 requests per 1 minute`

  **Rule 5: General API (Staging)**
  - Name: `Rate Limit - General API - Staging`
  - Expression: `(http.request.uri.path matches "/api/.*" and http.host contains "staging")`
  - Action: `Block`
  - Rate Limiting: `500 requests per 1 minute`

- [ ] **Test WAF Rules on Staging**
  ```bash
  node scripts/verify-rate-limits.js --env staging --endpoint all --max-requests 25
  ```

#### Production WAF Rules
- [ ] **Create Production Rate Limiting Rules** (Only after staging validation):

  **Rule 1: Order Placement (Production)**
  - Name: `Rate Limit - Order Placement - Production`
  - Expression: `(http.request.uri.path eq "/api/orders" and http.request.method eq "POST" and not http.host contains "staging")`
  - Action: `Block`
  - Rate Limiting: `10 requests per 1 minute`

  **Rule 2: Mitra Profile Creation (Production)**
  - Name: `Rate Limit - Mitra Profile - Production`
  - Expression: `(http.request.uri.path eq "/api/mitra/profile" and http.request.method eq "POST" and not http.host contains "staging")`
  - Action: `Block`
  - Rate Limiting: `2 requests per 10 minutes`

  **Rule 3: R2 Upload URLs (Production)**
  - Name: `Rate Limit - Upload URLs - Production`
  - Expression: `(http.request.uri.path matches "/api/driver/.*/orders/.*/request-upload-url" and http.request.method eq "POST" and not http.host contains "staging")`
  - Action: `Block`
  - Rate Limiting: `20 requests per 1 minute`

  **Rule 4: Service Management (Production)**
  - Name: `Rate Limit - Service Management - Production`
  - Expression: `((http.request.uri.path eq "/api/mitra/services" or http.request.uri.path eq "/api/mitra/drivers") and http.request.method eq "POST" and not http.host contains "staging")`
  - Action: `Block`
  - Rate Limiting: `15 requests per 1 minute`

  **Rule 5: General API (Production)**
  - Name: `Rate Limit - General API - Production`
  - Expression: `(http.request.uri.path matches "/api/.*" and not http.host contains "staging")`
  - Action: `Block`
  - Rate Limiting: `200 requests per 1 minute`

### Phase 3: Production Deployment
- [ ] **Deploy to Production**
  ```bash
  cd apps/worker
  npm run deploy:production
  ```

- [ ] **Verify Production Deployment**
  ```bash
  curl -I https://treksistem-api.abdullah-dev.workers.dev/api/admin/health
  ```

- [ ] **Test Rate Limiting on Production** (Carefully!)
  ```bash
  node scripts/verify-rate-limits.js --env production --endpoint generalApi --max-requests 5 --verbose
  ```

## Post-Deployment Monitoring

### 1. Immediate Monitoring (First 24 hours)
- [ ] **Monitor Cloudflare Analytics**
  - Check rate limiting rule triggers
  - Monitor blocked vs allowed requests
  - Review error rates

- [ ] **Monitor Worker Logs**
  ```bash
  wrangler tail treksistem-api --format pretty
  wrangler tail treksistem-api-staging --format pretty
  ```

- [ ] **Check Rate Limit Statistics**
  ```bash
  curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
    https://treksistem-api.abdullah-dev.workers.dev/api/admin/rate-limit-stats
  ```

### 2. Application Metrics
- [ ] **Monitor API Response Times**
  - Ensure rate limiting doesn't significantly impact performance
  - Check for any unexpected latency increases

- [ ] **Monitor Error Rates**
  - Track 429 (Too Many Requests) responses
  - Ensure legitimate requests aren't being blocked

- [ ] **Monitor Business Metrics**
  - Order placement success rates
  - User experience impact
  - Customer support tickets related to rate limiting

### 3. Weekly Review
- [ ] **Analyze Rate Limiting Effectiveness**
  - Review blocked request patterns
  - Identify potential abuse attempts
  - Assess if limits need adjustment

- [ ] **Performance Impact Assessment**
  - Compare API performance before/after implementation
  - Review resource usage (CPU, memory)
  - Check for any unexpected bottlenecks

## Rollback Plan

### If Issues Occur:
1. **Immediate Actions**:
   - [ ] Disable Cloudflare WAF rules (primary protection)
   - [ ] Set `RATE_LIMITING_ENABLED=false` in worker environment variables
   - [ ] Monitor for immediate improvement

2. **Gradual Rollback**:
   - [ ] Revert worker deployment to previous version
   - [ ] Remove rate limiting middleware from codebase
   - [ ] Deploy clean version

3. **Communication**:
   - [ ] Notify stakeholders of rollback
   - [ ] Document issues encountered
   - [ ] Plan remediation strategy

## Success Criteria

### Technical Metrics
- [ ] **Zero False Positives**: No legitimate requests blocked
- [ ] **Performance Impact**: <10ms additional latency
- [ ] **Availability**: 99.9% uptime maintained
- [ ] **Error Rate**: <0.1% increase in 5xx errors

### Security Metrics
- [ ] **Abuse Prevention**: Demonstrable reduction in API abuse
- [ ] **Resource Protection**: Stable resource usage under load
- [ ] **Attack Mitigation**: Successful blocking of rate-based attacks

### Business Metrics
- [ ] **User Experience**: No negative impact on legitimate users
- [ ] **Order Success Rate**: Maintained or improved
- [ ] **Support Tickets**: No increase in rate-limiting related issues

## Documentation Updates
- [ ] **Update API Documentation**: Include rate limiting information
- [ ] **Update Developer Guides**: Add rate limiting best practices
- [ ] **Create Troubleshooting Guide**: For rate limiting issues
- [ ] **Update Monitoring Runbooks**: Include rate limiting metrics

## Final Sign-off
- [ ] **Technical Lead Approval**: Code review and architecture approval
- [ ] **Security Team Approval**: Security configuration review
- [ ] **Operations Team Approval**: Monitoring and alerting setup
- [ ] **Product Team Approval**: Business impact assessment

---

**Deployment Date**: ___________
**Deployed By**: ___________
**Reviewed By**: ___________
**Production Ready**: [ ] Yes [ ] No 