import { create } from 'zustand';
import { mitraApi } from '@/services/mitraApi';
import { ApiError } from '@/services/api';

// Import the Mitras type from db-schema
// Based on the schema, the Mitras table has: id, ownerUserId, name, createdAt, updatedAt
interface MitraProfile {
  id: string;
  ownerUserId: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

interface AuthState {
  isAuthenticated: boolean;
  mitraProfile: MitraProfile | null;
  isLoading: boolean;
  error: string | null;
  checkAuthStatus: () => Promise<void>;
  setMitraProfile: (profile: MitraProfile | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  mitraProfile: null,
  isLoading: true, // Start with loading true to check auth on app load
  error: null,
  
  setMitraProfile: (profile) => set({ 
    mitraProfile: profile, 
    isAuthenticated: !!profile, 
    isLoading: false, 
    error: null 
  }),
  
  checkAuthStatus: async () => {
    set({ isLoading: true, error: null });
    try {
      const profile = await mitraApi.getProfile();
      set({ 
        mitraProfile: profile, 
        isAuthenticated: true, 
        isLoading: false, 
        error: null 
      });
    } catch (error: any) {
      console.warn("Auth check failed:", error.message);
      
      if (error instanceof ApiError) {
        if (error.status === 401 || error.status === 403) {
          // User is not logged in via Cloudflare Access
          set({ 
            isAuthenticated: false, 
            mitraProfile: null, 
            isLoading: false, 
            error: 'Authentication required.' 
          });
        } else if (error.status === 404) {
          // Authenticated by CF Access, but no Treksistem profile
          set({ 
            isAuthenticated: true, 
            mitraProfile: null, 
            isLoading: false, 
            error: 'ProfileNotFound' 
          });
        } else {
          set({ 
            isAuthenticated: false, 
            mitraProfile: null, 
            isLoading: false, 
            error: error.message 
          });
        }
      } else {
        set({ 
          isAuthenticated: false, 
          mitraProfile: null, 
          isLoading: false, 
          error: error.message || 'Unknown error occurred' 
        });
      }
    }
  },
  
  logout: () => {
    // Conceptual logout - CF Access logout is typically navigating to a specific CF logout path
    // For actual CF Access logout: window.location.href = 'https://<your-team-name>.cloudflareaccess.com/cdn-cgi/access/logout';
    set({ 
      isAuthenticated: false, 
      mitraProfile: null, 
      isLoading: false, 
      error: null 
    });
  },
}));

// Call checkAuthStatus on initial app load
useAuthStore.getState().checkAuthStatus(); 