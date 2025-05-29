// Entity types and schemas will be defined here
import { z } from 'zod';
import { ServiceConfigBaseSchema, DriverConfigSchema } from './service-config-types';
import { OrderStatusSchema, PhoneNumberSchema } from './order-types';

/**
 * CUID Schema for consistent ID validation
 */
export const CuidSchema = z.string().min(1, "ID cannot be empty");

/**
 * Timestamp Schema for consistent timestamp handling
 */
export const TimestampSchema = z.number().int().positive();

/**
 * Mitra Entity Schema
 * Represents a logistics service provider
 */
export const MitraSchema = z.object({
  /** Unique Mitra ID (CUID) */
  id: CuidSchema,
  /** Owner user ID from auth system */
  ownerUserId: z.string().min(1, "Owner user ID is required"),
  /** Mitra business name */
  name: z.string().min(1, "Mitra name is required"),
  /** Contact information */
  contactInfo: z.object({
    phone: PhoneNumberSchema.optional(),
    email: z.string().email().optional(),
    address: z.string().optional(),
  }).optional(),
  /** Business registration details */
  businessInfo: z.object({
    registrationNumber: z.string().optional(),
    businessType: z.enum(['INDIVIDUAL', 'PT', 'CV', 'KOPERASI', 'OTHER']).optional(),
    description: z.string().optional(),
  }).optional(),
  /** Mitra status */
  isActive: z.boolean().default(true),
  /** Creation timestamp */
  createdAt: TimestampSchema,
  /** Last update timestamp */
  updatedAt: TimestampSchema.optional(),
});

export type Mitra = z.infer<typeof MitraSchema>;

/**
 * Service Entity Schema
 * Represents a specific service offered by a Mitra
 */
export const ServiceSchema = z.object({
  /** Unique Service ID (CUID) */
  id: CuidSchema,
  /** ID of the Mitra offering this service */
  mitraId: CuidSchema,
  /** User-facing service name */
  name: z.string().min(1, "Service name is required"),
  /** Core service type identifier */
  serviceType: z.string().min(1, "Service type is required"),
  /** Detailed service configuration (JSON) */
  configJson: ServiceConfigBaseSchema,
  /** Whether service is currently active */
  isActive: z.boolean().default(true),
  /** Creation timestamp */
  createdAt: TimestampSchema,
  /** Last update timestamp */
  updatedAt: TimestampSchema.optional(),
});

export type Service = z.infer<typeof ServiceSchema>;

/**
 * Create Service Payload Schema
 * Used for creating new services via API
 */
export const CreateServicePayloadSchema = z.object({
  /** User-facing service name */
  name: z.string().min(3, "Service name must be at least 3 characters").max(100, "Service name must be at most 100 characters"),
  /** Core service type identifier */
  serviceTypeKey: z.string().min(1, "Service type key is required"),
  /** Detailed service configuration */
  configJson: ServiceConfigBaseSchema,
  /** Whether service is currently active */
  isActive: z.boolean().optional().default(true),
});

export type CreateServicePayload = z.infer<typeof CreateServicePayloadSchema>;

/**
 * Driver Entity Schema
 * Represents a driver working for a Mitra
 */
export const DriverSchema = z.object({
  /** Unique Driver ID (CUID) */
  id: CuidSchema,
  /** ID of the Mitra this driver belongs to */
  mitraId: CuidSchema,
  /** Driver identifier (email, phone, or unique ID) */
  identifier: z.string().min(1, "Driver identifier is required"),
  /** Driver's full name */
  name: z.string().min(1, "Driver name is required"),
  /** Driver contact information */
  contactInfo: z.object({
    phone: PhoneNumberSchema.optional(),
    email: z.string().email().optional(),
    emergencyContact: PhoneNumberSchema.optional(),
  }).optional(),
  /** Driver configuration (vehicle, capabilities, etc.) */
  configJson: DriverConfigSchema.optional(),
  /** Whether driver is currently active */
  isActive: z.boolean().default(true),
  /** Current location (for active drivers) */
  currentLocation: z.object({
    lat: z.number().min(-90).max(90),
    lon: z.number().min(-180).max(180),
    accuracy: z.number().min(0).optional(),
    lastUpdated: TimestampSchema,
  }).optional(),
  /** Driver availability status */
  availability: z.enum(['AVAILABLE', 'BUSY', 'OFFLINE']).default('OFFLINE'),
  /** Creation timestamp */
  createdAt: TimestampSchema,
  /** Last update timestamp */
  updatedAt: TimestampSchema.optional(),
});

export type Driver = z.infer<typeof DriverSchema>;

/**
 * Driver Service Assignment Schema
 * Junction table for driver-service relationships
 */
export const DriverServiceSchema = z.object({
  /** Driver ID */
  driverId: CuidSchema,
  /** Service ID */
  serviceId: CuidSchema,
  /** Assignment timestamp */
  assignedAt: TimestampSchema,
  /** Whether assignment is currently active */
  isActive: z.boolean().default(true),
});

export type DriverService = z.infer<typeof DriverServiceSchema>;

/**
 * Order Entity Schema
 * Represents a customer order
 */
