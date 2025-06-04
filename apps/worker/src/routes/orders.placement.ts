/**
 * Order Placement API Routes
 *
 * Implements RFC-TREK-ORDER-001: End-User Order Placement API
 *
 * This module provides the public API endpoint for end-users to place orders
 * for specific Mitra services. It includes:
 * - Dynamic validation against service configuration
 * - Comprehensive cost calculation with multiple pricing models
 * - Trust mechanisms for sensitive orders (talangan/barang penting)
 * - Transactional order and event creation
 *
 * @see RFC-TREK-ORDER-001 for order placement requirements
 * @see RFC-TREK-CONFIG-001 for service configuration integration
 * @see RFC-TREK-TRUST-001 for trust mechanism implementation
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { createId, isCuid } from '@paralleldrive/cuid2';
import { services, mitras, orders, orderEvents } from '@treksistem/db-schema';
import {
  OrderPlacementPayloadSchema,
  ServiceConfigBaseSchema,
  AddressDetailSchema,
  type OrderPlacementPayload,
  type ServiceConfigBase,
} from '@treksistem/shared-types';
import type { AppContext } from '../types';
import {
  calculateOrderCost,
  validateTalanganAmount,
  validateSelectedMuatan,
  validateSelectedFasilitas,
  CostCalculationError,
} from '../utils/cost-calculation';
import {
  evaluateOrderTrustMechanisms,
  validateOrdererIdentifier,
  generateTrustEventData,
  formatTrustSummary,
  TrustMechanismError,
} from '../utils/trust-mechanisms';

const orderPlacementRoutes = new Hono<AppContext>();

/**
 * POST /
 * Place a new order for a specific service
 *
 * This endpoint handles the complete order placement workflow:
 * 1. Validates request payload against Zod schema
 * 2. Fetches and validates service configuration
 * 3. Performs business rule validation
 * 4. Calculates estimated cost
 * 5. Evaluates trust mechanisms
 * 6. Creates order and initial event in transaction
 * 7. Returns order details with tracking information
 */
