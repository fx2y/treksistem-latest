import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { isCuid } from '@paralleldrive/cuid2';
import { services, mitras, masterServiceTemplates } from '@treksistem/db-schema';
import { 
  validateServiceConfig, 
  validatePublicServiceAccess, 
  createPublicServiceResponse 
} from '../utils/service-config-validator';
import type { AppContext } from '../types';
import { sql } from 'drizzle-orm';

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
        .where(eq(services.id, serviceId))
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

      // Validate the configJson using the modular validator
      const configValidation = validateServiceConfig(serviceData.configJson, serviceId);
      
      if (!configValidation.success) {
        return c.json({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Service configuration is invalid.',
          },
        }, 500);
      }

      // Check if service is accessible via public API
      const accessValidation = validatePublicServiceAccess(serviceData.isActive, configValidation.data);
      
      if (!accessValidation.isValid) {
        return c.json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Service configuration not found or not available.',
          },
        }, 404);
      }

      // Return safely formatted public response
      return c.json({
        success: true,
        data: createPublicServiceResponse(serviceData, configValidation.data),
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

/**
 * GET /master-templates
 * Fetch all master service templates for Mitra service creation
 * 
 * This endpoint returns all available master service templates that Mitras can use
 * as starting points when creating new services. Templates are ordered by sortOrder.
 * 
 * Used by the Mitra Admin Portal to populate template selection dropdowns.
 */
publicServiceRoutes.get('/master-templates', async (c) => {
  const db = c.get('db');

  try {
    // Query all master service templates ordered by sort order
    const templates = await db
      .select({
        id: masterServiceTemplates.id,
        name: masterServiceTemplates.name,
        description: masterServiceTemplates.description,
        appliesToServiceTypeKey: masterServiceTemplates.appliesToServiceTypeKey,
        configJson: masterServiceTemplates.configJson,
        sortOrder: masterServiceTemplates.sortOrder,
      })
      .from(masterServiceTemplates)
      .orderBy(masterServiceTemplates.sortOrder);

    return c.json({
      success: true,
      data: {
        templates,
        count: templates.length,
      },
    });

  } catch (error) {
    console.error('[Master Templates] Database error:', error);
    return c.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch master service templates.',
      },
    }, 500);
  }
});

export default publicServiceRoutes; 