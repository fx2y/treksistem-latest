import { z } from 'zod';

/**
 * Address Detail Schema
 * Represents pickup or dropoff address information
 */
export const AddressDetailSchema = z.object({
  /** Human-readable address text */
  text: z.string().min(1, 'Address text is required'),
  /** Latitude coordinate */
  lat: z.number().min(-90).max(90).nullable().optional(),
  /** Longitude coordinate */
  lon: z.number().min(-180).max(180).nullable().optional(),
  /** Additional notes or landmarks */
  notes: z.string().optional(),
});

export type AddressDetail = z.infer<typeof AddressDetailSchema>;

/**
 * Phone Number Schema with Indonesian format validation
 */
export const PhoneNumberSchema = z
  .string()
  .min(10, 'Phone number too short')
  .max(15, 'Phone number too long')
  .regex(/^(\+62|62|0)[0-9]{8,13}$/, 'Invalid Indonesian phone number format');

/**
 * Order Details Base Schema
 * Core information for any order type
 */
export const OrderDetailsBaseSchema = z.object({
  /** Pickup location */
  pickupAddress: AddressDetailSchema,
  /** Dropoff location */
  dropoffAddress: AddressDetailSchema,
  /** General order notes from customer */
  notes: z.string().optional(),
  /** Selected cargo/load type ID */
  selectedMuatanId: z.string().optional(),
  /** Selected facility IDs */
  selectedFasilitasIds: z.array(z.string()).optional(),
  /** Scheduled pickup time (for non-express orders) */
  scheduledPickupTime: z.string().datetime().optional(),
  /** Special instructions for driver */
  driverInstructions: z.string().optional(),
});

export type OrderDetailsBase = z.infer<typeof OrderDetailsBaseSchema>;

/**
 * Order Placement Payload Schema
 * Data sent when creating a new order
 */
export const OrderPlacementPayloadSchema = z.object({
  /** ID of the service being ordered */
  serviceId: z.string().min(1, 'Service ID is required'),
  /** Customer identifier (usually phone number) */
  ordererIdentifier: PhoneNumberSchema,
  /** Receiver WhatsApp number for notifications */
  receiverWaNumber: PhoneNumberSchema.optional(),
  /** Order details */
  details: OrderDetailsBaseSchema,
  /** Talangan (advance payment) amount if applicable */
  talanganAmount: z.number().min(0).optional(),
  /** Whether this order contains important/valuable items */
  isBarangPenting: z.boolean().default(false),
  /** Selected payment method */
  paymentMethod: z.enum(['CASH', 'TRANSFER', 'EWALLET']).default('CASH'),
});

export type OrderPlacementPayload = z.infer<typeof OrderPlacementPayloadSchema>;

/**
 * Order Status Enum
 * All possible states of an order
 */
export const OrderStatusSchema = z.enum([
  'PENDING',
  'ACCEPTED_BY_MITRA',
  'PENDING_DRIVER_ASSIGNMENT',
  'DRIVER_ASSIGNED',
  'REJECTED_BY_DRIVER',
  'ACCEPTED_BY_DRIVER',
  'DRIVER_AT_PICKUP',
  'PICKED_UP',
  'IN_TRANSIT',
  'DRIVER_AT_DROPOFF',
  'DELIVERED',
  'CANCELLED_BY_USER',
  'CANCELLED_BY_MITRA',
  'CANCELLED_BY_DRIVER',
  'FAILED_DELIVERY',
  'REFUNDED',
]);

export type OrderStatus = z.infer<typeof OrderStatusSchema>;

/**
 * Order Event Type Schema
 * Different types of events that can occur in an order
 */
export const OrderEventTypeSchema = z.enum([
  'STATUS_UPDATE',
  'PHOTO_UPLOADED',
  'LOCATION_UPDATE',
  'NOTE_ADDED',
  'PAYMENT_UPDATE',
  'ASSIGNMENT_CHANGED',
  'COST_UPDATED',
]);

export type OrderEventType = z.infer<typeof OrderEventTypeSchema>;

/**
 * Order Event Data Schema
 * Event-specific data stored in order_events.dataJson
 */
export const OrderEventDataSchema = z.discriminatedUnion('eventType', [
  z.object({
    eventType: z.literal('STATUS_UPDATE'),
    oldStatus: OrderStatusSchema.optional(),
    newStatus: OrderStatusSchema,
    reason: z.string().optional(),
  }),
  z.object({
    eventType: z.literal('PHOTO_UPLOADED'),
    photoR2Key: z.string().min(1, 'Photo R2 key is required'),
    photoType: z.enum(['PICKUP_PROOF', 'DELIVERY_PROOF', 'CONDITION_PROOF']),
    caption: z.string().optional(),
  }),
  z.object({
    eventType: z.literal('LOCATION_UPDATE'),
    lat: z.number().min(-90).max(90),
    lon: z.number().min(-180).max(180),
    accuracy: z.number().min(0).optional(),
    heading: z.number().min(0).max(360).optional(),
  }),
  z.object({
    eventType: z.literal('NOTE_ADDED'),
    note: z.string().min(1, 'Note cannot be empty'),
    author: z.enum(['CUSTOMER', 'DRIVER', 'MITRA', 'SYSTEM']),
  }),
  z.object({
    eventType: z.literal('PAYMENT_UPDATE'),
    oldAmount: z.number().optional(),
    newAmount: z.number().min(0),
    paymentMethod: z.enum(['CASH', 'TRANSFER', 'EWALLET']).optional(),
  }),
  z.object({
    eventType: z.literal('ASSIGNMENT_CHANGED'),
    oldDriverId: z.string().optional(),
    newDriverId: z.string().optional(),
    reason: z.string().optional(),
  }),
  z.object({
    eventType: z.literal('COST_UPDATED'),
    oldCost: z.number().optional(),
    newCost: z.number().min(0),
    reason: z.string().optional(),
  }),
]);

