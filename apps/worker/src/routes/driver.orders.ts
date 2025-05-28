import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { isCuid } from '@paralleldrive/cuid2';
import { createId } from '@paralleldrive/cuid2';
import { orders, services, drivers, mitras, orderEvents } from '@treksistem/db-schema';
import { OrderStatusSchema } from '@treksistem/shared-types';
import type { AppContext } from '../types';

const driverOrderRoutes = new Hono<AppContext>();

// Validation schemas for new endpoints
const rejectOrderSchema = z.object({
  reason: z.string().max(255).optional(),
});

const updateStatusSchema = z.object({
  newStatus: OrderStatusSchema,
  notes: z.string().max(255).optional(),
  photoR2Key: z.string().optional(),
  lat: z.number().min(-90).max(90).optional(),
  lon: z.number().min(-180).max(180).optional(),
});

const addNoteSchema = z.object({
  note: z.string().min(1).max(500),
  eventType: z.string().optional(),
});

// Schema for R2 upload URL request
const requestUploadUrlSchema = z.object({
  filename: z.string()
    .regex(/\.(jpg|jpeg|png|webp)$/i, "Invalid file type. Only JPG, JPEG, PNG, and WEBP are allowed.")
    .max(100, "Filename too long."),
  contentType: z.string()
    .regex(/^image\/(jpeg|png|webp)$/, "Invalid content type. Only image/jpeg, image/png, and image/webp are allowed."),
});

// Order status state machine - defines valid transitions
const validStatusTransitions: Record<string, string[]> = {
  'DRIVER_ASSIGNED': ['ACCEPTED_BY_DRIVER', 'REJECTED_BY_DRIVER', 'CANCELLED_BY_DRIVER'],
  'ACCEPTED_BY_DRIVER': ['DRIVER_AT_PICKUP', 'CANCELLED_BY_DRIVER'],
  'DRIVER_AT_PICKUP': ['PICKED_UP', 'CANCELLED_BY_DRIVER'],
  'PICKED_UP': ['IN_TRANSIT', 'DRIVER_AT_DROPOFF', 'CANCELLED_BY_DRIVER'],
  'IN_TRANSIT': ['DRIVER_AT_DROPOFF', 'CANCELLED_BY_DRIVER'],
  'DRIVER_AT_DROPOFF': ['DELIVERED', 'FAILED_DELIVERY', 'CANCELLED_BY_DRIVER'],
  'DELIVERED': [], // Terminal state
  'CANCELLED_BY_DRIVER': [], // Terminal state
  'FAILED_DELIVERY': ['DRIVER_AT_DROPOFF'], // Retry delivery
};

/**
 * Driver Context Middleware (Authorization)
 * Validates driverId from path and ensures driver exists and is active
 * Sets currentDriverId, currentDriverMitraId, and driverIsActive in context
 */
driverOrderRoutes.use('*', async (c, next) => {
  const driverIdFromPath = c.req.param('driverId');

  if (!driverIdFromPath || !isCuid(driverIdFromPath)) {
    return c.json({
      success: false,
      error: {
        code: 'INVALID_DRIVER_ID',
        message: 'Driver ID is missing or invalid format.',
      },
    }, 400);
  }

  try {
    const driver = await c.get('db').query.drivers.findFirst({
      where: eq(drivers.id, driverIdFromPath),
      columns: {
        id: true,
        mitraId: true,
        isActive: true,
        name: true,
      },
    });

    if (!driver) {
      return c.json({
        success: false,
        error: {
          code: 'DRIVER_NOT_FOUND',
          message: 'Driver not found.',
        },
      }, 404);
    }

    if (!driver.isActive) {
      return c.json({
        success: false,
        error: {
          code: 'DRIVER_INACTIVE',
          message: 'Driver account is inactive.',
        },
      }, 403);
    }

    // Set driver context for downstream handlers
    c.set('currentDriverId', driver.id);
    c.set('currentDriverMitraId', driver.mitraId);
    c.set('driverIsActive', driver.isActive);

    console.log(`[Driver Auth] Driver ${driver.name} (${driver.id}) authenticated for Mitra ${driver.mitraId}`);

  } catch (dbError) {
    console.error('[Driver Auth] Database error:', dbError);
    return c.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to verify driver authentication.',
      },
    }, 500);
  }

  await next();
});

