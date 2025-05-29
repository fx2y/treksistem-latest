import { z } from 'zod';
import { DriverConfigSchema } from '@treksistem/shared-types';

/**
 * Create Driver Payload Schema
 * Used for creating new drivers via API
 */
export const CreateDriverPayloadSchema = z.object({
  /** Driver identifier (email, phone, or unique ID) */
  identifier: z.string().min(1, "Driver identifier is required").max(100, "Driver identifier must be at most 100 characters"),
  /** Driver's full name */
  name: z.string().min(1, "Driver name is required").max(100, "Driver name must be at most 100 characters"),
  /** Driver configuration (vehicle, capabilities, etc.) */
  configJson: DriverConfigSchema.optional(),
  /** Whether driver is currently active */
  isActive: z.boolean().optional().default(true),
});

export type CreateDriverPayload = z.infer<typeof CreateDriverPayloadSchema>; 