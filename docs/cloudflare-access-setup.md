# Cloudflare Access Setup for Treksistem Mitra Admin

This document provides step-by-step instructions for configuring Cloudflare Access to protect the Treksistem Mitra Admin API endpoints and frontend application.

## Overview

Cloudflare Access provides zero-trust authentication for the Mitra Admin portal, ensuring only authorized users can access administrative functions. The implementation follows RFC-TREK-AUTH-001.

## Prerequisites

- Cloudflare account with Zero Trust enabled
- Domain managed by Cloudflare (or use `*.workers.dev` for testing)
- Deployed Treksistem worker application

## Configuration Steps

### 1. Navigate to Cloudflare Zero Trust Dashboard

1. Log into your Cloudflare dashboard
2. Go to **Zero Trust** → **Access** → **Applications**

### 2. Create Application for Mitra Admin API

#### Application Settings

1. Click **"Add an application"** → **"Self-hosted"**
2. Configure the following:

   - **Application Name**: `Treksistem Mitra API`
   - **Session Duration**: `24 hours` (recommended)
   - **Application Domain**: 
     - For custom domain: `your-api-domain.com`
     - For workers.dev: `treksistem-worker.your-subdomain.workers.dev`
   - **Path**: `/api/mitra/*`

#### Identity Providers

Enable the following identity providers:

1. **Email OTP** (Primary method)
   - ✅ Enable "One-time PIN"
   - This allows authentication via email verification codes

2. **Optional: Additional Providers**
   - GitHub OAuth (for developer access)
   - Google OAuth (for business email accounts)

#### CORS Settings

Configure CORS if your frontend is on a different domain:
- **Access-Control-Allow-Origin**: Include your frontend domains
- **Access-Control-Allow-Credentials**: `true`

### 3. Create Access Policy

#### Policy Configuration

1. **Policy Name**: `Allow Registered Mitras`
2. **Action**: `Allow`
3. **Configure Rules**:

   **Option A: Email Domain-based Access**
   ```
   Selector: "Emails ending in"
   Value: "@yourdomain.com"
   ```

   **Option B: Specific Email Addresses**
   ```
   Selector: "Email"
   Value: "admin@example.com"
   ```

   **Option C: Multiple Emails (for testing)**
   ```
   Selector: "Email"
   Values: 
   - "admin1@example.com"
   - "admin2@example.com"
   - "test@yourdomain.com"
   ```

4. Click **"Add application"**

### 4. (Future) Frontend Application Protection

When the Mitra Admin frontend is deployed:

1. Create another Self-hosted application:
   - **Application Name**: `Treksistem Mitra Admin Frontend`
   - **Application Domain**: `mitra-admin.yourdomain.com`
   - **Path**: `/` (protect entire frontend)

2. Use the same Access Policy created above

### 5. Custom Domain Configuration (Recommended)

For production deployment, configure a custom domain:

1. **DNS Setup**:
   ```
   CNAME api.yourdomain.com → treksistem-worker.your-subdomain.workers.dev
   CNAME mitra-admin.yourdomain.com → your-pages-deployment.pages.dev
   ```

2. **Update wrangler.jsonc**:
   ```json
   {
     "routes": [
       {
         "pattern": "api.yourdomain.com/api/*",
         "custom_domain": true
       }
     ]
   }
   ```

## Testing the Configuration

### 1. Test Unauthenticated Access

```bash
# This should redirect to CF Access login or return 403
curl -v https://api.yourdomain.com/api/mitra/auth/test
```

### 2. Test Development Mode

For local development, use the mock header:

```bash
# Local development with mock authentication
curl -H "X-Mock-User-Email: test@example.com" \
     http://localhost:8787/api/mitra/auth/test
```

### 3. Test Authenticated Access

1. Visit the protected URL in a browser
2. Complete the CF Access authentication flow
3. Verify the API returns user information:

```json
{
  "success": true,
  "data": {
    "message": "Cloudflare Access authentication and Mitra authorization working correctly",
    "authentication": {
      "userEmail": "admin@example.com",
      "source": "Cloudflare Access"
    },
    "authorization": {
      "mitraId": "cm123456789",
      "scope": "Mitra Admin"
    },
    "timestamp": "2024-03-08T10:30:00.000Z"
  }
}
```

## Security Considerations

### 1. Email Verification

- CF Access sends OTP codes to the provided email
- Ensure email addresses are properly verified
- Consider using corporate email domains for additional security

### 2. Session Management

- Sessions expire after the configured duration (24 hours recommended)
- Users must re-authenticate after session expiry
- Sessions are managed by Cloudflare, not the application

### 3. Header Security

The worker validates the following headers:
- `Cf-Access-Authenticated-User-Email`: Primary user identifier
- `Cf-Access-Authenticated-User-Id`: Optional additional identifier

### 4. Development vs Production

- **Development**: Mock authentication via `X-Mock-User-Email` header
- **Production**: Strict CF Access header validation
- **Environment Detection**: Based on `WORKER_ENV` variable

## Troubleshooting

### Common Issues

1. **"Authentication required" error**
   - Verify CF Access application is properly configured
   - Check that the path `/api/mitra/*` is correctly protected
   - Ensure the domain matches your worker deployment

2. **"No Mitra account associated" error**
   - The authenticated email doesn't have a corresponding Mitra record
   - Create a Mitra record with `owner_user_id` matching the email
   - Verify the email case matches exactly

3. **CORS errors in browser**
   - Add frontend domain to worker CORS configuration
   - Configure CF Access CORS settings if needed
   - Ensure `credentials: true` is set in frontend requests

### Debug Headers

Check these headers in browser developer tools:

```
Cf-Access-Authenticated-User-Email: admin@example.com
Cf-Access-Authenticated-User-Id: 123456789
```

### Logs

Monitor worker logs for authentication events:

```
[CF Access] Authenticated user: admin@example.com
[Mitra Auth] Authorized Mitra: cm123456789 (Example Mitra) for user: admin@example.com
```

## API Endpoints Protected

The following endpoints require CF Access authentication:

- `GET /api/mitra/profile` - Get Mitra profile
- `PUT /api/mitra/profile` - Update Mitra profile  
- `GET /api/mitra/services` - List Mitra services
- `GET /api/mitra/drivers` - List Mitra drivers
- `GET /api/mitra/auth/test` - Test authentication

## Next Steps

1. Deploy the worker with CF Access configuration
2. Create initial Mitra records in the database
3. Test the authentication flow end-to-end
4. Configure the frontend application protection
5. Set up monitoring and alerting for authentication failures

## Related Documentation

- [RFC-TREK-AUTH-001: Authentication & Authorization](../rfcs.md#rfc-trek-auth-001)
- [Cloudflare Access Documentation](https://developers.cloudflare.com/cloudflare-one/applications/)
- [Zero Trust Setup Guide](https://developers.cloudflare.com/cloudflare-one/setup/) 