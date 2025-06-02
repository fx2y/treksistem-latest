# Treksistem Worker

Cloudflare Worker for the Treksistem logistics platform backend API.

## Features

### Security Implementation
- **Standard Security Headers**: Comprehensive security headers including CSP, X-Frame-Options, X-Content-Type-Options, and Referrer-Policy
- **Content Security Policy**: Restrictive API-focused CSP to prevent XSS and injection attacks
- **HSTS Ready**: Strict Transport Security configuration (commented out, enable when ready for full HTTPS)
- **Security Monitoring**: Built-in endpoints for security configuration verification and auditing

### Public API
- **Service Configuration API**: Public endpoint for fetching service configurations (`GET /api/public/services/:serviceId/config`)
- **Input Validation**: CUID format validation and schema validation
- **Access Control**: Only exposes public services (`PUBLIC_3RD_PARTY` model)
- **Data Filtering**: Returns only publicly safe information

### Core Features
- **Hono Framework**: Modern web framework for Cloudflare Workers
- **D1 Database**: Drizzle ORM integration with Cloudflare D1
- **Error Handling**: Consistent RFC-compliant error responses
- **CORS Support**: Configurable CORS for frontend applications
- **Request Logging**: Structured request/response logging

## API Endpoints

### Public Endpoints (No Authentication)
- `GET /api/health` - Health check
- `GET /api/public/services/:serviceId/config` - Service configuration for order forms
- `POST /api/orders` - Order placement

### Protected Endpoints (Cloudflare Access)
- `GET /api/mitra/*` - Mitra admin operations
- `GET /api/mitra/orders/*` - Mitra order management

### Driver Endpoints (Path-based Auth)
- `GET /api/driver/:driverId/orders` - Driver order operations

### Test/Monitoring Endpoints
- `GET /api/test/security/headers` - Security headers verification
- `GET /api/test/security/security-audit` - Comprehensive security audit
- `GET /api/test/security/csp-test` - CSP testing
- `GET /api/test/db` - Database connection test
- `GET /api/test/cuid` - CUID generation test

## Development

```bash
# Start development server
pnpm --filter worker dev

# Deploy to Cloudflare
pnpm --filter worker deploy
```

## Security

See [SECURITY.md](./SECURITY.md) for detailed security implementation documentation.

## Architecture

### Middleware Stack
1. CORS configuration
2. Pretty JSON formatting
3. Drizzle client initialization
4. Request logging
5. **Security headers**
6. Error handling
7. 404 handling

### Modular Design
- `middleware/` - Reusable middleware functions
- `routes/` - API route handlers
- `utils/` - Utility functions and validators
- `types/` - TypeScript type definitions

## Environment Variables

- `TREKSISTEM_DB` - D1 Database binding
- `TREKSISTEM_R2` - R2 Storage binding
- `WORKER_ENV` - Environment identifier

## Compliance

- ✅ RFC-TREK-SEC-HEADERS-001 (Security Headers)
- ✅ RFC-TREK-API-PUBLIC-SVC-CONFIG-001 (Public Service Config API)
- ✅ RFC-TREK-ERROR-001 (Error Handling)
- ⚠️ OWASP Security Headers (Partially compliant - HSTS pending)

## Authentication & Authorization

The API implements a two-layer security model following RFC-TREK-AUTH-001:

### 1. Authentication (Cloudflare Access)

- **Protected Routes**: `/api/mitra/*`
- **Method**: Email OTP or OAuth providers (GitHub, Google)
- **Headers**: `Cf-Access-Authenticated-User-Email`
- **Development**: Mock authentication via `X-Mock-User-Email` header

### 2. Authorization (Mitra Mapping)

- Maps authenticated email to Mitra records via `mitras.owner_user_id`
- Ensures users can only access their own Mitra's resources
- Sets `currentMitraId` in request context

## Development Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Database Setup

```bash
# Apply migrations to local D1
wrangler d1 migrations apply TREKSISTEM_DB --local

# Create test Mitra records
pnpm tsx ../scripts/setup-dev-mitra.ts
```

### 3. Start Development Server

```bash
# Start worker with local persistence
wrangler dev --local --persist

# Or use turbo from root
turbo dev
```

### 4. Test Authentication

```bash
# Test CF Access mock authentication
curl -H "X-Mock-User-Email: dev-admin@example.com" \
     http://localhost:8787/api/mitra/auth/test

# Test without authentication (should fail)
curl http://localhost:8787/api/mitra/profile
```

## Environment Variables

Configure in `wrangler.jsonc`:

```json
{
  "vars": {
    "WORKER_ENV": "development" // or "staging", "production"
  }
}
```

## Middleware Stack

1. **CORS**: Configured for frontend domains
2. **Pretty JSON**: Development-friendly JSON formatting
3. **Database**: Drizzle client initialization
4. **Logging**: Request/response logging
5. **Error Handling**: Standardized error responses
6. **Authentication**: CF Access header validation (Mitra routes only)

## Error Handling

All errors follow RFC-TREK-ERROR-001 format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": {} // Optional additional details
  }
}
```

Common error codes:
- `UNAUTHENTICATED`: Missing or invalid authentication
- `UNAUTHORIZED`: User lacks required permissions
- `VALIDATION_ERROR`: Request validation failed
- `NOT_FOUND`: Resource not found
- `DATABASE_ERROR`: Database operation failed
- `INTERNAL_ERROR`: Unexpected server error

## Security Features

### Development Mode

- Mock authentication via `X-Mock-User-Email` header
- Bypasses CF Access requirements
- Only enabled when `WORKER_ENV=development`

### Production Mode

- Strict CF Access header validation
- Automatic session management via Cloudflare
- Secure cookie handling

### Request Validation

- Zod schemas for all request bodies
- Type-safe parameter validation
- Automatic error responses for invalid data

## Database Schema

The worker uses the shared database schema from `@treksistem/db-schema`:

- **mitras**: Mitra profiles with `owner_user_id` for auth mapping
- **services**: Services offered by Mitras
- **drivers**: Drivers associated with Mitras
- **orders**: Customer orders
- **order_events**: Order status tracking

## Deployment

### Local Development

```bash
wrangler dev --local --persist
```

### Staging/Production

```bash
# Deploy to Cloudflare Workers
wrangler deploy

# Apply database migrations
wrangler d1 migrations apply TREKSISTEM_DB
```

## Monitoring

### Logs

The worker provides structured logging:

```
[2024-03-08T10:30:00.000Z] GET /api/mitra/profile - START
[CF Access] Authenticated user: admin@example.com
[Mitra Auth] Authorized Mitra: cm123456789 (Example Mitra) for user: admin@example.com
[2024-03-08T10:30:00.123Z] GET /api/mitra/profile - 200 (123ms)
```

### Observability

Cloudflare Workers Analytics provides:
- Request volume and latency
- Error rates and status codes
- Geographic distribution
- Performance metrics

## Related Documentation

- [Cloudflare Access Setup](../../docs/cloudflare-access-setup.md)
- [RFC-TREK-AUTH-001](../../.ai/rfcs.md#rfc-trek-auth-001)
- [Database Schema](../../packages/db-schema/README.md)
- [Shared Types](../../packages/shared-types/README.md) 