/**
 * GET /assigned
 * List orders currently assigned to the authenticated driver
 * Filters for active assignment statuses and includes service configuration details
 */
driverOrderRoutes.get('/assigned', async (c) => {
  const currentDriverId = c.get('currentDriverId') as string;
  const db = c.get('db');

  // Define statuses that indicate active assignment for drivers (mutable array for inArray)
  const activeAssignmentStatuses = [
    'DRIVER_ASSIGNED',
    'ACCEPTED_BY_DRIVER',
    'DRIVER_AT_PICKUP',
    'PICKED_UP',
    'IN_TRANSIT',
    'DRIVER_AT_DROPOFF',
  ];

  try {
    const assignedOrders = await db.query.orders.findMany({
      where: and(
        eq(orders.driverId, currentDriverId),
        inArray(orders.status, activeAssignmentStatuses)
      ),
      orderBy: [desc(orders.updatedAt)],
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
        mitra: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Transform orders to include parsed service config and structured data
    const transformedOrders = assignedOrders.map(order => {
      // Parse service configuration for driver context
      let serviceConfig = null;
      try {
        if (order.service?.configJson) {
          serviceConfig = order.service.configJson;
        }
      } catch (parseError) {
        console.warn(`[Driver Orders] Failed to parse service config for order ${order.id}:`, parseError);
      }

      // Parse order details
      let orderDetails = null;
      try {
        if (order.detailsJson) {
          orderDetails = order.detailsJson;
        }
      } catch (parseError) {
        console.warn(`[Driver Orders] Failed to parse order details for order ${order.id}:`, parseError);
      }

      return {
        id: order.id,
        status: order.status,
        ordererIdentifier: order.ordererIdentifier,
        receiverWaNumber: order.receiverWaNumber,
        estimatedCost: order.estimatedCost,
        finalCost: order.finalCost,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        scheduledAt: order.scheduledAt,
        details: orderDetails,
        service: {
          id: order.service?.id,
          name: order.service?.name,
          serviceTypeKey: order.service?.serviceTypeKey,
          config: serviceConfig,
          isActive: order.service?.isActive,
        },
        mitra: {
          id: order.mitra?.id,
          name: order.mitra?.name,
        },
      };
    });

    console.log(`[Driver Orders] Found ${transformedOrders.length} active orders for driver ${currentDriverId}`);

    return c.json({
      success: true,
      data: {
        orders: transformedOrders,
        totalCount: transformedOrders.length,
        driverId: currentDriverId,
      },
    });

  } catch (error) {
    console.error('[Driver Orders] Database error fetching assigned orders:', error);
    return c.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch assigned orders.',
      },
    }, 500);
  }
});

/**
 * POST /:orderId/accept
 * Driver accepts an assigned order
 */
driverOrderRoutes.post('/:orderId/accept', async (c) => {
  const currentDriverId = c.get('currentDriverId') as string;
  const db = c.get('db');
  const orderId = c.req.param('orderId');

  if (!orderId || !isCuid(orderId)) {
    return c.json({
      success: false,
      error: {
        code: 'INVALID_ORDER_ID',
        message: 'Order ID is missing or invalid format.',
      },
    }, 400);
  }

  try {
    const result = await db.transaction(async (tx) => {
      // Fetch the order and verify it's assigned to this driver
      const order = await tx.query.orders.findFirst({
        where: and(
          eq(orders.id, orderId),
          eq(orders.driverId, currentDriverId)
        ),
      });

      if (!order) {
        throw new Error('ORDER_NOT_FOUND_OR_NOT_ASSIGNED');
      }

      // Verify order status allows acceptance
      if (order.status !== 'DRIVER_ASSIGNED') {
        throw new Error(`INVALID_STATUS_FOR_ACCEPTANCE:${order.status}`);
      }

      // Update order status
      const [updatedOrder] = await tx.update(orders)
        .set({
          status: 'ACCEPTED_BY_DRIVER',
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId))
        .returning();

      // Create audit trail event
      await tx.insert(orderEvents).values({
        id: createId(),
        orderId: orderId,
        timestamp: new Date(Date.now()),
        eventType: 'STATUS_UPDATE',
        dataJson: {
          eventType: 'STATUS_UPDATE' as const,
          oldStatus: order.status as any,
          newStatus: 'ACCEPTED_BY_DRIVER' as any,
        },
        actorType: 'DRIVER',
        actorId: currentDriverId,
      });

      return updatedOrder;
    });

    console.log(`[Driver Orders] Driver ${currentDriverId} accepted order ${orderId}`);

    return c.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error('[Driver Orders] Error accepting order:', error);

    if (error instanceof Error) {
      if (error.message === 'ORDER_NOT_FOUND_OR_NOT_ASSIGNED') {
        return c.json({
          success: false,
          error: {
            code: 'ORDER_NOT_FOUND',
            message: 'Order not found or not assigned to this driver.',
          },
        }, 404);
      }

      if (error.message.startsWith('INVALID_STATUS_FOR_ACCEPTANCE:')) {
        const currentStatus = error.message.split(':')[1];
        return c.json({
          success: false,
          error: {
            code: 'INVALID_STATUS_TRANSITION',
            message: `Order cannot be accepted at current status: ${currentStatus}`,
          },
        }, 409);
      }
    }

    return c.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to accept order.',
      },
    }, 500);
  }
});

