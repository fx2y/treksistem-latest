// Driver API service functions
// These will be implemented when the backend API is ready

import { OrderStatus, DriverOrderView } from '@treksistem/shared-types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Driver-specific types
export interface DriverOrder extends DriverOrderView {
  service: {
    name: string;
    type: string;
    parsedConfigJson?: Record<string, unknown>; // Parsed service configuration
  };
  mitraName: string;
}

export interface UpdateStatusPayload {
  newStatus: OrderStatus;
  notes?: string;
  photoR2Key?: string;
  lat?: number;
  lon?: number;
}

export interface UploadUrlResponse {
  uploadUrl: string;
  r2ObjectKey: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
  details?: string;
}

class DriverApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: string,
  ) {
    super(message);
    this.name = 'DriverApiError';
    // Ensure properties are used to avoid linting warnings
    this.status = status;
    this.details = details;
  }
}

async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    let errorDetails = undefined;

    try {
      const errorData: ApiError = await response.json();
      errorMessage = errorData.error || errorMessage;
      errorDetails = errorData.details;
    } catch {
      errorMessage = `${errorMessage}: ${response.statusText}`;
    }

    throw new DriverApiError(errorMessage, response.status, errorDetails);
  }

  const result: ApiResponse<T> = await response.json();
  return result.data;
}

export async function fetchAssignedOrders(driverId: string): Promise<DriverOrder[]> {
  const response = await fetch(`${API_BASE_URL}/driver/${driverId}/orders/assigned`);
  return handleApiResponse<DriverOrder[]>(response);
}

export async function acceptOrder(driverId: string, orderId: string): Promise<DriverOrder> {
  const response = await fetch(`${API_BASE_URL}/driver/${driverId}/orders/${orderId}/accept`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return handleApiResponse<DriverOrder>(response);
}

export async function rejectOrder(
  driverId: string,
  orderId: string,
  reason?: string,
): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/driver/${driverId}/orders/${orderId}/reject`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reason }),
  });
  return handleApiResponse<{ message: string }>(response);
}

export async function updateOrderStatus(
  driverId: string,
  orderId: string,
  payload: UpdateStatusPayload,
): Promise<DriverOrder> {
  const response = await fetch(
    `${API_BASE_URL}/driver/${driverId}/orders/${orderId}/update-status`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
  );
  return handleApiResponse<DriverOrder>(response);
}

export async function addOrderNote(
  driverId: string,
  orderId: string,
  note: string,
  eventType?: string,
): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/driver/${driverId}/orders/${orderId}/add-note`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ note, eventType }),
  });
  return handleApiResponse<{ message: string }>(response);
}

export async function requestUploadUrl(
  driverId: string,
  orderId: string,
  filename: string,
  contentType: string,
): Promise<UploadUrlResponse> {
  const response = await fetch(
    `${API_BASE_URL}/driver/${driverId}/orders/${orderId}/request-upload-url`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filename, contentType }),
    },
  );
  return handleApiResponse<UploadUrlResponse>(response);
}

export async function uploadFileToR2(
  uploadUrl: string,
  file: File,
  contentType: string,
): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
    },
    body: file,
  });

  if (!response.ok) {
    throw new DriverApiError(
      `Failed to upload file to R2: ${response.status} ${response.statusText}`,
      response.status,
    );
  }
}

// Helper function to get current location
export function getCurrentLocation(): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      (error) => {
        reject(new Error(`Failed to get location: ${error.message}`));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  });
}

// Helper function to generate WhatsApp deep links
export function generateWhatsAppLink(phoneNumber: string, message?: string): string {
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  const formattedNumber = cleanNumber.startsWith('0')
    ? `62${cleanNumber.slice(1)}`
    : cleanNumber.startsWith('62')
      ? cleanNumber
      : `62${cleanNumber}`;

  const encodedMessage = message ? encodeURIComponent(message) : '';
  return `https://wa.me/${formattedNumber}${encodedMessage ? `?text=${encodedMessage}` : ''}`;
}

// Helper function to generate Google Maps link
export function generateMapsLink(lat: number, lon: number, label?: string): string {
  const coords = `${lat},${lon}`;
  const labelParam = label ? `&q=${encodeURIComponent(label)}` : '';
  return `https://maps.google.com/?q=${coords}${labelParam}`;
}

export { DriverApiError };
