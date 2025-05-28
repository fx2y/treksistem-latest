import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { prettyJSON } from 'hono/pretty-json';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { createId } from '@paralleldrive/cuid2';
import { getDrizzleClient } from '@treksistem/db-schema';
import { sql } from 'drizzle-orm';
import { cfAccessAuth } from './middleware/auth';
import mitraRoutes from './routes/mitra';
import mitraOrderRoutes from './routes/mitra.orders';
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

// 5. Global Error Handler (as per RFC-TREK-ERROR-001)
app.onError((err, c) => {
  console.error(`[ERROR: ${c.req.method} ${c.req.url}]`, err);
  
  // Check if it's a Hono HTTPException
  if (err instanceof Error && 'getResponse' in err && typeof err.getResponse === 'function') {
    // Let Hono handle its own HTTP exceptions
    return (err as any).getResponse();
  }

  // Default error response structure
  let statusCode = 500;
  const errorResponse: { 
    success: boolean; 
    error: { 
      code: string; 
      message: string; 
      details?: any 
    } 
  } = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred.',
    },
  };

  // Handle specific error types
  if (err.name === 'ZodError') {
    statusCode = 400;
    errorResponse.error.code = 'VALIDATION_ERROR';
    errorResponse.error.message = 'Request validation failed.';
    errorResponse.error.details = (err as any).errors;
  } else if ('statusCode' in err && typeof (err as any).statusCode === 'number') {
    statusCode = (err as any).statusCode;
    errorResponse.error.message = err.message;
    if ('code' in err && typeof (err as any).code === 'string') {
      errorResponse.error.code = (err as any).code;
    }
  } else {
    errorResponse.error.message = err.message || 'An unexpected internal error occurred.';
  }

  return c.json(errorResponse, statusCode as any);
});

// 6. 404 Handler
app.notFound((c) => {
  return c.json({
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

// Mitra Admin Routes (Protected by Cloudflare Access)
app.route('/api/mitra', mitraRoutes);
app.route('/api/mitra/orders', mitraOrderRoutes);

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
app.get('/api/test/error', (c) => {
  throw new Error('Test error for error handling verification');
});

// Test endpoint to verify validation error handling
app.post('/api/test/validation', zValidator('json', z.object({
  requiredField: z.string(),
})), (c) => {
  const data = c.req.valid('json');
  return c.json({
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

// --- Future Route Modules (to be implemented in subsequent tasks) ---
// import publicRoutes from './routes/public';
// import driverRoutes from './routes/driver';
// 
// app.route('/api/public', publicRoutes);
// app.route('/api/driver', driverRoutes);

export default app; 