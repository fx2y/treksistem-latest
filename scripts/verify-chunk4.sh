#!/bin/bash

# Chunk 4 Verification Script (IS9, IS10, IS11)
# 
# This script provides manual verification instructions for:
# - IS9: Mitra Order Viewing & Basic Management API
# - IS10: Distance Calculation Utility (Haversine Implementation)  
# - IS11: Public API to Fetch Service Configuration
#
# Prerequisites:
# 1. Worker running locally: `pnpm dev` in apps/worker
# 2. D1 database initialized with schema
# 3. Test data seeded (see instructions below)

set -e

# Configuration
API_BASE_URL="http://localhost:8787"
MITRA_EMAIL="mitra_owner_1@example.com"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_api_health() {
    log_info "Checking API health..."
    if curl -s "${API_BASE_URL}/api/health" > /dev/null; then
        log_success "API is running"
    else
        log_error "API is not responding. Make sure worker is running with 'pnpm dev'"
        exit 1
    fi
}

# Test data setup instructions
setup_test_data() {
    log_info "Setting up test data..."
    
    # Create Mitra profile
    log_info "Creating Mitra profile..."
    MITRA_RESPONSE=$(curl -s -X POST "${API_BASE_URL}/api/mitra/profile" \
        -H "Content-Type: application/json" \
        -H "Cf-Access-Authenticated-User-Email: ${MITRA_EMAIL}" \
        -d '{"name": "Test Mitra 1"}')
    
    MITRA_ID=$(echo "$MITRA_RESPONSE" | jq -r '.data.id')
    if [ "$MITRA_ID" = "null" ]; then
        log_error "Failed to create Mitra profile"
        echo "$MITRA_RESPONSE" | jq .
        exit 1
    fi
    log_success "Created Mitra: $MITRA_ID"
    
    # Create services
    log_info "Creating test services..."
    
    # Public Active Service
    PUBLIC_SERVICE_RESPONSE=$(curl -s -X POST "${API_BASE_URL}/api/mitra/services" \
        -H "Content-Type: application/json" \
        -H "Cf-Access-Authenticated-User-Email: ${MITRA_EMAIL}" \
        -d '{
            "name": "Public Active Service",
            "serviceTypeKey": "DELIVERY",
            "configJson": {
                "modelBisnis": "PUBLIC_3RD_PARTY",
                "pricing": {
                    "modelHargaJarak": "PER_KM",
                    "biayaPerKm": 2500
                }
            },
            "isActive": true
        }')
    
    SERVICE_ID_PUBLIC_ACTIVE=$(echo "$PUBLIC_SERVICE_RESPONSE" | jq -r '.data.id')
    log_success "Created Public Active Service: $SERVICE_ID_PUBLIC_ACTIVE"
    
    # Internal Active Service
    INTERNAL_SERVICE_RESPONSE=$(curl -s -X POST "${API_BASE_URL}/api/mitra/services" \
        -H "Content-Type: application/json" \
        -H "Cf-Access-Authenticated-User-Email: ${MITRA_EMAIL}" \
        -d '{
            "name": "Internal Active Service",
            "serviceTypeKey": "DELIVERY",
            "configJson": {
                "modelBisnis": "USAHA_SENDIRI",
                "pricing": {
                    "modelHargaJarak": "FLAT",
                    "biayaFlat": 10000
                }
            },
            "isActive": true
        }')
    
    SERVICE_ID_INTERNAL_ACTIVE=$(echo "$INTERNAL_SERVICE_RESPONSE" | jq -r '.data.id')
    log_success "Created Internal Active Service: $SERVICE_ID_INTERNAL_ACTIVE"
    
    # Public Inactive Service
    INACTIVE_SERVICE_RESPONSE=$(curl -s -X POST "${API_BASE_URL}/api/mitra/services" \
        -H "Content-Type: application/json" \
        -H "Cf-Access-Authenticated-User-Email: ${MITRA_EMAIL}" \
        -d '{
            "name": "Public Inactive Service",
            "serviceTypeKey": "DELIVERY",
            "configJson": {
                "modelBisnis": "PUBLIC_3RD_PARTY",
                "pricing": {
                    "modelHargaJarak": "PER_KM",
                    "biayaPerKm": 3000
                }
            },
            "isActive": false
        }')
    
    SERVICE_ID_PUBLIC_INACTIVE=$(echo "$INACTIVE_SERVICE_RESPONSE" | jq -r '.data.id')
    log_success "Created Public Inactive Service: $SERVICE_ID_PUBLIC_INACTIVE"
    
    # Create driver
    log_info "Creating test driver..."
    DRIVER_RESPONSE=$(curl -s -X POST "${API_BASE_URL}/api/mitra/drivers" \
        -H "Content-Type: application/json" \
        -H "Cf-Access-Authenticated-User-Email: ${MITRA_EMAIL}" \
        -d '{
            "name": "Test Driver 1",
            "identifier": "DRV001",
            "configJson": {},
            "isActive": true
        }')
    
    DRIVER_ID=$(echo "$DRIVER_RESPONSE" | jq -r '.data.id')
    log_success "Created Driver: $DRIVER_ID"
    
    # Assign driver to service
    log_info "Assigning driver to service..."
    curl -s -X POST "${API_BASE_URL}/api/mitra/drivers/${DRIVER_ID}/assign-service" \
        -H "Content-Type: application/json" \
        -H "Cf-Access-Authenticated-User-Email: ${MITRA_EMAIL}" \
        -d "{\"serviceId\": \"$SERVICE_ID_PUBLIC_ACTIVE\"}" > /dev/null
    
    # Create test orders
    log_info "Creating test orders..."
    
    ORDER_RESPONSE_1=$(curl -s -X POST "${API_BASE_URL}/api/orders/place" \
        -H "Content-Type: application/json" \
        -d "{
            \"serviceId\": \"$SERVICE_ID_PUBLIC_ACTIVE\",
            \"ordererIdentifier\": \"user123\",
            \"detailsJson\": {
                \"pickupAddress\": {\"text\": \"Pickup Location\", \"lat\": -6.2088, \"lon\": 106.8456},
                \"dropoffAddress\": {\"text\": \"Dropoff Location\", \"lat\": -6.9175, \"lon\": 107.6191}
            }
        }")
    
    ORDER_ID_1=$(echo "$ORDER_RESPONSE_1" | jq -r '.data.id')
    log_success "Created Order 1: $ORDER_ID_1"
    
    ORDER_RESPONSE_2=$(curl -s -X POST "${API_BASE_URL}/api/orders/place" \
        -H "Content-Type: application/json" \
        -d "{
            \"serviceId\": \"$SERVICE_ID_PUBLIC_ACTIVE\",
            \"ordererIdentifier\": \"user456\",
            \"detailsJson\": {
                \"pickupAddress\": {\"text\": \"Pickup Location 2\", \"lat\": -6.2088, \"lon\": 106.8456},
                \"dropoffAddress\": {\"text\": \"Dropoff Location 2\", \"lat\": -6.9175, \"lon\": 107.6191}
            }
        }")
    
    ORDER_ID_2=$(echo "$ORDER_RESPONSE_2" | jq -r '.data.id')
    log_success "Created Order 2: $ORDER_ID_2"
    
    # Export variables for verification tests
    export MITRA_ID
    export SERVICE_ID_PUBLIC_ACTIVE
    export SERVICE_ID_INTERNAL_ACTIVE
    export SERVICE_ID_PUBLIC_INACTIVE
    export DRIVER_ID
    export ORDER_ID_1
    export ORDER_ID_2
    
    log_success "Test data setup complete!"
}

