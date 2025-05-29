#!/bin/bash

# Treksistem CI/CD Setup Script
# This script helps set up the CI/CD pipeline for Treksistem

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    local missing_tools=()
    
    if ! command_exists "wrangler"; then
        missing_tools+=("wrangler")
    fi
    
    if ! command_exists "pnpm"; then
        missing_tools+=("pnpm")
    fi
    
    if ! command_exists "node"; then
        missing_tools+=("node")
    fi
    
    if ! command_exists "gh"; then
        missing_tools+=("gh (GitHub CLI)")
    fi
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        log_info "Please install them and run this script again."
        log_info ""
        log_info "Installation commands:"
        log_info "  npm install -g wrangler"
        log_info "  npm install -g pnpm"
        log_info "  brew install gh (on macOS)"
        exit 1
    fi
    
    log_success "All prerequisites are installed"
}

# Validate wrangler authentication
check_wrangler_auth() {
    log_info "Checking Wrangler authentication..."
    
    if ! wrangler whoami >/dev/null 2>&1; then
        log_error "Wrangler is not authenticated"
        log_info "Please run: wrangler login"
        exit 1
    fi
    
    local user=$(wrangler whoami 2>/dev/null | grep "email" | awk '{print $2}')
    log_success "Wrangler authenticated as: $user"
}

# Check GitHub CLI authentication
check_gh_auth() {
    log_info "Checking GitHub CLI authentication..."
    
    if ! gh auth status >/dev/null 2>&1; then
        log_warning "GitHub CLI is not authenticated"
        log_info "Please run: gh auth login"
        log_info "This is optional but recommended for automated setup"
        return 1
    fi
    
    log_success "GitHub CLI is authenticated"
    return 0
}

