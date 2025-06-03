import { ApiErrorCode, type ApiErrorCodeType } from '@treksistem/shared-types';

// Base API configuration and utilities
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'; // This will be proxied to the worker in development

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /**
   * Check if this is a specific error code
   */
  is(code: ApiErrorCodeType): boolean {
    return this.code === code;
  }

  /**
   * Check if this is a client error (4xx)
   */
  isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  /**
   * Check if this is a server error (5xx)
   */
  isServerError(): boolean {
    return this.status >= 500;
  }

  /**
   * Check if this is a validation error
   */
  isValidationError(): boolean {
    return this.is(ApiErrorCode.VALIDATION_ERROR);
  }

  /**
   * Check if this is an authentication error
   */
  isAuthError(): boolean {
    return this.is(ApiErrorCode.UNAUTHORIZED) || this.is(ApiErrorCode.FORBIDDEN);
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(): string {
    switch (this.code) {
      case ApiErrorCode.VALIDATION_ERROR:
        return 'Please check your input and try again.';
      case ApiErrorCode.UNAUTHORIZED:
        return 'Please log in to continue.';
      case ApiErrorCode.FORBIDDEN:
        return 'You do not have permission to perform this action.';
      case ApiErrorCode.NOT_FOUND:
        return 'The requested resource was not found.';
      case ApiErrorCode.RESOURCE_CONFLICT:
        return 'This resource already exists or conflicts with existing data.';
      case ApiErrorCode.INTERNAL_SERVER_ERROR:
      case ApiErrorCode.DATABASE_ERROR:
        return 'Something went wrong on our end. Please try again later.';
      default:
        return this.message || 'An unexpected error occurred.';
    }
  }
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        let errorData: unknown = {};
        try {
          errorData = await response.json();
        } catch {
          // If response is not JSON, create a generic error
          errorData = {
            error: {
              code: 'NETWORK_ERROR',
              message: `HTTP ${response.status}: ${response.statusText}`,
            },
          };
        }

        // Handle RFC-TREK-ERROR-001 format
        if (
          typeof errorData === 'object' &&
          errorData !== null &&
          'success' in errorData &&
          errorData.success === false &&
          'error' in errorData
        ) {
          const error = errorData.error as { code?: string; message?: string; details?: unknown };
          throw new ApiError(
            error.code || 'UNKNOWN_ERROR',
            error.message || `HTTP ${response.status}`,
            response.status,
            error.details,
          );
        }

        // Fallback for non-standard error responses
        const fallbackData = errorData as { message?: string };
        throw new ApiError(
          'UNKNOWN_ERROR',
          fallbackData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
        );
      }

      const data = await response.json();

      // Handle RFC-TREK-ERROR-001 success format
      if (typeof data === 'object' && data !== null && 'success' in data && data.success === true) {
        return data.data;
      }

      // Handle legacy format or direct data return
      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      // Network or other errors
      throw new ApiError(
        'NETWORK_ERROR',
        error instanceof Error ? error.message : 'Network error',
        0,
      );
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