# IS10: Distance Calculation Utility Verification
verify_distance_calculation() {
    log_info "=== IS10: Distance Calculation Utility Verification ==="
    
    log_info "Testing Haversine distance calculation (London to Paris)..."
    log_info "Expected: ~343-344 km"
    
    # Note: Since the distance calculation is a utility function, we can't test it directly via API
    # It would be tested through the order placement API that uses it for cost estimation
    log_warning "Distance calculation is a utility function - tested indirectly through order placement"
    
    log_info "Manual verification:"
    echo "1. Check that order placement calculates estimated costs based on distance"
    echo "2. Verify coordinates are validated (lat: -90 to 90, lon: -180 to 180)"
    echo "3. Same point should return 0 distance"
}

# IS11: Public Service Configuration API Verification
verify_public_service_config() {
    log_info "=== IS11: Public Service Configuration API Verification ==="
    
    log_info "1. Testing public, active service configuration fetch..."
    RESPONSE=$(curl -s "${API_BASE_URL}/api/public/services/${SERVICE_ID_PUBLIC_ACTIVE}/config")
    STATUS=$(echo "$RESPONSE" | jq -r '.success')
    
    if [ "$STATUS" = "true" ]; then
        log_success "✓ Public active service config fetched successfully"
        echo "$RESPONSE" | jq '.data | {serviceId, name, mitraName, isActive, modelBisnis: .configJson.modelBisnis}'
    else
        log_error "✗ Failed to fetch public active service config"
        echo "$RESPONSE" | jq .
    fi
    
    log_info "2. Testing internal (non-public) service - should return 404..."
    RESPONSE=$(curl -s -w "%{http_code}" "${API_BASE_URL}/api/public/services/${SERVICE_ID_INTERNAL_ACTIVE}/config" -o /tmp/response.json)
    HTTP_CODE="${RESPONSE: -3}"
    
    if [ "$HTTP_CODE" = "404" ]; then
        log_success "✓ Internal service correctly returns 404"
    else
        log_error "✗ Internal service should return 404, got: $HTTP_CODE"
        cat /tmp/response.json | jq .
    fi
    
    log_info "3. Testing inactive public service - should return 404..."
    RESPONSE=$(curl -s -w "%{http_code}" "${API_BASE_URL}/api/public/services/${SERVICE_ID_PUBLIC_INACTIVE}/config" -o /tmp/response.json)
    HTTP_CODE="${RESPONSE: -3}"
    
    if [ "$HTTP_CODE" = "404" ]; then
        log_success "✓ Inactive service correctly returns 404"
    else
        log_error "✗ Inactive service should return 404, got: $HTTP_CODE"
        cat /tmp/response.json | jq .
    fi
    
    log_info "4. Testing non-existent service - should return 404..."
    FAKE_ID="clxyz123456789abcdef"
    RESPONSE=$(curl -s -w "%{http_code}" "${API_BASE_URL}/api/public/services/${FAKE_ID}/config" -o /tmp/response.json)
    HTTP_CODE="${RESPONSE: -3}"
    
    if [ "$HTTP_CODE" = "404" ]; then
        log_success "✓ Non-existent service correctly returns 404"
    else
        log_error "✗ Non-existent service should return 404, got: $HTTP_CODE"
        cat /tmp/response.json | jq .
    fi
    
    log_info "5. Testing invalid service ID format - should return 400..."
    RESPONSE=$(curl -s -w "%{http_code}" "${API_BASE_URL}/api/public/services/invalid-id/config" -o /tmp/response.json)
    HTTP_CODE="${RESPONSE: -3}"
    
    if [ "$HTTP_CODE" = "400" ]; then
        log_success "✓ Invalid service ID correctly returns 400"
    else
        log_error "✗ Invalid service ID should return 400, got: $HTTP_CODE"
        cat /tmp/response.json | jq .
    fi
}

