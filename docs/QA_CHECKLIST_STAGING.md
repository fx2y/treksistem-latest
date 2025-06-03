# Treksistem Staging Environment QA Checklist

This checklist must be executed after every deployment to staging or periodically for stability checks. All flows should be tested against the deployed staging environment using standard browsers to simulate end-user conditions.

## Prerequisites

- [ ] Staging worker deployed and accessible at staging URL
- [ ] Frontend apps deployed to Cloudflare Pages staging environments
- [ ] Database migrations applied to staging D1 database
- [ ] R2 staging bucket configured and accessible
- [ ] Cloudflare Access configured for staging (if applicable)

## 🔧 Environment Setup Verification

- [ ] Worker health check passes: `curl https://treksistem-api-staging.youraccount.workers.dev/api/health`
- [ ] Authentication headers work (CF Access or staging auth mechanism)
- [ ] Database connection functional in staging
- [ ] R2 staging bucket accessible for photo uploads
- [ ] CORS configured properly for staging frontend domains

---

## 1. 👤 Mitra Admin Flow

### 1.1 Profile Management

**Frontend URL**: `https://fe-mitra-admin-staging.pages.dev` (update with actual staging URL)

- [ ] **Login**: Access Mitra Admin interface via Cloudflare Access
- [ ] **Create Mitra Profile**:
  - Use staging API endpoint for profile creation
  - Verify profile created with correct ownerUserId linkage
- [ ] **View Mitra Profile**: Profile displays correctly in staging UI
- [ ] **Update Mitra Profile**: Profile updates persist correctly

### 1.2 Service Management

- [ ] **Create Service** ("Ojek Motor - Staging"):
  - Create service with staging-appropriate test data
  - Include pricing model: `PER_KM` with `biayaPerKm: 5000`
  - Enable talangan: `fiturTalangan.enabled: true, maxAmount: 50000`
  - Set `allowedModelOrder: ["PANGGIL_KE_ORDERER", "JEMPUT_ANTAR_LAIN"]`
- [ ] **View Service List**: Services display correctly in staging UI
- [ ] **View Service Details**: Service configuration renders properly
- [ ] **Update Service Configuration**: Updates persist and validate correctly
- [ ] **Verify Service Config Validation**: Invalid configs rejected with proper error messages

### 1.3 Driver Management

- [ ] **Create Driver**:
  - Create driver with staging test data
  - Include realistic vehicle information in configJson
- [ ] **View Driver List**: Drivers display correctly in staging UI
- [ ] **View Driver Details**: Driver information renders properly
- [ ] **Update Driver**: Updates persist correctly
- [ ] **Assign Driver to Service**: Assignment works via staging UI
- [ ] **Verify Driver-Service Assignment**: Assignment displays correctly
- [ ] **Remove Service Assignment**: Removal works via staging UI

### 1.4 Order Management

- [ ] **View Order List**: Orders display correctly (initially empty)
- [ ] **Filter Orders**: Filtering works with staging data
- [ ] **Assign Driver to Order**: Assignment works via staging UI
  - Use orders created in User Flow testing
  - Verify driver qualification validation
- [ ] **View Order Details**: Order information displays correctly

---

## 2. 🛒 End User Flow

### 2.1 Service Discovery

**Frontend URL**: `https://fe-user-public-staging.pages.dev` (update with actual staging URL)

- [ ] **View Public Service Config**: Service configuration loads correctly
  - Use serviceId from staging service
  - Verify configJson properly sanitized for public consumption
- [ ] **View Master Service Templates**: Templates load correctly

### 2.2 Order Placement

- [ ] **Place Order** for "Ojek Motor - Staging":
  - Use realistic staging addresses with valid lat/lon
  - Test with talangan: `talanganAmount: 25000` (within service limit)
  - Set `isBarangPenting: true` and include valid `receiverWaNumber`