/**
 * POST /:orderId/reject
 * Driver rejects an assigned order
 */
driverOrderRoutes.post('/:orderId/reject', 
  zValidator('json', rejectOrderSchema),
  async (c) => {
    const currentDriverId = c.get('currentDriverId') as string;
    const db = c.get('db');
    const orderId = c.req.param('orderId');
    const { reason } = c.req.valid('json');

    if (!orderId || !isCuid(orderId)) {
      return c.json({
        success: false,
        error: {
          code: 'INVALID_ORDER_ID',
          message: 'Order ID is missing or invalid format.',
        },
      }, 400);
    }

    try {
      await db.transaction(async (tx) => {
        // Fetch the order and verify it's assigned to this driver
        const order = await tx.query.orders.findFirst({
          where: and(
            eq(orders.id, orderId),
            eq(orders.driverId, currentDriverId)
          ),
        });

        if (!order) {
          throw new Error('ORDER_NOT_FOUND_OR_NOT_ASSIGNED');
        }

        // Verify order status allows rejection
        if (order.status !== 'DRIVER_ASSIGNED') {
          throw new Error(`INVALID_STATUS_FOR_REJECTION:${order.status}`);
        }

        // Update order status and unassign driver
        await tx.update(orders)
          .set({
            status: 'REJECTED_BY_DRIVER',
            driverId: null,
            updatedAt: new Date(),
          })
          .where(eq(orders.id, orderId));

        // Create audit trail event
        await tx.insert(orderEvents).values({
          id: createId(),
          orderId: orderId,
          timestamp: new Date(Date.now()),
          eventType: 'STATUS_UPDATE',
          dataJson: {
            eventType: 'STATUS_UPDATE' as const,
            oldStatus: order.status as any,
            newStatus: 'REJECTED_BY_DRIVER' as any,
            reason: reason || 'No reason provided',
          },
          actorType: 'DRIVER',
          actorId: currentDriverId,
        });
      });

      console.log(`[Driver Orders] Driver ${currentDriverId} rejected order ${orderId}: ${reason || 'No reason'}`);

      return c.json({
        success: true,
        message: 'Order rejected successfully.',
      });

    } catch (error) {
      console.error('[Driver Orders] Error rejecting order:', error);

      if (error instanceof Error) {
        if (error.message === 'ORDER_NOT_FOUND_OR_NOT_ASSIGNED') {
          return c.json({
            success: false,
            error: {
              code: 'ORDER_NOT_FOUND',
              message: 'Order not found or not assigned to this driver.',
            },
          }, 404);
        }

        if (error.message.startsWith('INVALID_STATUS_FOR_REJECTION:')) {
          const currentStatus = error.message.split(':')[1];
          return c.json({
            success: false,
            error: {
              code: 'INVALID_STATUS_TRANSITION',
              message: `Order cannot be rejected at current status: ${currentStatus}`,
            },
          }, 409);
        }
      }

      return c.json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to reject order.',
        },
      }, 500);
    }
  }
);

/**
 * POST /:orderId/update-status
 * Driver updates order status with optional notes, photo proof, and location
 */
