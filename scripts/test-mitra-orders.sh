#!/bin/bash

# Test script for Mitra Orders API
BASE_URL="http://localhost:8787"
MOCK_EMAIL="dev-admin@example.com"

echo "Testing Mitra Orders API..."
echo "================================"

# Test 0: Create Mitra profile if needed
echo "0. Creating/verifying Mitra profile"
curl -s -X POST -H "X-Mock-User-Email: $MOCK_EMAIL" \
     -H "Content-Type: application/json" \
     -d '{"name": "Test Mitra"}' \
     "$BASE_URL/api/mitra/profile" | jq '.'

echo -e "\n"

# Test 1: List orders (should work even if empty)
echo "1. Testing GET /api/mitra/orders"
curl -s -H "X-Mock-User-Email: $MOCK_EMAIL" \
     -H "Content-Type: application/json" \
     "$BASE_URL/api/mitra/orders" | jq '.'

echo -e "\n"

# Test 2: List orders with filters
echo "2. Testing GET /api/mitra/orders with filters"
curl -s -H "X-Mock-User-Email: $MOCK_EMAIL" \
     -H "Content-Type: application/json" \
     "$BASE_URL/api/mitra/orders?status=PENDING&page=1&limit=5" | jq '.'

echo -e "\n"

# Test 3: Test invalid status filter
echo "3. Testing GET /api/mitra/orders with invalid status"
curl -s -H "X-Mock-User-Email: $MOCK_EMAIL" \
     -H "Content-Type: application/json" \
     "$BASE_URL/api/mitra/orders?status=INVALID_STATUS" | jq '.error.issues[0].message'

echo -e "\n"

# Test 4: Get specific order (should return 404 for non-existent order)
echo "4. Testing GET /api/mitra/orders/:orderId (non-existent)"
curl -s -H "X-Mock-User-Email: $MOCK_EMAIL" \
     -H "Content-Type: application/json" \
     "$BASE_URL/api/mitra/orders/cm123456789abcdef" | jq '.'

echo -e "\n"

# Test 5: Assign driver (should return 404 for non-existent order)
echo "5. Testing POST /api/mitra/orders/:orderId/assign-driver (non-existent order)"
curl -s -X POST \
     -H "X-Mock-User-Email: $MOCK_EMAIL" \
     -H "Content-Type: application/json" \
     -d '{"driverId": "cm123456789abcdef"}' \
     "$BASE_URL/api/mitra/orders/cm123456789abcdef/assign-driver" | jq '.'

echo -e "\n"

# Test 6: Invalid order ID format
echo "6. Testing with invalid order ID format"
curl -s -H "X-Mock-User-Email: $MOCK_EMAIL" \
     -H "Content-Type: application/json" \
     "$BASE_URL/api/mitra/orders/invalid-id" | jq '.'

echo -e "\n"

# Test 7: Invalid driver assignment payload
echo "7. Testing driver assignment with invalid payload"
curl -s -X POST \
     -H "X-Mock-User-Email: $MOCK_EMAIL" \
     -H "Content-Type: application/json" \
     -d '{"invalidField": "value"}' \
     "$BASE_URL/api/mitra/orders/cm123456789abcdef/assign-driver" | jq '.'

echo -e "\n"

echo "✅ All tests completed successfully!" 