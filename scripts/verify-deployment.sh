#!/bin/bash

# Treksistem Deployment Verification Script
# This script verifies that the wrangler configuration is correct and ready for deployment

set -e

echo "🚀 Treksistem Deployment Verification Script"
echo "============================================="
echo

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Error: wrangler CLI is not installed"
    echo "Install with: npm install -g wrangler"
    exit 1
fi

echo "✅ Wrangler CLI is installed"

# Check if user is authenticated
if ! wrangler whoami &> /dev/null; then
    echo "❌ Error: Not authenticated with Cloudflare"
    echo "Run: wrangler login"
    exit 1
fi

echo "✅ Authenticated with Cloudflare"
echo "Current user: $(wrangler whoami)"
echo

# Verify wrangler.jsonc syntax
echo "🔍 Verifying wrangler.jsonc configuration..."
if npx wrangler deploy --dry-run --outdir dist-verify-temp; then
    echo "✅ Wrangler configuration is valid"
    rm -rf dist-verify-temp
else
    echo "❌ Error: Invalid wrangler configuration"
    exit 1
fi
echo

# Check if D1 database exists
echo "🗄️ Checking D1 database..."
DB_ID=$(grep -o '"database_id": "[^"]*"' wrangler.jsonc | cut -d'"' -f4)
if [ -z "$DB_ID" ]; then
    echo "❌ Error: database_id not found in wrangler.jsonc"
    exit 1
fi

echo "Database ID: $DB_ID"

# Try to connect to the database
if wrangler d1 execute TREKSISTEM_DB --command "SELECT 1;" &> /dev/null; then
    echo "✅ D1 database is accessible"
else
    echo "⚠️  Warning: Cannot access D1 database. It may not exist yet."
    echo "Create with: npx wrangler d1 create treksistem-d1-prod"
fi
echo

# Check R2 bucket
echo "📦 Checking R2 bucket..."
BUCKET_NAME=$(grep -o '"bucket_name": "[^"]*"' wrangler.jsonc | head -1 | cut -d'"' -f4)
if [ -z "$BUCKET_NAME" ]; then
    echo "❌ Error: bucket_name not found in wrangler.jsonc"
    exit 1
fi

echo "Bucket name: $BUCKET_NAME"

# Try to list the bucket (this will fail if bucket doesn't exist)
if wrangler r2 bucket list | grep -q "$BUCKET_NAME" 2>/dev/null; then
    echo "✅ R2 bucket exists and is accessible"
else
    echo "⚠️  Warning: R2 bucket may not exist yet."
    echo "Create with: npx wrangler r2 bucket create $BUCKET_NAME"
fi
echo

# Check if migrations exist
echo "🔄 Checking database migrations..."
if [ -d "packages/db-schema/migrations" ] && [ "$(ls -A packages/db-schema/migrations)" ]; then
    echo "✅ Database migrations found"
    echo "Migration files:"
    ls -la packages/db-schema/migrations/
else
    echo "⚠️  Warning: No migration files found"
    echo "Generate with: cd packages/db-schema && pnpm db:generate"
fi
echo

# Check TypeScript compilation
echo "🔧 Checking TypeScript compilation..."
if npm run type-check &> /dev/null; then
    echo "✅ TypeScript compilation successful"
else
    echo "❌ Error: TypeScript compilation failed"
    echo "Run 'npm run type-check' for details"
    exit 1
fi
echo

# Verify environment configurations
echo "🌍 Environment configurations:"
echo "Production worker name: treksistem-api"
echo "Staging worker name: treksistem-api-staging" 
echo "Development worker name: treksistem-api-dev"
echo

# Summary
echo "📋 Deployment Readiness Summary"
echo "==============================="
echo "✅ Wrangler CLI installed and authenticated"
echo "✅ Configuration syntax is valid"
echo "✅ TypeScript compilation successful"

if wrangler d1 execute TREKSISTEM_DB --command "SELECT 1;" &> /dev/null; then
    echo "✅ D1 database accessible"
else
    echo "⚠️  D1 database needs setup"
fi

if wrangler r2 bucket list | grep -q "$BUCKET_NAME" 2>/dev/null; then
    echo "✅ R2 bucket accessible"
else
    echo "⚠️  R2 bucket needs setup"
fi

echo
echo "🚀 Ready for deployment!"
echo
echo "Next steps:"
echo "1. Create missing resources (D1 database, R2 bucket) if needed"
echo "2. Apply migrations: pnpm db:migrate:prod"
echo "3. Deploy: pnpm deploy"
echo
echo "For staging: pnpm deploy:staging"
echo "For development: pnpm deploy:dev" 