import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { HTTPException } from 'hono/http-exception';
import {
  AppError,
  ValidationError,
  AuthError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  ServiceConfigError,
  OrderStatusError,
  DriverAssignmentError,
  Logger,
  handleDatabaseError,
  validateCuid,
  ERROR_CODES,
} from '../utils/error-handling';
import type { AppContext } from '../types';

const testErrorRoutes = new Hono<AppContext>();

/**
 * Test global error handler with generic Error
 */
testErrorRoutes.get('/generic-error', (_c) => {
  throw new Error('Test generic error for global handler verification');
});

/**
 * Test Hono HTTPException handling
 */
testErrorRoutes.get('/http-exception', (_c) => {
  throw new HTTPException(418, { message: 'I am a teapot - HTTP Exception test' });
});

/**
 * Test Zod validation error
 */
testErrorRoutes.post(
  '/validation-error',
  zValidator(
    'json',
    z.object({
      requiredField: z.string().min(1, 'Required field cannot be empty'),
      email: z.string().email('Invalid email format'),
      age: z.number().int().min(18, 'Must be at least 18 years old'),
    }),
  ),
  (c) => {
    const data = c.req.valid('json');
    return c.json({
      success: true,
      data: {
        message: 'Validation passed',
        receivedData: data,
      },
    });
  },
);

/**
 * Test custom AppError classes
 */
testErrorRoutes.get('/app-error/:errorType', (c) => {
  const errorType = c.req.param('errorType');

  switch (errorType) {
    case 'validation':
      throw new ValidationError('Test validation error', {
        field: 'testField',
        value: 'invalidValue',
      });

    case 'auth':
      throw new AuthError('Test authentication error');

    case 'forbidden':
      throw new ForbiddenError('Test authorization error');

    case 'not-found':
      throw new NotFoundError('Test resource not found error');

    case 'conflict':
      throw new ConflictError('Test resource conflict error');

    case 'database':
      throw new DatabaseError('Test database error', {
        operation: 'SELECT',
        table: 'test_table',
      });

    case 'service-config':
      throw new ServiceConfigError('Test service configuration error', {
        configField: 'pricing.biayaPerKm',
        issue: 'missing_value',
      });

    case 'order-status':
      throw new OrderStatusError('Test order status error', {
        currentStatus: 'PENDING',
        attemptedStatus: 'COMPLETED',
        orderId: 'test-order-123',
      });

    case 'driver-assignment':
      throw new DriverAssignmentError('Test driver assignment error', {
        driverId: 'test-driver-123',
        orderId: 'test-order-123',
        reason: 'driver_not_available',
      });

    default:
      throw new AppError('Test generic app error', ERROR_CODES.INTERNAL_ERROR, 500, {
        errorType,
        timestamp: new Date().toISOString(),
      });
  }
});

/**
 * Test database error handling utility
 */
testErrorRoutes.get('/database-error/:errorType', (_c) => {
  const errorType = _c.req.param('errorType');

  switch (errorType) {
    case 'unique-constraint': {
      const uniqueError = new Error('UNIQUE constraint failed: users.email');
      handleDatabaseError(uniqueError, 'user creation');
      break;
    }

    case 'not-null-constraint': {
      const notNullError = new Error('NOT NULL constraint failed: orders.service_id');
      handleDatabaseError(notNullError, 'order creation');
      break;
    }

    case 'foreign-key-constraint': {
      const fkError = new Error('FOREIGN KEY constraint failed');
      handleDatabaseError(fkError, 'relationship creation');
      break;
    }

    default: {
      const genericDbError = new Error('Database connection timeout');
      handleDatabaseError(genericDbError, 'generic operation');
    }
  }

  return _c.json({ success: true, message: 'This should not be reached' });
});

/**
 * Test CUID validation utility
 */
testErrorRoutes.post(
  '/cuid-validation',
  zValidator(
    'json',
    z.object({
      id: z.string(),
      fieldName: z.string().optional(),
    }),
  ),
  (_c) => {
    const { id, fieldName } = _c.req.valid('json');

    validateCuid(id, fieldName || 'ID');
    return _c.json({
      success: true,
      data: {
        message: 'CUID validation passed',
        validatedId: id,
      },
    });
  },
);

/**
 * Test Logger utility
 */
testErrorRoutes.get('/logger-test', (c) => {
  const testContext = {
    userId: 'test-user-123',
    operation: 'logger-test',
    timestamp: new Date().toISOString(),
  };

  Logger.info('Testing info log', testContext);
  Logger.warn('Testing warning log', { ...testContext, warningType: 'test' });
  Logger.debug('Testing debug log', { ...testContext, debugData: { test: true } });

  try {
    throw new Error('Test error for logger');
  } catch (error) {
    Logger.error('Testing error log', error as Error, testContext);
  }

  return c.json({
    success: true,
    data: {
      message: 'Logger test completed - check console/worker logs',
      context: testContext,
    },
  });
});

/**
 * Test async error handling
 */
testErrorRoutes.get('/async-error', async (c) => {
  // Simulate async operation that fails
  await new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error('Async operation failed'));
    }, 100);
  });

  return c.json({ success: true, message: 'This should not be reached' });
});

/**
 * Test network timeout simulation
 */
testErrorRoutes.get('/timeout-simulation', async (c) => {
  // Simulate a long-running operation
  await new Promise((resolve) => {
    setTimeout(resolve, 5000); // 5 second delay
  });

  return c.json({
    success: true,
    data: {
      message: 'Operation completed after delay',
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * Test error response format compliance
 */
testErrorRoutes.get('/error-format-test', (c) => {
  const testError = new ValidationError('Test error for format verification', {
    field: 'testField',
    expectedFormat: 'RFC-TREK-ERROR-001',
  });

  const errorResponse = testError.toErrorResponse();

  return c.json({
    success: true,
    data: {
      message: 'Error format test',
      sampleErrorResponse: errorResponse,
      compliance: {
        hasSuccessField: 'success' in errorResponse,
        successIsFalse: errorResponse.success === false,
        hasErrorObject: 'error' in errorResponse,
        hasErrorCode: 'code' in errorResponse.error,
        hasErrorMessage: 'message' in errorResponse.error,
        hasErrorDetails: 'details' in errorResponse.error,
      },
    },
  });
});

export default testErrorRoutes;