export const OrderSchema = z.object({
  /** Unique Order ID (CUID) */
  id: CuidSchema,
  /** ID of the service being ordered */
  serviceId: CuidSchema,
  /** ID of assigned driver (nullable until assigned) */
  driverId: CuidSchema.nullable().optional(),
  /** Customer identifier */
  ordererIdentifier: z.string().min(1, "Orderer identifier is required"),
  /** Receiver WhatsApp number for notifications */
  receiverWaNumber: PhoneNumberSchema.optional(),
  /** Order details (JSON) */
  detailsJson: z.record(z.any()),
  /** Current order status */
  status: OrderStatusSchema,
  /** Estimated cost */
  estimatedCost: z.number().min(0).optional(),
  /** Final cost */
  finalCost: z.number().min(0).optional(),
  /** Talangan amount */
  talanganAmount: z.number().min(0).optional(),
  /** Payment method */
  paymentMethod: z.enum(['CASH', 'TRANSFER', 'EWALLET']).optional(),
  /** Payment status */
  paymentStatus: z.enum(['PENDING', 'PAID', 'REFUNDED']).default('PENDING'),
  /** Whether order contains valuable items */
  isBarangPenting: z.boolean().default(false),
  /** Order priority level */
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  /** Creation timestamp */
  createdAt: TimestampSchema,
  /** Last update timestamp */
  updatedAt: TimestampSchema.optional(),
  /** Scheduled pickup time */
  scheduledPickupTime: TimestampSchema.optional(),
  /** Actual pickup time */
  actualPickupTime: TimestampSchema.optional(),
  /** Estimated delivery time */
  estimatedDeliveryTime: TimestampSchema.optional(),
  /** Actual delivery time */
  actualDeliveryTime: TimestampSchema.optional(),
});

export type Order = z.infer<typeof OrderSchema>;

/**
 * Order Event Entity Schema
 * Represents events in an order's lifecycle
 */
export const OrderEventEntitySchema = z.object({
  /** Unique Event ID (CUID) */
  id: CuidSchema,
  /** Order ID this event belongs to */
  orderId: CuidSchema,
  /** Event timestamp */
  timestamp: TimestampSchema,
  /** Event type */
  eventType: z.string().min(1, "Event type is required"),
  /** Event data (JSON) */
  dataJson: z.record(z.any()).optional(),
  /** Actor who triggered the event */
  actor: z.enum(['CUSTOMER', 'DRIVER', 'MITRA', 'SYSTEM']).optional(),
  /** Additional metadata */
  metadata: z.record(z.any()).optional(),
});

export type OrderEventEntity = z.infer<typeof OrderEventEntitySchema>;

/**
 * User Profile Schema
 * Basic user information for different user types
 */
export const UserProfileSchema = z.object({
  /** User ID */
  id: z.string().min(1, "User ID is required"),
  /** User type */
  userType: z.enum(['CUSTOMER', 'DRIVER', 'MITRA_ADMIN', 'SYSTEM_ADMIN']),
  /** Display name */
  name: z.string().min(1, "Name is required"),
  /** Contact information */
  contactInfo: z.object({
    phone: PhoneNumberSchema.optional(),
    email: z.string().email().optional(),
  }).optional(),
  /** User preferences */
  preferences: z.object({
    language: z.enum(['id', 'en']).default('id'),
    notifications: z.object({
      email: z.boolean().default(true),
      sms: z.boolean().default(true),
      whatsapp: z.boolean().default(true),
    }).optional(),
  }).optional(),
  /** User status */
  isActive: z.boolean().default(true),
  /** Creation timestamp */
  createdAt: TimestampSchema,
  /** Last login timestamp */
  lastLoginAt: TimestampSchema.optional(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

/**
 * Notification Schema
 * System notifications
 */
export const NotificationSchema = z.object({
  /** Notification ID */
  id: CuidSchema,
  /** Recipient user ID */
  userId: z.string().min(1, "User ID is required"),
  /** Notification type */
  type: z.enum(['ORDER_UPDATE', 'DRIVER_ASSIGNMENT', 'PAYMENT_REMINDER', 'SYSTEM_ALERT']),
  /** Notification title */
  title: z.string().min(1, "Title is required"),
  /** Notification message */
  message: z.string().min(1, "Message is required"),
  /** Notification data */
  data: z.record(z.any()).optional(),
  /** Delivery channels */
  channels: z.array(z.enum(['IN_APP', 'EMAIL', 'SMS', 'WHATSAPP'])),
  /** Read status */
  isRead: z.boolean().default(false),
  /** Delivery status */
  deliveryStatus: z.enum(['PENDING', 'SENT', 'DELIVERED', 'FAILED']).default('PENDING'),
  /** Creation timestamp */
  createdAt: TimestampSchema,
  /** Read timestamp */
  readAt: TimestampSchema.optional(),
});

export type Notification = z.infer<typeof NotificationSchema>;

/**
 * Common ID types for type safety
 */
export type MitraId = string;
export type ServiceId = string;
export type DriverId = string;
export type OrderId = string;
export type UserId = string; 