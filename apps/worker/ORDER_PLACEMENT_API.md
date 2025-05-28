# Order Placement API Implementation

## Overview

This document describes the implementation of **RFC-TREK-ORDER-001: End-User Order Placement API** for the Treksistem platform. The implementation provides a comprehensive order placement system with dynamic validation, multi-model cost calculation, and trust mechanisms.

## 🚀 Implementation Status: **COMPLETE**

### ✅ Implemented Features

- **Dynamic Service Configuration Validation**: Orders validated against specific service configurations
- **Multi-Model Cost Calculation**: Distance-based, zone-based, and per-item pricing support
- **Trust Mechanisms**: Automatic evaluation and WhatsApp notification generation for sensitive orders
- **Transactional Database Operations**: Complete audit trail through order events
- **Comprehensive Error Handling**: Business rule validation with specific error codes
- **Cost Transparency**: Detailed breakdown of all cost components

## 📁 File Structure

```
apps/worker/src/
├── routes/
│   └── orders.placement.ts          # Main order placement routes
├── utils/
│   ├── cost-calculation.ts          # Cost calculation utilities
│   ├── trust-mechanisms.ts          # Trust mechanism evaluation
│   └── geo.ts                       # Distance calculation (existing)
└── test-order-placement.ts          # Comprehensive test suite
```

## 🔌 API Endpoints

### 1. Order Placement
```http
POST /api/orders/
Content-Type: application/json

{
  "serviceId": "string",
  "ordererIdentifier": "+6281234567890",
  "receiverWaNumber": "+6289876543210",
  "paymentMethod": "CASH",
  "isBarangPenting": false,
  "talanganAmount": 0,
  "details": {
    "pickupAddress": {
      "text": "Jl. Veteran No. 1, Malang",
      "lat": -7.9666,
      "lon": 112.6326
    },
    "dropoffAddress": {
      "text": "Jl. Ijen No. 10, Malang",
      "lat": -7.9797,
      "lon": 112.6304
    },
    "notes": "Order notes",
    "selectedMuatanId": "PAKET_MAKANAN",
    "selectedFasilitasIds": ["HELM"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "cm123abc456def",
    "status": "PENDING",
    "estimatedCost": 25000,
    "trackingUrl": "https://treksistem.com/track/cm123abc456def",
    "service": {
      "name": "Ojek Motor Express",
      "mitra": "Mitra Transport Malang"
    },
    "costBreakdown": {
      "total": 25000,
      "breakdown": [
        { "description": "Biaya Admin", "amount": 5000 },
        { "description": "Biaya Jarak (2.1 km × Rp 3,000)", "amount": 6300 },
        { "description": "Biaya Handling Paket Makanan", "amount": 5000 }
      ],
      "calculation_method": "per_km",
      "distance_km": 2.1
    },
    "trust": {
      "level": "standard",
      "required_actions": [],
      "notification_required": false
    },
    "createdAt": 1703123456789
  },
  "message": "Order placed successfully"
}
```

### 2. Cost Estimation
```http
POST /api/orders/cost-estimate
Content-Type: application/json

{
  "serviceId": "string",
  "details": { /* same as order placement */ },
  "talanganAmount": 0
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "estimatedCost": 25000,
    "breakdown": [
      { "description": "Biaya Admin", "amount": 5000 },
      { "description": "Biaya Jarak (2.1 km × Rp 3,000)", "amount": 6300 }
    ],
    "metadata": {
      "calculationMethod": "per_km",
      "distanceKm": 2.1
    }
  }
}
```

## 🧮 Cost Calculation Models

### 1. Distance-Based Pricing (`PER_KM`)
- Uses Haversine formula for straight-line distance
- Configurable per-kilometer rate
- Validates against service coverage limits

### 2. Zone-Based Pricing (`ZONA_ASAL_TUJUAN`)
- Text-based zone matching (MVP approach)
- Predefined zone-to-zone pricing matrix
- Supports complex routing scenarios

### 3. Additional Cost Components
- **Admin Fee**: Fixed per-order administrative cost
- **Per-Item Pricing**: Optional per-piece charges
- **Muatan Handling**: Cargo-specific handling fees
- **Facilities**: Additional service facility charges

## 🔒 Trust Mechanisms

### Trigger Conditions
- **Talangan Orders**: `talanganAmount > 0`
- **Valuable Items**: `isBarangPenting = true` or service default
- **Combined Risk**: Both conditions = `HIGH_RISK` level

### Trust Levels
- **STANDARD**: Normal orders, no special requirements
- **SENSITIVE**: Single risk factor, receiver notification required
- **HIGH_RISK**: Multiple risk factors, enhanced verification