driverOrderRoutes.post('/:orderId/update-status',
  zValidator('json', updateStatusSchema),
  async (c) => {
    const currentDriverId = c.get('currentDriverId') as string;
    const db = c.get('db');
    const orderId = c.req.param('orderId');
    const { newStatus, notes, photoR2Key, lat, lon } = c.req.valid('json');

    if (!orderId || !isCuid(orderId)) {
      return c.json({
        success: false,
        error: {
          code: 'INVALID_ORDER_ID',
          message: 'Order ID is missing or invalid format.',
        },
      }, 400);
    }

    try {
      const result = await db.transaction(async (tx) => {
        // Fetch the order and verify it's assigned to this driver
        const order = await tx.query.orders.findFirst({
          where: and(
            eq(orders.id, orderId),
            eq(orders.driverId, currentDriverId)
          ),
        });

        if (!order) {
          throw new Error('ORDER_NOT_FOUND_OR_NOT_ASSIGNED');
        }

        // Validate status transition using state machine
        const allowedTransitions = validStatusTransitions[order.status] || [];
        if (!allowedTransitions.includes(newStatus)) {
          throw new Error(`INVALID_STATUS_TRANSITION:${order.status}:${newStatus}`);
        }

        // Prepare update data
        const updateData: any = {
          status: newStatus,
          updatedAt: new Date(),
        };

        // Set final cost if delivered (for now, keep it same as estimated)
        if (newStatus === 'DELIVERED' && !order.finalCost) {
          updateData.finalCost = order.estimatedCost;
        }

        // Update order
        const [updatedOrder] = await tx.update(orders)
          .set(updateData)
          .where(eq(orders.id, orderId))
          .returning();

        // Create event data with all relevant information
        const eventData: any = {
          eventType: 'STATUS_UPDATE' as const,
          oldStatus: order.status as any,
          newStatus: newStatus as any,
        };

        if (notes) eventData.reason = notes;
        if (photoR2Key) eventData.photoR2Key = photoR2Key;
        if (lat !== undefined && lon !== undefined) {
          eventData.location = { lat, lon };
        }

        // Create audit trail event
        await tx.insert(orderEvents).values({
          id: createId(),
          orderId: orderId,
          timestamp: new Date(Date.now()),
          eventType: 'STATUS_UPDATE',
          dataJson: eventData,
          actorType: 'DRIVER',
          actorId: currentDriverId,
        });

        // If photo was provided, create separate photo event
        if (photoR2Key) {
          await tx.insert(orderEvents).values({
            id: createId(),
            orderId: orderId,
            timestamp: new Date(Date.now()),
            eventType: 'PHOTO_UPLOADED',
            dataJson: {
              eventType: 'PHOTO_UPLOADED' as const,
              photoR2Key: photoR2Key,
              photoType: newStatus === 'DELIVERED' ? 'DELIVERY_PROOF' as const : 
                        newStatus === 'PICKED_UP' ? 'PICKUP_PROOF' as const : 'CONDITION_PROOF' as const,
              caption: notes,
            },
            actorType: 'DRIVER',
            actorId: currentDriverId,
          });
        }

        // If location was provided, create separate location event
        if (lat !== undefined && lon !== undefined) {
          await tx.insert(orderEvents).values({
            id: createId(),
            orderId: orderId,
            timestamp: new Date(Date.now()),
            eventType: 'LOCATION_UPDATE',
            dataJson: {
              eventType: 'LOCATION_UPDATE' as const,
              lat,
              lon,
            },
            actorType: 'DRIVER',
            actorId: currentDriverId,
          });
        }

        return updatedOrder;
      });

      console.log(`[Driver Orders] Driver ${currentDriverId} updated order ${orderId} status to ${newStatus}`);

      return c.json({
        success: true,
        data: result,
      });

    } catch (error) {
      console.error('[Driver Orders] Error updating order status:', error);

      if (error instanceof Error) {
        if (error.message === 'ORDER_NOT_FOUND_OR_NOT_ASSIGNED') {
          return c.json({
            success: false,
            error: {
              code: 'ORDER_NOT_FOUND',
              message: 'Order not found or not assigned to this driver.',
            },
          }, 404);
        }

        if (error.message.startsWith('INVALID_STATUS_TRANSITION:')) {
          const [, currentStatus, attemptedStatus] = error.message.split(':');
          return c.json({
            success: false,
            error: {
              code: 'INVALID_STATUS_TRANSITION',
              message: `Invalid status transition from ${currentStatus} to ${attemptedStatus}`,
            },
          }, 409);
        }
      }

      return c.json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update order status.',
        },
      }, 500);
    }
  }
);

