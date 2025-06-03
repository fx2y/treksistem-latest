# NEED HUMAN WISDOM: Staging URL Configuration

## Context

The staging QA process has been implemented with placeholder URLs that need to be updated with actual staging deployment URLs. This requires human intervention to configure the correct URLs after the staging environment is deployed.

## Required Actions

### 1. Update Postman Environment

**File**: `postman/Staging_Sandbox.postman_environment.json`

**Current placeholder**:

```json
"value": "https://treksistem-api-staging.youraccount.workers.dev"
```

**Action needed**:

1. Deploy the staging worker using: `pnpm deploy:staging`
2. Note the actual staging worker URL from the deployment output
3. Update the `baseUrl` value in the Postman environment file
4. Replace `youraccount` with your actual Cloudflare account subdomain

### 2. Update QA Verification Script

**File**: `scripts/staging-qa-verify.sh`

**Current placeholder**:

```bash
STAGING_WORKER_URL="https://treksistem-api-staging.youraccount.workers.dev"
```

**Action needed**:

1. Update the `STAGING_WORKER_URL` variable with the actual staging worker URL
2. This should match the URL updated in the Postman environment

### 3. Configure Frontend Staging URLs

**Files to update**:

- `docs/QA_CHECKLIST_STAGING.md`
- `docs/STAGING_QA_PROCESS.md`

**Current placeholders**:

```
- Mitra Admin: https://fe-mitra-admin-staging.pages.dev
- Driver View: https://fe-driver-view-staging.pages.dev
- User Public: https://fe-user-public-staging.pages.dev
```

**Action needed**:

1. Deploy frontend apps to Cloudflare Pages staging environments
2. Note the actual staging URLs for each frontend app
3. Update all documentation with the correct URLs

### 4. Configure Cloudflare Access for Staging

**Action needed**:

1. Set up Cloudflare Access for the staging environment
2. Configure appropriate access policies for staging users
3. Update the `stagingUserEmail` in the Postman environment with an email that has access rights
4. Test authentication flow with the staging environment

### 5. Verify Database and R2 Configuration

**Action needed**:

1. Ensure staging D1 database is created and migrations are applied:
   ```bash
   pnpm db:migrate:staging
   ```
2. Verify staging R2 bucket is created and accessible
3. Test file upload functionality in staging environment

## Verification Steps

After updating the URLs, run the following to verify the configuration:

1. **Test staging worker health**:

   ```bash
   curl https://your-actual-staging-worker-url.workers.dev/api/health
   ```

2. **Run staging API tests**:

   ```bash
   pnpm test:api:staging
   ```

3. **Run full staging QA verification**:
   ```bash
   pnpm qa:staging
   ```

## Expected Outcomes

- [ ] Staging worker URL is accessible and returns health check
- [ ] Postman environment configured with correct staging URL
- [ ] API tests run successfully against staging environment
- [ ] Frontend applications are accessible at staging URLs
- [ ] Authentication works correctly in staging environment
- [ ] File upload functionality works with staging R2 bucket

## Notes

- Keep the staging environment isolated from production data
- Use staging-specific test data for QA processes
- Monitor staging environment performance and costs
- Document any staging-specific configuration differences

## Next Steps After Configuration

1. Run initial staging QA verification
2. Execute manual QA checklist
3. Document any issues found during initial staging testing
4. Set up monitoring for staging environment health
5. Establish regular staging QA schedule

## Contact

If you encounter issues during staging URL configuration:

1. Check Cloudflare dashboard for deployment status
2. Verify wrangler configuration in `wrangler.jsonc`
3. Ensure all environment variables are properly set
4. Check Cloudflare Access configuration for staging
