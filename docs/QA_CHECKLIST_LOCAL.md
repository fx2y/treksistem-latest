# Treksistem Local Development QA Checklist

This checklist must be executed before marking any feature branch as ready for review/merge. All flows should be tested against the local development environment with `turbo dev` running.

## Prerequisites

- [ ] All local development servers running (`pnpm turbo dev`)
- [ ] Worker accessible at `http://localhost:8787`
- [ ] Frontend apps accessible at their respective ports
- [ ] Database migrations applied locally

## 🔧 Environment Setup Verification

- [ ] Worker health check passes: `curl http://localhost:8787/api/health`
- [ ] Mock authentication headers work (X-Mock-User-Email for Mitra APIs)
- [ ] Database connection functional
- [ ] R2 bucket accessible for photo uploads

---

## 1. 👤 Mitra Admin Flow

### 1.1 Profile Management

- [ ] **Login Simulation**: Set `X-Mock-User-Email: qa-admin@treksistem.com` header
- [ ] **Create Mitra Profile**:
  - POST `/api/mitra/profile` with valid data
  - Verify profile created with correct ownerUserId linkage
- [ ] **View Mitra Profile**: GET `/api/mitra/profile` returns created profile
- [ ] **Update Mitra Profile**: PUT `/api/mitra/profile` with modified data

### 1.2 Service Management

- [ ] **Create Service** ("Ojek Motor"):
  - POST `/api/mitra/services` with complete configJson
  - Include pricing model: `PER_KM` with `biayaPerKm: 5000`
  - Enable talangan: `fiturTalangan.enabled: true, maxAmount: 50000`
  - Set `allowedModelOrder: ["PANGGIL_KE_ORDERER", "JEMPUT_ANTAR_LAIN"]`
- [ ] **View Service List**: GET `/api/mitra/services` shows created service
- [ ] **View Service Details**: GET `/api/mitra/services/:serviceId`
- [ ] **Update Service Configuration**: PUT `/api/mitra/services/:serviceId`
- [ ] **Verify Service Config Validation**: Try invalid configJson (expect validation errors)

### 1.3 Driver Management

- [ ] **Create Driver**:
  - POST `/api/mitra/drivers` with valid driver data
  - Include vehicle information in configJson
- [ ] **View Driver List**: GET `/api/mitra/drivers`
- [ ] **View Driver Details**: GET `/api/mitra/drivers/:driverId`
- [ ] **Update Driver**: PUT `/api/mitra/drivers/:driverId`
- [ ] **Assign Driver to Service**: POST `/api/mitra/drivers/:driverId/services` with serviceId
- [ ] **Verify Driver-Service Assignment**: Check assignment appears in driver details
- [ ] **Remove Service Assignment**: DELETE `/api/mitra/drivers/:driverId/services/:serviceId`

### 1.4 Order Management

- [ ] **View Order List**: GET `/api/mitra/orders` (initially empty)
- [ ] **Filter Orders**: Test with query params (status, dateFrom, dateTo)
- [ ] **Assign Driver to Order**: POST `/api/mitra/orders/:orderId/assign-driver`
  - Use after order is created in User Flow
  - Verify driver is qualified for the service
- [ ] **View Order Details**: GET `/api/mitra/orders/:orderId` shows assigned driver

---

## 2. 🛒 End User Flow

### 2.1 Service Discovery

- [ ] **View Public Service Config**: GET `/api/public/services/:serviceId/config`
  - Use serviceId from created "Ojek Motor" service
  - Verify configJson is properly sanitized for public consumption
- [ ] **View Master Service Templates**: GET `/api/public/master-service-templates`

### 2.2 Order Placement

- [ ] **Place Order** for "Ojek Motor":
  - POST `/api/orders` with valid OrderPlacementPayload
  - Include realistic pickup/dropoff addresses with lat/lon
  - Test with talangan: `talanganAmount: 25000` (within service limit)
  - Set `isBarangPenting: true` and include `receiverWaNumber`
- [ ] **Verify Order Creation**:
  - Response includes orderId, estimatedCost, trackingUrl
  - Cost calculated using Haversine distance + service pricing
  - WA deep link generated for receiver notification
- [ ] **Test Order Validation**:
  - Try invalid serviceId (expect 404)
  - Try talangan amount exceeding service limit (expect validation error)
  - Try missing required fields (expect validation errors)

### 2.3 Order Tracking

- [ ] **Track Order**: GET `/api/orders/:orderId/track`
  - Verify sanitized order data returned
  - No sensitive information exposed (driver details minimal)
  - Order status shows as PENDING initially

---

## 3. 🚗 Driver Flow

### 3.1 Driver Authentication & Access

- [ ] **Access Driver View**: Navigate to `/driver-view/:driverId` in browser
  - Use driverId from created driver
  - Verify mobile-responsive interface
- [ ] **API Authentication**: Test driver APIs using driverId in URL path

### 3.2 Order Management

- [ ] **View Assigned Orders**: GET `/api/driver/:driverId/orders/assigned`
  - Initially empty until Mitra assigns order
- [ ] **Accept Order**: POST `/api/driver/:driverId/orders/:orderId/accept`
  - Verify order status changes to ACCEPTED_BY_DRIVER
  - Check status update appears in user tracking
- [ ] **Reject Order** (test with another order): POST `/api/driver/:driverId/orders/:orderId/reject`
  - Verify order becomes available for other drivers

