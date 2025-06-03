# Treksistem Rate Limiting Setup Guide

## Overview

This document provides step-by-step instructions for implementing rate limiting on Treksistem's staging and production environments using Cloudflare WAF (Web Application Firewall) rules.

## Prerequisites

- Access to Cloudflare Dashboard with appropriate permissions
- Understanding of worker deployment names:
  - **Production**: `treksistem-api` (deployed from `main` branch)
  - **Staging**: `treksistem-api-staging` (deployed from `develop` branch)
- Knowledge of critical API endpoints requiring protection

## Critical Endpoints for Rate Limiting

### High-Risk Public Endpoints
1. **Order Placement**: `POST /api/orders`
   - Risk: Spam orders, resource exhaustion
   - Recommended limit: 10 requests/minute per IP

2. **Service Config Lookup**: `GET /api/public/services/:serviceId/config`
   - Risk: Information harvesting, DoS
   - Recommended limit: 30 requests/minute per IP

### Administrative Endpoints (Protected by CF Access)
3. **Mitra Profile Creation**: `POST /api/mitra/profile`
   - Risk: Bulk account creation (invite-only bypass attempts)
   - Recommended limit: 2 requests/10 minutes per IP

4. **Service Creation**: `POST /api/mitra/services`
   - Risk: Resource exhaustion, spam services
   - Recommended limit: 5 requests/minute per IP

5. **Driver Creation**: `POST /api/mitra/drivers`
   - Risk: Bulk driver creation
   - Recommended limit: 10 requests/minute per IP

### Driver Endpoints
6. **R2 Upload URL Requests**: `POST /api/driver/:driverId/orders/:orderId/request-upload-url`
   - Risk: Excessive R2 pre-signed URL generation
   - Recommended limit: 20 requests/minute per IP

## Cloudflare WAF Rate Limiting Rules Setup

### Step 1: Access Cloudflare Dashboard

1. Log into Cloudflare Dashboard
2. Select your domain/zone
3. Navigate to **Security** → **WAF** → **Rate Limiting Rules**

### Step 2: Production Environment Rules

#### Rule 1: Order Placement Protection (Production)
```
Name: Prod API - Order Placement Limit
Description: Protect order placement endpoint from spam and abuse

Traffic Matching:
- Field: Hostname
- Operator: equals
- Value: [YOUR_PRODUCTION_DOMAIN] or treksistem-api.[YOUR_ACCOUNT].workers.dev

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
Response:
- Status Code: 429
- Content-Type: application/json
- Body: {"success":false,"error":{"code":"RATE_LIMIT_EXCEEDED","message":"Too many order placement requests. Please try again later."}}
```

#### Rule 2: Mitra Profile Creation Protection (Production)
```
Name: Prod API - Profile Creation Limit
Description: Protect Mitra profile creation from bulk account attempts

Traffic Matching:
- Field: Hostname
- Operator: equals
- Value: [YOUR_PRODUCTION_DOMAIN] or treksistem-api.[YOUR_ACCOUNT].workers.dev

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

#### Rule 3: R2 Upload URL Protection (Production)
```
Name: Prod API - Upload URL Limit
Description: Protect R2 pre-signed URL generation from abuse

Traffic Matching:
- Field: Hostname
- Operator: equals
- Value: [YOUR_PRODUCTION_DOMAIN] or treksistem-api.[YOUR_ACCOUNT].workers.dev

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

#### Rule 4: Service Management Protection (Production)
```
Name: Prod API - Service Management Limit
Description: Protect service creation and updates

Traffic Matching:
- Field: Hostname
- Operator: equals
- Value: [YOUR_PRODUCTION_DOMAIN] or treksistem-api.[YOUR_ACCOUNT].workers.dev

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

#### Rule 5: General API Protection (Production)
```
Name: Prod API - General High Traffic Limit
Description: General protection against API abuse

Traffic Matching:
- Field: Hostname
- Operator: equals
- Value: [YOUR_PRODUCTION_DOMAIN] or treksistem-api.[YOUR_ACCOUNT].workers.dev

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

### Step 3: Staging Environment Rules

Create similar rules for staging with more lenient limits for testing:

#### Staging Rule Template
```
Name: Staging API - [Endpoint Name] Limit
Description: Staging protection for [endpoint description]

Traffic Matching:
- Field: Hostname
- Operator: equals
- Value: [YOUR_STAGING_DOMAIN] or treksistem-api-staging.[YOUR_ACCOUNT].workers.dev

[Same path and method matching as production]

Rate Limiting:
- Requests: [2x Production Limit]
- Period: 1 minute
- Per: IP Address

Action: Log (initially), then Block after testing
Duration: 5 minutes
```

