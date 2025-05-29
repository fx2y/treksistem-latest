import { apiClient } from './api';

interface MitraProfile {
  id: string;
  ownerUserId: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

interface CreateMitraProfileRequest {
  name: string;
}

export const mitraApi = {
  /**
   * Fetch the current user's Mitra profile
   */
  async getProfile(): Promise<MitraProfile> {
    const response = await apiClient.get<{ success: boolean; data: MitraProfile }>('/mitra/profile');
    return response.data;
  },

  /**
   * Create a new Mitra profile for the current user
   */
  async createProfile(data: CreateMitraProfileRequest): Promise<MitraProfile> {
    const response = await apiClient.post<{ success: boolean; data: MitraProfile }>('/mitra/profile', data);
    return response.data;
  },

  /**
   * Update the current user's Mitra profile
   */
  async updateProfile(data: Partial<CreateMitraProfileRequest>): Promise<MitraProfile> {
    const response = await apiClient.put<{ success: boolean; data: MitraProfile }>('/mitra/profile', data);
    return response.data;
  },
}; 