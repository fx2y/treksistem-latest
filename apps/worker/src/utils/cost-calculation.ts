/**
 * Order Cost Calculation Utilities
 * 
 * This module provides comprehensive cost calculation functionality for orders based on
 * service configuration. Implements pricing rules from RFC-TREK-CONFIG-001 and supports
 * multiple pricing models including distance-based, zone-based, and per-item pricing.
 * 
 * @see RFC-TREK-CONFIG-001 for service configuration structure
 * @see RFC-TREK-ORDER-001 for order placement requirements
 */

import type { ServiceConfigBase, OrderDetailsBase, AddressDetail } from '@treksistem/shared-types';
import { calculateHaversineDistance, calculateOrderDistance } from './geo';

/**
 * Cost breakdown interface for transparency and debugging
 */
export interface CostBreakdown {
  adminFee: number;
  distanceCost: number;
  zoneCost: number;
  perItemCost: number;
  muatanHandlingFees: number;
  facilitiesFees: number;
  subtotal: number;
  totalCost: number;
  breakdown: Array<{
    description: string;
    amount: number;
  }>;
  metadata: {
    calculationMethod: string;
    distanceKm?: number;
    appliedZone?: string;
    itemCount?: number;
  };
}

/**
 * Cost calculation error for specific business rule violations
 */
export class CostCalculationError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'CostCalculationError';
  }
}

/**
 * Calculates estimated cost for an order based on service configuration
 * 
 * @param serviceConfig Service configuration with pricing rules
 * @param orderDetails Order details including addresses and selections
 * @returns Promise resolving to detailed cost breakdown
 * 
 * @throws CostCalculationError for business rule violations or missing data
 */
export async function calculateOrderCost(
  serviceConfig: ServiceConfigBase,
  orderDetails: OrderDetailsBase
): Promise<CostBreakdown> {
  const breakdown: CostBreakdown = {
    adminFee: 0,
    distanceCost: 0,
    zoneCost: 0,
    perItemCost: 0,
    muatanHandlingFees: 0,
    facilitiesFees: 0,
    subtotal: 0,
    totalCost: 0,
    breakdown: [],
    metadata: {
      calculationMethod: 'unknown',
    },
  };

  // 1. Admin fee (always applied)
  breakdown.adminFee = serviceConfig.pricing.biayaAdminPerOrder;
  breakdown.breakdown.push({
    description: 'Biaya Admin',
    amount: breakdown.adminFee,
  });

  // 2. Distance-based or zone-based cost
  await calculateLocationBasedCost(serviceConfig, orderDetails, breakdown);

  // 3. Per-item cost (if applicable)
  calculatePerItemCost(serviceConfig, orderDetails, breakdown);

  // 4. Muatan (cargo) handling fees
  calculateMuatanHandlingFees(serviceConfig, orderDetails, breakdown);

  // 5. Facilities fees
  calculateFacilitiesFees(serviceConfig, orderDetails, breakdown);

  // 6. Calculate totals
  breakdown.subtotal = breakdown.adminFee + breakdown.distanceCost + breakdown.zoneCost + 
                      breakdown.perItemCost + breakdown.muatanHandlingFees + breakdown.facilitiesFees;
  breakdown.totalCost = breakdown.subtotal;

  return breakdown;
}

/**
 * Calculates distance-based or zone-based cost
 */
