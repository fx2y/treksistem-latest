import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, desc } from 'drizzle-orm';
import { createId, isCuid } from '@paralleldrive/cuid2';
import { drivers, driverServices, services } from '@treksistem/db-schema';
import { mitraAuth } from '../middleware/auth';
import type { AppContext } from '../types';

const mitraDriverRoutes = new Hono<AppContext>();

// Apply Mitra authentication to all driver routes
mitraDriverRoutes.use('*', mitraAuth);

/**
 * Schema for creating a driver
 */
const createDriverPayloadSchema = z.object({
  identifier: z
    .string()
    .min(1, 'Driver identifier is required')
    .max(100, 'Driver identifier must be at most 100 characters'),
  name: z
    .string()
    .min(1, 'Driver name is required')
    .max(100, 'Driver name must be at most 100 characters'),
  configJson: z.record(z.any()).optional(), // Simple JSON object for driver capabilities/vehicle info
  isActive: z.boolean().optional().default(true),
});

/**
 * Schema for updating a driver (allows partial updates)
 */
const updateDriverPayloadSchema = createDriverPayloadSchema.partial();

/**
 * Schema for service assignment
 */
const assignServiceSchema = z.object({
  serviceId: z.string().refine(isCuid, 'Invalid service ID format'),
});

/**
 * POST /api/mitra/drivers
 * Create a new driver for the authenticated Mitra
 */
mitraDriverRoutes.post('/', zValidator('json', createDriverPayloadSchema), async (c) => {
  const payload = c.req.valid('json');
  const mitraId = c.get('currentMitraId')!;
  const db = c.get('db');

  try {
    // Check for duplicate identifier within the same Mitra
    const existingDriver = await db
      .select({ id: drivers.id })
      .from(drivers)
      .where(and(eq(drivers.mitraId, mitraId), eq(drivers.identifier, payload.identifier)))
      .limit(1);

    if (existingDriver.length > 0) {
      return c.json(
        {
          success: false,
          error: {
            code: 'CONFLICT',
            message: `Driver with identifier '${payload.identifier}' already exists for this Mitra.`,
          },
        },
        409,
      );
    }

    const newDriverId = createId();
    const [createdDriver] = await db
      .insert(drivers)
      .values({
        id: newDriverId,
        mitraId: mitraId,
        identifier: payload.identifier,
        name: payload.name,
        configJson: payload.configJson as any,
        isActive: payload.isActive,
      })
      .returning();

    if (!createdDriver) {
      throw new Error('Driver creation failed after insert.');
    }

    return c.json(
      {
        success: true,
        data: {
          id: createdDriver.id,
          mitraId: createdDriver.mitraId,
          identifier: createdDriver.identifier,
          name: createdDriver.name,
          configJson: createdDriver.configJson,
          isActive: createdDriver.isActive,
          createdAt: createdDriver.createdAt,
          updatedAt: createdDriver.updatedAt,
        },
      },
      201,
    );
  } catch (error) {
    console.error('[Driver Creation] Database error:', error);
    throw new Error('Failed to create driver.');
  }
});

/**
 * GET /api/mitra/drivers
 * List all drivers for the authenticated Mitra
 */
mitraDriverRoutes.get('/', async (c) => {
  const mitraId = c.get('currentMitraId')!;
  const db = c.get('db');

  try {
    const mitraDrivers = await db
      .select()
      .from(drivers)
      .where(eq(drivers.mitraId, mitraId))
      .orderBy(desc(drivers.createdAt));

    return c.json({
      success: true,
      data: {
        drivers: mitraDrivers.map((driver) => ({
          id: driver.id,
          mitraId: driver.mitraId,
          identifier: driver.identifier,
          name: driver.name,
          configJson: driver.configJson,
          isActive: driver.isActive,
          createdAt: driver.createdAt,
          updatedAt: driver.updatedAt,
        })),
        total: mitraDrivers.length,
      },
    });
  } catch (error) {
    console.error('[Driver List] Database error:', error);
    throw new Error('Failed to fetch drivers.');
  }
});

/**
 * GET /api/mitra/drivers/:driverId
 * Get a specific driver by ID (must belong to authenticated Mitra)
 */
mitraDriverRoutes.get('/:driverId', async (c) => {
  const { driverId } = c.req.param();
  const mitraId = c.get('currentMitraId')!;
  const db = c.get('db');

  // Validate driverId format
  if (!driverId || !isCuid(driverId)) {
    return c.json(
      {
        success: false,
        error: {
          code: 'INVALID_PARAM',
          message: 'Invalid driver ID format.',
        },
      },
      400,
    );
  }

  try {
    const driver = await db
      .select()
      .from(drivers)
      .where(and(eq(drivers.id, driverId), eq(drivers.mitraId, mitraId)))
      .limit(1);

    if (driver.length === 0) {
      return c.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Driver not found or not owned by this Mitra.',
          },
        },
        404,
      );
    }

    const foundDriver = driver[0];

    return c.json({
      success: true,
      data: {
        id: foundDriver.id,
        mitraId: foundDriver.mitraId,
        identifier: foundDriver.identifier,
        name: foundDriver.name,
        configJson: foundDriver.configJson,
        isActive: foundDriver.isActive,
        createdAt: foundDriver.createdAt,
        updatedAt: foundDriver.updatedAt,
      },
    });
  } catch (error) {
    console.error('[Driver Details] Database error:', error);
    throw new Error('Failed to fetch driver details.');
  }
});

