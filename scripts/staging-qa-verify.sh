#!/bin/bash

# Treksistem Staging QA Verification Script
# This script automates the staging environment QA process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
STAGING_WORKER_URL="https://treksistem-api-staging.youraccount.workers.dev"
POSTMAN_COLLECTION="postman/Treksistem_API_Working.postman_collection.json"
POSTMAN_ENVIRONMENT="postman/Staging_Sandbox.postman_environment.json"
REPORT_FILE="postman/report-staging.html"
LOG_FILE="staging-qa-$(date +%Y%m%d-%H%M%S).log"

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if newman is available (either global or via npx)
    if ! command -v newman &> /dev/null && ! npx newman --version &> /dev/null; then
        error "Newman is not available. Install globally: npm install -g newman, or ensure it's in package.json"
        exit 1
    fi
    
    # Check if postman collection exists
    if [ ! -f "$POSTMAN_COLLECTION" ]; then
        error "Postman collection not found: $POSTMAN_COLLECTION"
        exit 1
    fi
    
    # Check if postman environment exists
    if [ ! -f "$POSTMAN_ENVIRONMENT" ]; then
        error "Postman environment not found: $POSTMAN_ENVIRONMENT"
        exit 1
    fi
    
    success "Prerequisites check passed"
}

# Verify staging environment health
verify_staging_health() {
    log "Verifying staging environment health..."
    
    # Check worker health endpoint
    if curl -f -s "${STAGING_WORKER_URL}/api/health" > /dev/null; then
        success "Staging worker is accessible"
    else
        error "Staging worker health check failed"
        warning "Please verify the staging worker URL in the script and Postman environment"
        return 1
    fi
    
    # Check if environment file has correct staging URL
    if grep -q "youraccount.workers.dev" "$POSTMAN_ENVIRONMENT"; then
        warning "Postman environment still contains placeholder URL"
        warning "Please update baseUrl in $POSTMAN_ENVIRONMENT with actual staging URL"
    fi
}

# Run API tests
run_api_tests() {
    log "Running automated API tests..."
    
    # Use npx newman if global newman is not available
    NEWMAN_CMD="newman"
    if ! command -v newman &> /dev/null; then
        NEWMAN_CMD="npx newman"
        log "Using npx newman (global newman not found)"
    fi
    
    # Run Newman with staging environment
    if $NEWMAN_CMD run "$POSTMAN_COLLECTION" \
        -e "$POSTMAN_ENVIRONMENT" \
        --reporters cli,htmlextra \
        --reporter-htmlextra-export "$REPORT_FILE" \
        --reporter-htmlextra-title "Treksistem Staging API Test Report" \
        --reporter-htmlextra-logs \
        --timeout-request 30000 \
        --timeout-script 30000; then
        
        success "API tests completed successfully"
        log "Report generated: $REPORT_FILE"
        return 0
    else
        error "API tests failed"
        log "Check the report for details: $REPORT_FILE"
        return 1
    fi
}

# Generate QA checklist
generate_qa_checklist() {
    log "Generating QA execution checklist..."
    
    cat > "staging-qa-checklist-$(date +%Y%m%d).md" << EOF
# Staging QA Execution - $(date +%Y-%m-%d)

## Automated Tests Status
- [ ] API Tests: $([ $1 -eq 0 ] && echo "✅ PASSED" || echo "❌ FAILED")
- [ ] Report reviewed: $REPORT_FILE

## Manual Testing Checklist
Refer to: docs/QA_CHECKLIST_STAGING.md

### Environment URLs (Update with actual URLs)
- Worker: $STAGING_WORKER_URL
- Mitra Admin: https://fe-mitra-admin-staging.pages.dev
- Driver View: https://fe-driver-view-staging.pages.dev
- User Public: https://fe-user-public-staging.pages.dev

### Critical Flows to Test
- [ ] Mitra Profile Management
- [ ] Service Creation and Configuration
- [ ] Driver Management
- [ ] Order Placement (User Flow)
- [ ] Order Tracking
- [ ] Driver Order Management
- [ ] Photo Upload Functionality
- [ ] WhatsApp Deep Links

### Cross-browser Testing
- [ ] Chrome (Desktop)
- [ ] Firefox (Desktop)
- [ ] Safari (Desktop)
- [ ] Edge (Desktop)
- [ ] Chrome Mobile (Android)
- [ ] Safari Mobile (iOS)

### Security Testing
- [ ] Authentication flows
- [ ] Authorization checks
- [ ] Input validation
- [ ] Error handling

## Issues Found
1. ________________________________
2. ________________________________
3. ________________________________

## QA Sign-off
- [ ] All critical flows working
- [ ] No blocking issues found
- [ ] Ready for production deployment

**QA Engineer**: ________________
**Date**: $(date +%Y-%m-%d)
**Time**: $(date +%H:%M:%S)
EOF

    success "QA checklist generated: staging-qa-checklist-$(date +%Y%m%d).md"
}

# Main execution
main() {
    log "Starting Treksistem Staging QA Verification"
    log "Timestamp: $(date)"
    log "Log file: $LOG_FILE"
    
    # Check prerequisites
    check_prerequisites
    
    # Verify staging environment
    if ! verify_staging_health; then
        error "Staging environment health check failed"
        exit 1
    fi
    
    # Run API tests
    api_test_result=0
    if ! run_api_tests; then
        api_test_result=1
    fi
    
    # Generate checklist
    generate_qa_checklist $api_test_result
    
    # Summary
    log "=== QA Verification Summary ==="
    if [ $api_test_result -eq 0 ]; then
        success "Automated API tests: PASSED"
    else
        error "Automated API tests: FAILED"
    fi
    
    log "Next steps:"
    log "1. Review API test report: $REPORT_FILE"
    log "2. Execute manual QA checklist: staging-qa-checklist-$(date +%Y%m%d).md"
    log "3. Follow staging QA process: docs/STAGING_QA_PROCESS.md"
    
    if [ $api_test_result -ne 0 ]; then
        error "API tests failed - resolve issues before proceeding with manual QA"
        exit 1
    fi
    
    success "Staging QA verification completed successfully"
}

# Help function
show_help() {
    cat << EOF
Treksistem Staging QA Verification Script

Usage: $0 [OPTIONS]

OPTIONS:
    -h, --help          Show this help message
    -u, --url URL       Override staging worker URL
    -c, --collection    Override Postman collection path
    -e, --environment   Override Postman environment path
    --skip-health       Skip staging environment health check
    --api-only          Run only API tests (skip checklist generation)

Examples:
    $0                                          # Run full QA verification
    $0 -u https://my-staging.workers.dev       # Use custom staging URL
    $0 --api-only                              # Run only API tests
    $0 --skip-health                           # Skip health check

For more information, see: docs/STAGING_QA_PROCESS.md
EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -u|--url)
            STAGING_WORKER_URL="$2"
            shift 2
            ;;
        -c|--collection)
            POSTMAN_COLLECTION="$2"
            shift 2
            ;;
        -e|--environment)
            POSTMAN_ENVIRONMENT="$2"
            shift 2
            ;;
        --skip-health)
            SKIP_HEALTH=1
            shift
            ;;
        --api-only)
            API_ONLY=1
            shift
            ;;
        *)
            error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Override functions based on flags
if [ "$SKIP_HEALTH" = "1" ]; then
    verify_staging_health() {
        warning "Skipping staging environment health check"
        return 0
    }
fi

if [ "$API_ONLY" = "1" ]; then
    generate_qa_checklist() {
        log "Skipping QA checklist generation (API only mode)"
    }
fi

# Run main function
main 