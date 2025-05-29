// Basic API service functions for public operations
// Will be implemented in future instructions

import type { 
  OrderPlacementPayload, 
  ServiceConfigBase,
} from '@treksistem/shared-types';
import {
  OrderPlacementPayloadSchema,
  ServiceConfigBaseSchema
} from '@treksistem/shared-types';

const API_BASE_URL = '/api';

/**
 * Public Service Configuration Response
 * Contains service details needed for order placement
 */
export interface PublicServiceConfig {
  serviceId: string;
  name: string;
  mitraName: string;
  configJson: ServiceConfigBase;
  isActive: boolean;
}

/**
 * Order Placement Response
 * Response after successfully placing an order
 */
export interface OrderPlacementResponse {
  orderId: string;
  status: string;
  estimatedCost: number;
  trackingUrl: string;
  requiresReceiverNotification?: boolean;
  receiverNotificationLink?: string;
}

/**
 * API Error Response
 * Standardized error structure
 */
export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

/**
 * Custom error class for API errors
 */
export class ApiRequestError extends Error {
  public code?: string;
  public details?: unknown;

  constructor(message: string, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiRequestError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Handle API response and throw appropriate errors
 */
async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    let errorCode = response.status.toString();
    let errorDetails: unknown;

    try {
      const errorData = await response.json();
      if (errorData.message) {
        errorMessage = errorData.message;
      }
      if (errorData.code) {
        errorCode = errorData.code;
      }
      errorDetails = errorData.details || errorData;
    } catch {
      // Failed to parse error response, use default message
    }

    throw new ApiRequestError(errorMessage, errorCode, errorDetails);
  }

  try {
    return await response.json();
  } catch (error) {
    throw new ApiRequestError('Failed to parse response JSON', 'PARSE_ERROR', error);
  }
}

/**
 * Fetch public service configuration for order placement
 */
export async function fetchPublicServiceConfig(serviceId: string): Promise<PublicServiceConfig> {
  if (!serviceId) {
    throw new ApiRequestError('Service ID is required', 'MISSING_SERVICE_ID');
  }

  const response = await fetch(`${API_BASE_URL}/public/services/${encodeURIComponent(serviceId)}/config`);
  const data = await handleApiResponse<PublicServiceConfig>(response);

  // Validate the configJson structure
  try {
    ServiceConfigBaseSchema.parse(data.configJson);
  } catch (error) {
    throw new ApiRequestError('Invalid service configuration received from server', 'INVALID_CONFIG', error);
  }

  return data;
}

/**
 * Submit order placement request
 */
export async function placeOrder(payload: OrderPlacementPayload): Promise<OrderPlacementResponse> {
  // Validate payload before sending
  try {
    OrderPlacementPayloadSchema.parse(payload);
  } catch (error) {
    throw new ApiRequestError('Invalid order data', 'VALIDATION_ERROR', error);
  }

  const response = await fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return await handleApiResponse<OrderPlacementResponse>(response);
}

/**
 * Legacy API object for backward compatibility
 */
export const publicApi = {
  getServiceConfig: fetchPublicServiceConfig,
  trackOrder: async (orderId: string) => {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/track`);
    return await handleApiResponse(response);
  },
}; 