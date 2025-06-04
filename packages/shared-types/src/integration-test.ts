/**
 * Integration test to verify all schemas work correctly
 * This file is not included in the build but serves as a verification
 */

import {
  // Service Config Types
  ServiceConfigBaseSchema,

  // Order Types
  OrderPlacementPayloadSchema,
  PhoneNumberSchema,

  // API Types
  ApiResponseSchema,

  // Type exports
  type ServiceConfigBase,
  type OrderPlacementPayload,
  type ApiResponse,
} from './index';

// Test service configuration
const testServiceConfig: ServiceConfigBase = {
  serviceTypeAlias: 'Test Ojek Motor',
  modelBisnis: 'USAHA_SENDIRI',
  angkutanUtama: 'MOTOR',
  driverGenderConstraint: 'SEMUA',
  modelRute: 'DYNAMIC_P2P',
  privasiMassal: 'PRIVATE_SINGLE_ORDER',
  waktuLayananDefault: 'EXPRESS_NOW',
  allowedModelOrder: ['PANGGIL_KE_ORDERER'],
  penanggungJawabOrder: 'KETEMU_LANGSUNG',
  fiturTalangan: { enabled: false },
  alurLayanan: 'DIRECT_PICKUP_DELIVER',
  isBarangPentingDefault: false,
  jangkauanLayanan: { maxDistanceKm: 15 },
  pricing: {
    biayaAdminPerOrder: 2000,
    modelHargaJarak: 'PER_KM',
    biayaPerKm: 3500,
  },
};

// Test order placement
const testOrderPayload: OrderPlacementPayload = {
  serviceId: 'srv_test123',
  ordererIdentifier: '+6281234567890',
  details: {
    pickupAddress: {
      text: 'Test Pickup Location',
      lat: -7.96662,
      lon: 112.632632,
    },
    dropoffAddress: {
      text: 'Test Dropoff Location',
      lat: -7.97562,
      lon: 112.635632,
    },
  },
  paymentMethod: 'CASH',
  isBarangPenting: false,
};

// Validation tests
const serviceConfigValidation = ServiceConfigBaseSchema.safeParse(testServiceConfig);
const orderValidation = OrderPlacementPayloadSchema.safeParse(testOrderPayload);
const phoneValidation = PhoneNumberSchema.safeParse('+6281234567890');

// API response test
const testApiResponse: ApiResponse<{ orderId: string }> = {
  success: true,
  data: { orderId: 'ord_test123' },
  message: 'Order created successfully',
};

const apiResponseValidation = ApiResponseSchema.safeParse(testApiResponse);

// Verify all validations pass
if (
  serviceConfigValidation.success &&
  orderValidation.success &&
  phoneValidation.success &&
  apiResponseValidation.success
) {
  console.log('✅ All integration tests passed');
  console.log('✅ Service config validation:', serviceConfigValidation.success);
  console.log('✅ Order validation:', orderValidation.success);
  console.log('✅ Phone validation:', phoneValidation.success);
  console.log('✅ API response validation:', apiResponseValidation.success);
} else {
  console.log('❌ Some validations failed');
  if (!serviceConfigValidation.success) {
    console.log('Service config errors:', serviceConfigValidation.error.errors);
  }
  if (!orderValidation.success) {
    console.log('Order validation errors:', orderValidation.error.errors);
  }
  if (!phoneValidation.success) {
    console.log('Phone validation errors:', phoneValidation.error.errors);
  }
  if (!apiResponseValidation.success) {
    console.log('API response errors:', apiResponseValidation.error.errors);
  }
}

export {};
