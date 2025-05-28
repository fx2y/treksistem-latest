import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, desc } from 'drizzle-orm';
import { createId, isCuid } from '@paralleldrive/cuid2';
import { services } from '@treksistem/db-schema';
import { ServiceConfigBaseSchema } from '@treksistem/shared-types';
import { mitraAuth } from '../middleware/auth';
import type { AppContext } from '../types';

const mitraServiceRoutes = new Hono<AppContext>();

// Apply Mitra authentication to all service routes
mitraServiceRoutes.use('*', mitraAuth);

/**
 * Schema for creating a service
 * Validates the complete service payload including complex configJson
 */
const createServicePayloadSchema = z.object({
  name: z.string().min(3, "Service name must be at least 3 characters").max(100, "Service name must be at most 100 characters"),
  serviceTypeKey: z.string().min(1, "Service type key is required"), // e.g., 'P2P_EXPRESS_MOTOR'
  configJson: ServiceConfigBaseSchema, // Use the detailed Zod schema for validation
  isActive: z.boolean().optional().default(true),
});

/**
 * Schema for updating a service (allows partial updates)
 */
const updateServicePayloadSchema = createServicePayloadSchema.partial();

/**
 * POST /api/mitra/services
 * Create a new service for the authenticated Mitra
 */
mitraServiceRoutes.post(
  '/',
  zValidator('json', createServicePayloadSchema),
  async (c) => {
    const payload = c.req.valid('json');
    const mitraId = c.get('currentMitraId')!;
    const db = c.get('db');

    try {
      const newServiceId = createId();
      const [createdService] = await db.insert(services).values({
        id: newServiceId,
        mitraId: mitraId,
        name: payload.name,
        serviceTypeKey: payload.serviceTypeKey,
        configJson: payload.configJson as any, // Zod already validated structure
        isActive: payload.isActive,
      }).returning();

      if (!createdService) {
        throw new Error('Service creation failed after insert.');
      }

      return c.json({
        success: true,
        data: {
          id: createdService.id,
          mitraId: createdService.mitraId,
          name: createdService.name,
          serviceTypeKey: createdService.serviceTypeKey,
          configJson: createdService.configJson,
          isActive: createdService.isActive,
          createdAt: createdService.createdAt,
          updatedAt: createdService.updatedAt,
        },
      }, 201);
    } catch (error) {
      console.error('[Service Creation] Database error:', error);
      throw new Error('Failed to create service.');
    }
  }
);

/**
 * GET /api/mitra/services
 * List all services for the authenticated Mitra
 */
mitraServiceRoutes.get('/', async (c) => {
  const mitraId = c.get('currentMitraId')!;
  const db = c.get('db');

  try {
    const mitraServices = await db
      .select()
      .from(services)
      .where(eq(services.mitraId, mitraId))
      .orderBy(desc(services.createdAt));

    return c.json({
      success: true,
      data: {
        services: mitraServices.map(service => ({
          id: service.id,
          mitraId: service.mitraId,
          name: service.name,
          serviceTypeKey: service.serviceTypeKey,
          configJson: service.configJson,
          isActive: service.isActive,
          createdAt: service.createdAt,
          updatedAt: service.updatedAt,
        })),
        total: mitraServices.length,
      },
    });
  } catch (error) {
    console.error('[Service List] Database error:', error);
    throw new Error('Failed to fetch services.');
  }
});

/**
 * GET /api/mitra/services/:serviceId
 * Get a specific service by ID (must belong to authenticated Mitra)
 */
mitraServiceRoutes.get('/:serviceId', async (c) => {
  const { serviceId } = c.req.param();
  const mitraId = c.get('currentMitraId')!;
  const db = c.get('db');

  // Validate serviceId format
  if (!serviceId || !isCuid(serviceId)) {
    return c.json({
      success: false,
      error: {
        code: 'INVALID_PARAM',
        message: 'Invalid service ID format.',
      },
    }, 400);
  }

  try {
    const service = await db
      .select()
      .from(services)
      .where(and(
        eq(services.id, serviceId),
        eq(services.mitraId, mitraId)
      ))
      .limit(1);

    if (service.length === 0) {
      return c.json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Service not found or not owned by this Mitra.',
        },
      }, 404);
    }

    const foundService = service[0];

    return c.json({
      success: true,
      data: {
        id: foundService.id,
        mitraId: foundService.mitraId,
        name: foundService.name,
        serviceTypeKey: foundService.serviceTypeKey,
        configJson: foundService.configJson,
        isActive: foundService.isActive,
        createdAt: foundService.createdAt,
        updatedAt: foundService.updatedAt,
      },
    });
  } catch (error) {
    console.error('[Service Details] Database error:', error);
    throw new Error('Failed to fetch service details.');
  }
});