# IS9: Mitra Order Management API Verification
verify_mitra_order_management() {
    log_info "=== IS9: Mitra Order Management API Verification ==="
    
    log_info "1. Testing order list (no filters)..."
    RESPONSE=$(curl -s "${API_BASE_URL}/api/mitra/orders" \
        -H "Cf-Access-Authenticated-User-Email: ${MITRA_EMAIL}")
    
    ORDER_COUNT=$(echo "$RESPONSE" | jq '.data.orders | length')
    if [ "$ORDER_COUNT" -ge 2 ]; then
        log_success "✓ Listed $ORDER_COUNT orders for Mitra"
        echo "$RESPONSE" | jq '.data.orders[] | {id, status, serviceId}'
    else
        log_error "✗ Expected at least 2 orders, got: $ORDER_COUNT"
        echo "$RESPONSE" | jq .
    fi
    
    log_info "2. Testing order list with status filter..."
    RESPONSE=$(curl -s "${API_BASE_URL}/api/mitra/orders?status=PENDING" \
        -H "Cf-Access-Authenticated-User-Email: ${MITRA_EMAIL}")
    
    PENDING_COUNT=$(echo "$RESPONSE" | jq '.data.orders | length')
    log_success "✓ Found $PENDING_COUNT pending orders"
    
    log_info "3. Testing order list with service filter..."
    RESPONSE=$(curl -s "${API_BASE_URL}/api/mitra/orders?serviceId=${SERVICE_ID_PUBLIC_ACTIVE}" \
        -H "Cf-Access-Authenticated-User-Email: ${MITRA_EMAIL}")
    
    SERVICE_COUNT=$(echo "$RESPONSE" | jq '.data.orders | length')
    log_success "✓ Found $SERVICE_COUNT orders for specific service"
    
    log_info "4. Testing specific order details..."
    RESPONSE=$(curl -s "${API_BASE_URL}/api/mitra/orders/${ORDER_ID_1}" \
        -H "Cf-Access-Authenticated-User-Email: ${MITRA_EMAIL}")
    
    ORDER_ID_RETURNED=$(echo "$RESPONSE" | jq -r '.data.id')
    if [ "$ORDER_ID_RETURNED" = "$ORDER_ID_1" ]; then
        log_success "✓ Retrieved specific order details"
        echo "$RESPONSE" | jq '.data | {id, status, service: .service.name, events: (.events | length)}'
    else
        log_error "✗ Failed to retrieve order details"
        echo "$RESPONSE" | jq .
    fi
    
    log_info "5. Testing driver assignment..."
    RESPONSE=$(curl -s -X POST "${API_BASE_URL}/api/mitra/orders/${ORDER_ID_2}/assign-driver" \
        -H "Content-Type: application/json" \
        -H "Cf-Access-Authenticated-User-Email: ${MITRA_EMAIL}" \
        -d "{\"driverId\": \"$DRIVER_ID\"}")
    
    ASSIGNED_DRIVER=$(echo "$RESPONSE" | jq -r '.data.driverId')
    if [ "$ASSIGNED_DRIVER" = "$DRIVER_ID" ]; then
        log_success "✓ Successfully assigned driver to order"
        echo "$RESPONSE" | jq '.data | {id, driverId, status}'
    else
        log_error "✗ Failed to assign driver"
        echo "$RESPONSE" | jq .
    fi
    
    log_info "6. Testing assignment to non-existent driver..."
    FAKE_DRIVER_ID="clxyz123456789abcdef"
    RESPONSE=$(curl -s -w "%{http_code}" -X POST "${API_BASE_URL}/api/mitra/orders/${ORDER_ID_1}/assign-driver" \
        -H "Content-Type: application/json" \
        -H "Cf-Access-Authenticated-User-Email: ${MITRA_EMAIL}" \
        -d "{\"driverId\": \"$FAKE_DRIVER_ID\"}" -o /tmp/response.json)
    HTTP_CODE="${RESPONSE: -3}"
    
    if [ "$HTTP_CODE" = "404" ]; then
        log_success "✓ Non-existent driver correctly returns 404"
    else
        log_error "✗ Non-existent driver should return 404, got: $HTTP_CODE"
        cat /tmp/response.json | jq .
    fi
    
    log_info "7. Testing authorization - different Mitra email..."
    RESPONSE=$(curl -s -w "%{http_code}" "${API_BASE_URL}/api/mitra/orders" \
        -H "Cf-Access-Authenticated-User-Email: different_mitra@example.com" -o /tmp/response.json)
    HTTP_CODE="${RESPONSE: -3}"
    
    if [ "$HTTP_CODE" = "404" ] || [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ]; then
        log_success "✓ Different Mitra correctly denied access (HTTP $HTTP_CODE)"
    elif [ "$HTTP_CODE" = "200" ]; then
        ORDER_COUNT=$(cat /tmp/response.json | jq '.data.orders | length')
        if [ "$ORDER_COUNT" = "0" ]; then
            log_success "✓ Different Mitra sees no orders (proper isolation)"
        else
            log_error "✗ Different Mitra should not see orders from other Mitras"
        fi
    else
        log_error "✗ Unexpected response for different Mitra: $HTTP_CODE"
        cat /tmp/response.json | jq .
    fi
}

