#!/bin/bash

# Treksistem Deployment Validation Script
# This script validates that all deployment components are working correctly

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
WORKER_PROD_URL="https://treksistem-api.abdullah.workers.dev"
WORKER_STAGING_URL="https://treksistem-api-staging.abdullah.workers.dev"
WORKER_DEV_URL="https://treksistem-api-dev.abdullah.workers.dev"

FE_MITRA_ADMIN_PROD="https://treksistem-fe-mitra-admin.pages.dev"
FE_USER_PUBLIC_PROD="https://treksistem-fe-user-public.pages.dev"
FE_DRIVER_VIEW_PROD="https://treksistem-fe-driver-view.pages.dev"

FE_MITRA_ADMIN_STAGING="https://treksistem-fe-mitra-admin-staging.pages.dev"
FE_USER_PUBLIC_STAGING="https://treksistem-fe-user-public-staging.pages.dev"
FE_DRIVER_VIEW_STAGING="https://treksistem-fe-driver-view-staging.pages.dev"

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

# Check if URL is accessible
check_url() {
    local url=$1
    local name=$2
    local expected_status=${3:-200}
    
    log_info "Checking $name: $url"
    
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$url" --max-time 10 || echo "000")
    
    if [ "$response" = "$expected_status" ]; then
        log_success "$name is accessible (HTTP $response)"
        return 0
    else
        log_error "$name returned HTTP $response (expected $expected_status)"
        return 1
    fi
}

# Check API endpoint with JSON response
check_api_endpoint() {
    local url=$1
    local endpoint=$2
    local name=$3
    
    local full_url="$url$endpoint"
    log_info "Testing $name API: $full_url"
    
    local response=$(curl -s "$full_url" --max-time 10 || echo '{"error": "connection_failed"}')
    
    if echo "$response" | jq . >/dev/null 2>&1; then
        log_success "$name API returned valid JSON"
        return 0
    else
        log_error "$name API returned invalid JSON: $response"
        return 1
    fi
}

# Validate worker endpoints
validate_worker() {
    local env=$1
    local url=$2
    
    log_info "🔧 Validating Worker ($env environment)"
    
    local success=0
    
    # Basic health check
    if check_url "$url" "Worker ($env)" 200; then
        ((success++))
    fi
    
    # API health check
    if check_api_endpoint "$url" "/health" "Worker Health ($env)"; then
        ((success++))
    fi
    
    # Database health check
    if check_api_endpoint "$url" "/api/health/db" "Database Health ($env)"; then
        ((success++))
    fi
    
    # API endpoints check
    if check_api_endpoint "$url" "/api/public/services" "Public Services API ($env)"; then
        ((success++))
    fi
    
    echo ""
    if [ $success -eq 4 ]; then
        log_success "Worker ($env) validation: ✅ All checks passed"
        return 0
    else
        log_warning "Worker ($env) validation: ⚠️  $success/4 checks passed"
        return 1
    fi
}

# Validate frontend applications
validate_frontend() {
    local env=$1
    local url=$2
    local name=$3
    
    log_info "🌐 Validating $name ($env environment)"
    
    if check_url "$url" "$name ($env)" 200; then
        # Check if it's actually a React app (look for common React patterns)
        local content=$(curl -s "$url" --max-time 10 || echo "")
        if echo "$content" | grep -q "react\|React\|root\|__vite__" >/dev/null 2>&1; then
            log_success "$name ($env) appears to be a valid React application"
            return 0
        else
            log_warning "$name ($env) is accessible but may not be a React app"
            return 1
        fi
    else
        log_error "$name ($env) is not accessible"
        return 1
    fi
}

# Check GitHub Actions status
check_github_actions() {
    log_info "🔄 Checking GitHub Actions status"
    
    if ! command -v gh >/dev/null 2>&1; then
        log_warning "GitHub CLI not available, skipping Actions check"
        return 1
    fi
    
    if ! gh auth status >/dev/null 2>&1; then
        log_warning "GitHub CLI not authenticated, skipping Actions check"
        return 1
    fi
    
    local workflows=$(gh workflow list --json name,state | jq -r '.[] | "\(.name): \(.state)"' 2>/dev/null)
    
    if [ -n "$workflows" ]; then
        log_success "GitHub Actions workflows:"
        echo "$workflows" | while read -r line; do
            echo "  - $line"
        done
        return 0
    else
        log_warning "No GitHub Actions workflows found"
        return 1
    fi
}