/**
 * PUT /api/mitra/services/:serviceId
 * Update a specific service (must belong to authenticated Mitra)
 */
mitraServiceRoutes.put(
  '/:serviceId',
  zValidator('json', updateServicePayloadSchema),
  async (c) => {
    const { serviceId } = c.req.param();
    const payload = c.req.valid('json');
    const mitraId = c.get('currentMitraId')!;
    const db = c.get('db');

    // Validate serviceId format
    if (!serviceId || !isCuid(serviceId)) {
      return c.json({
        success: false,
        error: {
          code: 'INVALID_PARAM',
          message: 'Invalid service ID format.',
        },
      }, 400);
    }

    // Check if there's actually data to update
    if (Object.keys(payload).length === 0) {
      return c.json({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'No update data provided.',
        },
      }, 400);
    }

    try {
      // First, verify the service exists and belongs to this Mitra
      const existingService = await db
        .select({ id: services.id })
        .from(services)
        .where(and(
          eq(services.id, serviceId),
          eq(services.mitraId, mitraId)
        ))
        .limit(1);

      if (existingService.length === 0) {
        return c.json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Service not found or not owned by this Mitra.',
          },
        }, 404);
      }

      // Prepare update data
      const updateData: Partial<typeof services.$inferInsert> = { ...payload };
      updateData.updatedAt = new Date();

      // Perform the update
      const [updatedService] = await db
        .update(services)
        .set(updateData)
        .where(and(
          eq(services.id, serviceId),
          eq(services.mitraId, mitraId)
        ))
        .returning();

      if (!updatedService) {
        throw new Error('Service update failed after validation.');
      }

      return c.json({
        success: true,
        data: {
          id: updatedService.id,
          mitraId: updatedService.mitraId,
          name: updatedService.name,
          serviceTypeKey: updatedService.serviceTypeKey,
          configJson: updatedService.configJson,
          isActive: updatedService.isActive,
          createdAt: updatedService.createdAt,
          updatedAt: updatedService.updatedAt,
        },
      });
    } catch (error) {
      console.error('[Service Update] Database error:', error);
      throw new Error('Failed to update service.');
    }
  }
);

/**
 * DELETE /api/mitra/services/:serviceId
 * Delete a specific service (must belong to authenticated Mitra)
 */
mitraServiceRoutes.delete('/:serviceId', async (c) => {
  const { serviceId } = c.req.param();
  const mitraId = c.get('currentMitraId')!;
  const db = c.get('db');

  // Validate serviceId format
  if (!serviceId || !isCuid(serviceId)) {
    return c.json({
      success: false,
      error: {
        code: 'INVALID_PARAM',
        message: 'Invalid service ID format.',
      },
    }, 400);
  }

  try {
    const result = await db
      .delete(services)
      .where(and(
        eq(services.id, serviceId),
        eq(services.mitraId, mitraId)
      ))
      .returning({ id: services.id });

    if (result.length === 0) {
      return c.json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Service not found or not owned by this Mitra.',
        },
      }, 404);
    }

    return c.json({
      success: true,
      message: 'Service deleted successfully.',
    }, 200);
  } catch (error: any) {
    console.error('[Service Deletion] Database error:', error);
    
    // Check for foreign key constraint errors if orders are linked
    if (error.message?.includes('FOREIGN KEY constraint failed')) {
      return c.json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Cannot delete service. It may have associated orders or driver assignments.',
        },
      }, 409);
    }
    
    throw new Error('Failed to delete service.');
  }
});

export default mitraServiceRoutes; 