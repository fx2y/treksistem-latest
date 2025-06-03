# Error Handling Guide - Treksistem

This guide documents the comprehensive error handling implementation based on RFC-TREK-ERROR-001.

## Overview

The Treksistem platform implements a standardized error handling strategy across both backend (Cloudflare Workers) and frontend (React) applications to ensure consistent user experience and effective debugging.

## Backend Error Handling (Cloudflare Workers)

### Error Response Format (RFC-TREK-ERROR-001)

All API errors follow this standardized format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "User-friendly or developer-friendly error message",
    "details": "Optional: additional error context"
  }
}
```

### Error Codes

#### Client Errors (4xx)

- `VALIDATION_ERROR` - Request validation failed
- `AUTH_ERROR` - Authentication required
- `FORBIDDEN` - Access denied
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource already exists

#### Business Logic Errors

- `COST_CALCULATION_ERROR` - Cost calculation failed
- `TRUST_MECHANISM_ERROR` - Trust evaluation failed
- `SERVICE_CONFIG_ERROR` - Service configuration invalid
- `ORDER_STATUS_ERROR` - Invalid order status transition
- `DRIVER_ASSIGNMENT_ERROR` - Driver assignment failed

#### Server Errors (5xx)

- `INTERNAL_ERROR` - Unexpected server error
- `DATABASE_ERROR` - Database operation failed
- `EXTERNAL_SERVICE_ERROR` - External service unavailable

### Custom Error Classes

#### AppError (Base Class)

```typescript
import { AppError, ERROR_CODES } from '../utils/error-handling';

throw new AppError('Custom error message', ERROR_CODES.VALIDATION_ERROR, 400, {
  field: 'email',
  value: 'invalid',
});
```

#### Specialized Error Classes

```typescript
import {
  ValidationError,
  AuthError,
  NotFoundError,
  ConflictError,
  DatabaseError,
} from '../utils/error-handling';

// Validation error
throw new ValidationError('Invalid email format', {
  field: 'email',
  value: 'invalid-email',
});

// Database error
throw new DatabaseError('Failed to create user', {
  operation: 'INSERT',
  table: 'users',
});
```

### Global Error Handler

The global error handler in `apps/worker/src/index.ts` automatically:

1. Catches all unhandled errors
2. Formats them according to RFC-TREK-ERROR-001
3. Logs appropriate details for debugging
4. Returns consistent error responses

### Database Error Handling

Use the `handleDatabaseError` utility for consistent database error handling:

```typescript
import { handleDatabaseError } from '../utils/error-handling';

try {
  await db.insert(users).values(userData);
} catch (error) {
  handleDatabaseError(error, 'user creation');
}
```

### Logging

Use the structured Logger utility:

```typescript
import { Logger } from '../utils/error-handling';

Logger.info('User created successfully', { userId: 'user123' });
Logger.warn('Unusual activity detected', { userId: 'user123', activity: 'multiple_logins' });
Logger.error('Database connection failed', error, { operation: 'user_fetch' });
```

### Route Handler Best Practices

1. **Use try-catch for database operations:**

```typescript
app.get('/api/users/:id', async (c) => {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, c.req.param('id')),
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return c.json({ success: true, data: user });
  } catch (error) {
    if (error instanceof AppError) {
      throw error; // Re-throw custom errors
    }
    handleDatabaseError(error, 'user fetch');
  }
});
```

2. **Validate input parameters:**

```typescript
import { validateCuid } from '../utils/error-handling';

app.get('/api/orders/:orderId', (c) => {
  const orderId = c.req.param('orderId');
  validateCuid(orderId, 'Order ID');

  // Continue with validated orderId
});
```

## Frontend Error Handling

### API Client Error Handling

The standardized API client in `apps/fe-*/src/services/api.ts` provides:

1. **Automatic error parsing** from RFC-TREK-ERROR-001 format
2. **Custom ApiError class** with helper methods
3. **Network error handling**

```typescript
import { ApiError } from '../services/api';

try {
  const data = await apiClient.get('/api/users');
} catch (error) {
  if (error instanceof ApiError) {
    if (error.isValidationError()) {
      // Handle validation errors
    } else if (error.isAuthError()) {
      // Redirect to login
    } else {
      // Show generic error message
      toast.error(error.getUserMessage());
    }
  }
}
```

### TanStack Query Configuration

All frontend apps use standardized TanStack Query configurations:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry client errors or auth errors
        if (error instanceof ApiError && error.isClientError()) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: false, // Don't retry mutations to avoid duplicates
    },
  },
});
```