export type OrderEventData = z.infer<typeof OrderEventDataSchema>;

/**
 * Order Event Schema
 * Complete order event structure
 */
export const OrderEventSchema = z.object({
  /** Event ID */
  id: z.string().min(1),
  /** Order ID this event belongs to */
  orderId: z.string().min(1),
  /** Event timestamp */
  timestamp: z.number().int().positive(),
  /** Event type */
  eventType: OrderEventTypeSchema,
  /** Event-specific data */
  dataJson: OrderEventDataSchema,
});

export type OrderEvent = z.infer<typeof OrderEventSchema>;

/**
 * Public Order View Schema
 * Order information exposed to customers for tracking
 */
export const PublicOrderViewSchema = z.object({
  /** Order ID */
  id: z.string().min(1),
  /** Current status */
  status: OrderStatusSchema,
  /** Service name */
  serviceName: z.string().min(1),
  /** Mitra name */
  mitraName: z.string().min(1),
  /** Driver information (when assigned) */
  driver: z
    .object({
      name: z.string().min(1),
      phoneNumber: PhoneNumberSchema.optional(),
      vehicleInfo: z.string().optional(),
    })
    .optional(),
  /** Pickup address */
  pickupAddress: AddressDetailSchema,
  /** Dropoff address */
  dropoffAddress: AddressDetailSchema,
  /** Estimated cost */
  estimatedCost: z.number().min(0).optional(),
  /** Final cost */
  finalCost: z.number().min(0).optional(),
  /** Order creation time */
  createdAt: z.number().int().positive(),
  /** Last update time */
  updatedAt: z.number().int().positive().optional(),
  /** Recent events (limited for privacy) */
  recentEvents: z
    .array(
      z.object({
        timestamp: z.number().int().positive(),
        eventType: OrderEventTypeSchema,
        description: z.string(),
      }),
    )
    .optional(),
});

export type PublicOrderView = z.infer<typeof PublicOrderViewSchema>;

/**
 * Driver Order View Schema
 * Order information shown to drivers
 */
export const DriverOrderViewSchema = z.object({
  /** Order ID */
  id: z.string().min(1),
  /** Current status */
  status: OrderStatusSchema,
  /** Service information */
  service: z.object({
    name: z.string().min(1),
    type: z.string().min(1),
  }),
  /** Customer identifier (masked for privacy) */
  customerIdentifier: z.string().min(1),
  /** Pickup address */
  pickupAddress: AddressDetailSchema,
  /** Dropoff address */
  dropoffAddress: AddressDetailSchema,
  /** Order details relevant to driver */
  details: z.object({
    notes: z.string().optional(),
    driverInstructions: z.string().optional(),
    selectedMuatan: z.string().optional(),
    selectedFasilitas: z.array(z.string()).optional(),
  }),
  /** Expected cost */
  estimatedCost: z.number().min(0).optional(),
  /** Talangan amount if any */
  talanganAmount: z.number().min(0).optional(),
  /** Whether order contains valuable items */
  isBarangPenting: z.boolean(),
  /** Order timing */
  createdAt: z.number().int().positive(),
  scheduledPickupTime: z.number().int().positive().optional(),
});

export type DriverOrderView = z.infer<typeof DriverOrderViewSchema>;

/**
 * Order Assignment Schema
 * Information about driver assignment to an order
 */
export const OrderAssignmentSchema = z.object({
  /** Order ID */
  orderId: z.string().min(1),
  /** Driver ID */
  driverId: z.string().min(1),
  /** Assignment timestamp */
  assignedAt: z.number().int().positive(),
  /** Auto-assignment or manual */
  assignmentType: z.enum(['AUTO', 'MANUAL']),
  /** Assignment expiry time (for driver to accept) */
  expiresAt: z.number().int().positive().optional(),
});

export type OrderAssignment = z.infer<typeof OrderAssignmentSchema>;

/**
 * Order Cost Calculation Schema
 * Breakdown of order costs
 */
export const OrderCostCalculationSchema = z.object({
  /** Base service cost */
  baseCost: z.number().min(0),
  /** Distance-based cost */
  distanceCost: z.number().min(0),
  /** Admin fee */
  adminFee: z.number().min(0),
  /** Additional cargo handling fees */
  cargoHandlingFees: z.number().min(0).optional(),
  /** Facility fees */
  facilityFees: z.number().min(0).optional(),
  /** Other fees */
  otherFees: z.number().min(0).optional(),
  /** Total cost */
  totalCost: z.number().min(0),
  /** Cost calculation breakdown */
  breakdown: z
    .array(
      z.object({
        description: z.string().min(1),
        amount: z.number(),
      }),
    )
    .optional(),
});

export type OrderCostCalculation = z.infer<typeof OrderCostCalculationSchema>;
