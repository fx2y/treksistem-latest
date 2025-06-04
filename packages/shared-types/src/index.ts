import { z } from 'zod';

// Export all schemas and types from sub-modules
export * from './api';
export * from './entities';
export * from './service-config-types';
export * from './order-types';

// Export WhatsApp utilities explicitly
export { createWhatsAppLink, WhatsAppMessages } from './utils/whatsapp-links';

// Re-export zod for convenience
export { z };

// Legacy ApiResponse exports for backward compatibility
// (These are now also available from './api')
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
