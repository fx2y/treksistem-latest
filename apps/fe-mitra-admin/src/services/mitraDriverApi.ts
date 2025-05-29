import { Driver, DriverConfig } from '@treksistem/shared-types';
import { apiClient } from './api';

export interface ApiDriver extends Driver {
  // Frontend might parse configJson for easier use
  parsedConfigJson?: DriverConfig;
}

export interface AssignedServiceInfo {
  serviceId: string;
  serviceName: string;
  serviceType: string;
  isActive: boolean;
  assignedAt: number;
}

export interface CreateDriverPayload {
  identifier: string;
  name: string;
  configJson?: DriverConfig;
  isActive?: boolean;
}

export async function fetchMitraDrivers(): Promise<ApiDriver[]> {
  try {
    const response = await apiClient.get<{ success: boolean; data: { drivers: any[] } }>('/mitra/drivers');
    
    if (!response.success) {
      throw new Error('Failed to fetch drivers data');
    }
    
    // Parse configJson for immediate use in frontend
    return response.data.drivers.map((driver: any) => ({
      ...driver,
      parsedConfigJson: typeof driver.configJson === 'string' 
        ? JSON.parse(driver.configJson) 
        : driver.configJson, // Already an object if backend sends parsed
    }));
  } catch (error) {
    console.error('Error fetching mitra drivers:', error);
    throw error;
  }
}

export async function fetchMitraDriverById(driverId: string): Promise<ApiDriver> {
  try {
    const response = await apiClient.get<{ success: boolean; data: any }>(`/mitra/drivers/${driverId}`);
    
    if (!response.success) {
      throw new Error('Failed to fetch driver data');
    }
    
    return {
      ...response.data,
      parsedConfigJson: typeof response.data.configJson === 'string' 
        ? JSON.parse(response.data.configJson) 
        : response.data.configJson,
    };
  } catch (error) {
    console.error(`Error fetching driver ${driverId}:`, error);
    throw error;
  }
}

export async function createMitraDriver(payload: CreateDriverPayload): Promise<ApiDriver> {
  try {
    const response = await apiClient.post<{ success: boolean; data: any }>('/mitra/drivers', payload);
    
    if (!response.success) {
      throw new Error('Failed to create driver');
    }
    
    return {
      ...response.data,
      parsedConfigJson: typeof response.data.configJson === 'string' 
        ? JSON.parse(response.data.configJson) 
        : response.data.configJson,
    };
  } catch (error) {
    console.error('Error creating driver:', error);
    throw error;
  }
}

export async function updateMitraDriver(driverId: string, payload: Partial<CreateDriverPayload>): Promise<ApiDriver> {
  try {
    const response = await apiClient.put<{ success: boolean; data: any }>(`/mitra/drivers/${driverId}`, payload);
    
    if (!response.success) {
      throw new Error('Failed to update driver');
    }
    
    return {
      ...response.data,
      parsedConfigJson: typeof response.data.configJson === 'string' 
        ? JSON.parse(response.data.configJson) 
        : response.data.configJson,
    };
  } catch (error) {
    console.error(`Error updating driver ${driverId}:`, error);
    throw error;
  }
}

export async function fetchAssignedServicesForDriver(driverId: string): Promise<AssignedServiceInfo[]> {
  try {
    const response = await apiClient.get<{ success: boolean; data: { services: any[] } }>(`/mitra/drivers/${driverId}/services`);
    
    if (!response.success) {
      throw new Error('Failed to fetch assigned services');
    }
    
    return response.data.services;
  } catch (error) {
    console.error(`Error fetching assigned services for driver ${driverId}:`, error);
    throw error;
  }
}

export async function assignServiceToDriver(driverId: string, serviceId: string): Promise<void> {
  try {
    const response = await apiClient.post<{ success: boolean }>(`/mitra/drivers/${driverId}/services`, { serviceId });
    
    if (!response.success) {
      throw new Error('Failed to assign service to driver');
    }
  } catch (error) {
    console.error(`Error assigning service ${serviceId} to driver ${driverId}:`, error);
    throw error;
  }
}

export async function unassignServiceFromDriver(driverId: string, serviceId: string): Promise<void> {
  try {
    const response = await apiClient.delete<{ success: boolean }>(`/mitra/drivers/${driverId}/services/${serviceId}`);
    
    if (!response.success) {
      throw new Error('Failed to unassign service from driver');
    }
  } catch (error) {
    console.error(`Error unassigning service ${serviceId} from driver ${driverId}:`, error);
    throw error;
  }
} 