- [ ] **Verify Order Creation**:
  - Order created successfully with staging data
  - Cost calculation works with Haversine distance
  - WA deep link generated correctly
- [ ] **Test Order Validation**:
  - Invalid serviceId returns proper 404
  - Talangan amount validation works
  - Required field validation works

### 2.3 Order Tracking

- [ ] **Track Order**: Order tracking page works correctly
  - Verify sanitized order data displayed
  - No sensitive information exposed
  - Order status updates correctly

---

## 3. 🚗 Driver Flow

### 3.1 Driver Authentication & Access

**Frontend URL**: `https://fe-driver-view-staging.pages.dev/driver-view/:driverId` (update with actual staging URL)

- [ ] **Access Driver View**: Mobile-responsive interface loads correctly
  - Use driverId from staging driver
  - Test on actual mobile devices/browsers
- [ ] **API Authentication**: Driver APIs work with staging authentication

### 3.2 Order Management

- [ ] **View Assigned Orders**: Orders display correctly in mobile interface
- [ ] **Accept Order**: Order acceptance works via staging UI
  - Verify order status changes to ACCEPTED_BY_DRIVER
  - Check status update appears in user tracking
- [ ] **Reject Order**: Order rejection works via staging UI
  - Verify order becomes available for other drivers

### 3.3 Order Execution Flow

- [ ] **Update Status - Arrived at Pickup**: Status update works via staging UI
- [ ] **Update Status - Pickup with Photo**:
  - Photo upload to staging R2 bucket works
  - Presigned URL generation works correctly
  - Status update with photo reference works
- [ ] **Update Status - In Transit**: Status update works
- [ ] **Update Status - Arrived at Dropoff**: Status update works
- [ ] **Update Status - Delivery with Photo**:
  - Delivery proof photo upload works
  - Final status update completes order
- [ ] **Add Order Note**: Note addition works via staging UI

### 3.4 Cross-Flow Verification

- [ ] **User Tracking Updates**: User tracking reflects driver status updates
- [ ] **Mitra Order View Updates**: Mitra admin sees driver progress updates

---

## 4. 🔒 Security & Error Handling

### 4.1 Authentication Testing

- [ ] **Mitra API Protection**: Unauthorized access properly blocked
- [ ] **Driver API Protection**: Invalid driver access properly blocked
- [ ] **Cross-Mitra Access**: Resource isolation works correctly

### 4.2 Validation Testing

- [ ] **Invalid JSON Payloads**: Proper error responses returned
- [ ] **Schema Validation**: Zod validation works correctly
- [ ] **Business Rule Validation**:
  - Driver qualification validation works
  - Order status transition validation works
  - Talangan limit validation works

### 4.3 Error Response Format

- [ ] **Consistent Error Format**: All errors follow standard format
- [ ] **Helpful Error Messages**: Validation errors are informative

---

## 5. 📱 Frontend Responsiveness & UX

### 5.1 Mitra Admin Interface

- [ ] **Desktop View**: Interface works correctly on desktop browsers
- [ ] **Tablet View**: Interface adapts properly on tablet devices
- [ ] **Service Config Forms**: Complex forms render and validate correctly

### 5.2 Driver View Interface

- [ ] **Mobile Portrait**: Interface optimized for mobile portrait mode
- [ ] **Mobile Landscape**: Interface remains usable in landscape
- [ ] **Touch Interactions**: Touch targets appropriately sized
- [ ] **Real Device Testing**: Test on actual mobile devices

### 5.3 User Public Interface

- [ ] **Order Forms**: Dynamic forms work correctly
- [ ] **Order Tracking**: Tracking interface displays properly
- [ ] **Mobile Optimization**: Order flow works smoothly on mobile

---

## 6. 🔗 Integration Points

### 6.1 WhatsApp Deep Links

- [ ] **Receiver Notifications**: WA deep links generated correctly
- [ ] **Link Functionality**: Deep links work on mobile browsers
- [ ] **Message Templates**: Message content includes correct staging data

