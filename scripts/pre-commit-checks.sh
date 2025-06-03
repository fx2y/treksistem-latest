#!/bin/bash

# Pre-commit checks script for Treksistem
# This script runs all necessary checks before allowing a commit

set -e

echo "🔍 Running pre-commit checks..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "turbo.json" ]; then
    print_error "This script must be run from the project root directory"
    exit 1
fi

# 1. Type checking
echo "📝 Running TypeScript type checking..."
if pnpm run type-check; then
    print_status "TypeScript type checking passed"
else
    print_error "TypeScript type checking failed"
    exit 1
fi

# 2. Run tests
echo "🧪 Running tests..."
if pnpm run test; then
    print_status "All tests passed"
else
    print_error "Tests failed"
    exit 1
fi

# 3. Build check
echo "🏗️ Running build check..."
if pnpm run build; then
    print_status "Build successful"
else
    print_error "Build failed"
    exit 1
fi

# 4. Linting (with warnings allowed for now)
echo "🔍 Running linter..."
if pnpm run lint; then
    print_status "Linting passed"
else
    print_warning "Linting has warnings/errors - please review"
    echo "Note: Continuing with commit as this is a work in progress"
fi

# 5. Security audit
echo "🔒 Running security audit..."
if pnpm audit --audit-level moderate; then
    print_status "Security audit passed"
else
    print_warning "Security audit found issues - please review"
fi

print_status "All critical pre-commit checks passed!"
echo "🚀 Ready to commit!" 