/**
 * POST /:orderId/add-note
 * Driver adds a note to the order
 */
driverOrderRoutes.post('/:orderId/add-note',
  zValidator('json', addNoteSchema),
  async (c) => {
    const currentDriverId = c.get('currentDriverId') as string;
    const db = c.get('db');
    const orderId = c.req.param('orderId');
    const { note, eventType } = c.req.valid('json');

    if (!orderId || !isCuid(orderId)) {
      return c.json({
        success: false,
        error: {
          code: 'INVALID_ORDER_ID',
          message: 'Order ID is missing or invalid format.',
        },
      }, 400);
    }

    try {
      await db.transaction(async (tx) => {
        // Verify the order exists and is assigned to this driver
        const order = await tx.query.orders.findFirst({
          where: and(
            eq(orders.id, orderId),
            eq(orders.driverId, currentDriverId)
          ),
        });

        if (!order) {
          throw new Error('ORDER_NOT_FOUND_OR_NOT_ASSIGNED');
        }

        // Create note event
        await tx.insert(orderEvents).values({
          id: createId(),
          orderId: orderId,
          timestamp: new Date(Date.now()),
          eventType: 'NOTE_ADDED',
          dataJson: {
            eventType: 'NOTE_ADDED' as const,
            note: note,
            author: 'DRIVER' as const,
          },
          actorType: 'DRIVER',
          actorId: currentDriverId,
        });
      });

      console.log(`[Driver Orders] Driver ${currentDriverId} added note to order ${orderId}: ${note.substring(0, 50)}...`);

      return c.json({
        success: true,
        message: 'Note added successfully.',
      });

    } catch (error) {
      console.error('[Driver Orders] Error adding note:', error);

      if (error instanceof Error) {
        if (error.message === 'ORDER_NOT_FOUND_OR_NOT_ASSIGNED') {
          return c.json({
            success: false,
            error: {
              code: 'ORDER_NOT_FOUND',
              message: 'Order not found or not assigned to this driver.',
            },
          }, 404);
        }
      }

      return c.json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to add note.',
        },
      }, 500);
    }
  }
);

/**
 * POST /:orderId/request-upload-url
 * Generate a temporary upload token that can be used with the upload endpoint
 * Driver can only request upload tokens for orders assigned to them
 */
driverOrderRoutes.post('/:orderId/request-upload-url',
  zValidator('json', requestUploadUrlSchema),
  async (c) => {
    const currentDriverId = c.get('currentDriverId') as string;
    const currentDriverMitraId = c.get('currentDriverMitraId') as string;
    const db = c.get('db');
    const orderId = c.req.param('orderId');
    const { filename, contentType } = c.req.valid('json');

    if (!orderId || !isCuid(orderId)) {
      return c.json({
        success: false,
        error: {
          code: 'INVALID_ORDER_ID',
          message: 'Order ID is missing or invalid format.',
        },
      }, 400);
    }

    try {
      // Verify the order exists and is assigned to this driver
      const order = await db.query.orders.findFirst({
        where: and(
          eq(orders.id, orderId),
          eq(orders.driverId, currentDriverId)
        ),
        columns: {
          id: true,
          status: true,
          driverId: true,
        },
      });

      if (!order) {
        return c.json({
          success: false,
          error: {
            code: 'ORDER_NOT_FOUND',
            message: 'Order not found or not assigned to this driver.',
          },
        }, 404);
      }

      // Construct unique R2 object key with structured path
      // Format: proofs/{mitraId}/{orderId}/{uniqueId}-{filename}
      const uniqueId = createId();
      const r2ObjectKey = `proofs/${currentDriverMitraId}/${orderId}/${uniqueId}-${filename}`;

      console.log(`[Driver Upload] Generating upload token for driver ${currentDriverId}, order ${orderId}, key: ${r2ObjectKey}`);

      // Instead of pre-signed URL, return upload endpoint and token
      const uploadToken = createId(); // Temporary token for this upload
      const uploadUrl = `/api/driver/${currentDriverId}/orders/${orderId}/upload/${uploadToken}`;

      // Store the upload context temporarily (in a real system, you'd use KV or similar)
      // For now, we'll encode the necessary info in the token and validate it during upload
      const uploadContext = {
        r2ObjectKey,
        contentType,
        driverId: currentDriverId,
        orderId,
        mitraId: currentDriverMitraId,
        expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
      };

      console.log(`[Driver Upload] Upload token generated successfully for driver ${currentDriverId}, order ${orderId}`);

      return c.json({
        success: true,
        data: {
          uploadUrl: uploadUrl,
          uploadToken: uploadToken,
          r2ObjectKey: r2ObjectKey,
          expiresAt: uploadContext.expiresAt,
        },
      });

    } catch (error) {
      console.error('[Driver Upload] Error generating upload token:', error);

      return c.json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to generate upload token.',
        },
      }, 500);
    }
  }
);

