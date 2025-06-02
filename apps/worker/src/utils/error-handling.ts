import { HTTPException } from 'hono/http-exception';

/**
 * Standard error codes as per RFC-TREK-ERROR-001
 */
export const ERROR_CODES = {
  // Client errors (4xx)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_REQUEST: 'INVALID_REQUEST',
  
  // Business logic errors
  COST_CALCULATION_ERROR: 'COST_CALCULATION_ERROR',
  TRUST_MECHANISM_ERROR: 'TRUST_MECHANISM_ERROR',
  SERVICE_CONFIG_ERROR: 'SERVICE_CONFIG_ERROR',
  ORDER_STATUS_ERROR: 'ORDER_STATUS_ERROR',
  DRIVER_ASSIGNMENT_ERROR: 'DRIVER_ASSIGNMENT_ERROR',
  
  // Server errors (5xx)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

/**
 * Standard error response structure per RFC-TREK-ERROR-001
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: any;
  };
}

/**
 * Base application error class
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }

  toHTTPException(): HTTPException {
    return new HTTPException(this.statusCode as any, {
      message: this.message,
    });
  }

  toErrorResponse(): ErrorResponse {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
    };
  }
}

/**
 * Validation error for request validation failures
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, ERROR_CODES.VALIDATION_ERROR, 400, details);
    this.name = 'ValidationError';
  }
}

/**
 * Authentication error
 */
export class AuthError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, ERROR_CODES.AUTH_ERROR, 401);
    this.name = 'AuthError';
  }
}

/**
 * Authorization error
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, ERROR_CODES.FORBIDDEN, 403);
    this.name = 'ForbiddenError';
  }
}

/**
 * Resource not found error
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, ERROR_CODES.NOT_FOUND, 404);
    this.name = 'NotFoundError';
  }
}

/**
 * Conflict error for duplicate resources
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super(message, ERROR_CODES.CONFLICT, 409);
    this.name = 'ConflictError';
  }
}

/**
 * Database operation error
 */
export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed', details?: any) {
    super(message, ERROR_CODES.DATABASE_ERROR, 500, details);
    this.name = 'DatabaseError';
  }
}

/**
 * Service configuration error
 */
export class ServiceConfigError extends AppError {
  constructor(message: string, details?: any) {
    super(message, ERROR_CODES.SERVICE_CONFIG_ERROR, 400, details);
    this.name = 'ServiceConfigError';
  }
}

/**
 * Order status transition error
 */
export class OrderStatusError extends AppError {
  constructor(message: string, details?: any) {
    super(message, ERROR_CODES.ORDER_STATUS_ERROR, 400, details);
    this.name = 'OrderStatusError';
  }
}

/**
 * Driver assignment error
 */
export class DriverAssignmentError extends AppError {
  constructor(message: string, details?: any) {
    super(message, ERROR_CODES.DRIVER_ASSIGNMENT_ERROR, 400, details);
    this.name = 'DriverAssignmentError';
  }
}

/**
 * Logging utilities with structured context
 */
export class Logger {
  private static formatContext(context?: Record<string, any>): string {
    if (!context) return '';
    return JSON.stringify(context, null, 2);
  }

  static info(message: string, context?: Record<string, any>): void {
    const timestamp = new Date().toISOString();
    console.log(`[INFO: ${timestamp}] ${message}`, context ? this.formatContext(context) : '');
  }

  static warn(message: string, context?: Record<string, any>): void {
    const timestamp = new Date().toISOString();
    console.warn(`[WARN: ${timestamp}] ${message}`, context ? this.formatContext(context) : '');
  }

  static error(message: string, error?: Error, context?: Record<string, any>): void {
    const timestamp = new Date().toISOString();
    const errorInfo = error ? {
      message: error.message,
      stack: error.stack,
      name: error.name,
    } : {};
    
    console.error(`[ERROR: ${timestamp}] ${message}`, {
      ...errorInfo,
      ...context,
    });
  }

  static debug(message: string, context?: Record<string, any>): void {
    const timestamp = new Date().toISOString();
    console.log(`[DEBUG: ${timestamp}] ${message}`, context ? this.formatContext(context) : '');
  }
}

/**
 * Database error handler utility
 */
export function handleDatabaseError(error: any, operation: string): never {
  Logger.error(`Database error during ${operation}`, error);

  if (error.message?.includes('UNIQUE constraint failed')) {
    throw new ConflictError('Resource already exists or constraint violation.');
  }
  
  if (error.message?.includes('NOT NULL constraint failed')) {
    throw new ValidationError('Required field missing.');
  }
  
  if (error.message?.includes('FOREIGN KEY constraint failed')) {
    throw new ValidationError('Invalid reference to related resource.');
  }

  throw new DatabaseError(`Database operation failed: ${operation}`);
}

/**
 * Async error wrapper for route handlers
 */
export function asyncHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>
) {
  return (...args: T): Promise<R> => {
    return Promise.resolve(fn(...args)).catch((error) => {
      if (error instanceof AppError) {
        throw error;
      }
      
      Logger.error('Unhandled error in async handler', error);
      throw new AppError('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
    });
  };
}

/**
 * Validation helper for CUID format
 */
export function validateCuid(id: string, fieldName: string = 'ID'): void {
  const cuidRegex = /^[a-z0-9]{25}$/;
  if (!cuidRegex.test(id)) {
    throw new ValidationError(`${fieldName} must be a valid CUID format.`, {
      provided: id,
      expected: 'CUID format (25 lowercase alphanumeric characters)',
    });
  }
} 