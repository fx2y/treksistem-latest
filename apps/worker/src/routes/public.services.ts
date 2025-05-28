import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { isCuid } from '@paralleldrive/cuid2';
import { services, mitras } from '@treksistem/db-schema';
import { ServiceConfigBaseSchema } from '@treksistem/shared-types';
import type { AppContext } from '../types';

const publicServiceRoutes = new Hono<AppContext>();

/**
 * Schema for validating serviceId parameter
 */
const serviceIdParamSchema = z.object({
  serviceId: z.string().min(1, "Service ID is required"),
});

/**
 * GET /:serviceId/config
 * Fetch service configuration for public order placement
 * 
 * This endpoint returns service details including configJson for services that are:
 * - Active (isActive: true)
 * - Public (configJson.modelBisnis: 'PUBLIC_3RD_PARTY')
 * 
 * Used by the User Order Placement UI to dynamically render order forms.
 */
publicServiceRoutes.get(
  '/:serviceId/config',
  zValidator('param', serviceIdParamSchema),
  async (c) => {
    const { serviceId } = c.req.valid('param');
    const db = c.get('db');

    // Validate serviceId format (must be a valid CUID)
    if (!isCuid(serviceId)) {
      return c.json({
        success: false,
        error: {
          code: 'INVALID_PARAM',
          message: 'Invalid service ID format.',
        },
      }, 400);
    }

    try {
      // Query service with mitra information using a join
      const result = await db
        .select({
          serviceId: services.id,
          serviceName: services.name,
          serviceTypeKey: services.serviceTypeKey,
          configJson: services.configJson,
          isActive: services.isActive,
          mitraId: services.mitraId,
          mitraName: mitras.name,
        })
        .from(services)
        .innerJoin(mitras, eq(services.mitraId, mitras.id))
        .where(and(
          eq(services.id, serviceId),
          eq(services.isActive, true)
        ))
        .limit(1);

      if (result.length === 0) {
        return c.json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Service configuration not found or not available.',
          },
        }, 404);
      }

      const serviceData = result[0];

      // Parse and validate the configJson
      let parsedConfig;
      try {
        // The configJson is already parsed by Drizzle due to mode: 'json'
        parsedConfig = ServiceConfigBaseSchema.parse(serviceData.configJson);
      } catch (parseError) {
        console.error('[Public Service Config] Invalid configJson for service:', serviceId, parseError);
        return c.json({
          success: false,
          error: {
            code: 'INVALID_CONFIG',
            message: 'Service configuration is invalid.',
          },
        }, 500);
      }

      // Check if service is public (only PUBLIC_3RD_PARTY services should be exposed)
      if (parsedConfig.modelBisnis !== 'PUBLIC_3RD_PARTY') {
        return c.json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Service configuration not found or not available.',
          },
        }, 404);
      }

      // Return only publicly safe information
      return c.json({
        success: true,
        data: {
          serviceId: serviceData.serviceId,
          name: serviceData.serviceName,
          serviceTypeKey: serviceData.serviceTypeKey,
          mitraName: serviceData.mitraName,
          configJson: parsedConfig,
          isActive: serviceData.isActive,
        },
      });

    } catch (error) {
      console.error('[Public Service Config] Database error:', error);
      return c.json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch service configuration.',
        },
      }, 500);
    }
  }
);

export default publicServiceRoutes; 