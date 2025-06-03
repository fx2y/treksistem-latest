#!/bin/bash

# Treksistem Demo Health Check Script
# Verifies that demo data is properly seeded and accessible in staging environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Demo account configuration
DEMO_EMAIL="demo@treksistem.sandbox"
EXPECTED_SERVICES=3
EXPECTED_DRIVERS=3
EXPECTED_ORDERS=3

echo -e "${BLUE}🔍 Treksistem Demo Health Check${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Function to run D1 query and return result
run_d1_query() {
    local query="$1"
    wrangler d1 execute TREKSISTEM_DB --env staging --remote --command="$query" 2>/dev/null || echo "ERROR"
}

# Function to extract count from D1 output
extract_count() {
    local output="$1"
    echo "$output" | grep -o '[0-9]\+' | head -1 || echo "0"
}

# Check if demo mitra exists
echo -e "${YELLOW}📧 Checking demo Mitra account...${NC}"
mitra_result=$(run_d1_query "SELECT COUNT(*) as count FROM mitras WHERE owner_user_id = '$DEMO_EMAIL';")
mitra_count=$(extract_count "$mitra_result")

if [ "$mitra_count" = "1" ]; then
    echo -e "${GREEN}✅ Demo Mitra account exists${NC}"
    
    # Get mitra details
    mitra_details=$(run_d1_query "SELECT id, name FROM mitras WHERE owner_user_id = '$DEMO_EMAIL';")
    echo -e "   Details: $mitra_details"
else
    echo -e "${RED}❌ Demo Mitra account not found (count: $mitra_count)${NC}"
    exit 1
fi

echo ""

# Check services
echo -e "${YELLOW}🚗 Checking demo services...${NC}"
services_result=$(run_d1_query "SELECT COUNT(*) as count FROM services WHERE mitra_id IN (SELECT id FROM mitras WHERE owner_user_id = '$DEMO_EMAIL');")
services_count=$(extract_count "$services_result")

if [ "$services_count" = "$EXPECTED_SERVICES" ]; then
    echo -e "${GREEN}✅ All $EXPECTED_SERVICES demo services found${NC}"
    
    # List service names
    service_names=$(run_d1_query "SELECT name FROM services WHERE mitra_id IN (SELECT id FROM mitras WHERE owner_user_id = '$DEMO_EMAIL');")
    echo -e "   Services: $service_names"
else
    echo -e "${RED}❌ Expected $EXPECTED_SERVICES services, found $services_count${NC}"
fi

echo ""

# Check drivers
echo -e "${YELLOW}👨‍💼 Checking demo drivers...${NC}"
drivers_result=$(run_d1_query "SELECT COUNT(*) as count FROM drivers WHERE mitra_id IN (SELECT id FROM mitras WHERE owner_user_id = '$DEMO_EMAIL');")
drivers_count=$(extract_count "$drivers_result")

if [ "$drivers_count" = "$EXPECTED_DRIVERS" ]; then
    echo -e "${GREEN}✅ All $EXPECTED_DRIVERS demo drivers found${NC}"
    
    # List driver names
    driver_names=$(run_d1_query "SELECT name FROM drivers WHERE mitra_id IN (SELECT id FROM mitras WHERE owner_user_id = '$DEMO_EMAIL');")
    echo -e "   Drivers: $driver_names"
else
    echo -e "${RED}❌ Expected $EXPECTED_DRIVERS drivers, found $drivers_count${NC}"
fi

echo ""

# Check driver-service assignments
echo -e "${YELLOW}🔗 Checking driver-service assignments...${NC}"
assignments_result=$(run_d1_query "SELECT COUNT(*) as count FROM driver_services WHERE driver_id IN (SELECT id FROM drivers WHERE mitra_id IN (SELECT id FROM mitras WHERE owner_user_id = '$DEMO_EMAIL'));")
assignments_count=$(extract_count "$assignments_result")

if [ "$assignments_count" = "$EXPECTED_DRIVERS" ]; then
    echo -e "${GREEN}✅ All $EXPECTED_DRIVERS driver assignments found${NC}"
else
    echo -e "${RED}❌ Expected $EXPECTED_DRIVERS assignments, found $assignments_count${NC}"
fi

echo ""

# Check orders
echo -e "${YELLOW}📦 Checking demo orders...${NC}"
orders_result=$(run_d1_query "SELECT COUNT(*) as count FROM orders WHERE mitra_id IN (SELECT id FROM mitras WHERE owner_user_id = '$DEMO_EMAIL');")
orders_count=$(extract_count "$orders_result")

if [ "$orders_count" = "$EXPECTED_ORDERS" ]; then
    echo -e "${GREEN}✅ All $EXPECTED_ORDERS demo orders found${NC}"
    
    # Check order statuses
    order_statuses=$(run_d1_query "SELECT status, COUNT(*) as count FROM orders WHERE mitra_id IN (SELECT id FROM mitras WHERE owner_user_id = '$DEMO_EMAIL') GROUP BY status;")
    echo -e "   Order statuses: $order_statuses"
else
    echo -e "${RED}❌ Expected $EXPECTED_ORDERS orders, found $orders_count${NC}"
fi

echo ""

# Check order events
echo -e "${YELLOW}📝 Checking order events...${NC}"
events_result=$(run_d1_query "SELECT COUNT(*) as count FROM order_events WHERE order_id IN (SELECT id FROM orders WHERE mitra_id IN (SELECT id FROM mitras WHERE owner_user_id = '$DEMO_EMAIL'));")
events_count=$(extract_count "$events_result")

if [ "$events_count" -gt "0" ]; then
    echo -e "${GREEN}✅ Order events found ($events_count events)${NC}"
else
    echo -e "${YELLOW}⚠️  No order events found${NC}"
fi

echo ""

# Summary
echo -e "${BLUE}📊 Health Check Summary${NC}"
echo -e "${BLUE}=======================${NC}"

total_checks=6
passed_checks=0

[ "$mitra_count" = "1" ] && ((passed_checks++))
[ "$services_count" = "$EXPECTED_SERVICES" ] && ((passed_checks++))
[ "$drivers_count" = "$EXPECTED_DRIVERS" ] && ((passed_checks++))
[ "$assignments_count" = "$EXPECTED_DRIVERS" ] && ((passed_checks++))
[ "$orders_count" = "$EXPECTED_ORDERS" ] && ((passed_checks++))
[ "$events_count" -gt "0" ] && ((passed_checks++))

echo -e "Passed: ${GREEN}$passed_checks${NC}/$total_checks checks"

if [ "$passed_checks" = "$total_checks" ]; then
    echo -e "${GREEN}🎉 Demo environment is healthy!${NC}"
    echo ""
    echo -e "${BLUE}Demo Access Information:${NC}"
    echo -e "📧 Email: $DEMO_EMAIL"
    echo -e "🌐 Staging URL: https://staging-mitra.yourdomain.com"
    echo -e "🔑 Access: Cloudflare Access with Email OTP"
    exit 0
else
    echo -e "${RED}❌ Demo environment has issues!${NC}"
    echo ""
    echo -e "${YELLOW}🔧 To fix issues:${NC}"
    echo -e "1. Run: cd packages/db-schema/scripts && npx tsx seed-staging-demo.ts"
    echo -e "2. Copy generated SQL to seed-demo.sql"
    echo -e "3. Run: wrangler d1 execute TREKSISTEM_DB --env staging --remote --file=seed-demo.sql"
    echo -e "4. Re-run this health check"
    exit 1
fi 