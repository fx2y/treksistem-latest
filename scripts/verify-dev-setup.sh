#!/bin/bash

# Treksistem Development Setup Verification Script
# This script verifies that the local development environment is properly configured

set -e

echo "🔍 Verifying Treksistem Development Setup..."
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        return 1
    fi
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "ℹ️  $1"
}

# Check prerequisites
echo ""
echo "📋 Checking Prerequisites..."
echo "----------------------------"

# Check Node.js version
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version | cut -d'v' -f2)
    REQUIRED_NODE="18.0.0"
    if [ "$(printf '%s\n' "$REQUIRED_NODE" "$NODE_VERSION" | sort -V | head -n1)" = "$REQUIRED_NODE" ]; then
        print_status 0 "Node.js version $NODE_VERSION (>= $REQUIRED_NODE required)"
    else
        print_status 1 "Node.js version $NODE_VERSION (>= $REQUIRED_NODE required)"
        exit 1
    fi
else
    print_status 1 "Node.js not found"
    exit 1
fi

# Check pnpm
if command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm --version)
    print_status 0 "pnpm version $PNPM_VERSION"
else
    print_status 1 "pnpm not found - install with: npm install -g pnpm"
    exit 1
fi

# Check Wrangler
if command -v wrangler &> /dev/null; then
    WRANGLER_VERSION=$(wrangler --version | head -n1)
    print_status 0 "Wrangler CLI found: $WRANGLER_VERSION"
else
    print_status 1 "Wrangler CLI not found - install with: npm install -g wrangler"
    exit 1
fi

# Check if we're in the right directory
echo ""
echo "📁 Checking Project Structure..."
echo "--------------------------------"

if [ ! -f "package.json" ]; then
    print_status 1 "package.json not found - are you in the project root?"
    exit 1
fi

if [ ! -f "wrangler.jsonc" ]; then
    print_status 1 "wrangler.jsonc not found"
    exit 1
fi

if [ ! -f "turbo.json" ]; then
    print_status 1 "turbo.json not found"
    exit 1
fi

print_status 0 "Project structure looks correct"

# Check if dependencies are installed
echo ""
echo "📦 Checking Dependencies..."
echo "---------------------------"

if [ ! -d "node_modules" ]; then
    print_warning "node_modules not found - run 'pnpm install' first"
    echo ""
    print_info "Running pnpm install..."
    pnpm install
fi

print_status 0 "Dependencies are installed"

# Check if database migrations exist
echo ""
echo "🗄️  Checking Database Setup..."
echo "------------------------------"

if [ -d "packages/db-schema/migrations" ] && [ "$(ls -A packages/db-schema/migrations)" ]; then
    print_status 0 "Database migrations found"
else
    print_warning "No database migrations found"
    print_info "You may need to generate migrations with: cd packages/db-schema && pnpm db:generate"
fi

# Check if local database exists
if [ -d "apps/worker/.wrangler/state" ]; then
    print_status 0 "Local Wrangler state directory exists"
else
    print_warning "Local Wrangler state not found - will be created on first run"
fi

# Test build process
echo ""
echo "🔨 Testing Build Process..."
echo "---------------------------"

print_info "Running type check..."
if pnpm turbo type-check > /dev/null 2>&1; then
    print_status 0 "Type checking passed"
else
    print_status 1 "Type checking failed - run 'pnpm turbo type-check' for details"
fi

print_info "Running linting..."
if pnpm turbo lint > /dev/null 2>&1; then
    print_status 0 "Linting passed"
else
    print_warning "Linting has warnings - run 'pnpm turbo lint' to see details"
    print_info "Note: Linting warnings don't prevent development, but should be addressed before production"
fi

# Check port availability
echo ""
echo "🌐 Checking Port Availability..."
echo "--------------------------------"

check_port() {
    local port=$1
    local service=$2
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_warning "Port $port is already in use (needed for $service)"
        return 1
    else
        print_status 0 "Port $port is available for $service"
        return 0
    fi
}

check_port 8787 "Worker API"
check_port 5173 "Mitra Admin"
check_port 5174 "User Public"
check_port 5175 "Driver View"

# Final summary
echo ""
echo "📋 Setup Summary"
echo "=================="

echo ""
print_info "Your development environment appears to be ready!"
echo ""
echo "🚀 Next Steps:"
echo "  1. Start all services: pnpm turbo dev"
echo "  2. Or start individually:"
echo "     - Worker API: cd apps/worker && pnpm dev"
echo "     - Mitra Admin: cd apps/fe-mitra-admin && pnpm dev"
echo "     - Driver View: cd apps/fe-driver-view && pnpm dev"
echo "     - User Public: cd apps/fe-user-public && pnpm dev"
echo ""
echo "🌐 URLs when running:"
echo "  - Worker API: http://localhost:8787"
echo "  - Mitra Admin: http://localhost:5173"
echo "  - User Public: http://localhost:5174"
echo "  - Driver View: http://localhost:5175"
echo ""
echo "📚 Documentation:"
echo "  - Development Guide: README.md"
echo "  - AI Assistant Guide: AGENT.md"
echo "  - API Documentation: apps/worker/ORDER_PLACEMENT_API.md"
echo ""

print_status 0 "Development setup verification completed successfully!" 