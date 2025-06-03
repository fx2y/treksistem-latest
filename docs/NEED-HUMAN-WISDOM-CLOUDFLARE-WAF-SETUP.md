# NEED HUMAN WISDOM: Cloudflare WAF Rate Limiting Setup

## Overview

The rate limiting implementation is complete at the application level, but **requires manual configuration in the Cloudflare Dashboard** to set up WAF (Web Application Firewall) rate limiting rules. This document provides specific instructions for the human collaborator to complete the setup.

## What Has Been Implemented

✅ **Application-level rate limiting middleware** (`apps/worker/src/middleware/rate-limiting.ts`)
✅ **Comprehensive documentation** (`docs/RATE-LIMITING-SETUP.md`)
✅ **Verification script** (`scripts/verify-rate-limits.js`)
✅ **Integration with main application** (added to `apps/worker/src/index.ts`)
✅ **Admin monitoring endpoint** (`/api/admin/rate-limit-stats`)

## What Requires Human Action

❌ **Cloudflare WAF Rules Configuration** - Must be done manually in Cloudflare Dashboard
❌ **Domain/Worker URL Configuration** - Update scripts with actual URLs
❌ **Testing and Verification** - Run verification scripts after WAF setup

## Step-by-Step Instructions for Human Collaborator

### 1. Identify Your Worker URLs

First, determine your actual worker URLs:

**Production Worker:**
- Name: `treksistem-api` (from `wrangler.jsonc`)
- URL: `https://treksistem-api.YOUR_ACCOUNT.workers.dev`
- Or custom domain: `https://api.treksistem.com`

**Staging Worker:**
- Name: `treksistem-api-staging` (from `wrangler.jsonc`)
- URL: `https://treksistem-api-staging.YOUR_ACCOUNT.workers.dev`
- Or custom domain: `https://staging-api.treksistem.com`

### 2. Access Cloudflare Dashboard