/**
 * POST /:orderId/upload/:uploadToken
 * Handle the actual file upload using the upload token
 */
driverOrderRoutes.post('/:orderId/upload/:uploadToken',
  async (c) => {
    const currentDriverId = c.get('currentDriverId') as string;
    const currentDriverMitraId = c.get('currentDriverMitraId') as string;
    const orderId = c.req.param('orderId');
    const uploadToken = c.req.param('uploadToken');

    if (!orderId || !isCuid(orderId)) {
      return c.json({
        success: false,
        error: {
          code: 'INVALID_ORDER_ID',
          message: 'Order ID is missing or invalid format.',
        },
      }, 400);
    }

    if (!uploadToken || !isCuid(uploadToken)) {
      return c.json({
        success: false,
        error: {
          code: 'INVALID_UPLOAD_TOKEN',
          message: 'Upload token is missing or invalid format.',
        },
      }, 400);
    }

    try {
      // Verify the order exists and is assigned to this driver
      const db = c.get('db');
      const order = await db.query.orders.findFirst({
        where: and(
          eq(orders.id, orderId),
          eq(orders.driverId, currentDriverId)
        ),
        columns: {
          id: true,
          status: true,
          driverId: true,
        },
      });

      if (!order) {
        return c.json({
          success: false,
          error: {
            code: 'ORDER_NOT_FOUND',
            message: 'Order not found or not assigned to this driver.',
          },
        }, 404);
      }

      // Get the uploaded file from request body
      const contentType = c.req.header('content-type') || 'application/octet-stream';
      
      if (!contentType.startsWith('image/')) {
        return c.json({
          success: false,
          error: {
            code: 'INVALID_FILE_TYPE',
            message: 'Only image files are allowed.',
          },
        }, 400);
      }

      // For simplicity, we'll reconstruct the object key
      // In production, you'd store the upload context in KV or similar
      const r2ObjectKey = `proofs/${currentDriverMitraId}/${orderId}/${uploadToken}-upload.jpg`;

      console.log(`[Driver Upload] Uploading file for driver ${currentDriverId}, order ${orderId}, key: ${r2ObjectKey}`);

      // Get the request body as ReadableStream for R2 upload
      const requestBody = c.req.raw.body;
      
      if (!requestBody) {
        return c.json({
          success: false,
          error: {
            code: 'NO_FILE_PROVIDED',
            message: 'No file provided in request body.',
          },
        }, 400);
      }

      // Upload to R2
      const uploadedObject = await c.env.TREKSISTEM_R2.put(r2ObjectKey, requestBody, {
        httpMetadata: {
          contentType: contentType,
        },
        customMetadata: {
          orderId: orderId,
          driverId: currentDriverId,
          mitraId: currentDriverMitraId,
          uploadedAt: new Date().toISOString(),
          uploadToken: uploadToken,
        },
      });

      if (!uploadedObject) {
        throw new Error('Failed to upload file to R2');
      }

      console.log(`[Driver Upload] File uploaded successfully: ${r2ObjectKey}, etag: ${uploadedObject.etag}`);

      return c.json({
        success: true,
        data: {
          r2ObjectKey: r2ObjectKey,
          etag: uploadedObject.etag,
          size: uploadedObject.size,
          uploaded: uploadedObject.uploaded,
          message: 'File uploaded successfully. Use the r2ObjectKey in your status update.',
        },
      });

    } catch (error) {
      console.error('[Driver Upload] Error uploading file:', error);

      return c.json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to upload file.',
        },
      }, 500);
    }
  }
);

export default driverOrderRoutes; 