# Validate project structure
validate_project_structure() {
    log_info "Validating project structure..."
    
    local required_files=(
        "package.json"
        "wrangler.jsonc"
        "turbo.json"
        "apps/worker/src/index.ts"
        "apps/fe-mitra-admin/package.json"
        "apps/fe-user-public/package.json"
        "apps/fe-driver-view/package.json"
        "packages/db-schema/package.json"
        "packages/shared-types/package.json"
    )
    
    local missing_files=()
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            missing_files+=("$file")
        fi
    done
    
    if [ ${#missing_files[@]} -ne 0 ]; then
        log_error "Missing required files:"
        for file in "${missing_files[@]}"; do
            echo "  - $file"
        done
        exit 1
    fi
    
    log_success "Project structure is valid"
}

# Check if GitHub repository is configured
check_github_repo() {
    log_info "Checking GitHub repository configuration..."
    
    if ! git remote get-url origin >/dev/null 2>&1; then
        log_error "No GitHub remote 'origin' found"
        log_info "Please add your GitHub repository as origin:"
        log_info "  git remote add origin https://github.com/your-org/treksistem.git"
        exit 1
    fi
    
    local origin_url=$(git remote get-url origin)
    log_success "GitHub repository: $origin_url"
}

# Validate wrangler configuration
validate_wrangler_config() {
    log_info "Validating wrangler configuration..."
    
    if ! wrangler deploy --dry-run --outdir /tmp/wrangler-validation >/dev/null 2>&1; then
        log_error "Wrangler configuration is invalid"
        log_info "Please check your wrangler.jsonc file"
        exit 1
    fi
    
    log_success "Wrangler configuration is valid"
}

# Test build process
test_build() {
    log_info "Testing build process..."
    
    if ! pnpm install --frozen-lockfile >/dev/null 2>&1; then
        log_error "Failed to install dependencies"
        exit 1
    fi
    
    if ! pnpm type-check >/dev/null 2>&1; then
        log_error "TypeScript type check failed"
        exit 1
    fi
    
    if ! pnpm lint >/dev/null 2>&1; then
        log_error "Linting failed"
        exit 1
    fi
    
    if ! pnpm build >/dev/null 2>&1; then
        log_error "Build failed"
        exit 1
    fi
    
    log_success "Build process completed successfully"
}

# Setup GitHub secrets (if GitHub CLI is available)
setup_github_secrets() {
    if ! check_gh_auth; then
        log_warning "Skipping GitHub secrets setup (GitHub CLI not authenticated)"
        return
    fi
    
    log_info "Setting up GitHub secrets..."
    
    # Check if secrets already exist
    local existing_secrets=$(gh secret list --json name --jq '.[].name' 2>/dev/null | tr '\n' ' ')
    
    if [[ $existing_secrets == *"CF_API_TOKEN"* ]] && [[ $existing_secrets == *"CF_ACCOUNT_ID"* ]]; then
        log_success "GitHub secrets already configured"
        return
    fi
    
    log_warning "GitHub secrets need to be configured manually"
    log_info ""
    log_info "Please add the following secrets to your GitHub repository:"
    log_info "1. Go to: https://github.com/$(gh repo view --json owner,name --jq '.owner.login + \"/\" + .name')/settings/secrets/actions"
    log_info "2. Add these secrets:"
    log_info "   - CF_API_TOKEN: Your Cloudflare API token"
    log_info "   - CF_ACCOUNT_ID: Your Cloudflare account ID"
    log_info ""
    log_info "To get your Cloudflare Account ID:"
    log_info "  wrangler whoami"
    log_info ""
    log_info "To create an API token:"
    log_info "  1. Go to: https://dash.cloudflare.com/profile/api-tokens"
    log_info "  2. Click 'Create Token'"
    log_info "  3. Use 'Edit Cloudflare Workers' template"
    log_info "  4. Add D1:Edit and Pages:Edit permissions"
}

# Create Cloudflare resources
create_cloudflare_resources() {
    log_info "Checking Cloudflare resources..."
    
    # Extract database configurations from wrangler.jsonc
    local prod_db_name=$(grep -A 10 '"d1_databases"' wrangler.jsonc | grep '"database_name"' | head -1 | sed 's/.*"database_name": "\([^"]*\)".*/\1/')
    local staging_db_name=$(grep -A 20 '"staging"' wrangler.jsonc | grep '"database_name"' | head -1 | sed 's/.*"database_name": "\([^"]*\)".*/\1/')
    local dev_db_name=$(grep -A 20 '"development"' wrangler.jsonc | grep '"database_name"' | head -1 | sed 's/.*"database_name": "\([^"]*\)".*/\1/')
    
    # Check if databases exist
    local existing_dbs=$(wrangler d1 list --json 2>/dev/null | jq -r '.[].name' 2>/dev/null | tr '\n' ' ')
    
    log_info "Creating missing D1 databases..."
    
    for db_name in "$prod_db_name" "$staging_db_name" "$dev_db_name"; do
        if [[ -n "$db_name" ]] && [[ $existing_dbs != *"$db_name"* ]]; then
            log_info "Creating database: $db_name"
            if wrangler d1 create "$db_name" >/dev/null 2>&1; then
                log_success "Created database: $db_name"
            else
                log_warning "Failed to create database: $db_name (might already exist)"
            fi
        fi
    done
    
    # Extract bucket configurations
    local prod_bucket=$(grep -A 10 '"r2_buckets"' wrangler.jsonc | grep '"bucket_name"' | head -1 | sed 's/.*"bucket_name": "\([^"]*\)".*/\1/')
    local staging_bucket=$(grep -A 20 '"staging"' wrangler.jsonc | grep '"bucket_name"' | head -1 | sed 's/.*"bucket_name": "\([^"]*\)".*/\1/')
    local dev_bucket=$(grep -A 20 '"development"' wrangler.jsonc | grep '"bucket_name"' | head -1 | sed 's/.*"bucket_name": "\([^"]*\)".*/\1/')
    
    # Check if buckets exist
    local existing_buckets=$(wrangler r2 bucket list 2>/dev/null | grep -v "📦" | awk '{print $1}' | tr '\n' ' ')
    
    log_info "Creating missing R2 buckets..."
    
    for bucket_name in "$prod_bucket" "$staging_bucket" "$dev_bucket"; do
        if [[ -n "$bucket_name" ]] && [[ $existing_buckets != *"$bucket_name"* ]]; then
            log_info "Creating bucket: $bucket_name"
            if wrangler r2 bucket create "$bucket_name" >/dev/null 2>&1; then
                log_success "Created bucket: $bucket_name"
            else
                log_warning "Failed to create bucket: $bucket_name (might already exist)"
            fi
        fi
    done
}

# Create environment configuration guide
create_env_guide() {
    log_info "Creating environment configuration guide..."
    
    cat > ".env.example" << EOF
# Treksistem Environment Configuration
# Copy this file to .env.local in each frontend app and configure as needed

# API Configuration
VITE_API_BASE_URL=http://localhost:8787
VITE_WORKER_ENV=development

# Development settings
VITE_DEBUG_MODE=true
VITE_LOG_LEVEL=debug
EOF
    
    log_success "Created .env.example file"
}

# Validate CI/CD workflows
validate_workflows() {
    log_info "Validating CI/CD workflows..."
    
    local workflow_files=(
        ".github/workflows/deploy.yml"
        ".github/workflows/pr-checks.yml"
        ".github/workflows/db-migrations.yml"
        ".github/workflows/manual-deploy.yml"
    )
    
    for workflow in "${workflow_files[@]}"; do
        if [ ! -f "$workflow" ]; then
            log_error "Missing workflow file: $workflow"
            exit 1
        fi
        
        # Basic YAML validation
        if ! python3 -c "import yaml; yaml.safe_load(open('$workflow'))" >/dev/null 2>&1 && \
           ! node -e "require('js-yaml').load(require('fs').readFileSync('$workflow', 'utf8'))" >/dev/null 2>&1; then
            log_warning "Could not validate YAML syntax for: $workflow"
        fi
    done
    
    log_success "All workflow files are present"
}

# Generate setup summary
generate_summary() {
    log_info "Generating setup summary..."
    
    cat > "CI_CD_SETUP_SUMMARY.md" << EOF
# Treksistem CI/CD Setup Summary

## ✅ Completed Setup Steps

- [x] Prerequisites validated
- [x] Wrangler authentication confirmed
- [x] Project structure validated
- [x] Build process tested
- [x] Workflow files validated
- [x] Cloudflare resources created/verified

## 📋 Manual Steps Required

### 1. GitHub Secrets Configuration
Add these secrets to your GitHub repository:
- \`CF_API_TOKEN\`: Your Cloudflare API token
- \`CF_ACCOUNT_ID\`: Your Cloudflare account ID

**Setup URL**: https://github.com/$(git remote get-url origin | sed 's/.*github.com[:/]\([^.]*\).*/\1/')/settings/secrets/actions

### 2. Cloudflare Pages Projects
Create Pages projects for each frontend:
- \`treksistem-fe-mitra-admin\`
- \`treksistem-fe-user-public\`
- \`treksistem-fe-driver-view\`
- \`treksistem-fe-mitra-admin-staging\`
- \`treksistem-fe-user-public-staging\`
- \`treksistem-fe-driver-view-staging\`

**Setup URL**: https://dash.cloudflare.com/pages

### 3. Branch Protection Rules
Configure protection for the \`main\` branch:
- Require pull request reviews
- Require status checks to pass
- Restrict pushes

**Setup URL**: https://github.com/$(git remote get-url origin | sed 's/.*github.com[:/]\([^.]*\).*/\1/')/settings/branches

### 4. Environment Protection
Set up GitHub Environments:
- \`production\` (requires approval)
- \`staging\` (auto-deploy)
- \`development\` (auto-deploy)

**Setup URL**: https://github.com/$(git remote get-url origin | sed 's/.*github.com[:/]\([^.]*\).*/\1/')/settings/environments

## 🚀 Next Steps

1. Complete the manual steps above
2. Test the CI/CD pipeline with a small change
3. Review the deployment documentation: \`docs/deployment.md\`
4. Set up monitoring and alerting

## 🔗 Useful Links

- [Deployment Documentation](docs/deployment.md)
- [GitHub Actions](https://github.com/$(git remote get-url origin | sed 's/.*github.com[:/]\([^.]*\).*/\1/')/actions)
- [Cloudflare Dashboard](https://dash.cloudflare.com/)

Generated on: $(date)
EOF
    
    log_success "Created CI_CD_SETUP_SUMMARY.md"
}

# Main execution
main() {
    echo ""
    log_info "🚀 Treksistem CI/CD Setup Script"
    log_info "================================"
    echo ""
    
    check_prerequisites
    check_wrangler_auth
    validate_project_structure
    check_github_repo
    validate_wrangler_config
    test_build
    create_cloudflare_resources
    setup_github_secrets
    create_env_guide
    validate_workflows
    generate_summary
    
    echo ""
    log_success "🎉 CI/CD setup completed successfully!"
    echo ""
    log_info "📋 Next steps:"
    log_info "1. Review CI_CD_SETUP_SUMMARY.md for manual configuration steps"
    log_info "2. Configure GitHub secrets and branch protection"
    log_info "3. Set up Cloudflare Pages projects"
    log_info "4. Test the pipeline with a small change"
    echo ""
    log_info "📖 Full documentation: docs/deployment.md"
    echo ""
}

# Run main function
main "$@" 