# Database verification
verify_database_state() {
    log_info "=== Database State Verification ==="
    
    log_info "Checking database records..."
    
    if command -v wrangler &> /dev/null; then
        log_info "Verifying order events were created..."
        wrangler d1 execute TREKSISTEM_DB --local --command \
            "SELECT COUNT(*) as event_count FROM orderEvents WHERE orderId IN ('$ORDER_ID_1', '$ORDER_ID_2');"
        
        log_info "Verifying driver assignment in database..."
        wrangler d1 execute TREKSISTEM_DB --local --command \
            "SELECT id, driverId, status FROM orders WHERE id = '$ORDER_ID_2';"
        
        log_info "Verifying driver-service relationship..."
        wrangler d1 execute TREKSISTEM_DB --local --command \
            "SELECT * FROM driverServices WHERE driverId = '$DRIVER_ID' AND serviceId = '$SERVICE_ID_PUBLIC_ACTIVE';"
    else
        log_warning "Wrangler not found - skipping database verification"
        log_info "To verify database state manually, run:"
        echo "  wrangler d1 execute TREKSISTEM_DB --local --command \"SELECT * FROM orders;\""
        echo "  wrangler d1 execute TREKSISTEM_DB --local --command \"SELECT * FROM orderEvents;\""
    fi
}