orderPlacementRoutes.post('/', zValidator('json', OrderPlacementPayloadSchema), async (c) => {
  const payload = c.req.valid('json') as OrderPlacementPayload;
  const db = c.get('db');

  try {
    console.log(`[Order Placement] Starting order placement for service: ${payload.serviceId}`);

    // === 1. Fetch Service and Mitra Information ===
    const serviceWithMitra = await db
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
      .where(and(eq(services.id, payload.serviceId), eq(services.isActive, true)))
      .limit(1);

    if (serviceWithMitra.length === 0) {
      return c.json(
        {
          success: false,
          error: {
            code: 'SERVICE_NOT_FOUND',
            message: 'Service not found or inactive',
          },
        },
        404,
      );
    }

    const serviceData = serviceWithMitra[0];

    // === 2. Parse and Validate Service Configuration ===
    let serviceConfig: ServiceConfigBase;
    try {
      serviceConfig = ServiceConfigBaseSchema.parse(serviceData.configJson);
    } catch (parseError) {
      console.error('[Order Placement] Invalid service config:', serviceData.serviceId, parseError);
      return c.json(
        {
          success: false,
          error: {
            code: 'INVALID_SERVICE_CONFIG',
            message: 'Service configuration is invalid',
          },
        },
        500,
      );
    }

    // Check if service accepts public orders
    if (
      serviceConfig.modelBisnis !== 'PUBLIC_3RD_PARTY' &&
      serviceConfig.modelBisnis !== 'USAHA_SENDIRI'
    ) {
      return c.json(
        {
          success: false,
          error: {
            code: 'SERVICE_NOT_AVAILABLE',
            message: 'Service is not available for public ordering',
          },
        },
        403,
      );
    }

    console.log(`[Order Placement] Service config validated for: ${serviceData.serviceName}`);

    // === 3. Validate Order Payload Against Service Configuration ===

    // Validate addresses
    try {
      AddressDetailSchema.parse(payload.details.pickupAddress);
      AddressDetailSchema.parse(payload.details.dropoffAddress);
    } catch (addressError) {
      return c.json(
        {
          success: false,
          error: {
            code: 'INVALID_ADDRESS',
            message: 'Invalid pickup or dropoff address format',
            details: addressError,
          },
        },
        400,
      );
    }

    // Validate orderer identifier
    try {
      validateOrdererIdentifier(payload.ordererIdentifier);
    } catch (error) {
      if (error instanceof TrustMechanismError) {
        return c.json(
          {
            success: false,
            error: {
              code: error.code,
              message: error.message,
              details: error.details,
            },
          },
          400,
        );
      }
      throw error;
    }

    // Validate talangan amount
    try {
      validateTalanganAmount(serviceConfig, payload.talanganAmount);
    } catch (error) {
      if (error instanceof CostCalculationError) {
        return c.json(
          {
            success: false,
            error: {
              code: error.code,
              message: error.message,
              details: error.details,
            },
          },
          400,
        );
      }
      throw error;
    }

    // Validate selected muatan
    try {
      validateSelectedMuatan(serviceConfig, payload.details.selectedMuatanId);
    } catch (error) {
      if (error instanceof CostCalculationError) {
        return c.json(
          {
            success: false,
            error: {
              code: error.code,
              message: error.message,
              details: error.details,
            },
          },
          400,
        );
      }
      throw error;
    }

    // Validate selected facilities
    try {
      validateSelectedFasilitas(serviceConfig, payload.details.selectedFasilitasIds);
    } catch (error) {
      if (error instanceof CostCalculationError) {
        return c.json(
          {
            success: false,
            error: {
              code: error.code,
              message: error.message,
              details: error.details,
            },
          },
          400,
        );
      }
      throw error;
    }

    console.log('[Order Placement] Payload validation completed');

    // === 4. Calculate Estimated Cost ===
    let costBreakdown;
    try {
      costBreakdown = await calculateOrderCost(serviceConfig, payload.details);
      console.log(
        `[Order Placement] Cost calculated: Rp ${costBreakdown.totalCost.toLocaleString()}`,
      );
    } catch (error) {
      if (error instanceof CostCalculationError) {
        return c.json(
          {
            success: false,
            error: {
              code: error.code,
              message: error.message,
              details: error.details,
            },
          },
          400,
        );
      }
      throw error;
    }

    // === 5. Generate Order ID and Tracking URL ===
    const newOrderId = createId();
    const trackingUrl = `https://treksistem.com/track/${newOrderId}`;

    // === 6. Evaluate Trust Mechanisms ===
    let trustResult;
    try {
      trustResult = evaluateOrderTrustMechanisms(serviceConfig, payload, newOrderId);
      console.log(`[Order Placement] Trust evaluation: ${trustResult.trustLevel}`);
    } catch (error) {
      if (error instanceof TrustMechanismError) {
        return c.json(
          {
            success: false,
            error: {
              code: error.code,
              message: error.message,
              details: error.details,
            },
          },
          400,
        );
      }
      throw error;
    }

    // === 7. Create Order and Events in Transaction ===
    const transactionResult = await db.transaction(async (tx) => {
      // Insert order
      const [createdOrder] = await tx
        .insert(orders)
        .values({
          id: newOrderId,
          serviceId: payload.serviceId,
          mitraId: serviceData.mitraId,
          ordererIdentifier: payload.ordererIdentifier,
          receiverWaNumber: payload.receiverWaNumber || null,
          detailsJson: payload.details,
          status: 'PENDING',
          estimatedCost: costBreakdown.totalCost,
          scheduledAt: payload.details.scheduledPickupTime
            ? new Date(payload.details.scheduledPickupTime)
            : null,
        })
        .returning();

      // Insert initial order event
      const orderCreatedEventId = createId();
      await tx.insert(orderEvents).values({
        id: orderCreatedEventId,
        orderId: newOrderId,
        eventType: 'ORDER_CREATED',
        dataJson: {
          placedBy: payload.ordererIdentifier,
          serviceName: serviceData.serviceName,
          mitraName: serviceData.mitraName,
          estimatedCost: costBreakdown.totalCost,
          costBreakdown: costBreakdown.breakdown,
          paymentMethod: payload.paymentMethod,
          isBarangPenting: payload.isBarangPenting,
          talanganAmount: payload.talanganAmount || 0,
          trust: generateTrustEventData(trustResult),
        },
        actorType: 'CUSTOMER',
        actorId: payload.ordererIdentifier,
      });

      // If trust mechanisms are required, log trust evaluation event
      if (trustResult.requiresReceiverNotification) {
        const trustEventId = createId();
        await tx.insert(orderEvents).values({
          id: trustEventId,
          orderId: newOrderId,
          eventType: 'TRUST_EVALUATION',
          dataJson: {
            trustLevel: trustResult.trustLevel,
            trustReasons: trustResult.trustReason,
            verificationRequirements: trustResult.verificationRequirements,
            receiverNotificationRequired: true,
            notificationLinkGenerated: !!trustResult.receiverNotificationLink,
          },
          actorType: 'SYSTEM',
          actorId: 'trust-evaluator',
        });
      }

      return {
        order: createdOrder,
        trustResult,
        costBreakdown,
      };
    });

    console.log(`[Order Placement] Order created successfully: ${newOrderId}`);

    // === 8. Prepare Response ===
    const response = {
      orderId: newOrderId,
      status: 'PENDING' as const,
      estimatedCost: costBreakdown.totalCost,
      trackingUrl,
      service: {
        name: serviceData.serviceName,
        mitra: serviceData.mitraName,
      },
      costBreakdown: {
        total: costBreakdown.totalCost,
        breakdown: costBreakdown.breakdown,
        calculation_method: costBreakdown.metadata.calculationMethod,
        ...(costBreakdown.metadata.distanceKm && {
          distance_km: costBreakdown.metadata.distanceKm,
        }),
      },
      trust: formatTrustSummary(trustResult),
      ...(trustResult.requiresReceiverNotification && {
        requiresReceiverNotification: true,
        receiverNotificationLink: trustResult.receiverNotificationLink,
      }),
      createdAt: transactionResult.order.createdAt,
      ...(transactionResult.order.scheduledAt && {
        scheduledAt: transactionResult.order.scheduledAt,
      }),
    };

    return c.json(
      {
        success: true,
        data: response,
        message: 'Order placed successfully',
      },
      201,
    );
  } catch (error) {
    console.error('[Order Placement] Unexpected error:', error);

    return c.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred while placing the order',
        },
      },
      500,
    );
  }
});

