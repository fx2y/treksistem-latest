import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiError } from '@/services/api';
import { toast } from 'sonner';

// Generic hook for GET requests
export function useApiQuery<T>(
  key: string[],
  endpoint: string,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    onError?: (error: ApiError) => void;
  }
) {
  return useQuery({
    queryKey: key,
    queryFn: () => apiClient.get<T>(endpoint),
    enabled: options?.enabled,
    staleTime: options?.staleTime,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && [401, 403, 404].includes(error.status)) {
        return false;
      }
      return failureCount < 3;
    },
    throwOnError: (error) => {
      if (options?.onError && error instanceof ApiError) {
        options.onError(error);
      }
      return false;
    },
  });
}

// Generic hook for mutations (POST, PUT, DELETE)
export function useApiMutation<TData, TVariables = any>(
  endpoint: string,
  method: 'POST' | 'PUT' | 'DELETE' = 'POST',
  options?: {
    onSuccess?: (data: TData) => void;
    onError?: (error: ApiError) => void;
    invalidateQueries?: string[][];
    showSuccessToast?: boolean;
    showErrorToast?: boolean;
  }
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      switch (method) {
        case 'POST':
          return apiClient.post<TData>(endpoint, variables);
        case 'PUT':
          return apiClient.put<TData>(endpoint, variables);
        case 'DELETE':
          return apiClient.delete<TData>(endpoint);
        default:
          throw new Error(`Unsupported method: ${method}`);
      }
    },
    onSuccess: (data) => {
      if (options?.showSuccessToast) {
        toast.success('Operation completed successfully');
      }
      
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey });
        });
      }
      
      options?.onSuccess?.(data);
    },
    onError: (error: ApiError) => {
      if (options?.showErrorToast) {
        toast.error(error.message || 'An error occurred');
      }
      
      options?.onError?.(error);
    },
  });
} 