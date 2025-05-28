/**
 * Geolocation and Distance Calculation Utilities
 * 
 * This module provides distance calculation functionality for the Treksistem platform.
 * Currently implements Haversine formula for MVP, with interface designed for future
 * integration with routing engines like OSRM or GraphHopper.
 * 
 * @see RFC-TREK-GEO-001 for geolocation requirements
 * @see RFC-TREK-COST-001 for cost optimization constraints
 */

import type { AddressDetail } from '@treksistem/shared-types';

/**
 * Point interface representing a geographic coordinate
 */
export interface Point {
  lat: number;
  lon: number;
}

/**
 * Distance calculation result
 */
export interface DistanceResult {
  /** Distance in kilometers */
  distanceKm: number;
  /** Calculation method used */
  method: 'haversine' | 'routing';
  /** Additional metadata (e.g., route duration for routing engines) */
  metadata?: Record<string, unknown>;
}

/**
 * Interface for distance calculation implementations
 * Designed to allow swapping between Haversine and routing engines
 */
export interface DistanceCalculator {
  calculate(point1: Point, point2: Point): Promise<DistanceResult>;
}

/**
 * Calculates the straight-line distance between two geographic points using the Haversine formula.
 * 
 * The Haversine formula determines the great-circle distance between two points on a sphere
 * given their latitude and longitude. This provides the shortest distance over the earth's
 * surface, but does not account for actual road routes.
 * 
 * Formula:
 * - a = sin²(Δφ/2) + cos φ1 ⋅ cos φ2 ⋅ sin²(Δλ/2)
 * - c = 2 ⋅ atan2( √a, √(1−a) )
 * - d = R ⋅ c
 * 
 * Where φ is latitude, λ is longitude, R is earth's radius (6371 km)
 * 
 * @param point1 First geographic point
 * @param point2 Second geographic point
 * @returns Distance in kilometers
 * 
 * @example
 * ```typescript
 * const london = { lat: 51.5074, lon: -0.1278 };
 * const paris = { lat: 48.8566, lon: 2.3522 };
 * const distance = calculateHaversineDistance(london, paris);
 * console.log(`Distance: ${distance.toFixed(2)} km`); // ~344.75 km
 * ```
 */
