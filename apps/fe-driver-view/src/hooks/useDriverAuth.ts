import { useParams } from 'react-router-dom';
import { useMemo } from 'react';

export interface UseDriverAuthResult {
  driverId: string | null;
  isAuthenticated: boolean;
  isValidDriverId: boolean;
}

// Custom hook to handle driver authentication based on URL parameter
export const useDriverAuth = (): UseDriverAuthResult => {
  const { driverId } = useParams<{ driverId: string }>();

  const result = useMemo(() => {
    if (!driverId) {
      return {
        driverId: null,
        isAuthenticated: false,
        isValidDriverId: false,
      };
    }

    // Basic validation for CUID format (starts with 'c' and has reasonable length)
    // This is a simple check - the backend will do proper validation
    const isValidFormat = /^c[a-z0-9]{20,30}$/i.test(driverId);

    return {
      driverId,
      isAuthenticated: isValidFormat,
      isValidDriverId: isValidFormat,
    };
  }, [driverId]);

  return result;
}; 