### 6.2 File Upload Flow

- [ ] **Photo Upload**: Complete upload flow works with staging R2
- [ ] **File Access**: Uploaded files accessible via staging URLs
- [ ] **File Validation**: File restrictions work correctly

---

## 7. 📊 Data Consistency

### 7.1 Order Events Audit Trail

- [ ] **Event Generation**: Order state changes generate events correctly
- [ ] **Event Data**: Event dataJson contains appropriate information
- [ ] **Event Ordering**: Events appear in correct chronological order

### 7.2 Transactional Integrity

- [ ] **Driver Assignment**: Assignment operations are atomic
- [ ] **Order Creation**: Order and initial event created together
- [ ] **Status Updates**: Status changes and events generated atomically

---

## 8. 🌐 Staging-Specific Considerations

### 8.1 Environment Configuration

- [ ] **Environment Variables**: Staging-specific configs applied correctly
- [ ] **Database Isolation**: Staging data isolated from production
- [ ] **R2 Bucket Isolation**: Staging files isolated from production

### 8.2 Performance & Reliability

- [ ] **Response Times**: API responses within acceptable limits
- [ ] **Error Rates**: No unexpected errors during normal operations
- [ ] **Resource Usage**: Worker and database performance acceptable

### 8.3 Data Management

- [ ] **Test Data Cleanup**: Staging environment has clean test data
- [ ] **Data Privacy**: No production data in staging environment
- [ ] **Data Persistence**: Test data persists appropriately between tests

---

## ✅ Staging QA Sign-off Criteria

Before marking staging deployment as stable:

1. **All relevant test cases passed** for the deployed features
2. **API verification script passes**: `pnpm test:api:staging` with all tests green
3. **No console errors** in browser during manual testing on staging
4. **Cross-browser compatibility** verified on major browsers
5. **Mobile responsiveness** verified on actual devices
6. **Performance acceptable** for staging environment expectations

## 📝 Staging QA Notes Template

```
QA Execution Date: ___________
Staging Deployment Version: _____________
Tester: ____________________
Browser/Device Used: ____________________

Manual Test Results:
- Mitra Flow: ☐ Pass ☐ Fail (Issues: _________)
- User Flow: ☐ Pass ☐ Fail (Issues: _________)
- Driver Flow: ☐ Pass ☐ Fail (Issues: _________)
- Security Tests: ☐ Pass ☐ Fail (Issues: _________)
- Frontend Responsiveness: ☐ Pass ☐ Fail (Issues: _________)
- Mobile Testing: ☐ Pass ☐ Fail (Issues: _________)

API Test Results:
- Newman Collection (Staging): ☐ Pass ☐ Fail (Failed Tests: _________)

Performance Notes:
- API Response Times: _________ (acceptable/slow)
- UI Load Times: _________ (acceptable/slow)
- File Upload Performance: _________ (acceptable/slow)

Overall Result: ☐ Staging Stable ☐ Needs Fixes

Issues Found:
1. _________________________________
2. _________________________________
3. _________________________________

Recommendations:
1. _________________________________
2. _________________________________
```

## 🔄 Staging QA Execution Protocol

### After Every Staging Deployment:

1. **Automated API Verification**:

   ```bash
   pnpm test:api:staging
   ```

   - Review `postman/report-staging.html`
   - All tests must pass before proceeding

2. **Manual QA Execution**:

   - Execute relevant test cases from this checklist
   - Focus on changed functionality and critical paths
   - Test on multiple browsers and devices

3. **Issue Reporting**:

   - Report issues in project issue tracker
   - Tag with `staging` environment label
   - Include browser/device information

4. **Sign-off**:
   - Complete QA notes template
   - Get approval before promoting to production

### Periodic Stability Checks:

- Execute full checklist weekly
- Monitor staging environment health
- Verify data consistency and cleanup
- Update test data as needed