async function calculateLocationBasedCost(
  serviceConfig: ServiceConfigBase,
  orderDetails: OrderDetailsBase,
  breakdown: CostBreakdown
): Promise<void> {
  const { pricing } = serviceConfig;

  if (pricing.modelHargaJarak === 'PER_KM') {
    if (!pricing.biayaPerKm) {
      throw new CostCalculationError(
        'Per-km pricing enabled but biayaPerKm not configured',
        'INVALID_PRICING_CONFIG'
      );
    }

    // Calculate distance using geo utility
    const distanceResult = await calculateOrderDistance(
      orderDetails.pickupAddress,
      orderDetails.dropoffAddress
    );

    if (!distanceResult) {
      throw new CostCalculationError(
        'Distance calculation requires valid coordinates for both pickup and dropoff addresses',
        'MISSING_COORDINATES',
        {
          pickupHasCoords: hasValidCoordinates(orderDetails.pickupAddress),
          dropoffHasCoords: hasValidCoordinates(orderDetails.dropoffAddress),
        }
      );
    }

    breakdown.distanceCost = distanceResult.distanceKm * pricing.biayaPerKm;
    breakdown.metadata.calculationMethod = 'per_km';
    breakdown.metadata.distanceKm = distanceResult.distanceKm;
    
    breakdown.breakdown.push({
      description: `Biaya Jarak (${distanceResult.distanceKm.toFixed(2)} km × Rp ${pricing.biayaPerKm.toLocaleString()})`,
      amount: breakdown.distanceCost,
    });

    // Check service coverage limits
    if (serviceConfig.jangkauanLayanan.maxDistanceKm && 
        distanceResult.distanceKm > serviceConfig.jangkauanLayanan.maxDistanceKm) {
      throw new CostCalculationError(
        `Distance ${distanceResult.distanceKm.toFixed(2)} km exceeds service coverage limit of ${serviceConfig.jangkauanLayanan.maxDistanceKm} km`,
        'DISTANCE_EXCEEDS_COVERAGE',
        {
          calculatedDistance: distanceResult.distanceKm,
          maxDistance: serviceConfig.jangkauanLayanan.maxDistanceKm,
        }
      );
    }

  } else if (pricing.modelHargaJarak === 'ZONA_ASAL_TUJUAN') {
    if (!pricing.zonaHarga || pricing.zonaHarga.length === 0) {
      throw new CostCalculationError(
        'Zone-based pricing enabled but zonaHarga not configured',
        'INVALID_PRICING_CONFIG'
      );
    }

    // For MVP, implement simple text-based zone matching
    // In production, this would use geofencing or more sophisticated zone detection
    const pickupZone = extractZoneFromAddress(orderDetails.pickupAddress);
    const dropoffZone = extractZoneFromAddress(orderDetails.dropoffAddress);

    const zonePrice = pricing.zonaHarga.find(zone => 
      zone.asalZona.toLowerCase() === pickupZone.toLowerCase() &&
      zone.tujuanZona.toLowerCase() === dropoffZone.toLowerCase()
    );

    if (!zonePrice) {
      throw new CostCalculationError(
        `No zone pricing found for route: ${pickupZone} → ${dropoffZone}`,
        'ZONE_PRICE_NOT_FOUND',
        {
          pickupZone,
          dropoffZone,
          availableZones: pricing.zonaHarga.map(z => `${z.asalZona} → ${z.tujuanZona}`),
        }
      );
    }

    breakdown.zoneCost = zonePrice.harga;
    breakdown.metadata.calculationMethod = 'zone_based';
    breakdown.metadata.appliedZone = `${pickupZone} → ${dropoffZone}`;
    
    breakdown.breakdown.push({
      description: `Biaya Zona (${pickupZone} → ${dropoffZone})`,
      amount: breakdown.zoneCost,
    });
  }
}

/**
 * Calculates per-item cost if applicable
 */
function calculatePerItemCost(
  serviceConfig: ServiceConfigBase,
  orderDetails: OrderDetailsBase,
  breakdown: CostBreakdown
): void {
  const { pricing } = serviceConfig;

  if (pricing.modelHargaMuatanPcs === 'PER_PCS' && pricing.biayaPerPcs) {
    // Extract item count from order details (this field might be dynamic based on service type)
    const itemCount = extractItemCount(orderDetails);
    
    if (itemCount > 0) {
      breakdown.perItemCost = itemCount * pricing.biayaPerPcs;
      breakdown.metadata.itemCount = itemCount;
      
      breakdown.breakdown.push({
        description: `Biaya Per Item (${itemCount} × Rp ${pricing.biayaPerPcs.toLocaleString()})`,
        amount: breakdown.perItemCost,
      });
    }
  }
}

/**
 * Calculates muatan (cargo) handling fees
 */
function calculateMuatanHandlingFees(
  serviceConfig: ServiceConfigBase,
  orderDetails: OrderDetailsBase,
  breakdown: CostBreakdown
): void {
  if (!orderDetails.selectedMuatanId || !serviceConfig.allowedMuatan) {
    return;
  }

  const selectedMuatan = serviceConfig.allowedMuatan.find(
    muatan => muatan.muatanId === orderDetails.selectedMuatanId
  );

  if (selectedMuatan && selectedMuatan.biayaHandlingTambahan) {
    breakdown.muatanHandlingFees = selectedMuatan.biayaHandlingTambahan;
    
    breakdown.breakdown.push({
      description: `Biaya Handling ${selectedMuatan.namaTampil}`,
      amount: breakdown.muatanHandlingFees,
    });
  }
}

/**
 * Calculates facilities fees
 */
function calculateFacilitiesFees(
  serviceConfig: ServiceConfigBase,
  orderDetails: OrderDetailsBase,
  breakdown: CostBreakdown
): void {
  if (!orderDetails.selectedFasilitasIds || !serviceConfig.availableFasilitas) {
    return;
  }

  let totalFacilitiesFees = 0;

  for (const fasilitasId of orderDetails.selectedFasilitasIds) {
    const selectedFasilitas = serviceConfig.availableFasilitas.find(
      fasilitas => fasilitas.fasilitasId === fasilitasId
    );

    if (selectedFasilitas && selectedFasilitas.biayaFasilitasTambahan) {
      totalFacilitiesFees += selectedFasilitas.biayaFasilitasTambahan;
      
      breakdown.breakdown.push({
        description: `Fasilitas ${selectedFasilitas.namaTampil}`,
        amount: selectedFasilitas.biayaFasilitasTambahan,
      });
    }
  }

  breakdown.facilitiesFees = totalFacilitiesFees;
}

