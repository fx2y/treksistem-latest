#!/bin/bash

# Test script for Mitra Driver Management API
# Tests all CRUD operations and service assignment functionality

BASE_URL="http://localhost:8787"
MITRA_EMAIL="test-admin@example.com"
ANOTHER_EMAIL="another-admin@example.com"

echo "🚀 Testing Mitra Driver Management API"
echo "======================================="

# Helper function to make API calls
api_call() {
    local method=$1
    local endpoint=$2
    local email=$3
    local data=$4
    
    if [ -n "$data" ]; then
        curl -s -X "$method" "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -H "X-Mock-User-Email: $email" \
            -d "$data"
    else
        curl -s -X "$method" "$BASE_URL$endpoint" \
            -H "X-Mock-User-Email: $email"
    fi
}

echo
echo "📋 Step 1: Create Mitra Profile"
echo "--------------------------------"
MITRA_RESPONSE=$(api_call "POST" "/api/mitra/profile" "$MITRA_EMAIL" '{"name": "Test Mitra Company"}')
echo "$MITRA_RESPONSE" | jq
MITRA_ID=$(echo "$MITRA_RESPONSE" | jq -r '.data.id')

echo
echo "📋 Step 2: Create Service for Testing"
echo "-------------------------------------"
SERVICE_RESPONSE=$(api_call "POST" "/api/mitra/services" "$MITRA_EMAIL" '{
    "name": "Express Delivery", 
    "serviceTypeKey": "P2P_EXPRESS", 
    "configJson": {
        "serviceTypeAlias": "Express Delivery",
        "modelBisnis": "USAHA_SENDIRI",
        "angkutanUtama": "motorcycle",
        "modelRute": "DYNAMIC_P2P",
        "privasiMassal": "PRIVATE_SINGLE_ORDER",
        "waktuLayananDefault": "EXPRESS_NOW",
        "allowedModelOrder": ["PANGGIL_KE_ORDERER"],
        "penanggungJawabOrder": "KETEMU_LANGSUNG",
        "fiturTalangan": {"enabled": false},
        "alurLayanan": "DIRECT_PICKUP_DELIVER",
        "jangkauanLayanan": {"maxDistanceKm": 50},
        "pricing": {"biayaAdminPerOrder": 5000, "modelHargaJarak": "PER_KM", "biayaPerKm": 2000}
    }
}')
echo "$SERVICE_RESPONSE" | jq
SERVICE_ID=$(echo "$SERVICE_RESPONSE" | jq -r '.data.id')

echo
echo "🚗 Step 3: Create Driver"
echo "------------------------"
DRIVER_RESPONSE=$(api_call "POST" "/api/mitra/drivers" "$MITRA_EMAIL" '{
    "identifier": "driver001",
    "name": "John Doe",
    "configJson": {
        "vehicleType": "motorcycle",
        "licensePlate": "B1234XYZ"
    }
}')
echo "$DRIVER_RESPONSE" | jq
DRIVER_ID=$(echo "$DRIVER_RESPONSE" | jq -r '.data.id')

echo
echo "📝 Step 4: List All Drivers"
echo "---------------------------"
api_call "GET" "/api/mitra/drivers" "$MITRA_EMAIL" | jq

echo
echo "🔍 Step 5: Get Specific Driver"
echo "------------------------------"
api_call "GET" "/api/mitra/drivers/$DRIVER_ID" "$MITRA_EMAIL" | jq

echo
echo "✏️ Step 6: Update Driver"
echo "------------------------"
api_call "PUT" "/api/mitra/drivers/$DRIVER_ID" "$MITRA_EMAIL" '{
    "name": "John Doe Updated",
    "configJson": {
        "vehicleType": "car",
        "licensePlate": "B5678ABC"
    }
}' | jq

echo
echo "🔗 Step 7: Assign Service to Driver"
echo "-----------------------------------"
api_call "POST" "/api/mitra/drivers/$DRIVER_ID/services" "$MITRA_EMAIL" "{\"serviceId\": \"$SERVICE_ID\"}" | jq

echo
echo "📋 Step 8: List Driver's Assigned Services"
echo "------------------------------------------"
api_call "GET" "/api/mitra/drivers/$DRIVER_ID/services" "$MITRA_EMAIL" | jq

echo
echo "❌ Step 9: Unassign Service from Driver"
echo "---------------------------------------"
api_call "DELETE" "/api/mitra/drivers/$DRIVER_ID/services/$SERVICE_ID" "$MITRA_EMAIL" | jq

echo
echo "✅ Step 10: Verify Service Unassigned"
echo "-------------------------------------"
api_call "GET" "/api/mitra/drivers/$DRIVER_ID/services" "$MITRA_EMAIL" | jq

echo
echo "🚫 Step 11: Test Error Cases"
echo "=============================="

echo
echo "11.1: Duplicate Driver Identifier"
echo "---------------------------------"
api_call "POST" "/api/mitra/drivers" "$MITRA_EMAIL" '{
    "identifier": "driver001",
    "name": "Jane Doe"
}' | jq

echo
echo "11.2: Invalid Driver ID Format"
echo "------------------------------"
api_call "GET" "/api/mitra/drivers/invalid-id" "$MITRA_EMAIL" | jq

echo
echo "11.3: Invalid Service ID Format"
echo "-------------------------------"
api_call "POST" "/api/mitra/drivers/$DRIVER_ID/services" "$MITRA_EMAIL" '{
    "serviceId": "invalid-service-id"
}' | jq

echo
echo "11.4: Cross-Mitra Authorization Test"
echo "------------------------------------"
echo "Creating another Mitra..."
ANOTHER_MITRA_RESPONSE=$(api_call "POST" "/api/mitra/profile" "$ANOTHER_EMAIL" '{"name": "Another Mitra Company"}')
echo "$ANOTHER_MITRA_RESPONSE" | jq

echo
echo "Trying to access first Mitra's drivers with second Mitra's credentials..."
api_call "GET" "/api/mitra/drivers" "$ANOTHER_EMAIL" | jq

echo
echo "Trying to assign service to driver from different Mitra..."
api_call "POST" "/api/mitra/drivers/$DRIVER_ID/services" "$ANOTHER_EMAIL" "{\"serviceId\": \"$SERVICE_ID\"}" | jq

echo
echo "🎉 All tests completed!"
echo "======================="
echo "Driver ID: $DRIVER_ID"
echo "Service ID: $SERVICE_ID"
echo "Mitra ID: $MITRA_ID" 