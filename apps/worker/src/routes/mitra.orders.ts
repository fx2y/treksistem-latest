import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { createId, isCuid } from '@paralleldrive/cuid2';
import { orders, orderEvents, drivers, driverServices, services } from '@treksistem/db-schema';
import { OrderStatusSchema } from '@treksistem/shared-types';
import { mitraAuth } from '../middleware/auth';
import type { AppContext } from '../types';

const mitraOrderRoutes = new Hono<AppContext>();

// Apply Mitra authentication to all order routes
mitraOrderRoutes.use('*', mitraAuth);

/**
 * Schema for listing orders with filters
 */
const listOrdersQuerySchema = z.object({
  status: OrderStatusSchema.optional(),
  serviceId: z.string().refine(isCuid, 'Invalid service ID format').optional(),
  driverId: z.string().refine(isCuid, 'Invalid driver ID format').optional(),
  dateFrom: z
    .string()
    .datetime()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  dateTo: z
    .string()
    .datetime()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

/**
 * Schema for driver assignment
 */
const assignDriverSchema = z.object({
  driverId: z.string().refine(isCuid, 'Invalid driver ID format'),
});

/**
 * GET /api/mitra/orders
 * List orders for the authenticated Mitra with filtering and pagination
 */
mitraOrderRoutes.get('/', zValidator('query', listOrdersQuerySchema), async (c) => {
  const queryParams = c.req.valid('query');
  const mitraId = c.get('currentMitraId')!;
  const db = c.get('db');

  try {
    // Build the base query with joins
    const baseQuery = db
      .select({
        // Order fields
        id: orders.id,
        serviceId: orders.serviceId,
        mitraId: orders.mitraId,
        driverId: orders.driverId,
        ordererIdentifier: orders.ordererIdentifier,
        receiverWaNumber: orders.receiverWaNumber,
        detailsJson: orders.detailsJson,
        status: orders.status,
        estimatedCost: orders.estimatedCost,
        finalCost: orders.finalCost,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        scheduledAt: orders.scheduledAt,
        // Service details
        serviceName: services.name,
        serviceTypeKey: services.serviceTypeKey,
        // Driver details (nullable)
        driverName: drivers.name,
        driverIdentifier: drivers.identifier,
      })
      .from(orders)
      .leftJoin(services, eq(orders.serviceId, services.id))
      .leftJoin(drivers, eq(orders.driverId, drivers.id));

    // Build WHERE conditions
    const whereConditions = [eq(orders.mitraId, mitraId)];

    if (queryParams.status) {
      whereConditions.push(eq(orders.status, queryParams.status));
    }

    if (queryParams.serviceId) {
      whereConditions.push(eq(orders.serviceId, queryParams.serviceId));
    }

    if (queryParams.driverId) {
      whereConditions.push(eq(orders.driverId, queryParams.driverId));
    }

    if (queryParams.dateFrom) {
      whereConditions.push(gte(orders.createdAt, queryParams.dateFrom));
    }

    if (queryParams.dateTo) {
      whereConditions.push(lte(orders.createdAt, queryParams.dateTo));
    }

    // Apply WHERE conditions and build final query
    const finalQuery =
      whereConditions.length > 1
        ? baseQuery.where(and(...whereConditions))
        : baseQuery.where(whereConditions[0]);

    // Apply ordering and pagination
    const offset = (queryParams.page - 1) * queryParams.limit;
    const ordersResult = await finalQuery
      .orderBy(desc(orders.createdAt))
      .limit(queryParams.limit + 1) // Fetch one extra to check if there are more pages
      .offset(offset);

    // Check if there are more pages
    const hasMore = ordersResult.length > queryParams.limit;
    const ordersToReturn = hasMore ? ordersResult.slice(0, queryParams.limit) : ordersResult;

    // Transform the results to include nested objects
    const transformedOrders = ordersToReturn.map((order) => ({
      id: order.id,
      serviceId: order.serviceId,
      mitraId: order.mitraId,
      driverId: order.driverId,
      ordererIdentifier: order.ordererIdentifier,
      receiverWaNumber: order.receiverWaNumber,
      detailsJson: order.detailsJson,
      status: order.status,
      estimatedCost: order.estimatedCost,
      finalCost: order.finalCost,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      scheduledAt: order.scheduledAt,
      service: {
        name: order.serviceName,
        serviceTypeKey: order.serviceTypeKey,
      },
      driver: order.driverId
        ? {
            name: order.driverName,
            identifier: order.driverIdentifier,
          }
        : null,
    }));

    return c.json({
      success: true,
      data: {
        orders: transformedOrders,
        pagination: {
          currentPage: queryParams.page,
          limit: queryParams.limit,
          hasMore,
        },
      },
    });
  } catch (error) {
    console.error('[Order List] Database error:', error);
    throw new Error('Failed to fetch orders.');
  }
});

/**
 * GET /api/mitra/orders/:orderId
 * Get specific order details with related data
 */
mitraOrderRoutes.get('/:orderId', async (c) => {
  const { orderId } = c.req.param();
  const mitraId = c.get('currentMitraId')!;
  const db = c.get('db');

  // Validate orderId format
  if (!orderId || !isCuid(orderId)) {
    return c.json(
      {
        success: false,
        error: {
          code: 'INVALID_PARAM',
          message: 'Invalid order ID format.',
        },
      },
      400,
    );
  }

  try {
    // Fetch order with related data using Drizzle's relational queries
    const orderWithDetails = await db.query.orders.findFirst({
      where: and(eq(orders.id, orderId), eq(orders.mitraId, mitraId)),
      with: {
        service: {
          columns: {
            id: true,
            name: true,
            serviceTypeKey: true,
            configJson: true,
            isActive: true,
          },
        },
        driver: {
          columns: {
            id: true,
            name: true,
            identifier: true,
            configJson: true,
            isActive: true,
          },
        },
        events: {
          orderBy: desc(orderEvents.timestamp),
          columns: {
            id: true,
            timestamp: true,
            eventType: true,
            dataJson: true,
            actorType: true,
            actorId: true,
          },
        },
      },
    });

    if (!orderWithDetails) {
      return c.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Order not found or not owned by this Mitra.',
          },
        },
        404,
      );
    }

    return c.json({
      success: true,
      data: orderWithDetails,
    });
  } catch (error) {
    console.error('[Order Details] Database error:', error);
    throw new Error('Failed to fetch order details.');
  }
});

