#!/bin/bash

# Test script for Cloudflare Access authentication
# Usage: ./scripts/test-auth.sh [base_url]

BASE_URL=${1:-"http://localhost:8787"}

echo "🧪 Testing Cloudflare Access Authentication Implementation"
echo "Base URL: $BASE_URL"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test function
test_endpoint() {
    local method=$1
    local endpoint=$2
    local headers=$3
    local data=$4
    local expected_status=$5
    local description=$6
    
    echo -e "${YELLOW}Testing:${NC} $description"
    echo "  $method $endpoint"
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            $headers \
            -d "$data" \
            "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            $headers \
            "$BASE_URL$endpoint")
    fi
    
    # Split response and status code
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "  ${GREEN}✅ PASS${NC} (Status: $status_code)"
    else
        echo -e "  ${RED}❌ FAIL${NC} (Expected: $expected_status, Got: $status_code)"
        echo "  Response: $body"
    fi
    echo ""
}

echo "=== 1. Health Check (Unauthenticated) ==="
test_endpoint "GET" "/api/health" "" "" "200" "Health check should work without auth"

echo "=== 2. CF Access Test (Unauthenticated) ==="
test_endpoint "GET" "/api/test/cf-access" "" "" "401" "CF Access test should require authentication"

echo "=== 3. CF Access Test (Mock Authentication) ==="
test_endpoint "GET" "/api/test/cf-access" "-H 'X-Mock-User-Email: dev-admin@example.com'" "" "200" "CF Access test with mock authentication"

echo "=== 4. Mitra Auth Test (Unauthenticated) ==="
test_endpoint "GET" "/api/mitra/auth/test" "" "" "401" "Mitra auth test should require authentication"

echo "=== 5. Mitra Auth Test (Mock Authentication - No Mitra) ==="
test_endpoint "GET" "/api/mitra/auth/test" "-H 'X-Mock-User-Email: nonexistent@example.com'" "" "403" "Should fail if no Mitra record exists"

echo "=== 6. Mitra Auth Test (Mock Authentication - Valid Mitra) ==="
test_endpoint "GET" "/api/mitra/auth/test" "-H 'X-Mock-User-Email: dev-admin@example.com'" "" "200" "Should succeed with valid Mitra record"

echo "=== 7. Mitra Profile (Mock Authentication) ==="
test_endpoint "GET" "/api/mitra/profile" "-H 'X-Mock-User-Email: dev-admin@example.com'" "" "200" "Should get Mitra profile"

echo "=== 8. Mitra Services (Mock Authentication) ==="
test_endpoint "GET" "/api/mitra/services" "-H 'X-Mock-User-Email: dev-admin@example.com'" "" "200" "Should list Mitra services"

echo "=== 9. Mitra Drivers (Mock Authentication) ==="
test_endpoint "GET" "/api/mitra/drivers" "-H 'X-Mock-User-Email: dev-admin@example.com'" "" "200" "Should list Mitra drivers"

echo "=== 10. Update Mitra Profile (Mock Authentication) ==="
test_endpoint "PUT" "/api/mitra/profile" "-H 'X-Mock-User-Email: dev-admin@example.com'" '{"name":"Updated Test Mitra"}' "200" "Should update Mitra profile"

echo "=== 11. Validation Error Test ==="
test_endpoint "POST" "/api/test/validation" "" '{"invalidField":"test"}' "400" "Should return validation error"

echo "=== 12. Valid Validation Test ==="
test_endpoint "POST" "/api/test/validation" "" '{"requiredField":"test"}' "200" "Should pass validation"

echo "=== 13. Database Connection Test ==="
test_endpoint "GET" "/api/test/db" "" "" "200" "Database connection should work"

echo "=== 14. CUID Generation Test ==="
test_endpoint "GET" "/api/test/cuid" "" "" "200" "CUID generation should work"

echo "=== 15. 404 Test ==="
test_endpoint "GET" "/api/nonexistent" "" "" "404" "Should return 404 for non-existent endpoints"

echo "🎉 Authentication testing complete!"
echo ""
echo "📝 Notes:"
echo "  - Tests 5-10 require Mitra records in the database"
echo "  - Run 'pnpm tsx scripts/setup-dev-mitra.ts' to create test data"
echo "  - For production testing, replace mock headers with actual CF Access"
echo "" 