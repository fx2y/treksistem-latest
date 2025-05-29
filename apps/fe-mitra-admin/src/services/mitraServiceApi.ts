import { Service, ServiceConfigBase } from '@treksistem/shared-types';
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

// TODO: Add create, update, delete functions later
export async function createMitraService(_serviceData: Partial<Service>): Promise<ApiService> {
  // Implementation will be added in the next phase
  throw new Error('Not implemented yet');
}

export async function updateMitraService(_serviceId: string, _serviceData: Partial<Service>): Promise<ApiService> {
  // Implementation will be added in the next phase
  throw new Error('Not implemented yet');
}

export async function deleteMitraService(_serviceId: string): Promise<void> {
  // Implementation will be added in the next phase
  throw new Error('Not implemented yet');
} 