/**
 * PUT /api/mitra/drivers/:driverId
 * Update a driver's information (must belong to authenticated Mitra)
 */
mitraDriverRoutes.put('/:driverId', zValidator('json', updateDriverPayloadSchema), async (c) => {
  const { driverId } = c.req.param();
  const payload = c.req.valid('json');
  const mitraId = c.get('currentMitraId')!;
  const db = c.get('db');

  // Validate driverId format
  if (!driverId || !isCuid(driverId)) {
    return c.json(
      {
        success: false,
        error: {
          code: 'INVALID_PARAM',
          message: 'Invalid driver ID format.',
        },
      },
      400,
    );
  }

  try {
    // Check if driver exists and belongs to the current Mitra
    const existingDriver = await db
      .select()
      .from(drivers)
      .where(and(eq(drivers.id, driverId), eq(drivers.mitraId, mitraId)))
      .limit(1);

    if (existingDriver.length === 0) {
      return c.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Driver not found or not owned by this Mitra.',
          },
        },
        404,
      );
    }

    // Check for duplicate identifier if identifier is being updated
    if (payload.identifier && payload.identifier !== existingDriver[0].identifier) {
      const duplicateDriver = await db
        .select({ id: drivers.id })
        .from(drivers)
        .where(and(eq(drivers.mitraId, mitraId), eq(drivers.identifier, payload.identifier)))
        .limit(1);

      if (duplicateDriver.length > 0) {
        return c.json(
          {
            success: false,
            error: {
              code: 'CONFLICT',
              message: `Driver with identifier '${payload.identifier}' already exists for this Mitra.`,
            },
          },
          409,
        );
      }
    }

    // Update the driver
    const [updatedDriver] = await db
      .update(drivers)
      .set({
        ...payload,
        configJson: payload.configJson as any,
        updatedAt: new Date(),
      })
      .where(eq(drivers.id, driverId))
      .returning();

    if (!updatedDriver) {
      throw new Error('Driver update failed after database operation.');
    }

    return c.json({
      success: true,
      data: {
        id: updatedDriver.id,
        mitraId: updatedDriver.mitraId,
        identifier: updatedDriver.identifier,
        name: updatedDriver.name,
        configJson: updatedDriver.configJson,
        isActive: updatedDriver.isActive,
        createdAt: updatedDriver.createdAt,
        updatedAt: updatedDriver.updatedAt,
      },
    });
  } catch (error) {
    console.error('[Driver Update] Database error:', error);
    throw new Error('Failed to update driver.');
  }
});

/**
 * DELETE /api/mitra/drivers/:driverId
 * Delete a driver (must belong to authenticated Mitra)
 * This will cascade delete all driver-service assignments
 */
mitraDriverRoutes.delete('/:driverId', async (c) => {
  const { driverId } = c.req.param();
  const mitraId = c.get('currentMitraId')!;
  const db = c.get('db');

  // Validate driverId format
  if (!driverId || !isCuid(driverId)) {
    return c.json(
      {
        success: false,
        error: {
          code: 'INVALID_PARAM',
          message: 'Invalid driver ID format.',
        },
      },
      400,
    );
  }

  try {
    // Check if driver exists and belongs to the current Mitra
    const existingDriver = await db
      .select({ id: drivers.id })
      .from(drivers)
      .where(and(eq(drivers.id, driverId), eq(drivers.mitraId, mitraId)))
      .limit(1);

    if (existingDriver.length === 0) {
      return c.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Driver not found or not owned by this Mitra.',
          },
        },
        404,
      );
    }

    // Delete the driver (this will cascade delete driver-service assignments due to foreign key constraints)
    await db.delete(drivers).where(eq(drivers.id, driverId));

    return c.json(
      {
        success: true,
        message: 'Driver deleted successfully.',
      },
      200,
    );
  } catch (error) {
    console.error('[Driver Deletion] Database error:', error);
    throw new Error('Failed to delete driver.');
  }
});

/**
 * POST /api/mitra/drivers/:driverId/services
 * Assign a service to a driver
 */
