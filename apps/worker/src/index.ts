import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { prettyJSON } from 'hono/pretty-json';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { createId } from '@paralleldrive/cuid2';
import { getDrizzleClient } from '@treksistem/db-schema';
import { sql } from 'drizzle-orm';
import { cfAccessAuth } from './middleware/auth';
import { securityHeaders } from './middleware/security-headers';
import { usageTrackingMiddleware } from './utils/usage-monitoring';
import { rateLimitingMiddleware } from './middleware/rate-limiting';
import { Logger, AppError, ERROR_CODES } from './utils/error-handling';
import mitraRoutes from './routes/mitra';
import mitraOrderRoutes from './routes/mitra.orders';
import publicServiceRoutes from './routes/public.services';
import orderPlacementRoutes from './routes/orders.placement';
import driverOrderRoutes from './routes/driver.orders';
import testSecurityRoutes from './routes/test.security';
import testErrorRoutes from './routes/test.error-handling';
import adminRoutes from './routes/admin';
import type { AppContext } from './types';

const app = new Hono<AppContext>();

// --- Global Middleware ---

// 1. CORS Configuration
app.use('*', cors({
  origin: [
    'http://localhost:5173', // fe-user-public dev
    'http://localhost:5174', // fe-mitra-admin dev
    'http://localhost:5175', // fe-driver-view dev
    'http://localhost:3000', // Alternative dev ports
    'http://localhost:3001',
    'http://localhost:3002',
    // Add production frontend domains here when deployed
    // 'https://your-production-domain.com',
  ],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    // CF Access headers
    'Cf-Access-Authenticated-User-Email',
    'Cf-Access-Authenticated-User-Id',
    // Development mock headers
    'X-Mock-User-Email',
  ],
  credentials: true, // Allow cookies from CF Access
}));

// 2. Pretty JSON for development readability
app.use('*', prettyJSON());

// 3. Drizzle Client Initialization
app.use('*', async (c, next) => {
  const db = getDrizzleClient(c.env.TREKSISTEM_DB);
  c.set('db', db);
  await next();
});

// 4. Request Logging Middleware
app.use('*', async (c, next) => {
  const start = Date.now();
  const method = c.req.method;
  const url = c.req.url;
  
  console.log(`[${new Date().toISOString()}] ${method} ${url} - START`);
  
  await next();
  
  const duration = Date.now() - start;
  const status = c.res.status;
  console.log(`[${new Date().toISOString()}] ${method} ${url} - ${status} (${duration}ms)`);
});

// 5. Security Headers Middleware
app.use('*', securityHeaders());

// 6. Usage Monitoring (RFC-TREK-COST-001 compliance)
app.use('*', usageTrackingMiddleware);

// 7. Rate Limiting Middleware (Application-level backup to WAF)
app.use('*', rateLimitingMiddleware());

// 8. Global Error Handler (as per RFC-TREK-ERROR-001)
app.onError((err, _c) => {
  const method = _c.req.method;
  const url = _c.req.url;
  
  // Default error response structure
  const errorResponse: {
    success: false;
    error: {
      code: string;
      message: string;
      timestamp: string;
      requestId: string;
      details?: any;
    };
  } = {
    success: false,
    error: {
      code: ERROR_CODES.INTERNAL_ERROR,
      message: 'An internal server error occurred.',
      timestamp: new Date().toISOString(),
      requestId: createId(), // Generate unique request ID for tracking
    },
  };

  let statusCode = 500;

  // Handle HTTP exceptions (from middleware like auth)
  if (err.name === 'HTTPException') {
    statusCode = (err as any).status;
    errorResponse.error.message = err.message;
    
    // Map common HTTP status codes to our error codes
    switch (statusCode) {
      case 400:
        errorResponse.error.code = ERROR_CODES.VALIDATION_ERROR;
        break;
      case 401:
        errorResponse.error.code = ERROR_CODES.AUTH_ERROR;
        break;
      case 403:
        errorResponse.error.code = ERROR_CODES.FORBIDDEN;
        break;
      case 404:
        errorResponse.error.code = ERROR_CODES.NOT_FOUND;
        break;
      case 409:
        errorResponse.error.code = ERROR_CODES.CONFLICT;
        break;
      case 429:
        errorResponse.error.code = 'RATE_LIMIT_EXCEEDED';
        break;
      default:
        errorResponse.error.code = ERROR_CODES.INTERNAL_ERROR;
    }
    
    Logger.warn(`HTTP Exception: ${method} ${url}`, { status: statusCode, message: err.message });
  }

  // Handle specific error types
  if (err.name === 'ZodError') {
    statusCode = 400;
    errorResponse.error.code = ERROR_CODES.VALIDATION_ERROR;
    errorResponse.error.message = 'Request validation failed.';
    errorResponse.error.details = (err as any).errors;
    Logger.warn(`Validation Error: ${method} ${url}`, { errors: (err as any).errors });
  } else if (err.name === 'CostCalculationError') {
    statusCode = 400;
    errorResponse.error.code = (err as any).code || ERROR_CODES.COST_CALCULATION_ERROR;
    errorResponse.error.message = err.message;
    errorResponse.error.details = (err as any).details;
    Logger.warn(`Cost Calculation Error: ${method} ${url}`, {
      code: (err as any).code,
      details: (err as any).details,
    });
  } else if (err.name === 'TrustMechanismError') {
    statusCode = 400;
    errorResponse.error.code = (err as any).code || ERROR_CODES.TRUST_MECHANISM_ERROR;
    errorResponse.error.message = err.message;
    errorResponse.error.details = (err as any).details;
    Logger.warn(`Trust Mechanism Error: ${method} ${url}`, {
      code: (err as any).code,
      details: (err as any).details,
    });
  } else if (err instanceof AppError) {
    statusCode = (err as any)._statusCode;
    errorResponse.error.message = err.message;
    if ('_code' in err && typeof (err as any)._code === 'string') {
      errorResponse.error.code = (err as any)._code;
    }
    if ('_details' in err) {
      errorResponse.error.details = (err as any)._details;
    }
  } else if (err.message?.includes('UNIQUE constraint failed')) {
    // Handle database constraint violations
    statusCode = 409;
    errorResponse.error.code = ERROR_CODES.CONFLICT;
    errorResponse.error.message = 'Resource already exists or constraint violation.';
    Logger.warn(`Database Constraint Error: ${method} ${url}`, { error: err.message });
  } else if (err.message?.includes('NOT NULL constraint failed')) {
    statusCode = 400;
    errorResponse.error.code = ERROR_CODES.VALIDATION_ERROR;
    errorResponse.error.message = 'Required field missing.';
    Logger.warn(`Database Validation Error: ${method} ${url}`, { error: err.message });
  } else {
    // Log unexpected errors with full context
    errorResponse.error.message = err.message || 'An unexpected internal error occurred.';
    Logger.error(`Unexpected Error: ${method} ${url}`, err, {
      url,
      method,
    });
  }

  return _c.json(errorResponse, statusCode as any);
});

