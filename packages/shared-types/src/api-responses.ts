/**
 * Standard API response types per RFC-TREK-ERROR-001
 */

export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Standard error codes from backend
 */
export const API_ERROR_CODES = {
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

export type ApiErrorCode = typeof API_ERROR_CODES[keyof typeof API_ERROR_CODES];

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(
    public _code: string,
    message: string,
    public _status: number,
    public _details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /**
   * Check if this is a specific error code
   */
  is(_code: ApiErrorCode): boolean {
    return this._code === _code;
  }

  /**
   * Check if this is a client error (4xx)
   */
  isClientError(): boolean {
    return this._status >= 400 && this._status < 500;
  }

  /**
   * Check if this is a server error (5xx)
   */
  isServerError(): boolean {
    return this._status >= 500;
  }

  /**
   * Check if this is a validation error
   */
  isValidationError(): boolean {
    return this.is(API_ERROR_CODES.VALIDATION_ERROR);
  }

  /**
   * Check if this is an authentication error
   */
  isAuthError(): boolean {
    return this.is(API_ERROR_CODES.AUTH_ERROR) || this.is(API_ERROR_CODES.FORBIDDEN);
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(): string {
    switch (this._code) {
      case API_ERROR_CODES.VALIDATION_ERROR:
        return 'Please check your input and try again.';
      case API_ERROR_CODES.AUTH_ERROR:
        return 'Please log in to continue.';
      case API_ERROR_CODES.FORBIDDEN:
        return 'You do not have permission to perform this action.';
      case API_ERROR_CODES.NOT_FOUND:
        return 'The requested resource was not found.';
      case API_ERROR_CODES.CONFLICT:
        return 'This resource already exists or conflicts with existing data.';
      case API_ERROR_CODES.INTERNAL_ERROR:
      case API_ERROR_CODES.DATABASE_ERROR:
        return 'Something went wrong on our end. Please try again later.';
      default:
        return this.message || 'An unexpected error occurred.';
    }
  }

  // Getter methods to maintain backward compatibility
  get code(): string {
    return this._code;
  }

  get status(): number {
    return this._status;
  }

  get details(): any {
    return this._details;
  }
} 