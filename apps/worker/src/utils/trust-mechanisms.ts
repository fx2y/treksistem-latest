/**
 * Trust Mechanisms Utilities
 * 
 * This module implements trust mechanisms for sensitive orders involving talangan
 * (advance purchase by driver) or orders marked as "Barang Penting" (valuable items).
 * 
 * Based on RFC-TREK-TRUST-001, these mechanisms focus on user verification and
 * receiver notification to mitigate risks in peer-to-peer delivery scenarios.
 * 
 * @see RFC-TREK-TRUST-001 for trust mechanism requirements
 * @see RFC-TREK-ORDER-001 for order placement integration
 */

import type { ServiceConfigBase, OrderPlacementPayload } from '@treksistem/shared-types';

/**
 * Trust mechanism result interface
 */
export interface TrustMechanismResult {
  /** Whether this order requires receiver notification */
  requiresReceiverNotification: boolean;
  /** WhatsApp deep link for orderer to notify receiver */
  receiverNotificationLink?: string;
  /** Trust level classification */
  trustLevel: 'STANDARD' | 'SENSITIVE' | 'HIGH_RISK';
  /** Reason for trust classification */
  trustReason: string[];
  /** Additional verification requirements */
  verificationRequirements: string[];
}

/**
 * Trust mechanism error for business rule violations
 */
export class TrustMechanismError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'TrustMechanismError';
  }
}

/**
 * Evaluates trust requirements for an order and generates necessary mechanisms
 * 
 * @param serviceConfig Service configuration with trust settings
 * @param orderPayload Order placement payload
 * @param orderId Generated order ID for tracking
 * @returns Trust mechanism evaluation result
 * 
 * @throws TrustMechanismError if required trust conditions are not met
 */
export function evaluateOrderTrustMechanisms(
  serviceConfig: ServiceConfigBase,
  orderPayload: OrderPlacementPayload,
  orderId: string
): TrustMechanismResult {
  const result: TrustMechanismResult = {
    requiresReceiverNotification: false,
    trustLevel: 'STANDARD',
    trustReason: [],
    verificationRequirements: [],
  };

  // Check trigger conditions for trust mechanisms
  const hasTalangan = orderPayload.talanganAmount && orderPayload.talanganAmount > 0;
  const isServiceDefaultBarangPenting = serviceConfig.isBarangPentingDefault;
  const isOrderMarkedBarangPenting = orderPayload.isBarangPenting;

  // Determine if trust mechanisms are needed
  if (hasTalangan) {
    result.trustLevel = 'SENSITIVE';
    result.trustReason.push(`Talangan amount: Rp ${orderPayload.talanganAmount!.toLocaleString()}`);
    result.requiresReceiverNotification = true;
  }

  if (isServiceDefaultBarangPenting || isOrderMarkedBarangPenting) {
    result.trustLevel = result.trustLevel === 'SENSITIVE' ? 'HIGH_RISK' : 'SENSITIVE';
    result.trustReason.push('Order contains valuable/important items');
    result.requiresReceiverNotification = true;
  }

  // Validate receiver notification requirements
  if (result.requiresReceiverNotification) {
    if (!orderPayload.receiverWaNumber) {
      throw new TrustMechanismError(
        'Receiver WhatsApp number is required for orders with talangan or valuable items',
        'RECEIVER_WA_REQUIRED',
        {
          hasTalangan,
          isBarangPenting: isServiceDefaultBarangPenting || isOrderMarkedBarangPenting,
          talanganAmount: orderPayload.talanganAmount,
        }
      );
    }

    // Generate receiver notification link
    result.receiverNotificationLink = generateReceiverNotificationLink(
      orderPayload,
      orderId,
      serviceConfig.serviceTypeAlias
    );

    // Add verification requirements
    result.verificationRequirements.push(
      'Orderer must notify receiver using the provided WhatsApp link'
    );

    if (hasTalangan) {
      result.verificationRequirements.push(
        'Driver will collect advance payment (talangan) on behalf of orderer'
      );
    }

    if (isServiceDefaultBarangPenting || isOrderMarkedBarangPenting) {
      result.verificationRequirements.push(
        'Extra care required for valuable items during transport'
      );
    }
  }

  return result;
}

/**
 * Generates WhatsApp deep link for receiver notification
 * 
 * The link allows the orderer to quickly send a structured message to the receiver
 * informing them about the incoming delivery and providing tracking information.
 * 
 * @param orderPayload Order placement payload
 * @param orderId Generated order ID
 * @param serviceName Name of the service being used
 * @returns WhatsApp deep link URL
 */