# Check recent deployments
check_recent_deployments() {
    log_info "📋 Checking recent deployments"
    
    if ! command -v gh >/dev/null 2>&1 || ! gh auth status >/dev/null 2>&1; then
        log_warning "GitHub CLI not available or not authenticated, skipping deployment check"
        return 1
    fi
    
    local recent_runs=$(gh run list --limit 5 --json conclusion,createdAt,displayTitle,workflowName 2>/dev/null | jq -r '.[] | "\(.workflowName): \(.conclusion) (\(.createdAt[:10]))"')
    
    if [ -n "$recent_runs" ]; then
        log_success "Recent workflow runs:"
        echo "$recent_runs" | while read -r line; do
            echo "  - $line"
        done
        return 0
    else
        log_warning "No recent workflow runs found"
        return 1
    fi
}

# Validate Cloudflare resources
validate_cloudflare_resources() {
    log_info "☁️  Validating Cloudflare resources"
    
    if ! command -v wrangler >/dev/null 2>&1; then
        log_warning "Wrangler CLI not available, skipping Cloudflare resource check"
        return 1
    fi
    
    if ! wrangler whoami >/dev/null 2>&1; then
        log_warning "Wrangler not authenticated, skipping Cloudflare resource check"
        return 1
    fi
    
    local success=0
    
    # Check D1 databases
    local databases=$(wrangler d1 list --json 2>/dev/null | jq -r '.[].name' 2>/dev/null | tr '\n' ' ')
    if [[ $databases == *"treksistem-d1-prod"* ]]; then
        log_success "Production database found"
        ((success++))
    else
        log_error "Production database not found"
    fi
    
    # Check R2 buckets
    local buckets=$(wrangler r2 bucket list 2>/dev/null | grep -v "📦" | awk '{print $1}' | tr '\n' ' ')
    if [[ $buckets == *"treksistem-proofs-prod"* ]]; then
        log_success "Production R2 bucket found"
        ((success++))
    else
        log_error "Production R2 bucket not found"
    fi
    
    echo ""
    if [ $success -eq 2 ]; then
        log_success "Cloudflare resources: ✅ All resources found"
        return 0
    else
        log_warning "Cloudflare resources: ⚠️  $success/2 resources found"
        return 1
    fi
}

