import { z } from 'zod';
import { ServiceConfigBaseSchema } from '@treksistem/shared-types';

/**
 * Create Service Payload Schema
 * Used for creating new services via API
 */
export const CreateServicePayloadSchema = z.object({
  /** User-facing service name */
  name: z.string().min(3, "Service name must be at least 3 characters").max(100, "Service name must be at most 100 characters"),
  /** Core service type identifier */
  serviceTypeKey: z.string().min(1, "Service type key is required"),
  /** Detailed service configuration */
  configJson: ServiceConfigBaseSchema,
  /** Whether service is currently active */
  isActive: z.boolean().optional().default(true),
});

export type CreateServicePayload = z.infer<typeof CreateServicePayloadSchema>; 