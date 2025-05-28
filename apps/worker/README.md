# Treksistem Worker API

This is the backend API for the Treksistem logistics platform, built with Hono on Cloudflare Workers.

## Architecture

- **Runtime**: Cloudflare Workers
- **Framework**: Hono.js
- **Database**: Cloudflare D1 (SQLite) with Drizzle ORM
- **Authentication**: Cloudflare Access
- **Storage**: Cloudflare R2 (for file uploads)

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

## API Endpoints

### Health & Testing

- `GET /api/health` - Service health check
- `GET /api/test/cf-access` - Test CF Access authentication
- `GET /api/test/error` - Test error handling
- `POST /api/test/validation` - Test request validation
- `GET /api/test/cuid` - Test CUID generation
- `GET /api/test/db` - Test database connection

### Mitra Admin (Protected)

All endpoints require Cloudflare Access authentication:

- `GET /api/mitra/profile` - Get current Mitra profile
- `PUT /api/mitra/profile` - Update Mitra profile
- `GET /api/mitra/services` - List Mitra's services
- `GET /api/mitra/drivers` - List Mitra's drivers
- `GET /api/mitra/auth/test` - Test authentication & authorization

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