1. Log into [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select your zone/domain
3. Navigate to **Security** → **WAF** → **Rate Limiting Rules**

### 3. Create Production Rate Limiting Rules

Create the following rules for your **production** environment. Replace `[YOUR_PRODUCTION_DOMAIN]` with your actual production worker URL:

#### Rule 1: Order Placement Protection
```
Name: Prod API - Order Placement Limit
Description: Protect order placement endpoint from spam and abuse

Traffic Matching:
- Field: Hostname
- Operator: equals
- Value: [YOUR_PRODUCTION_DOMAIN]

AND

- Field: URI Path
- Operator: equals
- Value: /api/orders

AND

- Field: HTTP Method
- Operator: equals
- Value: POST

Rate Limiting:
- Requests: 10
- Period: 1 minute
- Per: IP Address

Action: Block
Duration: 10 minutes
```

#### Rule 2: Mitra Profile Creation Protection
```
Name: Prod API - Profile Creation Limit
Description: Protect Mitra profile creation from bulk account attempts

Traffic Matching:
- Field: Hostname
- Operator: equals
- Value: [YOUR_PRODUCTION_DOMAIN]

AND

- Field: URI Path
- Operator: equals
- Value: /api/mitra/profile

AND

- Field: HTTP Method
- Operator: equals
- Value: POST

Rate Limiting:
- Requests: 2
- Period: 10 minutes
- Per: IP Address

Action: Block
Duration: 30 minutes
```

#### Rule 3: R2 Upload URL Protection
```
Name: Prod API - Upload URL Limit
Description: Protect R2 pre-signed URL generation from abuse

Traffic Matching:
- Field: Hostname
- Operator: equals
- Value: [YOUR_PRODUCTION_DOMAIN]

AND

- Field: URI Path
- Operator: contains
- Value: /api/driver/

AND

- Field: URI Path
- Operator: contains
- Value: /request-upload-url

AND

- Field: HTTP Method
- Operator: equals
- Value: POST

Rate Limiting:
- Requests: 20
- Period: 1 minute
- Per: IP Address

Action: Block
Duration: 5 minutes
```

#### Rule 4: Service Management Protection
```
Name: Prod API - Service Management Limit
Description: Protect service creation and updates

Traffic Matching:
- Field: Hostname
- Operator: equals
- Value: [YOUR_PRODUCTION_DOMAIN]

AND

- Field: URI Path
- Operator: starts with
- Value: /api/mitra/services

AND

- Field: HTTP Method
- Operator: in
- Value: POST, PUT, DELETE

Rate Limiting:
- Requests: 15
- Period: 1 minute
- Per: IP Address

Action: Block
Duration: 5 minutes
```

#### Rule 5: General API Protection
```
Name: Prod API - General High Traffic Limit
Description: General protection against API abuse

Traffic Matching:
- Field: Hostname
- Operator: equals
- Value: [YOUR_PRODUCTION_DOMAIN]

AND

- Field: URI Path
- Operator: starts with
- Value: /api/

Rate Limiting:
- Requests: 200
- Period: 1 minute
- Per: IP Address

Action: Block
Duration: 10 minutes
```

### 4. Create Staging Rate Limiting Rules

Create similar rules for **staging** with more lenient limits:

- Order Placement: 20 requests/minute
- Profile Creation: 4 requests/10 minutes
- Upload URLs: 40 requests/minute
- Service Management: 30 requests/minute
- General API: 500 requests/minute

**Important:** Start with **Action: Log** for staging rules to monitor without blocking.

### 5. Update Verification Script

Edit `scripts/verify-rate-limits.js` and replace the placeholder URLs:

```javascript
// Line ~18-28, update these URLs:
environments: {
  staging: {
    baseUrl: 'https://YOUR_ACTUAL_STAGING_URL',
  },
  production: {
    baseUrl: 'https://YOUR_ACTUAL_PRODUCTION_URL',
  },
  local: {
    baseUrl: 'http://localhost:8787',
  },
},
```

### 6. Test the Implementation

#### Test Application-Level Rate Limiting (Local)
```bash
# Start local development
cd /path/to/treksistem-latest
pnpm dev

# In another terminal, test rate limiting
node scripts/verify-rate-limits.js --env local --endpoint orders --verbose
```

#### Test WAF Rate Limiting (Staging)
```bash
# Test staging environment
node scripts/verify-rate-limits.js --env staging --endpoint orders --verbose

# Test all endpoints
node scripts/verify-rate-limits.js --env staging --endpoint all
```

#### Monitor Rate Limiting Activity
```bash
# Check application-level stats
curl https://YOUR_STAGING_URL/api/admin/rate-limit-stats

# Check Cloudflare Security Events in dashboard
# Navigate to Security → Overview → Events
```

### 7. Gradual Rollout Strategy

#### Week 1: Monitoring Phase
1. Set all WAF rules to **Action: Log**
2. Monitor Cloudflare Security Events
3. Analyze legitimate traffic patterns
4. Adjust thresholds if needed

#### Week 2: Soft Enforcement
1. Switch critical endpoints (orders, profile creation) to **Action: Block**
2. Keep general API protection on **Log**
3. Monitor for false positives

#### Week 3: Full Enforcement
1. Enable all rate limiting rules
2. Set up monitoring alerts
3. Document any bypass procedures

### 8. Monitoring and Maintenance

#### Daily Monitoring
- Check Cloudflare Security Events for rate limiting activity
- Monitor application logs for rate limiting middleware activity
- Review `/api/admin/rate-limit-stats` endpoint

#### Weekly Review
- Analyze blocked requests and patterns
- Adjust rate limits based on legitimate usage
- Update documentation with any changes

#### Monthly Optimization
- Review and optimize rate limiting rules
- Update limits based on traffic growth
- Test emergency bypass procedures

## Verification Checklist

After completing the setup, verify:

- [ ] All 5 production WAF rules are created and active
- [ ] All 5 staging WAF rules are created (start with Log action)
- [ ] Verification script URLs are updated with actual domains
- [ ] Local rate limiting works (`node scripts/verify-rate-limits.js --env local`)
- [ ] Staging rate limiting works (`node scripts/verify-rate-limits.js --env staging`)
- [ ] Admin stats endpoint returns data (`/api/admin/rate-limit-stats`)
- [ ] Cloudflare Security Events show rate limiting activity
- [ ] False positive monitoring is in place

## Troubleshooting

### Common Issues

1. **Rules not triggering**: Check hostname matching in WAF rules
2. **Too many false positives**: Increase rate limits temporarily
3. **Verification script fails**: Check URL configuration and network access

### Emergency Procedures

If rate limiting causes issues:
1. Change WAF rule Action from "Block" to "Log"
2. Increase rate limits temporarily
3. Analyze logs to identify the issue
4. Adjust rules and re-enable blocking

## Support

- **Cloudflare Documentation**: [Rate Limiting Rules](https://developers.cloudflare.com/waf/rate-limiting-rules/)
- **Application Code**: `apps/worker/src/middleware/rate-limiting.ts`
- **Full Documentation**: `docs/RATE-LIMITING-SETUP.md`

---

**Priority**: HIGH - Required for production security
**Estimated Time**: 2-3 hours for initial setup + ongoing monitoring
**Dependencies**: Cloudflare Dashboard access, deployed workers 