/**
 * GET /cost-estimate
 * Get cost estimate for an order without creating it
 *
 * This endpoint allows users to get cost estimates before committing to place an order.
 * Useful for UI that shows estimated costs as users fill out order forms.
 */
orderPlacementRoutes.post(
  '/cost-estimate',
  zValidator(
    'json',
    OrderPlacementPayloadSchema.pick({
      serviceId: true,
      details: true,
      talanganAmount: true,
    }),
  ),
  async (c) => {
    const payload = c.req.valid('json');
    const db = c.get('db');

    try {
      // Fetch service configuration
      const serviceResult = await db
        .select({
          configJson: services.configJson,
          isActive: services.isActive,
          serviceName: services.name,
        })
        .from(services)
        .where(and(eq(services.id, payload.serviceId), eq(services.isActive, true)))
        .limit(1);

      if (serviceResult.length === 0) {
        return c.json(
          {
            success: false,
            error: {
              code: 'SERVICE_NOT_FOUND',
              message: 'Service not found or inactive',
            },
          },
          404,
        );
      }

      const serviceConfig = ServiceConfigBaseSchema.parse(serviceResult[0].configJson);

      // Calculate cost estimate
      const costBreakdown = await calculateOrderCost(serviceConfig, payload.details);

      return c.json({
        success: true,
        data: {
          estimatedCost: costBreakdown.totalCost,
          breakdown: costBreakdown.breakdown,
          metadata: costBreakdown.metadata,
        },
      });
    } catch (error) {
      if (error instanceof CostCalculationError) {
        return c.json(
          {
            success: false,
            error: {
              code: error.code,
              message: error.message,
              details: error.details,
            },
          },
          400,
        );
      }

      console.error('[Cost Estimate] Unexpected error:', error);
      return c.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to calculate cost estimate',
          },
        },
        500,
      );
    }
  },
);

/**
 * GET /:orderId/track
 * Public order tracking endpoint for end-users
 *
 * Returns sanitized order information including:
 * - Order status and basic details
 * - Service information
 * - Driver information (sanitized when assigned)
 * - Recent order events
 *
 * No authentication required - uses order ID as access token
 */
