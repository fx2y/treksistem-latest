# Mitra Orders API Documentation

## Overview

The Mitra Orders API provides endpoints for authenticated Mitra admins to manage orders associated with their services. This includes listing orders with filtering capabilities, viewing detailed order information, and manually assigning drivers to orders.

## Implementation Details

- **File**: `apps/worker/src/routes/mitra.orders.ts`
- **Spec ID**: TREK-IMPL-API-MITRA-ORD-001
- **Authentication**: Cloudflare Access + Mitra authorization
- **Base Path**: `/api/mitra/orders`

## Endpoints

### 1. List Orders

**GET** `/api/mitra/orders`

Lists all orders for the authenticated Mitra with optional filtering and pagination.

#### Query Parameters

| Parameter   | Type   | Description                         | Required |
| ----------- | ------ | ----------------------------------- | -------- |
| `status`    | string | Filter by order status (enum)       | No       |
| `serviceId` | string | Filter by service ID (CUID)         | No       |
| `driverId`  | string | Filter by driver ID (CUID)          | No       |
| `dateFrom`  | string | Filter from date (ISO8601)          | No       |
| `dateTo`    | string | Filter to date (ISO8601)            | No       |
| `page`      | number | Page number (default: 1)            | No       |
| `limit`     | number | Items per page (1-100, default: 10) | No       |

#### Response

```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "cm...",
        "serviceId": "cm...",
        "mitraId": "cm...",
        "driverId": "cm..." | null,
        "ordererIdentifier": "+628123456789",
        "receiverWaNumber": "+628123456789",
        "detailsJson": {...},
        "status": "PENDING",
        "estimatedCost": 50000,
        "finalCost": null,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z",
        "scheduledAt": null,
        "service": {
          "name": "Express Delivery",
          "serviceTypeKey": "P2P_EXPRESS"
        },
        "driver": {
          "name": "John Doe",
          "identifier": "driver001"
        } | null
      }
    ],
    "pagination": {
      "currentPage": 1,
      "limit": 10,
      "hasMore": false
    }
  }
}
```

### 2. Get Order Details

**GET** `/api/mitra/orders/:orderId`

Retrieves detailed information about a specific order, including related service, driver, and event history.

#### Path Parameters

| Parameter | Type   | Description     |
| --------- | ------ | --------------- |
| `orderId` | string | Order ID (CUID) |

#### Response

```json
{
  "success": true,
  "data": {
    "id": "cm...",
    "serviceId": "cm...",
    "mitraId": "cm...",
    "driverId": "cm...",
    "ordererIdentifier": "+628123456789",
    "receiverWaNumber": "+628123456789",
    "detailsJson": {...},
    "status": "PENDING",
    "estimatedCost": 50000,
    "finalCost": null,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "scheduledAt": null,
    "service": {
      "id": "cm...",
      "name": "Express Delivery",
      "serviceTypeKey": "P2P_EXPRESS",
      "configJson": {...},
      "isActive": true
    },
    "driver": {
      "id": "cm...",
      "name": "John Doe",
      "identifier": "driver001",
      "configJson": {...},
      "isActive": true
    },
    "events": [
      {
        "id": "cm...",
        "timestamp": "2024-01-01T00:00:00.000Z",
        "eventType": "STATUS_UPDATE",
        "dataJson": {...},
        "actorType": "MITRA_ADMIN",
        "actorId": "cm..."
      }
    ]
  }
}
```

### 3. Assign Driver to Order

**POST** `/api/mitra/orders/:orderId/assign-driver`

Manually assigns a driver to an order. Includes comprehensive validation to ensure the assignment is valid.

#### Path Parameters

| Parameter | Type   | Description     |
| --------- | ------ | --------------- |
| `orderId` | string | Order ID (CUID) |

#### Request Body

```json
{
  "driverId": "cm..."
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "id": "cm...",
    "serviceId": "cm...",
    "mitraId": "cm...",
    "driverId": "cm...",
    "status": "DRIVER_ASSIGNED",
    "updatedAt": "2024-01-01T00:00:00.000Z"
    // ... other order fields
  }
}
```

## Validation Rules

### Driver Assignment Validation

1. **Order Ownership**: Order must belong to the authenticated Mitra
2. **Order Status**: Order must be in an assignable state:
   - `PENDING`
   - `ACCEPTED_BY_MITRA`
   - `PENDING_DRIVER_ASSIGNMENT`
   - `REJECTED_BY_DRIVER`
3. **Driver Ownership**: Driver must belong to the authenticated Mitra
4. **Driver Status**: Driver must be active (`isActive: true`)
5. **Service Qualification**: Driver must be assigned to the order's service type (via `driver_services` table)

### Status Transitions

When a driver is successfully assigned:

- Order status changes to `DRIVER_ASSIGNED`
- Order `updatedAt` timestamp is updated
- An `ASSIGNMENT_CHANGED` event is created in `order_events`

## Error Handling

### Common Error Responses

#### 400 Bad Request

```json
{
  "success": false,
  "error": {
    "code": "INVALID_PARAM",
    "message": "Invalid order ID format."
  }
}
```

#### 404 Not Found

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Order not found or not owned by this Mitra."
  }
}
```

#### 409 Conflict

```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Order is not in an assignable state."
  }
}
```

#### Validation Errors

```json
{
  "success": false,
  "error": {
    "issues": [
      {
        "code": "invalid_enum_value",
        "options": ["PENDING", "ACCEPTED_BY_MITRA", ...],
        "path": ["status"],
        "message": "Invalid enum value..."
      }
    ],
    "name": "ZodError"
  }
}
```

## Database Operations

### Query Optimization

- Uses LEFT JOINs to include service and driver information in order listings
- Implements efficient pagination with `LIMIT` and `OFFSET`
- Leverages database indexes on:
  - `orders.mitra_id`
  - `orders.status`
  - `orders.created_at`
  - `orders.service_id`
  - `orders.driver_id`

### Data Consistency

- Order updates and event creation are performed sequentially
- Comprehensive validation prevents invalid state transitions
- Foreign key constraints ensure referential integrity

## Security Considerations

- All endpoints require Cloudflare Access authentication
- Mitra-level authorization ensures data isolation
- CUID validation prevents injection attacks
- Comprehensive input validation using Zod schemas

## Testing

The implementation includes comprehensive test coverage via `test-mitra-orders.sh`:

1. Order listing (empty state)
2. Filtered order listing
3. Invalid status validation
4. Order detail retrieval (404 cases)
5. Driver assignment (404 cases)
6. Invalid ID format handling
7. Invalid payload validation

## Performance Considerations

- Pagination prevents large result sets
- Efficient database queries with appropriate JOINs
- Minimal data transfer with selective column selection
- Proper indexing for common query patterns

## Future Enhancements

1. **Bulk Operations**: Support for bulk driver assignments
2. **Advanced Filtering**: Date range filtering on `scheduledAt`
3. **Sorting Options**: Multiple sort criteria support
4. **Real-time Updates**: WebSocket notifications for order changes
5. **Analytics**: Order statistics and reporting endpoints
