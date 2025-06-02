import { ServiceConfigBaseSchema } from '@treksistem/shared-types';
import type { z } from 'zod';

/**
 * Result type for service configuration validation
 */
export type ServiceConfigValidationResult = {
  success: true;
  data: z.infer<typeof ServiceConfigBaseSchema>;
} | {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
};

/**
 * Validates service configuration JSON against the base schema
 * 
 * @param configJson - The configuration JSON to validate
 * @param serviceId - Service ID for logging purposes
 * @returns Validation result with parsed data or error information
 */
export const validateServiceConfig = (
  configJson: unknown,
  serviceId?: string
): ServiceConfigValidationResult => {
  const parseResult = ServiceConfigBaseSchema.safeParse(configJson);
  
  if (!parseResult.success) {
    // Log error for debugging
    console.error('[Service Config Validation] Invalid configJson', {
      serviceId,
      error: parseResult.error,
      configJson
    });
    
    return {
      success: false,
      error: {
        code: 'INVALID_CONFIG',
        message: 'Service configuration is invalid.',
        details: parseResult.error.issues
      }
    };
  }
  
  return {
    success: true,
    data: parseResult.data
  };
};

/**
 * Checks if a service configuration is publicly accessible
 * 
 * @param config - Validated service configuration
 * @returns True if service is public, false otherwise
 */
export const isPublicService = (config: z.infer<typeof ServiceConfigBaseSchema>): boolean => {
  return config.modelBisnis === 'PUBLIC_3RD_PARTY';
};

/**
 * Validates that a service is suitable for public API exposure
 * 
 * @param isActive - Whether the service is active
 * @param config - Validated service configuration
 * @returns Validation result
 */
export const validatePublicServiceAccess = (
  isActive: boolean,
  config: z.infer<typeof ServiceConfigBaseSchema>
): { isValid: boolean; reason?: string } => {
  if (!isActive) {
    return { isValid: false, reason: 'Service is not active' };
  }
  
  if (!isPublicService(config)) {
    return { isValid: false, reason: 'Service is not public' };
  }
  
  return { isValid: true };
};

/**
 * Creates a safe public response object for service configuration
 * Only includes data that should be exposed to public API consumers
 * 
 * @param serviceData - Raw service data from database
 * @param config - Validated configuration
 * @returns Safe public response object
 */
export const createPublicServiceResponse = (
  serviceData: {
    serviceId: string;
    serviceName: string;
    serviceTypeKey?: string;
    mitraName: string;
    isActive: boolean;
  },
  config: z.infer<typeof ServiceConfigBaseSchema>
) => {
  return {
    serviceId: serviceData.serviceId,
    name: serviceData.serviceName,
    serviceTypeKey: serviceData.serviceTypeKey,
    mitraName: serviceData.mitraName,
    configJson: config,
    isActive: serviceData.isActive,
  };
}; 