/**
 * Validates talangan (advance payment) amount against service limits
 */
export function validateTalanganAmount(
  serviceConfig: ServiceConfigBase,
  talanganAmount?: number
): void {
  if (!talanganAmount || talanganAmount <= 0) {
    return; // No talangan requested
  }

  if (!serviceConfig.fiturTalangan.enabled) {
    throw new CostCalculationError(
      'Talangan feature is not enabled for this service',
      'TALANGAN_NOT_ENABLED'
    );
  }

  if (serviceConfig.fiturTalangan.maxAmount && 
      talanganAmount > serviceConfig.fiturTalangan.maxAmount) {
    throw new CostCalculationError(
      `Talangan amount Rp ${talanganAmount.toLocaleString()} exceeds maximum limit of Rp ${serviceConfig.fiturTalangan.maxAmount.toLocaleString()}`,
      'TALANGAN_EXCEEDS_LIMIT',
      {
        requestedAmount: talanganAmount,
        maxAmount: serviceConfig.fiturTalangan.maxAmount,
      }
    );
  }
}

/**
 * Validates selected muatan against service configuration
 */
export function validateSelectedMuatan(
  serviceConfig: ServiceConfigBase,
  selectedMuatanId?: string
): void {
  if (!selectedMuatanId) {
    return; // No muatan selected
  }

  if (!serviceConfig.allowedMuatan || serviceConfig.allowedMuatan.length === 0) {
    throw new CostCalculationError(
      'This service does not support muatan selection',
      'MUATAN_NOT_SUPPORTED'
    );
  }

  const isValidMuatan = serviceConfig.allowedMuatan.some(
    muatan => muatan.muatanId === selectedMuatanId
  );

  if (!isValidMuatan) {
    throw new CostCalculationError(
      `Selected muatan '${selectedMuatanId}' is not available for this service`,
      'INVALID_MUATAN_SELECTION',
      {
        selectedMuatan: selectedMuatanId,
        availableMuatan: serviceConfig.allowedMuatan.map(m => m.muatanId),
      }
    );
  }
}

/**
 * Validates selected facilities against service configuration
 */
export function validateSelectedFasilitas(
  serviceConfig: ServiceConfigBase,
  selectedFasilitasIds?: string[]
): void {
  if (!selectedFasilitasIds || selectedFasilitasIds.length === 0) {
    return; // No facilities selected
  }

  if (!serviceConfig.availableFasilitas || serviceConfig.availableFasilitas.length === 0) {
    throw new CostCalculationError(
      'This service does not support facility selection',
      'FASILITAS_NOT_SUPPORTED'
    );
  }

  const availableFasilitasIds = serviceConfig.availableFasilitas.map(f => f.fasilitasId);
  const invalidFasilitas = selectedFasilitasIds.filter(
    id => !availableFasilitasIds.includes(id)
  );

  if (invalidFasilitas.length > 0) {
    throw new CostCalculationError(
      `Selected facilities not available for this service: ${invalidFasilitas.join(', ')}`,
      'INVALID_FASILITAS_SELECTION',
      {
        invalidFasilitas,
        selectedFasilitas: selectedFasilitasIds,
        availableFasilitas: availableFasilitasIds,
      }
    );
  }
}

// === Helper Functions ===

/**
 * Checks if an address has valid coordinates
 */
function hasValidCoordinates(address: AddressDetail): boolean {
  return (
    address.lat !== null &&
    address.lat !== undefined &&
    address.lon !== null &&
    address.lon !== undefined &&
    typeof address.lat === 'number' &&
    typeof address.lon === 'number' &&
    address.lat >= -90 &&
    address.lat <= 90 &&
    address.lon >= -180 &&
    address.lon <= 180
  );
}

/**
 * Extracts zone from address text (MVP implementation)
 * In production, this would use geofencing or external geocoding services
 */
function extractZoneFromAddress(address: AddressDetail): string {
  // Simple keyword-based zone extraction for MVP
  const text = address.text.toLowerCase();
  
  // Common Indonesian city/area patterns
  if (text.includes('malang kota') || text.includes('kota malang')) return 'MALANG_KOTA';
  if (text.includes('malang') && !text.includes('kota')) return 'KAB_MALANG';
  if (text.includes('batu')) return 'KOTA_BATU';
  if (text.includes('jakarta')) return 'JAKARTA';
  if (text.includes('bandung')) return 'BANDUNG';
  if (text.includes('surabaya')) return 'SURABAYA';
  
  // Default to the first significant word as zone
  const words = text.split(/\s+/).filter(word => word.length > 3);
  return words[0]?.toUpperCase() || 'UNKNOWN_ZONE';
}

/**
 * Extracts item count from order details (dynamic field)
 */
function extractItemCount(orderDetails: OrderDetailsBase): number {
  // Check common field names that might contain item count
  const details = orderDetails as any;
  
  return details.quantity || 
         details.itemCount || 
         details.jumlahBarang || 
         details.pieces || 
         1; // Default to 1 item if not specified
} 