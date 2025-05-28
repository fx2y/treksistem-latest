import { z } from 'zod';

// Basic API Response Schema
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.any().optional(),
  error: z.string().optional(),
});

export type ApiResponse<T = unknown> = {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
};

// Export all schemas and types
export * from './api';
export * from './entities';

// Re-export zod for convenience
export { z }; 