export function calculateHaversineDistance(point1: Point, point2: Point): number {
  // Validate input coordinates
  if (!isValidCoordinate(point1) || !isValidCoordinate(point2)) {
    throw new Error('Invalid coordinates provided');
  }

  // Handle same point case
  if (point1.lat === point2.lat && point1.lon === point2.lon) {
    return 0;
  }

  // Earth's radius in kilometers
  const R = 6371;

  // Convert degrees to radians
  const lat1Rad = toRadians(point1.lat);
  const lat2Rad = toRadians(point2.lat);
  const dLatRad = toRadians(point2.lat - point1.lat);
  const dLonRad = toRadians(point2.lon - point1.lon);

  // Haversine formula
  const a = Math.sin(dLatRad / 2) * Math.sin(dLatRad / 2) +
            Math.cos(lat1Rad) * Math.cos(lat2Rad) *
            Math.sin(dLonRad / 2) * Math.sin(dLonRad / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  const distance = R * c;

  return distance;
}

/**
 * Haversine-based distance calculator implementation
 * Provides async interface compatible with future routing engine integrations
 */
export class HaversineDistanceCalculator implements DistanceCalculator {
  async calculate(point1: Point, point2: Point): Promise<DistanceResult> {
    const distanceKm = calculateHaversineDistance(point1, point2);
    
    return {
      distanceKm,
      method: 'haversine',
      metadata: {
        note: 'Straight-line distance, not actual route distance',
        earthRadius: 6371
      }
    };
  }
}

/**
 * Default distance calculator instance
 * Currently uses Haversine, can be swapped for routing engine in the future
 */
export const defaultDistanceCalculator = new HaversineDistanceCalculator();

/**
 * Convenience function for calculating distance using the default calculator
 * 
 * @param point1 First geographic point
 * @param point2 Second geographic point
 * @returns Promise resolving to distance result
 */
export async function calculateDistance(point1: Point, point2: Point): Promise<DistanceResult> {
  return defaultDistanceCalculator.calculate(point1, point2);
}

// === Business Logic Integration ===

/**
 * Calculates distance between pickup and dropoff addresses from order details
 * Handles cases where coordinates might be missing
 * 
 * @param pickupAddress Pickup address details
 * @param dropoffAddress Dropoff address details
 * @returns Promise resolving to distance result or null if coordinates unavailable
 * 
 * @example
 * ```typescript
 * const pickup = { text: "Jakarta Central", lat: -6.2088, lon: 106.8456 };
 * const dropoff = { text: "Bandung", lat: -6.9175, lon: 107.6191 };
 * const result = await calculateOrderDistance(pickup, dropoff);
 * if (result) {
 *   console.log(`Order distance: ${result.distanceKm.toFixed(2)} km`);
 * }
 * ```
 */
export async function calculateOrderDistance(
  pickupAddress: AddressDetail,
  dropoffAddress: AddressDetail
): Promise<DistanceResult | null> {
  // Check if both addresses have valid coordinates
  if (!hasValidCoordinates(pickupAddress) || !hasValidCoordinates(dropoffAddress)) {
    return null;
  }

  const pickup: Point = {
    lat: pickupAddress.lat!,
    lon: pickupAddress.lon!
  };

  const dropoff: Point = {
    lat: dropoffAddress.lat!,
    lon: dropoffAddress.lon!
  };

  return calculateDistance(pickup, dropoff);
}

/**
 * Checks if an address has valid coordinates
 */
function hasValidCoordinates(address: AddressDetail): boolean {
  return (
    address.lat !== null &&
    address.lat !== undefined &&
    address.lon !== null &&
    address.lon !== undefined &&
    isValidCoordinate({ lat: address.lat, lon: address.lon })
  );
}

// === Helper Functions ===

/**
 * Converts degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Validates that a coordinate point has valid latitude and longitude values
 */
function isValidCoordinate(point: Point): boolean {
  return (
    typeof point.lat === 'number' &&
    typeof point.lon === 'number' &&
    point.lat >= -90 &&
    point.lat <= 90 &&
    point.lon >= -180 &&
    point.lon <= 180 &&
    !isNaN(point.lat) &&
    !isNaN(point.lon)
  );
}

// === Future Integration Placeholder ===

/**
 * OSRM/GraphHopper Distance Calculator (Future Implementation)
 * 
 * This class will be implemented when integrating with routing engines.
 * It will provide actual route distances instead of straight-line distances.
 * 
 * Considerations for future implementation:
 * - Use free OSRM API or self-hosted instance
 * - Implement caching for identical coordinate pairs
 * - Handle rate limiting and fallback to Haversine
 * - Add route duration and other metadata
 */
/*
export class RoutingDistanceCalculator implements DistanceCalculator {
  constructor(
    private osrmEndpoint: string = 'https://router.project-osrm.org',
    private fallbackCalculator: DistanceCalculator = new HaversineDistanceCalculator()
  ) {}

  async calculate(point1: Point, point2: Point): Promise<DistanceResult> {
    try {
      // Implementation would make HTTP request to OSRM API
      // const response = await fetch(`${this.osrmEndpoint}/route/v1/driving/${point1.lon},${point1.lat};${point2.lon},${point2.lat}?overview=false`);
      // const data = await response.json();
      // return { distanceKm: data.routes[0].distance / 1000, method: 'routing' };
      
      // Fallback to Haversine if routing fails
      return this.fallbackCalculator.calculate(point1, point2);
    } catch (error) {
      console.warn('Routing calculation failed, falling back to Haversine:', error);
      return this.fallbackCalculator.calculate(point1, point2);
    }
  }
}
*/ 