// 9. 404 Handler
app.notFound((_c) => {
  return _c.json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found.',
    },
  }, 404);
});

// --- Health Check Endpoint ---
app.get('/api/health', (c) => {
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: c.env.WORKER_ENV || 'unknown'
  });
});

// --- Route Modules ---

// Public Routes (No authentication required)
app.route('/api/public/services', publicServiceRoutes);
app.route('/api/orders', orderPlacementRoutes);

// Mitra Admin Routes (Protected by Cloudflare Access)
app.route('/api/mitra', mitraRoutes);
app.route('/api/mitra/orders', mitraOrderRoutes);

// Admin Routes (Protected by Cloudflare Access)
app.route('/api/admin', adminRoutes);

// Driver Routes (Protected by unguessable driverId in path)
app.route('/api/driver/:driverId/orders', driverOrderRoutes);

// --- Test Endpoints for Development ---

// Test endpoint to verify CF Access integration (without Mitra authorization)
app.get('/api/test/cf-access', cfAccessAuth, (c) => {
  const userEmail = c.get('currentUserEmail');
  return c.json({
    success: true,
    data: {
      message: 'Cloudflare Access authentication working',
      userEmail,
      timestamp: new Date().toISOString(),
    },
  });
});

// Test endpoint to verify error handling
app.get('/api/test/error', (_c) => {
  throw new Error('Test error for error handling verification');
});

// Test endpoint to verify validation error handling
app.post('/api/test/validation', zValidator('json', z.object({
  requiredField: z.string(),
})), (_c) => {
  const data = _c.req.valid('json');
  return _c.json({
    success: true,
    data: {
      message: 'Validation passed',
      receivedData: data,
    },
  });
});

// Test endpoint to verify CUID2 generation
app.get('/api/test/cuid', (c) => {
  const ids = Array.from({ length: 5 }, () => createId());
  return c.json({
    success: true,
    data: {
      message: 'CUID2 generation test',
      generatedIds: ids,
      timestamp: new Date().toISOString(),
    },
  });
});

// Test endpoint to verify database connection
app.get('/api/test/db', async (c) => {
  try {
    const db = c.get('db');
    // Simple query to test database connection using sql template literal
    const result = await db.run(sql`SELECT 1 as test`);
    return c.json({
      success: true,
      data: {
        message: 'Database connection successful',
        testResult: result,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Database test error:', error);
    return c.json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Database connection failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    }, 500);
  }
});

// Security test routes
app.route('/api/test/security', testSecurityRoutes);

// Comprehensive error handling test routes
app.route('/api/test/error-handling', testErrorRoutes);

// Note: Geo distance calculation test endpoints were removed after successful verification
// The geo utility is available via import: { calculateHaversineDistance, calculateDistance } from './utils/geo'

// --- Future Route Modules (to be implemented in subsequent tasks) ---
// import driverRoutes from './routes/driver';
// 
// app.route('/api/driver', driverRoutes);

export default app; 