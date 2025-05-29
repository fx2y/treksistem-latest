import { Service, ServiceConfigBase } from '@treksistem/shared-types';
import { CreateServicePayload } from '@/types/service';
import { apiClient } from './api';

export interface ApiService extends Service {
  // Frontend might parse configJson for easier use
  parsedConfigJson?: ServiceConfigBase;
}

export async function fetchMitraServices(): Promise<ApiService[]> {
  try {
    const response = await apiClient.get<{ success: boolean; data: { services: any[] } }>('/mitra/services');
    
    if (!response.success) {
      throw new Error('Failed to fetch services data');
    }
    
    // Parse configJson for immediate use in frontend and map serviceTypeKey to serviceType
    return response.data.services.map((service: any) => ({
      ...service,
      serviceType: service.serviceTypeKey, // Map database field to entity field
      parsedConfigJson: typeof service.configJson === 'string' 
        ? JSON.parse(service.configJson) 
        : service.configJson, // Already an object if backend sends parsed
    }));
  } catch (error) {
    console.error('Error fetching mitra services:', error);
    throw error;
  }
}

export async function fetchMitraServiceById(serviceId: string): Promise<ApiService> {
  try {
    const response = await apiClient.get<{ success: boolean; data: any }>(`/mitra/services/${serviceId}`);
    
    if (!response.success) {
      throw new Error('Failed to fetch service data');
    }
    
    return {
      ...response.data,
      serviceType: response.data.serviceTypeKey, // Map database field to entity field
      parsedConfigJson: typeof response.data.configJson === 'string' 
        ? JSON.parse(response.data.configJson) 
        : response.data.configJson,
    };
  } catch (error) {
    console.error(`Error fetching service ${serviceId}:`, error);
    throw error;
  }
}

export async function createMitraService(payload: CreateServicePayload): Promise<ApiService> {
  try {
    const response = await apiClient.post<{ success: boolean; data: any }>('/mitra/services', payload);
    
    if (!response.success) {
      throw new Error('Failed to create service');
    }
    
    return {
      ...response.data,
      serviceType: response.data.serviceTypeKey,
      parsedConfigJson: typeof response.data.configJson === 'string' 
        ? JSON.parse(response.data.configJson) 
        : response.data.configJson,
    };
  } catch (error) {
    console.error('Error creating service:', error);
    throw error;
  }
}

export async function updateMitraService(serviceId: string, payload: Partial<CreateServicePayload>): Promise<ApiService> {
  try {
    const response = await apiClient.put<{ success: boolean; data: any }>(`/mitra/services/${serviceId}`, payload);
    
    if (!response.success) {
      throw new Error('Failed to update service');
    }
    
    return {
      ...response.data,
      serviceType: response.data.serviceTypeKey,
      parsedConfigJson: typeof response.data.configJson === 'string' 
        ? JSON.parse(response.data.configJson) 
        : response.data.configJson,
    };
  } catch (error) {
    console.error(`Error updating service ${serviceId}:`, error);
    throw error;
  }
}

export async function deleteMitraService(serviceId: string): Promise<void> {
  try {
    const response = await apiClient.delete<{ success: boolean }>(`/mitra/services/${serviceId}`);
    
    if (!response.success) {
      throw new Error('Failed to delete service');
    }
  } catch (error) {
    console.error(`Error deleting service ${serviceId}:`, error);
    throw error;
  }
} 