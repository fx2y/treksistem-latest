#!/bin/bash

# Treksistem Development QA Verification Script
# This script verifies your local development environment is ready for QA testing

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local timeout=${3:-30}
    local count=0
    
    print_status "Waiting for $service_name to be ready..."
    
    while [ $count -lt $timeout ]; do
        if curl -s -f "$url" >/dev/null 2>&1; then
            print_success "$service_name is ready!"
            return 0
        fi
        sleep 1
        count=$((count + 1))
        echo -n "."
    done
    
    print_error "$service_name failed to start within ${timeout}s"
    return 1
}

echo "🚀 Treksistem Development QA Verification"
echo "=========================================="

# Step 1: Check dependencies
print_status "Checking dependencies..."

if ! command -v pnpm &> /dev/null; then
    print_error "pnpm is not installed. Please install pnpm first."
    exit 1
fi

if ! command -v curl &> /dev/null; then
    print_error "curl is not installed. Please install curl first."
    exit 1
fi

if ! command -v newman &> /dev/null; then
    print_warning "Newman not found globally. Using local installation."
fi

print_success "Dependencies check passed"

# Step 2: Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "wrangler.jsonc" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_success "Project structure verified"

# Step 3: Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    pnpm install
fi

# Step 4: Check if services are already running
print_status "Checking running services..."

WORKER_RUNNING=false
if check_port 8787; then
    print_success "Worker is already running on port 8787"
    WORKER_RUNNING=true
else
    print_warning "Worker is not running on port 8787"
fi

# Step 5: Start services if not running
if [ "$WORKER_RUNNING" = false ]; then
    print_status "Starting development servers..."
    
    # Kill any existing processes that might be hanging
    pkill -f "turbo dev" || true
    pkill -f "wrangler" || true
    sleep 2
    
    # Start development servers in background
    pnpm turbo dev > dev-servers.log 2>&1 &
    DEV_PID=$!
    
    print_status "Development servers starting (PID: $DEV_PID)..."
    print_status "Logs are being written to dev-servers.log"
    
    # Wait for worker to be ready
    if ! wait_for_service "http://localhost:8787/api/health" "Worker" 60; then
        print_error "Failed to start worker. Check dev-servers.log for details."
        kill $DEV_PID 2>/dev/null || true
        exit 1
    fi
fi

# Step 6: Verify worker health
print_status "Verifying worker health..."
HEALTH_RESPONSE=$(curl -s http://localhost:8787/api/health)

if echo "$HEALTH_RESPONSE" | grep -q '"status":"ok"'; then
    print_success "Worker health check passed"
    echo "Response: $HEALTH_RESPONSE"
else
    print_error "Worker health check failed"
    echo "Response: $HEALTH_RESPONSE"
    exit 1
fi

# Step 7: Verify authentication setup
print_status "Verifying authentication setup..."
AUTH_RESPONSE=$(curl -s -H "X-Mock-User-Email: qa-admin@treksistem.com" http://localhost:8787/api/mitra/profile)

if echo "$AUTH_RESPONSE" | grep -q '"success":true'; then
    print_success "Mock authentication is working"
elif echo "$AUTH_RESPONSE" | grep -q '"success":false'; then
    print_warning "Authentication setup verified (profile not created yet - this is normal)"
else
    print_error "Authentication verification failed"
    echo "Response: $AUTH_RESPONSE"
    exit 1
fi

# Step 8: Run API verification tests
print_status "Running comprehensive API verification..."

if pnpm test:api:local; then
    print_success "API verification tests passed! 🎉"
    
    # Check if HTML report was generated
    if [ -f "postman/report.html" ]; then
        print_success "HTML test report generated: postman/report.html"
        
        # Try to open the report (macOS only)
        if command -v open &> /dev/null; then
            print_status "Opening test report in browser..."
            open postman/report.html
        else
            print_status "Test report available at: file://$(pwd)/postman/report.html"
        fi
    fi
else
    print_error "API verification tests failed!"
    echo
    echo "Troubleshooting steps:"
    echo "1. Check dev-servers.log for any startup errors"
    echo "2. Verify all services are running with: pnpm health:check"
    echo "3. Try restarting development servers: pnpm turbo dev"
    exit 1
fi

# Step 9: Development environment summary
echo
echo "📋 Development Environment Summary"
echo "=================================="
echo "✅ Dependencies installed"
echo "✅ Development servers running"
echo "✅ Worker health check passed"
echo "✅ Authentication setup verified"
echo "✅ API verification tests passed"
echo
echo "🛠️  Available Commands:"
echo "  pnpm turbo dev          - Start all development servers"
echo "  pnpm health:check       - Quick health check"
echo "  pnpm test:api:local     - Run API verification tests"
echo "  open postman/report.html - View detailed test report"
echo
echo "📚 Documentation:"
echo "  docs/QA_CHECKLIST_LOCAL.md  - Manual testing checklist"
echo "  docs/QA_PROCESS.md          - QA process documentation"
echo "  docs/DEV_WORKFLOW_QA.md     - Development workflow guide"
echo
print_success "Development environment is ready for QA! 🚀"

# Clean up log file if everything succeeded
if [ -f "dev-servers.log" ] && [ "$WORKER_RUNNING" = false ]; then
    print_status "Cleaning up startup logs..."
    rm -f dev-servers.log
fi 