export function generateReceiverNotificationLink(
  orderPayload: OrderPlacementPayload,
  orderId: string,
  serviceName: string
): string {
  if (!orderPayload.receiverWaNumber) {
    throw new TrustMechanismError(
      'Cannot generate receiver notification link without receiver WhatsApp number',
      'MISSING_RECEIVER_WA'
    );
  }

  // Clean phone number (remove + prefix for WhatsApp API)
  const cleanPhoneNumber = orderPayload.receiverWaNumber.replace(/^\+/, '');
  
  // Generate tracking URL (this should match the actual frontend URL structure)
  const trackingUrl = `https://treksistem.com/track/${orderId}`;
  
  // Determine order type description
  let orderTypeDescription = serviceName;
  if (orderPayload.talanganAmount && orderPayload.talanganAmount > 0) {
    orderTypeDescription += ` (dengan talangan Rp ${orderPayload.talanganAmount.toLocaleString()})`;
  }
  if (orderPayload.isBarangPenting) {
    orderTypeDescription += ' - Barang Penting';
  }

  // Construct notification message
  const notificationMessage = [
    `Halo! 👋`,
    ``,
    `Anda akan menerima kiriman *${orderTypeDescription}* dari ${orderPayload.ordererIdentifier} melalui platform Treksistem.`,
    ``,
    `📦 *Detail Pengiriman:*`,
    `🆔 Order ID: ${orderId}`,
    `📍 Dari: ${orderPayload.details.pickupAddress.text}`,
    `📍 Ke: ${orderPayload.details.dropoffAddress.text}`,
    ...(orderPayload.details.notes ? [`📝 Catatan: ${orderPayload.details.notes}`] : []),
    ``,
    `🔗 *Lacak Pengiriman:* ${trackingUrl}`,
    ``,
    `⚠️ *Penting:*`,
    `• Harap konfirmasi kesiapan menerima kepada pengirim`,
    `• Periksa identitas driver saat pengantaran`,
    `• Laporkan jika ada masalah melalui platform`,
    ``,
    `Terima kasih! 🙏`,
    `- Tim Treksistem`,
  ].join('\n');

  // Encode message for URL
  const encodedMessage = encodeURIComponent(notificationMessage);

  // Generate WhatsApp deep link
  return `whatsapp://send?phone=${cleanPhoneNumber}&text=${encodedMessage}`;
}

/**
 * Validates that an orderer identifier meets basic format requirements
 * 
 * This provides basic validation for orderer identification, typically phone numbers.
 * More sophisticated verification would require external APIs.
 * 
 * @param ordererIdentifier Orderer identifier to validate
 */
export function validateOrdererIdentifier(ordererIdentifier: string): void {
  if (!ordererIdentifier || ordererIdentifier.trim().length === 0) {
    throw new TrustMechanismError(
      'Orderer identifier is required',
      'MISSING_ORDERER_IDENTIFIER'
    );
  }

  // Basic phone number format validation (Indonesian format)
  const phoneRegex = /^\+?62[0-9]{8,13}$/;
  if (!phoneRegex.test(ordererIdentifier.replace(/\s|-/g, ''))) {
    // For MVP, log warning but don't block non-phone identifiers
    console.warn(`[Trust] Orderer identifier '${ordererIdentifier}' does not match expected phone format`);
  }
}

/**
 * Generates trust-related event data for order events
 * 
 * @param trustResult Trust mechanism evaluation result
 * @returns Event data object for logging trust-related actions
 */
export function generateTrustEventData(trustResult: TrustMechanismResult): Record<string, unknown> {
  return {
    trustLevel: trustResult.trustLevel,
    requiresReceiverNotification: trustResult.requiresReceiverNotification,
    trustReasons: trustResult.trustReason,
    verificationRequirements: trustResult.verificationRequirements,
    notificationLinkGenerated: !!trustResult.receiverNotificationLink,
  };
}

/**
 * Checks if an order requires enhanced verification based on service config and order details
 * 
 * @param serviceConfig Service configuration
 * @param orderPayload Order payload
 * @returns Whether enhanced verification is required
 */
export function requiresEnhancedVerification(
  serviceConfig: ServiceConfigBase,
  orderPayload: OrderPlacementPayload
): boolean {
  const hasTalangan = orderPayload.talanganAmount && orderPayload.talanganAmount > 0;
  const isBarangPenting = serviceConfig.isBarangPentingDefault || orderPayload.isBarangPenting;
  
  return hasTalangan || isBarangPenting;
}

/**
 * Formats trust mechanism summary for API responses
 * 
 * @param trustResult Trust mechanism evaluation result
 * @returns Formatted summary for client consumption
 */
export function formatTrustSummary(trustResult: TrustMechanismResult): {
  level: string;
  required_actions: string[];
  notification_required: boolean;
} {
  return {
    level: trustResult.trustLevel.toLowerCase(),
    required_actions: trustResult.verificationRequirements,
    notification_required: trustResult.requiresReceiverNotification,
  };
} 