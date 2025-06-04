import { z } from 'zod';

/**
 * Standard API Response Schema
 * Used for all API endpoints to ensure consistent response format
 */
export const ApiResponseSchema = z.object({
  /** Operation success status */
  success: z.boolean(),
  /** Optional success/info message */
  message: z.string().optional(),
  /** Response data payload */
  data: z.any().optional(),
  /** Error message (when success is false) */
  error: z.string().optional(),
  /** Error code for programmatic handling */
  errorCode: z.string().optional(),
  /** Request timestamp */
  timestamp: z.number().int().positive().optional(),
  /** Request ID for tracing */
  requestId: z.string().optional(),
});

export type ApiResponse<T = unknown> = {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errorCode?: string;
  timestamp?: number;
  requestId?: string;
};

/**
 * Success Response Schema
 * For successful API responses
 */
export const ApiSuccessResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    message: z.string().optional(),
    data: dataSchema,
    timestamp: z.number().int().positive().optional(),
    requestId: z.string().optional(),
  });

/**
 * Error Response Schema
 * For failed API responses
 */
export const ApiErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string().min(1, 'Error message is required'),
  errorCode: z.string().optional(),
  details: z.any().optional(),
  timestamp: z.number().int().positive().optional(),
  requestId: z.string().optional(),
});

export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;

/**
 * Pagination Query Parameters Schema
 */
export const PaginationQuerySchema = z.object({
  /** Page number (1-based) */
  page: z.coerce.number().int().min(1).default(1),
  /** Items per page */
  limit: z.coerce.number().int().min(1).max(100).default(20),
  /** Sort field */
  sortBy: z.string().optional(),
  /** Sort direction */
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

/**
 * Paginated Response Schema
 */
export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    pagination: z.object({
      currentPage: z.number().int().min(1),
      totalPages: z.number().int().min(0),
      totalItems: z.number().int().min(0),
      itemsPerPage: z.number().int().min(1),
      hasNextPage: z.boolean(),
      hasPrevPage: z.boolean(),
    }),
  });

/**
 * Filter Query Schema
 * Common filtering parameters
 */
export const FilterQuerySchema = z.object({
  /** Search query */
  search: z.string().optional(),
  /** Status filter */
  status: z.string().optional(),
  /** Date range filter - start */
  dateFrom: z.string().datetime().optional(),
  /** Date range filter - end */
  dateTo: z.string().datetime().optional(),
  /** Active/inactive filter */
  isActive: z.coerce.boolean().optional(),
});

export type FilterQuery = z.infer<typeof FilterQuerySchema>;

/**
 * Authentication Header Schema
 * For validating auth-related headers
 */
export const AuthHeaderSchema = z.object({
  /** Cloudflare Access authenticated user email */
  'cf-access-authenticated-user-email': z.string().email().optional(),
  /** Authorization bearer token */
  authorization: z
    .string()
    .regex(/^Bearer .+$/)
    .optional(),
  /** API key */
  'x-api-key': z.string().optional(),
});

export type AuthHeader = z.infer<typeof AuthHeaderSchema>;

/**
 * Request Context Schema
 * Information about the request context
 */
export const RequestContextSchema = z.object({
  /** Request ID for tracing */
  requestId: z.string(),
  /** User ID (from auth) */
  userId: z.string().optional(),
  /** User type */
  userType: z.enum(['CUSTOMER', 'DRIVER', 'MITRA_ADMIN', 'SYSTEM_ADMIN']).optional(),
  /** Mitra ID (for mitra users) */
  mitraId: z.string().optional(),
  /** Driver ID (for driver users) */
  driverId: z.string().optional(),
  /** Request timestamp */
  timestamp: z.number().int().positive(),
  /** User agent */
  userAgent: z.string().optional(),
  /** Client IP */
  clientIp: z.string().optional(),
});

export type RequestContext = z.infer<typeof RequestContextSchema>;

/**
 * API Error Codes
 * Standardized error codes for consistent error handling
 */
export const ApiErrorCode = {
  // Authentication errors (401)
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',

  // Authorization errors (403)
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',

  // Validation errors (400)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',

  // Resource errors (404)
  NOT_FOUND: 'NOT_FOUND',
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  SERVICE_NOT_FOUND: 'SERVICE_NOT_FOUND',
  DRIVER_NOT_FOUND: 'DRIVER_NOT_FOUND',
  MITRA_NOT_FOUND: 'MITRA_NOT_FOUND',

  // Conflict errors (409)
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  ORDER_ALREADY_ASSIGNED: 'ORDER_ALREADY_ASSIGNED',
  DRIVER_ALREADY_BUSY: 'DRIVER_ALREADY_BUSY',

  // Business logic errors (422)
  BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',
  INVALID_ORDER_STATUS: 'INVALID_ORDER_STATUS',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DRIVER_NOT_AVAILABLE: 'DRIVER_NOT_AVAILABLE',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',

  // Rate limiting (429)
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // Server errors (500)
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
} as const;