/**
 * POST /api/mitra/orders/:orderId/assign-driver
 * Assign a driver to an order
 */
mitraOrderRoutes.post(
  '/:orderId/assign-driver',
  zValidator('json', assignDriverSchema),
  async (c) => {
    const { orderId } = c.req.param();
    const { driverId } = c.req.valid('json');
    const mitraId = c.get('currentMitraId')!;
    const db = c.get('db');

    // Validate orderId format
    if (!orderId || !isCuid(orderId)) {
      return c.json(
        {
          success: false,
          error: {
            code: 'INVALID_PARAM',
            message: 'Invalid order ID format.',
          },
        },
        400,
      );
    }

    try {
      // 1. Fetch the order and verify ownership
      const order = await db.query.orders.findFirst({
        where: and(eq(orders.id, orderId), eq(orders.mitraId, mitraId)),
        columns: {
          id: true,
          serviceId: true,
          status: true,
          driverId: true,
        },
      });

      if (!order) {
        return c.json(
          {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Order not found or not owned by this Mitra.',
            },
          },
          404,
        );
      }

      // 2. Verify order status is assignable
      const assignableStatuses = [
        'PENDING',
        'ACCEPTED_BY_MITRA',
        'PENDING_DRIVER_ASSIGNMENT',
        'REJECTED_BY_DRIVER',
      ];

      if (!assignableStatuses.includes(order.status as any)) {
        return c.json(
          {
            success: false,
            error: {
              code: 'CONFLICT',
              message: 'Order is not in an assignable state.',
            },
          },
          409,
        );
      }

      // 3. Fetch and verify the driver
      const driver = await db.query.drivers.findFirst({
        where: and(eq(drivers.id, driverId), eq(drivers.mitraId, mitraId)),
        columns: {
          id: true,
          name: true,
          isActive: true,
        },
      });

      if (!driver) {
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

      if (!driver.isActive) {
        return c.json(
          {
            success: false,
            error: {
              code: 'BAD_REQUEST',
              message: 'Driver is not active.',
            },
          },
          400,
        );
      }

      // 4. Verify driver is assigned to the service type
      const driverServiceAssignment = await db.query.driverServices.findFirst({
        where: and(
          eq(driverServices.driverId, driverId),
          eq(driverServices.serviceId, order.serviceId),
        ),
      });

      if (!driverServiceAssignment) {
        return c.json(
          {
            success: false,
            error: {
              code: 'BAD_REQUEST',
              message: 'Driver is not qualified for this service type.',
            },
          },
          400,
        );
      }

      // 5. Update the order
      const now = new Date();
      const [updatedOrder] = await db
        .update(orders)
        .set({
          driverId: driverId,
          status: 'DRIVER_ASSIGNED',
          updatedAt: now,
        })
        .where(eq(orders.id, orderId))
        .returning();

      // 6. Create an order event
      await db.insert(orderEvents).values({
        id: createId(),
        orderId: orderId,
        timestamp: now,
        eventType: 'ASSIGNMENT_CHANGED',
        dataJson: {
          eventType: 'ASSIGNMENT_CHANGED',
          oldDriverId: order.driverId,
          newDriverId: driverId,
          reason: 'Manual assignment by Mitra admin',
        },
        actorType: 'MITRA_ADMIN',
        actorId: mitraId,
      });

      return c.json({
        success: true,
        data: updatedOrder,
      });
    } catch (error) {
      console.error('[Driver Assignment] Error:', error);

      // Handle specific business logic errors
      if (error instanceof Error) {
        switch (error.message) {
          case 'ORDER_NOT_FOUND':
            return c.json(
              {
                success: false,
                error: {
                  code: 'NOT_FOUND',
                  message: 'Order not found or not owned by this Mitra.',
                },
              },
              404,
            );

          case 'ORDER_NOT_ASSIGNABLE':
            return c.json(
              {
                success: false,
                error: {
                  code: 'CONFLICT',
                  message: 'Order is not in an assignable state.',
                },
              },
              409,
            );

          case 'DRIVER_NOT_FOUND':
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

          case 'DRIVER_INACTIVE':
            return c.json(
              {
                success: false,
                error: {
                  code: 'BAD_REQUEST',
                  message: 'Driver is not active.',
                },
              },
              400,
            );

          case 'DRIVER_NOT_QUALIFIED':
            return c.json(
              {
                success: false,
                error: {
                  code: 'BAD_REQUEST',
                  message: 'Driver is not qualified for this service type.',
                },
              },
              400,
            );

          default:
            throw error;
        }
      }

      throw new Error('Failed to assign driver to order.');
    }
  },
);

export default mitraOrderRoutes;