orderPlacementRoutes.get(
  '/:orderId/track',
  zValidator(
    'param',
    z.object({
      orderId: z.string().min(1, 'Order ID is required'),
    }),
  ),
  async (c) => {
    const { orderId } = c.req.valid('param');
    const db = c.get('db');

    // Validate orderId format (must be a valid CUID)
    if (!isCuid(orderId)) {
      return c.json(
        {
          success: false,
          error: {
            code: 'INVALID_ORDER_ID',
            message: 'Invalid order ID format.',
          },
        },
        400,
      );
    }

    try {
      console.log(`[Order Tracking] Fetching tracking details for order: ${orderId}`);

      // Query order with related service, driver, and events
      const orderTrackingDetails = await db.query.orders.findFirst({
        where: eq(orders.id, orderId),
        columns: {
          id: true,
          status: true,
          estimatedCost: true,
          finalCost: true,
          createdAt: true,
          updatedAt: true,
          scheduledAt: true,
          // Note: detailsJson contains full addresses but we'll extract only safe parts
          detailsJson: true,
        },
        with: {
          service: {
            columns: {
              name: true,
              serviceTypeKey: true,
            },
          },
          driver: {
            columns: {
              name: true,
              configJson: true,
            },
          },
          events: {
            columns: {
              timestamp: true,
              eventType: true,
              dataJson: true,
              actorType: true,
            },
            orderBy: (events, { desc }) => [desc(events.timestamp)],
            limit: 20, // Limit number of events for performance
          },
        },
      });

      if (!orderTrackingDetails) {
        return c.json(
          {
            success: false,
            error: {
              code: 'ORDER_NOT_FOUND',
              message: 'Order not found.',
            },
          },
          404,
        );
      }

      // Sanitize driver information
      let sanitizedDriverInfo = undefined;
      if (orderTrackingDetails.driver) {
        let vehicleInfo = 'Unknown';

        // Extract safe vehicle information from driver config
        if (orderTrackingDetails.driver.configJson) {
          try {
            const driverConfig = orderTrackingDetails.driver.configJson as any;
            if (driverConfig.vehicle?.type) {
              vehicleInfo = driverConfig.vehicle.type;
            } else if (driverConfig.vehicleType) {
              vehicleInfo = driverConfig.vehicleType;
            }
          } catch (configError) {
            console.warn(
              `[Order Tracking] Failed to parse driver config for order ${orderId}:`,
              configError,
            );
          }
        }

        sanitizedDriverInfo = {
          name: orderTrackingDetails.driver.name || 'Driver',
          vehicleInfo,
        };
      }

      // Extract safe address information from detailsJson
      let pickupAddress = 'Pickup location';
      let dropoffAddress = 'Dropoff location';

      try {
        const orderDetails = orderTrackingDetails.detailsJson as any;
        if (orderDetails.pickupAddress?.addressText) {
          pickupAddress = orderDetails.pickupAddress.addressText;
        }
        if (orderDetails.dropoffAddress?.addressText) {
          dropoffAddress = orderDetails.dropoffAddress.addressText;
        }
      } catch (detailsError) {
        console.warn(
          `[Order Tracking] Failed to extract address details for order ${orderId}:`,
          detailsError,
        );
      }

      // Process and sanitize order events
      const sanitizedEvents = orderTrackingDetails.events.map((event) => {
        const sanitizedEvent: any = {
          timestamp: event.timestamp,
          eventType: event.eventType,
        };

        // Add event-specific data if present
        if (event.dataJson) {
          try {
            const eventData = event.dataJson as any;

            // For photo events, provide R2 URL if available
            if (event.eventType === 'PHOTO_UPLOADED' && eventData.photoR2Key) {
              // Construct public R2 URL - assumes public bucket configuration
              // Note: This will need to be adjusted based on actual R2 bucket setup
              sanitizedEvent.photoUrl = eventData.photoR2Key; // Store R2 key for now
              if (eventData.photoType) {
                sanitizedEvent.photoType = eventData.photoType;
              }
              if (eventData.caption) {
                sanitizedEvent.caption = eventData.caption;
              }
            }

            // For status updates, include status information
            if (event.eventType === 'STATUS_UPDATE') {
              if (eventData.newStatus) {
                sanitizedEvent.newStatus = eventData.newStatus;
              }
              if (eventData.reason) {
                sanitizedEvent.reason = eventData.reason;
              }
            }

            // For notes, include note content
            if (event.eventType === 'NOTE_ADDED' && eventData.note) {
              sanitizedEvent.note = eventData.note;
              sanitizedEvent.author = eventData.author || 'Unknown';
            }
          } catch (eventDataError) {
            console.warn(
              `[Order Tracking] Failed to parse event data for order ${orderId}, event ${event.eventType}:`,
              eventDataError,
            );
          }
        }

        return sanitizedEvent;
      });

      // Calculate estimated delivery time if possible
      let estimatedDeliveryTime = undefined;
      if (orderTrackingDetails.scheduledAt) {
        // For scheduled orders, use scheduled time as estimated pickup
        // Delivery time could be calculated based on service configuration
        estimatedDeliveryTime = orderTrackingDetails.scheduledAt.getTime();
      }

      // Prepare response data
      const responseData = {
        orderId,
        status: orderTrackingDetails.status,
        serviceName: orderTrackingDetails.service.name,
        pickupAddress,
        dropoffAddress,
        ...(sanitizedDriverInfo && { driverInfo: sanitizedDriverInfo }),
        orderEvents: sanitizedEvents,
        estimatedCost: orderTrackingDetails.estimatedCost,
        ...(orderTrackingDetails.finalCost && { finalCost: orderTrackingDetails.finalCost }),
        createdAt: orderTrackingDetails.createdAt.getTime(),
        ...(orderTrackingDetails.updatedAt && {
          updatedAt: orderTrackingDetails.updatedAt.getTime(),
        }),
        ...(estimatedDeliveryTime && { estimatedDeliveryTime }),
      };

      console.log(`[Order Tracking] Successfully retrieved tracking details for order: ${orderId}`);

      return c.json({
        success: true,
        data: responseData,
      });
    } catch (error) {
      console.error('[Order Tracking] Unexpected error:', error);

      return c.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to retrieve order tracking information.',
          },
        },
        500,
      );
    }
  },
);

export default orderPlacementRoutes;
