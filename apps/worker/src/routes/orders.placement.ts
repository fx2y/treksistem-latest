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
import { eq, and } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { services, mitras, orders, orderEvents } from '@treksistem/db-schema';
import { 
  OrderPlacementPayloadSchema, 
  ServiceConfigBaseSchema, 
  AddressDetailSchema,
  type OrderPlacementPayload,
  type ServiceConfigBase 
} from '@treksistem/shared-types';
import type { AppContext } from '../types';
import { 
  calculateOrderCost, 
  validateTalanganAmount,
  validateSelectedMuatan,
  validateSelectedFasilitas,
  CostCalculationError 
} from '../utils/cost-calculation';
import { 
  evaluateOrderTrustMechanisms,
  validateOrdererIdentifier,
  generateTrustEventData,
  formatTrustSummary,
  TrustMechanismError 
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
orderPlacementRoutes.post(
  '/',
  zValidator('json', OrderPlacementPayloadSchema),
  async (c) => {
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
        .where(and(
          eq(services.id, payload.serviceId),
          eq(services.isActive, true)
        ))
        .limit(1);

      if (serviceWithMitra.length === 0) {
        return c.json({
          success: false,
          error: {
            code: 'SERVICE_NOT_FOUND',
            message: 'Service not found or inactive',
          },
        }, 404);
      }

      const serviceData = serviceWithMitra[0];

      // === 2. Parse and Validate Service Configuration ===
      let serviceConfig: ServiceConfigBase;
      try {
        serviceConfig = ServiceConfigBaseSchema.parse(serviceData.configJson);
      } catch (parseError) {
        console.error('[Order Placement] Invalid service config:', serviceData.serviceId, parseError);
        return c.json({
          success: false,
          error: {
            code: 'INVALID_SERVICE_CONFIG',
            message: 'Service configuration is invalid',
          },
        }, 500);
      }

      // Check if service accepts public orders
      if (serviceConfig.modelBisnis !== 'PUBLIC_3RD_PARTY' && serviceConfig.modelBisnis !== 'USAHA_SENDIRI') {
        return c.json({
          success: false,
          error: {
            code: 'SERVICE_NOT_AVAILABLE',
            message: 'Service is not available for public ordering',
          },
        }, 403);
      }

      console.log(`[Order Placement] Service config validated for: ${serviceData.serviceName}`);

      // === 3. Validate Order Payload Against Service Configuration ===
      
      // Validate addresses
      try {
        AddressDetailSchema.parse(payload.details.pickupAddress);
        AddressDetailSchema.parse(payload.details.dropoffAddress);
      } catch (addressError) {
        return c.json({
          success: false,
          error: {
            code: 'INVALID_ADDRESS',
            message: 'Invalid pickup or dropoff address format',
            details: addressError,
          },
        }, 400);
      }

      // Validate orderer identifier
      try {
        validateOrdererIdentifier(payload.ordererIdentifier);
      } catch (error) {
        if (error instanceof TrustMechanismError) {
          return c.json({
            success: false,
            error: {
              code: error.code,
              message: error.message,
              details: error.details,
            },
          }, 400);
        }
        throw error;
      }

      // Validate talangan amount
      try {
        validateTalanganAmount(serviceConfig, payload.talanganAmount);
      } catch (error) {
        if (error instanceof CostCalculationError) {
          return c.json({
            success: false,
            error: {
              code: error.code,
              message: error.message,
              details: error.details,
            },
          }, 400);
        }
        throw error;
      }

      // Validate selected muatan
      try {
        validateSelectedMuatan(serviceConfig, payload.details.selectedMuatanId);
      } catch (error) {
        if (error instanceof CostCalculationError) {
          return c.json({
            success: false,
            error: {
              code: error.code,
              message: error.message,
              details: error.details,
            },
          }, 400);
        }
        throw error;
      }

      // Validate selected facilities
      try {
        validateSelectedFasilitas(serviceConfig, payload.details.selectedFasilitasIds);
      } catch (error) {
        if (error instanceof CostCalculationError) {
          return c.json({
            success: false,
            error: {
              code: error.code,
              message: error.message,
              details: error.details,
            },
          }, 400);
        }
        throw error;
      }

      console.log('[Order Placement] Payload validation completed');

      // === 4. Calculate Estimated Cost ===
      let costBreakdown;
      try {
        costBreakdown = await calculateOrderCost(serviceConfig, payload.details);
        console.log(`[Order Placement] Cost calculated: Rp ${costBreakdown.totalCost.toLocaleString()}`);
      } catch (error) {
        if (error instanceof CostCalculationError) {
          return c.json({
            success: false,
            error: {
              code: error.code,
              message: error.message,
              details: error.details,
            },
          }, 400);
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
          return c.json({
            success: false,
            error: {
              code: error.code,
              message: error.message,
              details: error.details,
            },
          }, 400);
        }
        throw error;
      }

      // === 7. Create Order and Events in Transaction ===
      const transactionResult = await db.transaction(async (tx) => {
        // Insert order
        const [createdOrder] = await tx.insert(orders).values({
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
        }).returning();

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
          ...(costBreakdown.metadata.distanceKm && { distance_km: costBreakdown.metadata.distanceKm }),
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

      return c.json({
        success: true,
        data: response,
        message: 'Order placed successfully',
      }, 201);

    } catch (error) {
      console.error('[Order Placement] Unexpected error:', error);
      
      return c.json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred while placing the order',
        },
      }, 500);
    }
  }
);

/**
 * GET /cost-estimate
 * Get cost estimate for an order without creating it
 * 
 * This endpoint allows users to get cost estimates before committing to place an order.
 * Useful for UI that shows estimated costs as users fill out order forms.
 */
orderPlacementRoutes.post(
  '/cost-estimate',
  zValidator('json', OrderPlacementPayloadSchema.pick({ 
    serviceId: true, 
    details: true, 
    talanganAmount: true 
  })),
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
        .where(and(
          eq(services.id, payload.serviceId),
          eq(services.isActive, true)
        ))
        .limit(1);

      if (serviceResult.length === 0) {
        return c.json({
          success: false,
          error: {
            code: 'SERVICE_NOT_FOUND',
            message: 'Service not found or inactive',
          },
        }, 404);
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
        return c.json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
          },
        }, 400);
      }

      console.error('[Cost Estimate] Unexpected error:', error);
      return c.json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to calculate cost estimate',
        },
      }, 500);
    }
  }
);

export default orderPlacementRoutes; 