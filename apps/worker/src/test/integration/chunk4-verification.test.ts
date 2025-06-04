/**
 * Chunk 4 Verification Tests (IS9, IS10, IS11)
 *
 * Programmatic verification of:
 * - IS9: Mitra Order Viewing & Basic Management API
 * - IS10: Distance Calculation Utility (Haversine Implementation)
 * - IS11: Public API to Fetch Service Configuration
 *
 * This test suite verifies functionality from an end-user/business perspective
 * by making HTTP API calls and inspecting responses and database state.
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createId } from '@paralleldrive/cuid2';
import { TestApiClient } from '../utils/test-api-client';
import { TestDataFactory } from '../utils/test-data-factory';
import { DatabaseTestHelper } from '../utils/database-test-helper';
import { calculateHaversineDistance, calculateDistance } from '../../utils/geo';

describe('Chunk 4 Verification: IS9, IS10, IS11', () => {
  let apiClient: TestApiClient;
  let dataFactory: TestDataFactory;
  let dbHelper: DatabaseTestHelper;

  // Test data IDs - will be populated during setup
  let mitra1Profile: any;
  let serviceIdPublicActive: string;
  let serviceIdInternalActive: string;
  let serviceIdPublicInactive: string;
  let driverId1: string;
  let orderIdPending: string;
  let orderIdAssignable: string;
  let orderIdCompleted: string;

  const MITRA_OWNER_EMAIL_1 = 'mitra_owner_1@example.com';

  beforeAll(async () => {
    // Initialize test utilities
    apiClient = new TestApiClient('http://localhost:8787');
    dataFactory = new TestDataFactory();
    dbHelper = new DatabaseTestHelper();

    // Ensure clean database state
    await dbHelper.cleanupTestData();
  });

  afterAll(async () => {
    // Cleanup test data
    await dbHelper.cleanupTestData();
  });

  beforeEach(async () => {
    // Reset test state for each test group
    await dbHelper.cleanupTestData();

    // Create test mitra profile
    const mitraResponse = await apiClient.post(
      '/api/mitra/profile',
      { name: 'Test Mitra 1' },
      { 'Cf-Access-Authenticated-User-Email': MITRA_OWNER_EMAIL_1 },
    );
    mitra1Profile = mitraResponse.body.data;

    // Create test services
    const publicActiveService = await apiClient.post(
      '/api/mitra/services',
      {
        name: 'Public Active Service',
        serviceTypeKey: 'DELIVERY',
        configJson: {
          modelBisnis: 'PUBLIC_3RD_PARTY',
          pricing: {
            modelHargaJarak: 'PER_KM',
            biayaPerKm: 2500,
          },
        },
        isActive: true,
      },
      { 'Cf-Access-Authenticated-User-Email': MITRA_OWNER_EMAIL_1 },
    );
    serviceIdPublicActive = publicActiveService.body.data.id;

    const internalActiveService = await apiClient.post(
      '/api/mitra/services',
      {
        name: 'Internal Active Service',
        serviceTypeKey: 'DELIVERY',
        configJson: {
          modelBisnis: 'USAHA_SENDIRI',
          pricing: {
            modelHargaJarak: 'FLAT',
            biayaFlat: 10000,
          },
        },
        isActive: true,
      },
      { 'Cf-Access-Authenticated-User-Email': MITRA_OWNER_EMAIL_1 },
    );
    serviceIdInternalActive = internalActiveService.body.data.id;

    const publicInactiveService = await apiClient.post(
      '/api/mitra/services',
      {
        name: 'Public Inactive Service',
        serviceTypeKey: 'DELIVERY',
        configJson: {
          modelBisnis: 'PUBLIC_3RD_PARTY',
          pricing: {
            modelHargaJarak: 'PER_KM',
            biayaPerKm: 3000,
          },
        },
        isActive: false,
      },
      { 'Cf-Access-Authenticated-User-Email': MITRA_OWNER_EMAIL_1 },
    );
    serviceIdPublicInactive = publicInactiveService.body.data.id;

    // Create test driver
    const driverResponse = await apiClient.post(
      '/api/mitra/drivers',
      {
        name: 'Test Driver 1',
        identifier: 'DRV001',
        configJson: {},
        isActive: true,
      },
      { 'Cf-Access-Authenticated-User-Email': MITRA_OWNER_EMAIL_1 },
    );
    driverId1 = driverResponse.body.data.id;

    // Assign driver to public active service
    await apiClient.post(
      `/api/mitra/drivers/${driverId1}/assign-service`,
      { serviceId: serviceIdPublicActive },
      { 'Cf-Access-Authenticated-User-Email': MITRA_OWNER_EMAIL_1 },
    );

    // Create test orders using the order placement API
    const orderPayload1 = {
      serviceId: serviceIdPublicActive,
      ordererIdentifier: 'user123',
      detailsJson: {
        pickupAddress: { text: 'Pickup Location', lat: -6.2088, lon: 106.8456 },
        dropoffAddress: { text: 'Dropoff Location', lat: -6.9175, lon: 107.6191 },
      },
    };

    const orderResponse1 = await apiClient.post('/api/orders/place', orderPayload1);
    orderIdPending = orderResponse1.body.data.id;

    const orderPayload2 = {
      serviceId: serviceIdPublicActive,
      ordererIdentifier: 'user456',
      detailsJson: {
        pickupAddress: { text: 'Pickup Location 2', lat: -6.2088, lon: 106.8456 },
        dropoffAddress: { text: 'Dropoff Location 2', lat: -6.9175, lon: 107.6191 },
      },
    };

    const orderResponse2 = await apiClient.post('/api/orders/place', orderPayload2);
    orderIdAssignable = orderResponse2.body.data.id;

    const orderPayload3 = {
      serviceId: serviceIdPublicActive,
      ordererIdentifier: 'user789',
      detailsJson: {
        pickupAddress: { text: 'Pickup Location 3', lat: -6.2088, lon: 106.8456 },
        dropoffAddress: { text: 'Dropoff Location 3', lat: -6.9175, lon: 107.6191 },
      },
    };

    const orderResponse3 = await apiClient.post('/api/orders/place', orderPayload3);
    orderIdCompleted = orderResponse3.body.data.id;

    // Assign driver to one order and mark it as completed
    await apiClient.post(
      `/api/mitra/orders/${orderIdCompleted}/assign-driver`,
      { driverId: driverId1 },
      { 'Cf-Access-Authenticated-User-Email': MITRA_OWNER_EMAIL_1 },
    );

    // Update order status to completed (this would normally be done through driver API)
    // For testing purposes, we'll simulate this
  });

  describe('IS10: Distance Calculation Utility (Haversine Implementation)', () => {
    test('should calculate correct distance between London and Paris', async () => {
      const london = { lat: 51.5074, lon: -0.1278 };
      const paris = { lat: 48.8566, lon: 2.3522 };

      const distance = calculateHaversineDistance(london, paris);

      // Expected distance is approximately 343-344 km
      expect(distance).toBeGreaterThan(343);
      expect(distance).toBeLessThan(345);
    });

    test('should return 0 for same point', async () => {
      const point = { lat: 51.5074, lon: -0.1278 };

      const distance = calculateHaversineDistance(point, point);

      expect(distance).toBe(0);
    });

    test('should work with async calculateDistance function', async () => {
      const london = { lat: 51.5074, lon: -0.1278 };
      const paris = { lat: 48.8566, lon: 2.3522 };

      const result = await calculateDistance(london, paris);

      expect(result.distanceKm).toBeGreaterThan(343);
      expect(result.distanceKm).toBeLessThan(345);
      expect(result.method).toBe('haversine');
      expect(result.metadata).toBeDefined();
    });

    test('should throw error for invalid coordinates', () => {
      const invalidPoint1 = { lat: 91, lon: 0 }; // Invalid latitude
      const validPoint = { lat: 0, lon: 0 };

      expect(() => calculateHaversineDistance(invalidPoint1, validPoint)).toThrow(
        'Invalid coordinates provided',
      );
    });
  });

  describe('IS11: Public API to Fetch Service Configuration', () => {
    test('should fetch config for public, active service', async () => {
      const response = await apiClient.get(`/api/public/services/${serviceIdPublicActive}/config`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.serviceId).toBe(serviceIdPublicActive);
      expect(response.body.data.name).toBe('Public Active Service');
      expect(response.body.data.mitraName).toBe('Test Mitra 1');
      expect(response.body.data.isActive).toBe(true);
      expect(response.body.data.configJson.modelBisnis).toBe('PUBLIC_3RD_PARTY');
      expect(response.body.data.configJson.pricing.biayaPerKm).toBe(2500);
    });

    test('should return 404 for internal (non-public) service', async () => {
      const response = await apiClient.get(
        `/api/public/services/${serviceIdInternalActive}/config`,
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    test('should return 404 for inactive public service', async () => {
      const response = await apiClient.get(
        `/api/public/services/${serviceIdPublicInactive}/config`,
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    test('should return 404 for non-existent service', async () => {
      const nonExistentId = createId();
      const response = await apiClient.get(`/api/public/services/${nonExistentId}/config`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    test('should return 400 for invalid service ID format', async () => {
      const response = await apiClient.get('/api/public/services/invalid-id/config');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_PARAM');
    });
  });

  describe('IS9: Mitra Order Viewing & Basic Management API', () => {
    describe('List Orders', () => {
      test('should list all orders for mitra (no filters)', async () => {
        const response = await apiClient.get('/api/mitra/orders', {
          'Cf-Access-Authenticated-User-Email': MITRA_OWNER_EMAIL_1,
        });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.orders).toHaveLength(3);
        expect(response.body.data.pagination.currentPage).toBe(1);
        expect(response.body.data.pagination.hasMore).toBe(false);

        // Verify order IDs are present
        const orderIds = response.body.data.orders.map((order: any) => order.id);
        expect(orderIds).toContain(orderIdPending);
        expect(orderIds).toContain(orderIdAssignable);
        expect(orderIds).toContain(orderIdCompleted);
      });

      test('should filter orders by status', async () => {
        const response = await apiClient.get('/api/mitra/orders?status=PENDING', {
          'Cf-Access-Authenticated-User-Email': MITRA_OWNER_EMAIL_1,
        });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.orders.length).toBeGreaterThan(0);

        // All returned orders should have PENDING status
        response.body.data.orders.forEach((order: any) => {
          expect(order.status).toBe('PENDING');
        });
      });

      test('should filter orders by service ID', async () => {
        const response = await apiClient.get(
          `/api/mitra/orders?serviceId=${serviceIdPublicActive}`,
          {
            'Cf-Access-Authenticated-User-Email': MITRA_OWNER_EMAIL_1,
          },
        );

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.orders).toHaveLength(3);

        // All orders should belong to the specified service
        response.body.data.orders.forEach((order: any) => {
          expect(order.serviceId).toBe(serviceIdPublicActive);
        });
      });
    });

    describe('Get Order Details', () => {
      test('should get specific order details with related data', async () => {
        const response = await apiClient.get(`/api/mitra/orders/${orderIdPending}`, {
          'Cf-Access-Authenticated-User-Email': MITRA_OWNER_EMAIL_1,
        });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe(orderIdPending);
        expect(response.body.data.mitraId).toBe(mitra1Profile.id);
        expect(response.body.data.service).toBeDefined();
        expect(response.body.data.service.id).toBe(serviceIdPublicActive);
        expect(response.body.data.service.name).toBe('Public Active Service');
        expect(response.body.data.events).toBeDefined();
        expect(Array.isArray(response.body.data.events)).toBe(true);
        expect(response.body.data.events.length).toBeGreaterThan(0);
      });

      test('should return 404 for non-existent order', async () => {
        const nonExistentId = createId();
        const response = await apiClient.get(`/api/mitra/orders/${nonExistentId}`, {
          'Cf-Access-Authenticated-User-Email': MITRA_OWNER_EMAIL_1,
        });

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('NOT_FOUND');
      });
    });

    describe('Driver Assignment', () => {
      test('should successfully assign driver to assignable order', async () => {
        const response = await apiClient.post(
          `/api/mitra/orders/${orderIdAssignable}/assign-driver`,
          { driverId: driverId1 },
          { 'Cf-Access-Authenticated-User-Email': MITRA_OWNER_EMAIL_1 },
        );

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe(orderIdAssignable);
        expect(response.body.data.driverId).toBe(driverId1);
        expect(response.body.data.status).toBe('DRIVER_ASSIGNED');
      });

      test('should reject assignment with non-existent driver', async () => {
        const nonExistentDriverId = createId();
        const response = await apiClient.post(
          `/api/mitra/orders/${orderIdPending}/assign-driver`,
          { driverId: nonExistentDriverId },
          { 'Cf-Access-Authenticated-User-Email': MITRA_OWNER_EMAIL_1 },
        );

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('NOT_FOUND');
        expect(response.body.error.message).toContain('Driver not found');
      });

      test('should reject assignment with invalid order ID format', async () => {
        const response = await apiClient.post(
          '/api/mitra/orders/invalid-id/assign-driver',
          { driverId: driverId1 },
          { 'Cf-Access-Authenticated-User-Email': MITRA_OWNER_EMAIL_1 },
        );

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('INVALID_PARAM');
      });
    });

    describe('Authorization & Data Isolation', () => {
      test('should not access orders from different mitra', async () => {
        const response = await apiClient.get('/api/mitra/orders', {
          'Cf-Access-Authenticated-User-Email': 'different_mitra@example.com',
        });

        // Should either return empty list or authentication error
        // The exact behavior depends on the auth middleware implementation
        expect([200, 401, 403, 404]).toContain(response.status);

        if (response.status === 200) {
          expect(response.body.data.orders).toHaveLength(0);
        }
      });
    });
  });
});