mitraDriverRoutes.post(
  '/:driverId/services',
  zValidator('json', assignServiceSchema),
  async (c) => {
    const { driverId } = c.req.param();
    const { serviceId } = c.req.valid('json');
    const mitraId = c.get('currentMitraId')!;
    const db = c.get('db');

    // Validate driverId format
    if (!driverId || !isCuid(driverId)) {
      return c.json(
        {
          success: false,
          error: {
            code: 'INVALID_PARAM',
            message: 'Invalid driver ID format.',
          },
        },
        400,
      );
    }

    try {
      // Verify driver and service belong to the current Mitra
      const [driverExists, serviceExists] = await Promise.all([
        db
          .select({ id: drivers.id })
          .from(drivers)
          .where(and(eq(drivers.id, driverId), eq(drivers.mitraId, mitraId)))
          .limit(1),
        db
          .select({ id: services.id })
          .from(services)
          .where(and(eq(services.id, serviceId), eq(services.mitraId, mitraId)))
          .limit(1),
      ]);

      if (driverExists.length === 0) {
        return c.json(
          {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Driver not found for this Mitra.',
            },
          },
          404,
        );
      }

      if (serviceExists.length === 0) {
        return c.json(
          {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Service not found for this Mitra.',
            },
          },
          404,
        );
      }

      // Check if assignment already exists
      const existingAssignment = await db
        .select({ driverId: driverServices.driverId })
        .from(driverServices)
        .where(and(eq(driverServices.driverId, driverId), eq(driverServices.serviceId, serviceId)))
        .limit(1);

      if (existingAssignment.length > 0) {
        return c.json(
          {
            success: true,
            message: 'Service already assigned to driver.',
          },
          200,
        );
      }

      // Create the assignment
      await db.insert(driverServices).values({
        driverId,
        serviceId,
      });

      return c.json(
        {
          success: true,
          message: 'Service assigned to driver successfully.',
        },
        201,
      );
    } catch (error) {
      console.error('[Service Assignment] Database error:', error);
      throw new Error('Failed to assign service to driver.');
    }
  },
);

/**
 * DELETE /api/mitra/drivers/:driverId/services/:serviceId
 * Unassign a service from a driver
 */
mitraDriverRoutes.delete('/:driverId/services/:serviceId', async (c) => {
  const { driverId, serviceId } = c.req.param();
  const mitraId = c.get('currentMitraId')!;
  const db = c.get('db');

  // Validate ID formats
  if (!driverId || !isCuid(driverId) || !serviceId || !isCuid(serviceId)) {
    return c.json(
      {
        success: false,
        error: {
          code: 'INVALID_PARAM',
          message: 'Invalid driver ID or service ID format.',
        },
      },
      400,
    );
  }

  try {
    // Verify driver belongs to the current Mitra before attempting deletion
    const driverExists = await db
      .select({ id: drivers.id })
      .from(drivers)
      .where(and(eq(drivers.id, driverId), eq(drivers.mitraId, mitraId)))
      .limit(1);

    if (driverExists.length === 0) {
      return c.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Driver not found for this Mitra.',
          },
        },
        404,
      );
    }

    // Delete the assignment
    const result = await db
      .delete(driverServices)
      .where(and(eq(driverServices.driverId, driverId), eq(driverServices.serviceId, serviceId)))
      .returning({ driverId: driverServices.driverId });

    if (result.length === 0) {
      return c.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Assignment not found.',
          },
        },
        404,
      );
    }

    return c.json(
      {
        success: true,
        message: 'Service unassigned from driver successfully.',
      },
      200,
    );
  } catch (error) {
    console.error('[Service Unassignment] Database error:', error);
    throw new Error('Failed to unassign service from driver.');
  }
});

/**
 * GET /api/mitra/drivers/:driverId/services
 * List services assigned to a driver
 */
mitraDriverRoutes.get('/:driverId/services', async (c) => {
  const { driverId } = c.req.param();
  const mitraId = c.get('currentMitraId')!;
  const db = c.get('db');

  // Validate driverId format
  if (!driverId || !isCuid(driverId)) {
    return c.json(
      {
        success: false,
        error: {
          code: 'INVALID_PARAM',
          message: 'Invalid driver ID format.',
        },
      },
      400,
    );
  }

  try {
    // First, verify the driver belongs to the current Mitra
    const driverExists = await db
      .select({ id: drivers.id })
      .from(drivers)
      .where(and(eq(drivers.id, driverId), eq(drivers.mitraId, mitraId)))
      .limit(1);

    if (driverExists.length === 0) {
      return c.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Driver not found for this Mitra.',
          },
        },
        404,
      );
    }

    // Get assigned services
    const assignedServices = await db
      .select({
        serviceId: services.id,
        serviceName: services.name,
        serviceTypeKey: services.serviceTypeKey,
        configJson: services.configJson,
        isActive: services.isActive,
        createdAt: services.createdAt,
        updatedAt: services.updatedAt,
      })
      .from(driverServices)
      .innerJoin(services, eq(driverServices.serviceId, services.id))
      .where(eq(driverServices.driverId, driverId))
      .orderBy(desc(services.createdAt));

    return c.json({
      success: true,
      data: {
        services: assignedServices.map((service) => ({
          id: service.serviceId,
          name: service.serviceName,
          serviceTypeKey: service.serviceTypeKey,
          configJson: service.configJson,
          isActive: service.isActive,
          createdAt: service.createdAt,
          updatedAt: service.updatedAt,
        })),
        total: assignedServices.length,
      },
    });
  } catch (error) {
    console.error('[Driver Services List] Database error:', error);
    throw new Error('Failed to fetch assigned services for driver.');
  }
});

export default mitraDriverRoutes;
