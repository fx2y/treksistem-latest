// Basic API service functions for public operations
// Will be implemented in future instructions

const API_BASE_URL = '/api';

export const publicApi = {
  // Placeholder for future implementation
  getServiceConfig: async (serviceId: string) => {
    const response = await fetch(`${API_BASE_URL}/public/services/${serviceId}/config`);
    if (!response.ok) {
      throw new Error('Failed to fetch service config');
    }
    return response.json();
  },

  trackOrder: async (orderId: string) => {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/track`);
    if (!response.ok) {
      throw new Error('Failed to track order');
    }
    return response.json();
  },
}; 