# Cleanup function
cleanup_test_data() {
    log_info "=== Cleanup Test Data ==="
    
    if [ -n "$MITRA_ID" ]; then
        log_info "Cleaning up test data..."
        
        # Delete orders (will cascade to events)
        if command -v wrangler &> /dev/null; then
            wrangler d1 execute TREKSISTEM_DB --local --command \
                "DELETE FROM orders WHERE mitraId = '$MITRA_ID';" || true
            
            # Delete driver service assignments
            wrangler d1 execute TREKSISTEM_DB --local --command \
                "DELETE FROM driverServices WHERE driverId = '$DRIVER_ID';" || true
            
            # Delete drivers
            wrangler d1 execute TREKSISTEM_DB --local --command \
                "DELETE FROM drivers WHERE mitraId = '$MITRA_ID';" || true
            
            # Delete services
            wrangler d1 execute TREKSISTEM_DB --local --command \
                "DELETE FROM services WHERE mitraId = '$MITRA_ID';" || true
            
            # Delete mitra
            wrangler d1 execute TREKSISTEM_DB --local --command \
                "DELETE FROM mitras WHERE id = '$MITRA_ID';" || true
            
            log_success "Test data cleaned up"
        else
            log_warning "Wrangler not found - manual cleanup required"
        fi
    fi
}

# Main execution
main() {
    log_info "Starting Chunk 4 Verification (IS9, IS10, IS11)"
    log_info "=============================================="
    
    # Check prerequisites
    check_api_health
    
    # Setup test data
    setup_test_data
    
    # Run verification tests
    verify_distance_calculation
    echo
    verify_public_service_config
    echo
    verify_mitra_order_management
    echo
    verify_database_state
    
    # Cleanup
    if [ "${SKIP_CLEANUP:-false}" != "true" ]; then
        echo
        cleanup_test_data
    else
        log_info "Skipping cleanup (SKIP_CLEANUP=true)"
    fi
    
    log_success "Chunk 4 verification completed!"
    log_info "All tests should show ✓ for successful verification"
}

# Handle script termination
trap cleanup_test_data EXIT

# Check if jq is available
if ! command -v jq &> /dev/null; then
    log_error "jq is required but not installed. Please install jq first."
    exit 1
fi

# Run main function
main "$@" 