**Staging Specific Limits:**
- Order Placement: 20 requests/minute
- Profile Creation: 4 requests/10 minutes
- Upload URLs: 40 requests/minute
- Service Management: 30 requests/minute
- General API: 500 requests/minute

## Step 4: Implementation Strategy

### Phase 1: Monitoring (Week 1)
1. Create all rules with **Action: Log**
2. Monitor Cloudflare Security Events
3. Analyze legitimate traffic patterns
4. Adjust thresholds based on real usage

### Phase 2: Soft Enforcement (Week 2)
1. Switch critical endpoints to **Action: Block**
2. Keep general API protection on **Log**
3. Monitor for false positives
4. Fine-tune based on feedback

### Phase 3: Full Enforcement (Week 3+)
1. Enable all rate limiting rules
2. Set up monitoring and alerting
3. Document bypass procedures for legitimate high-volume users

## Verification Procedures

### Manual Testing

#### Test Order Placement Rate Limit
```bash
# Test script to verify order placement rate limiting
for i in {1..15}; do
  echo "Request $i:"
  curl -X POST "https://[YOUR_DOMAIN]/api/orders" \
    -H "Content-Type: application/json" \
    -d '{"serviceId":"test","invalid":"payload"}' \
    -w "Status: %{http_code}, Time: %{time_total}s\n" \
    -s -o /dev/null
  sleep 2
done
```

#### Test General API Rate Limit
```bash
# Test general API rate limiting
for i in {1..250}; do
  curl -s -o /dev/null -w "%{http_code} " \
    "https://[YOUR_DOMAIN]/api/public/services/test/config"
  if [ $((i % 50)) -eq 0 ]; then echo ""; fi
done
```

### Automated Verification Script

Create `scripts/verify-rate-limits.js`:

```javascript
// Rate limit verification script
const testEndpoints = [
  {
    name: 'Order Placement',
    url: '/api/orders',
    method: 'POST',
    expectedLimit: 10,
    payload: { serviceId: 'test' }
  },
  {
    name: 'Service Config',
    url: '/api/public/services/test/config',
    method: 'GET',
    expectedLimit: 30
  }
];

// Implementation in separate file
```

## Monitoring and Alerting

### Cloudflare Security Events
1. Navigate to **Security** → **Overview**
2. Monitor **Rate Limiting** events
3. Set up email notifications for high-volume blocks

### Key Metrics to Track
- Requests blocked per endpoint
- False positive rate
- Legitimate traffic impact
- Attack patterns and sources

### Alert Thresholds
- **Warning**: >100 blocks/hour on any endpoint
- **Critical**: >500 blocks/hour across all endpoints
- **Investigation**: Blocks from same IP across multiple endpoints

## Troubleshooting

### Common Issues

#### False Positives
- **Symptom**: Legitimate users getting blocked
- **Solution**: Increase rate limits or add IP whitelist
- **Prevention**: Monitor logs before enabling blocking

#### Bypass Attempts
- **Symptom**: Distributed attacks from multiple IPs
- **Solution**: Implement additional WAF rules based on patterns
- **Escalation**: Consider Cloudflare Bot Management

#### Configuration Errors
- **Symptom**: Rules not triggering or blocking everything
- **Solution**: Verify hostname and path matching
- **Testing**: Use Cloudflare's rule simulator

### Emergency Bypass

If rate limiting causes issues:

1. **Immediate**: Change Action from "Block" to "Log"
2. **Short-term**: Increase rate limits temporarily
3. **Long-term**: Analyze logs and adjust rules

## Maintenance

### Regular Tasks
- **Weekly**: Review security events and blocked requests
- **Monthly**: Analyze traffic patterns and adjust limits
- **Quarterly**: Review and update rule configurations

### Rule Updates
- Test changes in staging first
- Use gradual rollout (Log → Block)
- Document all changes with rationale

## Integration with Application

While WAF provides primary protection, the application includes backup rate limiting middleware for additional security layers. See `apps/worker/src/middleware/rate-limiting.ts` for implementation details.

## Security Considerations

### Defense in Depth
- WAF rules provide first line of defense
- Application-level rate limiting as backup
- Monitoring and alerting for rapid response

### Privacy and Compliance
- Rate limiting based on IP addresses
- No personal data stored in rate limiting rules
- Logs retention follows Cloudflare's data policy

## Support and Escalation

### Internal Team
- **Primary**: DevOps team for rule configuration
- **Secondary**: Backend team for application-level adjustments
- **Escalation**: Security team for attack response

### Cloudflare Support
- Use support tickets for complex WAF issues
- Enterprise customers have priority support
- Community forums for general questions

---

**Last Updated**: [Current Date]
**Version**: 1.0
**Reviewed By**: [Team Lead] 