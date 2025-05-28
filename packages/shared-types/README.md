# @treksistem/shared-types

This package contains shared TypeScript types and Zod schemas used across the Treksistem monorepo. It provides type-safe data structures for service configurations, orders, API responses, and entity definitions.

## Features

- 🔒 **Type Safety**: Comprehensive TypeScript types with strict validation
- 🛡️ **Runtime Validation**: Zod schemas for request/response validation
- 🔄 **Consistent APIs**: Standardized response formats across all services
- 📋 **Business Logic**: Types that reflect the core business domain (RFC-TREK-CONFIG-001, RFC-TREK-DATA-001)

## Modules

### Service Configuration Types (`service-config-types.ts`)
- `ServiceConfigBaseSchema` - Main service configuration based on RFC-TREK-CONFIG-001
- `ServicePricingConfigSchema` - Pricing model definitions
- `AmbulanceConfigSchema` - Ambulance-specific configurations
- `FixedRouteConfigSchema` - Scheduled service configurations
- `DriverConfigSchema` - Driver and vehicle configurations

### Order Types (`order-types.ts`)
- `OrderPlacementPayloadSchema` - Order creation data
- `OrderStatusSchema` - Order lifecycle states
- `OrderEventDataSchema` - Order event tracking
- `AddressDetailSchema` - Address information with coordinates

### Entity Types (`entities.ts`)
- `MitraSchema` - Service provider entities
- `ServiceSchema` - Service definitions
- `DriverSchema` - Driver entities with location tracking
- `OrderSchema` - Complete order entities

### API Types (`api.ts`)
- `ApiResponseSchema` - Standard API response format
- `PaginationQuerySchema` - Pagination parameters
- `AuthHeaderSchema` - Authentication headers
- `FileUploadSchema` - File upload handling

## Usage Examples

### Validating Service Configuration

```typescript
import { ServiceConfigBaseSchema, type ServiceConfigBase } from '@treksistem/shared-types';

const serviceConfig: ServiceConfigBase = {
  serviceTypeAlias: "Ojek Motor Cepat",
  modelBisnis: "USAHA_SENDIRI",
  angkutanUtama: "MOTOR",
  driverGenderConstraint: "SEMUA",
  modelRute: "DYNAMIC_P2P",
  privasiMassal: "PRIVATE_SINGLE_ORDER",
  waktuLayananDefault: "EXPRESS_NOW",
  allowedModelOrder: ["PANGGIL_KE_ORDERER"],
  penanggungJawabOrder: "KETEMU_LANGSUNG",
  fiturTalangan: { enabled: false },
  alurLayanan: "DIRECT_PICKUP_DELIVER",
  jangkauanLayanan: { maxDistanceKm: 10 },
  pricing: {
    biayaAdminPerOrder: 2000,
    modelHargaJarak: "PER_KM",
    biayaPerKm: 3000
  }
};

const result = ServiceConfigBaseSchema.safeParse(serviceConfig);
if (result.success) {
  console.log('✅ Valid service configuration');
} else {
  console.log('❌ Validation errors:', result.error.errors);
}
```

### Creating Order Placement

```typescript
import { OrderPlacementPayloadSchema, type OrderPlacementPayload } from '@treksistem/shared-types';

const orderPayload: OrderPlacementPayload = {
  serviceId: "srv_abc123",
  ordererIdentifier: "+6281234567890",
  details: {
    pickupAddress: {
      text: "Jl. Veteran No. 12, Malang",
      lat: -7.966620,
      lon: 112.632632
    },
    dropoffAddress: {
      text: "Jl. Ijen No. 45, Malang",
      lat: -7.975620,
      lon: 112.635632
    },
    notes: "Paket makanan, harap hati-hati"
  },
  paymentMethod: "CASH"
};

const result = OrderPlacementPayloadSchema.safeParse(orderPayload);
```

### API Response Handling

```typescript
import { ApiResponse, ApiSuccessResponseSchema } from '@treksistem/shared-types';
import { z } from 'zod';

// Define expected response data schema
const OrderResponseSchema = z.object({
  orderId: z.string(),
  status: z.string(),
  estimatedCost: z.number()
});

// Create typed success response schema
const OrderApiResponseSchema = ApiSuccessResponseSchema(OrderResponseSchema);

// Use in API handler
function handleOrderResponse(response: unknown): ApiResponse<z.infer<typeof OrderResponseSchema>> {
  const result = OrderApiResponseSchema.safeParse(response);
  if (result.success) {
    return result.data;
  }
  throw new Error('Invalid API response format');
}
```

## Installation

This package is automatically available in the monorepo workspace:

```typescript
import { ServiceConfigBaseSchema, OrderSchema, ApiResponse } from '@treksistem/shared-types';
```

## Type Safety Guidelines

1. **Always use schemas for validation** - Don't trust external data
2. **Leverage type inference** - Use `z.infer<typeof Schema>` for TypeScript types
3. **Validate at boundaries** - API endpoints, database operations, external integrations
4. **Use discriminated unions** - For type-specific configurations and events

## Contributing

When adding new types:

1. Create appropriate Zod schema with validation rules
2. Export both schema and inferred type
3. Add JSDoc comments for documentation
4. Include usage examples for complex types
5. Update this README with new exports

## Dependencies

- `zod` ^3.23.8 - Runtime validation and type inference 