### Error Boundaries

Use the ErrorBoundary component for component tree errors:

```typescript
import { ErrorBoundary } from '@treksistem/ui-core';

function App() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Component error:', error, errorInfo);
      }}
    >
      <YourAppComponents />
    </ErrorBoundary>
  );
}
```

### Toast Notifications

Use consistent toast notifications for user feedback:

```typescript
import { toast } from 'sonner';

// Success
toast.success('Order created successfully');

// Error
toast.error('Failed to create order. Please try again.');

// With API error
catch (error) {
  if (error instanceof ApiError) {
    toast.error(error.getUserMessage());
  } else {
    toast.error('An unexpected error occurred');
  }
}
```

### Form Validation Errors

Handle Zod validation errors in forms:

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const form = useForm({
  resolver: zodResolver(schema),
});

// Validation errors are automatically displayed via FormMessage components
```

## Testing Error Handling

### Backend Test Endpoints

Comprehensive test endpoints are available at `/api/test/error-handling/`:

- `/generic-error` - Test global error handler
- `/http-exception` - Test Hono HTTPException
- `/validation-error` - Test Zod validation
- `/app-error/:errorType` - Test custom error classes
- `/database-error/:errorType` - Test database error handling
- `/cuid-validation` - Test CUID validation
- `/logger-test` - Test logging utilities
- `/async-error` - Test async error handling
- `/error-format-test` - Verify RFC-TREK-ERROR-001 compliance

### Manual Testing

1. **Start the worker:**

```bash
cd apps/worker && pnpm wrangler dev --local --persist
```

2. **Test error scenarios:**

```bash
# Test validation error
curl -X POST http://localhost:8787/api/test/error-handling/validation-error \
  -H "Content-Type: application/json" \
  -d '{"invalidField": "test"}'

# Test custom error
curl http://localhost:8787/api/test/error-handling/app-error/validation

# Test database error
curl http://localhost:8787/api/test/error-handling/database-error/unique-constraint
```

### Frontend Testing

1. **Network errors:** Disconnect network and observe retry behavior
2. **Validation errors:** Submit invalid form data
3. **Component errors:** Trigger component failures to test ErrorBoundary

## Monitoring and Debugging

### Cloudflare Worker Logs

Access logs via Cloudflare Dashboard:

1. Go to Workers & Pages → Your Worker → Logs
2. Filter by error level or search for specific error codes
3. Use structured logging context for debugging

### Log Levels

- **INFO:** Successful operations, key events
- **WARN:** Non-critical issues, business rule violations
- **ERROR:** Actual errors requiring attention
- **DEBUG:** Detailed debugging information (development only)

### Error Context

All errors include contextual information:

- Request method and URL
- User/Mitra/Driver IDs when available
- Timestamp
- Operation details
- Error stack traces (in development)

## Best Practices

### Backend

1. Always use try-catch for database operations
2. Throw specific error types rather than generic Error
3. Include relevant context in error details
4. Log errors with appropriate levels
5. Don't expose sensitive information in error messages

### Frontend

1. Handle errors at the appropriate level (component vs global)
2. Provide user-friendly error messages
3. Implement proper retry logic for network errors
4. Use loading states during error recovery
5. Log client-side errors for debugging

### General

1. Follow RFC-TREK-ERROR-001 format consistently
2. Test error scenarios thoroughly
3. Monitor error rates and patterns
4. Update error handling as the application evolves
5. Document new error codes and scenarios

## Migration Guide

If updating existing code to use the new error handling:

1. **Replace generic Error throws:**

```typescript
// Before
throw new Error('User not found');

// After
throw new NotFoundError('User not found');
```

2. **Update API error handling:**

```typescript
// Before
catch (error) {
  toast.error(error.message);
}

// After
catch (error) {
  if (error instanceof ApiError) {
    toast.error(error.getUserMessage());
  } else {
    toast.error('An unexpected error occurred');
  }
}
```

3. **Add error boundaries:**

```typescript
// Wrap components with ErrorBoundary
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

This comprehensive error handling system ensures consistent, user-friendly error experiences while providing developers with the information needed for effective debugging and monitoring.
