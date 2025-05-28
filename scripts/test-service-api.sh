#!/bin/bash

# Test script for Mitra Service Configuration API
# This script tests all CRUD operations for the service endpoints

BASE_URL="http://localhost:8787"
TEST_EMAIL="test@example.com"

echo "🧪 Testing Mitra Service Configuration API (CRUD)"
echo "=================================================="

# Test 1: Create Mitra Profile (prerequisite)
echo "📝 Step 1: Creating Mitra profile..."
MITRA_RESPONSE=$(curl -s -X POST "$BASE_URL/api/mitra/profile" \
  -H "Content-Type: application/json" \
  -H "cf-access-authenticated-user-email: $TEST_EMAIL" \
  -d '{"name": "Test Mitra Company"}')

echo "Mitra Profile Response: $MITRA_RESPONSE"
echo ""

# Test 2: List Services (should be empty initially)
echo "📋 Step 2: Listing services (should be empty)..."
curl -s -X GET "$BASE_URL/api/mitra/services" \
  -H "Content-Type: application/json" \
  -H "cf-access-authenticated-user-email: $TEST_EMAIL" | jq '.'
echo ""

# Test 3: Create a Service
echo "➕ Step 3: Creating a new service..."
SERVICE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/mitra/services" \
  -H "Content-Type: application/json" \
  -H "cf-access-authenticated-user-email: $TEST_EMAIL" \
  -d '{
    "name": "Express Motor Service",
    "serviceTypeKey": "P2P_EXPRESS_MOTOR",
    "configJson": {
      "serviceTypeAlias": "Motor Express",
      "modelBisnis": "USAHA_SENDIRI",
      "angkutanUtama": "MOTOR",
      "driverGenderConstraint": "SEMUA",
      "modelRute": "DYNAMIC_P2P",
      "privasiMassal": "PRIVATE_SINGLE_ORDER",
      "waktuLayananDefault": "EXPRESS_NOW",
      "allowedModelOrder": ["PANGGIL_KE_ORDERER", "JEMPUT_ANTAR_LAIN"],
      "penanggungJawabOrder": "KETEMU_LANGSUNG",
      "fiturTalangan": {
        "enabled": true,
        "maxAmount": 100000
      },
      "alurLayanan": "DIRECT_PICKUP_DELIVER",
      "isBarangPentingDefault": false,
      "jangkauanLayanan": {
        "maxDistanceKm": 50,
        "kotaCoverage": ["Jakarta Pusat", "Jakarta Selatan"]
      },
      "pricing": {
        "biayaAdminPerOrder": 2000,
        "modelHargaJarak": "PER_KM",
        "biayaPerKm": 3000
      },
      "allowedMuatan": [
        {
          "muatanId": "DOKUMEN",
          "namaTampil": "Dokumen",
          "biayaHandlingTambahan": 0
        },
        {
          "muatanId": "MAKANAN",
          "namaTampil": "Makanan",
          "biayaHandlingTambahan": 1000
        }
      ]
    },
    "isActive": true
  }')

echo "Service Creation Response: $SERVICE_RESPONSE"
SERVICE_ID=$(echo $SERVICE_RESPONSE | jq -r '.data.id // empty')
echo "Created Service ID: $SERVICE_ID"
echo ""

# Test 4: List Services (should show the created service)
echo "📋 Step 4: Listing services (should show 1 service)..."
curl -s -X GET "$BASE_URL/api/mitra/services" \
  -H "Content-Type: application/json" \
  -H "cf-access-authenticated-user-email: $TEST_EMAIL" | jq '.'
echo ""

# Test 5: Get Specific Service
if [ ! -z "$SERVICE_ID" ]; then
  echo "🔍 Step 5: Getting specific service by ID..."
  curl -s -X GET "$BASE_URL/api/mitra/services/$SERVICE_ID" \
    -H "Content-Type: application/json" \
    -H "cf-access-authenticated-user-email: $TEST_EMAIL" | jq '.'
  echo ""
fi

# Test 6: Update Service
if [ ! -z "$SERVICE_ID" ]; then
  echo "✏️ Step 6: Updating service..."
  curl -s -X PUT "$BASE_URL/api/mitra/services/$SERVICE_ID" \
    -H "Content-Type: application/json" \
    -H "cf-access-authenticated-user-email: $TEST_EMAIL" \
    -d '{
      "name": "Updated Express Motor Service",
      "configJson": {
        "serviceTypeAlias": "Updated Motor Express",
        "modelBisnis": "USAHA_SENDIRI",
        "angkutanUtama": "MOTOR",
        "driverGenderConstraint": "SEMUA",
        "modelRute": "DYNAMIC_P2P",
        "privasiMassal": "PRIVATE_SINGLE_ORDER",
        "waktuLayananDefault": "EXPRESS_NOW",
        "allowedModelOrder": ["PANGGIL_KE_ORDERER", "JEMPUT_ANTAR_LAIN", "AMBIL_ANTAR_ORDERER"],
        "penanggungJawabOrder": "KETEMU_LANGSUNG",
        "fiturTalangan": {
          "enabled": true,
          "maxAmount": 150000
        },
        "alurLayanan": "DIRECT_PICKUP_DELIVER",
        "isBarangPentingDefault": false,
        "jangkauanLayanan": {
          "maxDistanceKm": 75,
          "kotaCoverage": ["Jakarta Pusat", "Jakarta Selatan", "Jakarta Timur"]
        },
        "pricing": {
          "biayaAdminPerOrder": 2500,
          "modelHargaJarak": "PER_KM",
          "biayaPerKm": 3500
        },
        "allowedMuatan": [
          {
            "muatanId": "DOKUMEN",
            "namaTampil": "Dokumen",
            "biayaHandlingTambahan": 0
          },
          {
            "muatanId": "MAKANAN",
            "namaTampil": "Makanan",
            "biayaHandlingTambahan": 1500
          },
          {
            "muatanId": "PAKET",
            "namaTampil": "Paket Kecil",
            "biayaHandlingTambahan": 2000
          }
        ]
      }
    }' | jq '.'
  echo ""
fi

# Test 7: Test Invalid Service ID
echo "❌ Step 7: Testing invalid service ID (should return 400)..."
curl -s -X GET "$BASE_URL/api/mitra/services/invalid-id" \
  -H "Content-Type: application/json" \
  -H "cf-access-authenticated-user-email: $TEST_EMAIL" | jq '.'
echo ""

# Test 8: Test Non-existent Service ID
echo "❌ Step 8: Testing non-existent service ID (should return 404)..."
curl -s -X GET "$BASE_URL/api/mitra/services/cm123456789012345678" \
  -H "Content-Type: application/json" \
  -H "cf-access-authenticated-user-email: $TEST_EMAIL" | jq '.'
echo ""

# Test 9: Delete Service
if [ ! -z "$SERVICE_ID" ]; then
  echo "🗑️ Step 9: Deleting service..."
  curl -s -X DELETE "$BASE_URL/api/mitra/services/$SERVICE_ID" \
    -H "Content-Type: application/json" \
    -H "cf-access-authenticated-user-email: $TEST_EMAIL" | jq '.'
  echo ""
fi

# Test 10: Verify Service is Deleted
echo "✅ Step 10: Verifying service is deleted (should be empty list)..."
curl -s -X GET "$BASE_URL/api/mitra/services" \
  -H "Content-Type: application/json" \
  -H "cf-access-authenticated-user-email: $TEST_EMAIL" | jq '.'
echo ""

echo "🎉 All tests completed!" 