### WhatsApp Notification
Automatic deep link generation for receiver notification:
```
whatsapp://send?phone=6289876543210&text=Halo!%20👋%0A%0AAnda%20akan%20menerima%20kiriman...
```

## 🗄️ Database Operations

### Transactional Order Creation
```sql
-- Insert order
INSERT INTO orders (id, serviceId, mitraId, ordererIdentifier, ...)
VALUES (?, ?, ?, ?, ...);

-- Insert order created event
INSERT INTO orderEvents (id, orderId, eventType, dataJson, ...)
VALUES (?, ?, 'ORDER_CREATED', ?, ...);

-- Insert trust evaluation event (if applicable)
INSERT INTO orderEvents (id, orderId, eventType, dataJson, ...)
VALUES (?, ?, 'TRUST_EVALUATION', ?, ...);
```

### Event Sourcing
All order state changes are captured in `orderEvents` table:
- `ORDER_CREATED`: Initial order placement
- `TRUST_EVALUATION`: Trust mechanism assessment
- `STATUS_UPDATE`: Order status changes
- `ASSIGNMENT_CHANGED`: Driver assignments

## ⚠️ Error Handling

### Business Rule Errors
- `SERVICE_NOT_FOUND`: Invalid or inactive service
- `SERVICE_NOT_AVAILABLE`: Service not accepting public orders
- `INVALID_ADDRESS`: Malformed address data
- `TALANGAN_NOT_ENABLED`: Talangan requested but not supported
- `TALANGAN_EXCEEDS_LIMIT`: Amount exceeds service limit
- `RECEIVER_WA_REQUIRED`: Missing receiver WhatsApp for sensitive orders
- `DISTANCE_EXCEEDS_COVERAGE`: Route outside service area
- `ZONE_PRICE_NOT_FOUND`: No pricing for route zones

### Validation Errors
- `VALIDATION_ERROR`: Zod schema validation failures
- `INVALID_PRICING_CONFIG`: Service configuration errors
- `MISSING_COORDINATES`: Required coordinates unavailable

## 🧪 Testing

### Test Suite
Run the comprehensive test suite:
```bash
cd apps/worker
npx tsx src/test-order-placement.ts
```

### Manual Testing
Start the development server:
```bash
pnpm dev
```

Test cost estimation:
```bash
curl -X POST http://localhost:8787/api/orders/cost-estimate \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": "test-service-id",
    "details": {
      "pickupAddress": {
        "text": "Jl. Veteran No. 1, Malang",
        "lat": -7.9666,
        "lon": 112.6326
      },
      "dropoffAddress": {
        "text": "Jl. Ijen No. 10, Malang",
        "lat": -7.9797,
        "lon": 112.6304
      }
    },
    "talanganAmount": 0
  }'
```

## 🔧 Configuration

### Service Configuration Requirements
Services must have valid `configJson` conforming to `ServiceConfigBase`:
- `modelBisnis`: Must be `PUBLIC_3RD_PARTY` or `USAHA_SENDIRI`
- `pricing`: Valid pricing configuration with admin fee
- `fiturTalangan`: Talangan settings if enabled
- `allowedMuatan`: Available cargo types
- `availableFasilitas`: Available facilities

### Environment Variables
- `TREKSISTEM_DB`: D1 database binding
- `WORKER_ENV`: Environment identifier

## 📋 RFC Compliance

### RFC-TREK-ORDER-001 ✅
- [x] Public order placement endpoint
- [x] Dynamic validation against service configuration
- [x] Cost estimation with multiple pricing models
- [x] Transactional order and event creation

### RFC-TREK-TRUST-001 ✅
- [x] Trust mechanism evaluation for sensitive orders
- [x] Receiver notification requirements
- [x] WhatsApp deep link generation
- [x] Trust level classification

### RFC-TREK-CONFIG-001 ✅
- [x] Service configuration integration
- [x] Dynamic pricing model support
- [x] Muatan and fasilitas handling
- [x] Business model validation

## 🚀 Next Steps

1. **Frontend Integration**: Implement order placement UI in `fe-user-public`
2. **Driver Assignment**: Implement automatic driver assignment logic
3. **Real-time Updates**: Add WebSocket support for order status updates
4. **Payment Integration**: Add payment gateway integration
5. **Routing Engine**: Replace Haversine with actual routing API

## 📞 Support

For questions or issues with the order placement API:
- Check the worker logs for detailed execution traces
- Review the test suite for usage examples
- Consult the RFC documents for business requirements 