export type ApiErrorCodeType = (typeof ApiErrorCode)[keyof typeof ApiErrorCode];

/**
 * API Method Schema
 */
export const ApiMethodSchema = z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);

export type ApiMethod = z.infer<typeof ApiMethodSchema>;

/**
 * File Upload Schema
 * For handling file uploads (e.g., driver photos)
 */
export const FileUploadSchema = z.object({
  /** File name */
  filename: z.string().min(1, 'Filename is required'),
  /** MIME type */
  mimeType: z.string().min(1, 'MIME type is required'),
  /** File size in bytes */
  size: z.number().int().min(1, 'File size must be greater than 0'),
  /** File content (base64 or binary) */
  content: z.string().optional(),
  /** R2 upload key (if already uploaded) */
  r2Key: z.string().optional(),
});

export type FileUpload = z.infer<typeof FileUploadSchema>;

/**
 * Presigned URL Request Schema
 * For requesting presigned URLs for R2 uploads
 */
export const PresignedUrlRequestSchema = z.object({
  /** File name */
  filename: z.string().min(1, 'Filename is required'),
  /** MIME type */
  mimeType: z.string().min(1, 'MIME type is required'),
  /** File size in bytes */
  size: z
    .number()
    .int()
    .min(1)
    .max(10 * 1024 * 1024), // 10MB max
  /** Upload purpose */
  purpose: z.enum(['DRIVER_PHOTO', 'ORDER_PROOF', 'VEHICLE_PHOTO', 'DOCUMENT']),
});

export type PresignedUrlRequest = z.infer<typeof PresignedUrlRequestSchema>;

/**
 * Presigned URL Response Schema
 */
export const PresignedUrlResponseSchema = z.object({
  /** Presigned upload URL */
  uploadUrl: z.string().url(),
  /** R2 key for the uploaded file */
  r2Key: z.string().min(1),
  /** Upload expiry time */
  expiresAt: z.number().int().positive(),
  /** Required headers for upload */
  requiredHeaders: z.record(z.string()).optional(),
});

export type PresignedUrlResponse = z.infer<typeof PresignedUrlResponseSchema>;

/**
 * Webhook Event Schema
 * For webhook notifications
 */
export const WebhookEventSchema = z.object({
  /** Event ID */
  id: z.string().min(1),
  /** Event type */
  type: z.string().min(1),
  /** Event data */
  data: z.any(),
  /** Event timestamp */
  timestamp: z.number().int().positive(),
  /** Source of the event */
  source: z.string().min(1),
  /** Event version */
  version: z.string().default('1.0'),
});

export type WebhookEvent = z.infer<typeof WebhookEventSchema>;

/**
 * Health Check Response Schema
 */
export const HealthCheckResponseSchema = z.object({
  status: z.enum(['healthy', 'unhealthy']),
  timestamp: z.number().int().positive(),
  version: z.string(),
  services: z
    .record(
      z.object({
        status: z.enum(['healthy', 'unhealthy']),
        latency: z.number().optional(),
        error: z.string().optional(),
      }),
    )
    .optional(),
});

export type HealthCheckResponse = z.infer<typeof HealthCheckResponseSchema>;

/**
 * Bulk Operation Schema
 * For handling bulk operations
 */
export const BulkOperationSchema = z.object({
  /** Operation type */
  operation: z.enum(['CREATE', 'UPDATE', 'DELETE']),
  /** Items to process */
  items: z.array(z.any()).min(1).max(100),
  /** Options for the bulk operation */
  options: z
    .object({
      /** Continue on error */
      continueOnError: z.boolean().default(false),
      /** Validate items before processing */
      validateFirst: z.boolean().default(true),
    })
    .optional(),
});

export type BulkOperation = z.infer<typeof BulkOperationSchema>;

/**
 * Bulk Operation Result Schema
 */
export const BulkOperationResultSchema = z.object({
  /** Total items processed */
  totalItems: z.number().int().min(0),
  /** Successfully processed items */
  successCount: z.number().int().min(0),
  /** Failed items */
  errorCount: z.number().int().min(0),
  /** Detailed results */
  results: z.array(
    z.object({
      index: z.number().int().min(0),
      success: z.boolean(),
      data: z.any().optional(),
      error: z.string().optional(),
    }),
  ),
  /** Overall operation status */
  status: z.enum(['completed', 'partial', 'failed']),
});

export type BulkOperationResult = z.infer<typeof BulkOperationResultSchema>;