### 3.3 Order Execution Flow

- [ ] **Update Status - Arrived at Pickup**:
  - POST `/api/driver/:driverId/orders/:orderId/update-status`
  - `newStatus: "DRIVER_AT_PICKUP"`
- [ ] **Update Status - Pickup with Photo**:
  - Request upload URL: POST `/api/driver/:driverId/orders/:orderId/request-upload-url`
  - Upload test image to R2 using presigned URL
  - Update status: `newStatus: "PICKED_UP", photoR2Key: <uploaded_key>`
- [ ] **Update Status - In Transit**: `newStatus: "IN_TRANSIT"`
- [ ] **Update Status - Arrived at Dropoff**: `newStatus: "DRIVER_AT_DROPOFF"`
- [ ] **Update Status - Delivery with Photo**:
  - Upload delivery proof photo
  - Update status: `newStatus: "DELIVERED", photoR2Key: <delivery_proof_key>`
- [ ] **Add Order Note**: POST `/api/driver/:driverId/orders/:orderId/add-note`

### 3.4 Cross-Flow Verification

- [ ] **User Tracking Updates**: After each driver status update, verify user tracking shows updated status
- [ ] **Mitra Order View Updates**: Verify Mitra can see driver progress in order details

---

## 4. 🔒 Security & Error Handling

### 4.1 Authentication Testing

- [ ] **Mitra API Protection**: Try accessing Mitra endpoints without auth headers (expect 401)
- [ ] **Driver API Protection**: Try accessing driver endpoints with wrong driverId (expect 403)
- [ ] **Cross-Mitra Access**: Try accessing other Mitra's resources (expect 403)

### 4.2 Validation Testing

- [ ] **Invalid JSON Payloads**: Send malformed JSON (expect 400)
- [ ] **Schema Validation**: Send data violating Zod schemas (expect validation errors)
- [ ] **Business Rule Validation**:
  - Try assigning driver to service they're not qualified for
  - Try invalid order status transitions
  - Try exceeding talangan limits

### 4.3 Error Response Format

- [ ] **Consistent Error Format**: All errors return `{ success: false, error: string, errorCode?: string }`
- [ ] **Helpful Error Messages**: Validation errors include specific field issues

---

## 5. 📱 Frontend Responsiveness & UX

### 5.1 Mitra Admin Interface

- [ ] **Desktop View**: Forms and tables display correctly on 1200px+ screens
- [ ] **Tablet View**: Interface adapts appropriately on 768px screens
- [ ] **Service Config Forms**: Complex configJson forms render and validate properly

### 5.2 Driver View Interface

- [ ] **Mobile Portrait**: Primary interface optimized for 375px width
- [ ] **Mobile Landscape**: Interface remains usable in landscape
- [ ] **Touch Interactions**: Buttons and form elements appropriately sized

### 5.3 User Public Interface

- [ ] **Order Forms**: Dynamic forms render based on service configuration
- [ ] **Order Tracking**: Tracking page displays status updates clearly
- [ ] **Mobile Optimization**: Order placement flow works smoothly on mobile

---

## 6. 🔗 Integration Points

### 6.1 WhatsApp Deep Links

- [ ] **Receiver Notifications**: WA deep links generated with correct format
- [ ] **Link Functionality**: Test deep links in mobile browser (should open WhatsApp)
- [ ] **Message Templates**: Verify message content includes order details

### 6.2 File Upload Flow

- [ ] **Photo Upload**: Complete flow from request-upload-url to R2 storage
- [ ] **File Access**: Verify uploaded files accessible via generated URLs
- [ ] **File Validation**: Test file size and type restrictions

---

## 7. 📊 Data Consistency

### 7.1 Order Events Audit Trail

- [ ] **Event Generation**: Verify all order state changes generate orderEvents
- [ ] **Event Data**: Check event dataJson contains appropriate information
- [ ] **Event Ordering**: Events appear in correct chronological order

### 7.2 Transactional Integrity

- [ ] **Driver Assignment**: Assignment operations are atomic
- [ ] **Order Creation**: Order and initial event created together
- [ ] **Status Updates**: Status changes and events generated atomically

---

## ✅ QA Sign-off Criteria

Before marking a feature branch as complete:

1. **All relevant test cases passed** based on the feature changes
2. **API verification script passes**: `pnpm test:api:local` with all tests green
3. **No console errors** in browser during manual testing
4. **Pre-commit hooks pass** for final commits
5. **Documentation updated** if new endpoints or flows added

## 📝 QA Notes Template

```
QA Execution Date: ___________
Feature Branch: _____________
Tester: ____________________

Manual Test Results:
- Mitra Flow: ☐ Pass ☐ Fail (Issues: _________)
- User Flow: ☐ Pass ☐ Fail (Issues: _________)
- Driver Flow: ☐ Pass ☐ Fail (Issues: _________)
- Security Tests: ☐ Pass ☐ Fail (Issues: _________)
- Frontend Responsiveness: ☐ Pass ☐ Fail (Issues: _________)

API Test Results:
- Newman Collection: ☐ Pass ☐ Fail (Failed Tests: _________)

Overall Result: ☐ Ready for Review ☐ Needs Fixes

Issues Found:
1. ________________________________
2. ________________________________
3. ________________________________
```
