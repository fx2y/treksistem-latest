# Treksistem Worker API

This is the Cloudflare Worker backend for the Treksistem logistics platform, built with Hono.js and implementing the specifications from TREK-IMPL-WORKER-001 and TREK-IMPL-AUTH-001.

## Features

### ✅ Implemented (TREK-IMPL-WORKER-001)

- **Hono Application Setup**: Complete Hono.js application with TypeScript support
- **D1 Database Integration**: Drizzle ORM client with D1 binding
- **Error Handling**: RFC-TREK-ERROR-001 compliant error responses
- **CORS Configuration**: Configured for development and production frontends
- **Health Check Endpoint**: `/api/health` with environment information
- **Request Logging**: Comprehensive request/response logging middleware
- **CUID2 ID Generation**: Secure, collision-resistant ID generation
- **Validation**: Zod-based request validation with proper error handling

### ✅ Implemented (TREK-IMPL-AUTH-001)

- **Cloudflare Access Integration**: Middleware for `/api/mitra/*` routes
- **Development Mode Support**: Mock authentication for local development
- **User Identity Extraction**: Reads `Cf-Access-Authenticated-User-Email` header
- **Flexible Authentication**: Supports both CF Access and mock headers

## API Endpoints

### Core Endpoints

- `GET /api/health` - Health check with environment info
- `GET /api/mitra/test` - Test CF Access authentication (protected)

### Development/Test Endpoints

- `GET /api/test/cuid` - Test CUID2 generation
- `GET /api/test/error` - Test error handling
- `POST /api/test/validation` - Test request validation
- `GET /api/test/db` - Test database connection

## Environment Configuration

### Required Bindings (wrangler.jsonc)

```jsonc
{
  "d1_databases": [
    {
      "binding": "TREKSISTEM_DB",
      "database_name": "treksistem-d1-database",
      "database_id": "your-database-id"
    }
  ],
  "vars": {
    "WORKER_ENV": "development"
  }
}
```

### Environment Variables

- `WORKER_ENV`: Environment identifier (`development`, `staging`, `production`)

## Development

### Prerequisites

- Node.js 18+
- pnpm
- Wrangler CLI

### Setup

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# The worker will be available at http://localhost:8787
```

### Testing

Run the comprehensive test suite:

```bash
./test-endpoints.sh
```

This tests all implemented functionality including:
- Health checks
- Error handling
- Request validation
- Database connectivity
- Authentication middleware
- CORS headers

## Authentication

### Cloudflare Access Integration

Protected routes under `/api/mitra/*` require Cloudflare Access authentication:

- **Production**: CF Access must be configured to protect these routes
- **Development**: Uses mock authentication with fallback email `dev-admin@example.com`
- **Custom Mock**: Send `X-Mock-User-Email` header for custom test emails

### Example Usage

```bash
# Development mode (automatic mock)
curl http://localhost:8787/api/mitra/test

# Custom mock email
curl -H "X-Mock-User-Email: admin@company.com" http://localhost:8787/api/mitra/test

# Production (CF Access header automatically added)
curl -H "Cf-Access-Authenticated-User-Email: user@company.com" https://api.treksistem.com/api/mitra/test
```

## Error Handling

All errors follow RFC-TREK-ERROR-001 format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {} // Optional additional details
  }
}
```

### Error Types

- `INTERNAL_ERROR`: Unexpected server errors
- `VALIDATION_ERROR`: Request validation failures (Zod)
- `UNAUTHENTICATED`: Missing or invalid authentication
- `NOT_FOUND`: Resource not found (404)
- `DATABASE_ERROR`: Database connection/query failures

## CORS Configuration

Configured origins for development:
- `http://localhost:5173` (fe-user-public)
- `http://localhost:5174` (fe-mitra-admin) 
- `http://localhost:5175` (fe-driver-view)
- `http://localhost:3000-3002` (alternative ports)

Production origins should be added to the CORS configuration.

## Database Integration

- **ORM**: Drizzle ORM with D1 adapter
- **Client**: Auto-initialized via middleware
- **Access**: Available in route handlers via `c.get('db')`

Example usage:
```typescript
app.get('/api/example', async (c) => {
  const db = c.get('db');
  const result = await db.select().from(someTable);
  return c.json({ data: result });
});
```

## Security Features

- **CUID2 IDs**: Cryptographically secure, collision-resistant identifiers
- **Request Validation**: Zod schemas for type-safe request handling
- **Authentication Middleware**: CF Access integration with development fallbacks
- **CORS Protection**: Restricted origins and methods
- **Error Sanitization**: No sensitive data leaked in error responses

## Future Enhancements

The following route modules are planned for implementation:

- `/api/mitra/*` - Mitra admin operations
- `/api/public/*` - Public user operations  
- `/api/driver/*` - Driver operations

These will be implemented in subsequent tasks following the modular architecture established here.

## Architecture

### Middleware Stack

1. **CORS**: Cross-origin request handling
2. **Pretty JSON**: Development-friendly JSON formatting
3. **Drizzle Client**: Database client initialization
4. **Request Logging**: Request/response timing and logging
5. **Error Handler**: Global error handling and formatting
6. **404 Handler**: Not found error responses

### Type Safety

- **Environment Bindings**: Typed `Env` interface
- **Context Variables**: Typed `AppContext` for request context
- **Request Validation**: Zod schemas for runtime type checking
- **Database**: Fully typed Drizzle ORM integration

This implementation provides a solid foundation for the Treksistem logistics platform with proper error handling, authentication, and development tooling. 