# Generate validation report
generate_report() {
    local total_checks=$1
    local passed_checks=$2
    
    log_info "📊 Generating validation report"
    
    local pass_rate=$((passed_checks * 100 / total_checks))
    
    cat > "DEPLOYMENT_VALIDATION_REPORT.md" << EOF
# Treksistem Deployment Validation Report

**Generated:** $(date)
**Pass Rate:** $passed_checks/$total_checks ($pass_rate%)

## Summary

$(if [ $pass_rate -ge 90 ]; then
echo "🟢 **Status: HEALTHY** - All critical systems are operational"
elif [ $pass_rate -ge 70 ]; then
echo "🟡 **Status: WARNING** - Some issues detected but core functionality working"
else
echo "🔴 **Status: CRITICAL** - Multiple systems failing, immediate attention required"
fi)

## Validation Results

### Worker APIs
- Production: $([ -f /tmp/worker_prod_status ] && cat /tmp/worker_prod_status || echo "❓ Not tested")
- Staging: $([ -f /tmp/worker_staging_status ] && cat /tmp/worker_staging_status || echo "❓ Not tested")

### Frontend Applications
- Mitra Admin (Prod): $([ -f /tmp/fe_mitra_prod_status ] && cat /tmp/fe_mitra_prod_status || echo "❓ Not tested")
- User Public (Prod): $([ -f /tmp/fe_user_prod_status ] && cat /tmp/fe_user_prod_status || echo "❓ Not tested")
- Driver View (Prod): $([ -f /tmp/fe_driver_prod_status ] && cat /tmp/fe_driver_prod_status || echo "❓ Not tested")

### Infrastructure
- Cloudflare Resources: $([ -f /tmp/cf_resources_status ] && cat /tmp/cf_resources_status || echo "❓ Not tested")
- GitHub Actions: $([ -f /tmp/gh_actions_status ] && cat /tmp/gh_actions_status || echo "❓ Not tested")

## Recommendations

$(if [ $pass_rate -lt 100 ]; then
echo "### Issues to Address"
echo "1. Review failed checks above"
echo "2. Check Cloudflare Dashboard for service status"
echo "3. Review recent deployment logs"
echo "4. Verify DNS and SSL certificate status"
echo ""
fi)

### Next Steps
1. Monitor application metrics
2. Set up alerting for critical endpoints
3. Schedule regular validation runs
4. Update deployment documentation if needed

## Links
- [Cloudflare Dashboard](https://dash.cloudflare.com/)
- [GitHub Actions](https://github.com/$(git remote get-url origin 2>/dev/null | sed 's/.*github.com[:/]\([^.]*\).*/\1/' || echo 'your-org/treksistem')/actions)
- [Deployment Documentation](docs/deployment.md)

EOF
    
    log_success "Created DEPLOYMENT_VALIDATION_REPORT.md"
}

# Main validation function
main() {
    echo ""
    log_info "🔍 Treksistem Deployment Validation"
    log_info "===================================="
    echo ""
    
    local total_checks=0
    local passed_checks=0
    
    # Worker validation
    if validate_worker "production" "$WORKER_PROD_URL"; then
        echo "✅ Passed" > /tmp/worker_prod_status
        ((passed_checks++))
    else
        echo "❌ Failed" > /tmp/worker_prod_status
    fi
    ((total_checks++))
    
    if validate_worker "staging" "$WORKER_STAGING_URL"; then
        echo "✅ Passed" > /tmp/worker_staging_status
        ((passed_checks++))
    else
        echo "❌ Failed" > /tmp/worker_staging_status
    fi
    ((total_checks++))
    
    echo ""
    
    # Frontend validation
    if validate_frontend "production" "$FE_MITRA_ADMIN_PROD" "Mitra Admin"; then
        echo "✅ Passed" > /tmp/fe_mitra_prod_status
        ((passed_checks++))
    else
        echo "❌ Failed" > /tmp/fe_mitra_prod_status
    fi
    ((total_checks++))
    
    if validate_frontend "production" "$FE_USER_PUBLIC_PROD" "User Public"; then
        echo "✅ Passed" > /tmp/fe_user_prod_status
        ((passed_checks++))
    else
        echo "❌ Failed" > /tmp/fe_user_prod_status
    fi
    ((total_checks++))
    
    if validate_frontend "production" "$FE_DRIVER_VIEW_PROD" "Driver View"; then
        echo "✅ Passed" > /tmp/fe_driver_prod_status
        ((passed_checks++))
    else
        echo "❌ Failed" > /tmp/fe_driver_prod_status
    fi
    ((total_checks++))
    
    echo ""
    
    # Infrastructure checks
    if validate_cloudflare_resources; then
        echo "✅ Passed" > /tmp/cf_resources_status
        ((passed_checks++))
    else
        echo "❌ Failed" > /tmp/cf_resources_status
    fi
    ((total_checks++))
    
    if check_github_actions; then
        echo "✅ Passed" > /tmp/gh_actions_status
        ((passed_checks++))
    else
        echo "❌ Failed" > /tmp/gh_actions_status
    fi
    ((total_checks++))
    
    echo ""
    check_recent_deployments
    echo ""
    
    # Generate final report
    local pass_rate=$((passed_checks * 100 / total_checks))
    
    generate_report $total_checks $passed_checks
    
    # Final summary
    if [ $pass_rate -ge 90 ]; then
        log_success "🎉 Validation completed: $passed_checks/$total_checks checks passed ($pass_rate%)"
        log_success "✅ Deployment is healthy!"
    elif [ $pass_rate -ge 70 ]; then
        log_warning "⚠️  Validation completed: $passed_checks/$total_checks checks passed ($pass_rate%)"
        log_warning "Some issues detected but core functionality appears to be working"
    else
        log_error "❌ Validation completed: $passed_checks/$total_checks checks passed ($pass_rate%)"
        log_error "Multiple critical issues detected - immediate attention required"
    fi
    
    echo ""
    log_info "📋 Full report: DEPLOYMENT_VALIDATION_REPORT.md"
    
    # Cleanup temp files
    rm -f /tmp/worker_*_status /tmp/fe_*_status /tmp/cf_*_status /tmp/gh_*_status
    
    # Exit with appropriate code
    if [ $pass_rate -ge 70 ]; then
        exit 0
    else
        exit 1
    fi
}

# Command line argument processing
case "${1:-}" in
    --worker-only)
        log_info "Running worker-only validation"
        validate_worker "production" "$WORKER_PROD_URL"
        validate_worker "staging" "$WORKER_STAGING_URL"
        ;;
    --frontend-only)
        log_info "Running frontend-only validation"
        validate_frontend "production" "$FE_MITRA_ADMIN_PROD" "Mitra Admin"
        validate_frontend "production" "$FE_USER_PUBLIC_PROD" "User Public"
        validate_frontend "production" "$FE_DRIVER_VIEW_PROD" "Driver View"
        ;;
    --help)
        echo "Treksistem Deployment Validation Script"
        echo ""
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --worker-only     Validate only worker deployments"
        echo "  --frontend-only   Validate only frontend deployments"
        echo "  --help           Show this help message"
        echo ""
        echo "Default: Run full validation of all components"
        ;;
    *)
        main
        ;;
esac 