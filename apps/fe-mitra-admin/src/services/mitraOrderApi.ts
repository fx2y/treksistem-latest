import { Order, OrderStatus, OrderEvent } from '@treksistem/shared-types';
import { apiClient } from './api';

export interface ApiOrder extends Order {
  // Nested service information
  service?: {
    id: string;
    name: string;
    serviceTypeKey: string;
  };
  // Nested driver information
  driver?: {
    id: string;
    name: string;
    identifier: string;
  };
  // Order events for timeline
  events?: OrderEvent[];
  // Parsed details JSON for easier frontend use
  parsedDetailsJson?: any;
}

export interface OrderFilters {
  status?: OrderStatus;
  serviceId?: string;
  driverId?: string;
  dateFrom?: string; // ISO date string
  dateTo?: string; // ISO date string
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface OrdersResponse {
  data: ApiOrder[];
  meta: PaginationMeta;
}

export interface AssignDriverPayload {
  driverId: string;
}

export async function fetchMitraOrders(filters: OrderFilters = {}): Promise<OrdersResponse> {
  try {
    // Build query parameters
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.serviceId) params.append('serviceId', filters.serviceId);
    if (filters.driverId) params.append('driverId', filters.driverId);
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    const endpoint = `/mitra/orders${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiClient.get<{ success: boolean; data: OrdersResponse }>(endpoint);
    
    if (!response.success) {
      throw new Error('Failed to fetch orders data');
    }
    
    // Parse detailsJson for easier frontend use
    const ordersWithParsedDetails = response.data.data.map((order: any) => ({
      ...order,
      parsedDetailsJson: typeof order.detailsJson === 'string' 
        ? JSON.parse(order.detailsJson) 
        : order.detailsJson,
    }));
    
    return {
      data: ordersWithParsedDetails,
      meta: response.data.meta,
    };
  } catch (error) {
    console.error('Error fetching mitra orders:', error);
    throw error;
  }
}

export async function fetchMitraOrderById(orderId: string): Promise<ApiOrder> {
  try {
    const response = await apiClient.get<{ success: boolean; data: any }>(`/mitra/orders/${orderId}`);
    
    if (!response.success) {
      throw new Error('Failed to fetch order data');
    }
    
    return {
      ...response.data,
      parsedDetailsJson: typeof response.data.detailsJson === 'string' 
        ? JSON.parse(response.data.detailsJson) 
        : response.data.detailsJson,
    };
  } catch (error) {
    console.error(`Error fetching order ${orderId}:`, error);
    throw error;
  }
}

export async function assignDriverToOrder(orderId: string, driverId: string): Promise<ApiOrder> {
  try {
    const payload: AssignDriverPayload = { driverId };
    const response = await apiClient.post<{ success: boolean; data: any }>(`/mitra/orders/${orderId}/assign-driver`, payload);
    
    if (!response.success) {
      throw new Error('Failed to assign driver to order');
    }
    
    return {
      ...response.data,
      parsedDetailsJson: typeof response.data.detailsJson === 'string' 
        ? JSON.parse(response.data.detailsJson) 
        : response.data.detailsJson,
    };
  } catch (error) {
    console.error(`Error assigning driver to order ${orderId}:`, error);
    throw error;
  }
}

// Utility function to check if an order can be assigned a driver
export function canAssignDriver(order: ApiOrder): boolean {
  return order.status === 'PENDING_DRIVER_ASSIGNMENT' && !order.driverId;
}

// Utility function to get order status badge variant
export function getOrderStatusBadgeVariant(status: OrderStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'PENDING':
    case 'PENDING_DRIVER_ASSIGNMENT':
      return 'outline';
    case 'ACCEPTED_BY_MITRA':
    case 'DRIVER_ASSIGNED':
    case 'ACCEPTED_BY_DRIVER':
      return 'default';
    case 'DRIVER_AT_PICKUP':
    case 'PICKED_UP':
    case 'IN_TRANSIT':
    case 'DRIVER_AT_DROPOFF':
      return 'secondary';
    case 'DELIVERED':
      return 'default';
    case 'CANCELLED_BY_USER':
    case 'CANCELLED_BY_MITRA':
    case 'CANCELLED_BY_DRIVER':
    case 'FAILED_DELIVERY':
    case 'REJECTED_BY_DRIVER':
      return 'destructive';
    default:
      return 'outline';
  }
} 