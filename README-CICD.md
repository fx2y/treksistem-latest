# Treksistem CI/CD Pipeline

**A comprehensive, production-ready CI/CD pipeline for the Treksistem logistics platform built on Cloudflare infrastructure.**

## 🚀 Quick Start

```bash
# 1. Run the setup script
./scripts/setup-cicd.sh

# 2. Configure GitHub secrets (from setup output)
# 3. Create Cloudflare Pages projects
# 4. Test the pipeline
git checkout -b test-cicd
git push origin test-cicd
# Create PR to trigger pipeline
```

## 📋 Pipeline Overview

### Automated Workflows

| Workflow | Trigger | Purpose | Duration |
|----------|---------|---------|----------|
| **Main Deploy** | Push to `main`/`develop` | Full deployment pipeline | ~8-12 min |
| **PR Checks** | Pull requests | Fast feedback & validation | ~3-5 min |
| **DB Migrations** | Manual trigger | Safe database updates | ~2-3 min |
| **Manual Deploy** | Manual trigger | Emergency & targeted deployments | ~5-8 min |

### Deployment Matrix

| Component | Production | Staging | Preview |
|-----------|------------|---------|---------|
| **Worker API** | `main` → `treksistem-api` | `develop` → `treksistem-api-staging` | PR → `treksistem-api-dev` |
| **Mitra Admin** | `main` → `treksistem-fe-mitra-admin` | `develop` → `...-staging` | PR → `...-preview` |
| **User Public** | `main` → `treksistem-fe-user-public` | `develop` → `...-staging` | PR → `...-preview` |
| **Driver View** | `main` → `treksistem-fe-driver-view` | `develop` → `...-staging` | PR → `...-preview` |

## 🛠️ Setup Guide

### Prerequisites

```bash
# Required tools
npm install -g wrangler pnpm
brew install gh  # GitHub CLI (macOS)

# Authentication
wrangler login
gh auth login
```

### 1. Automated Setup

```bash
# Run the comprehensive setup script
./scripts/setup-cicd.sh

# This will:
# ✅ Validate prerequisites
# ✅ Check project structure
# ✅ Test build process
# ✅ Create Cloudflare resources
# ✅ Generate setup summary
```

### 2. Manual Configuration

After running the setup script, complete these manual steps:

#### GitHub Secrets
Add these secrets in your repository settings:
- `CF_API_TOKEN`: Cloudflare API token with Workers/Pages/D1/R2 permissions
- `CF_ACCOUNT_ID`: Your Cloudflare account ID

#### Cloudflare Pages Projects
Create these projects in Cloudflare Dashboard:
- `treksistem-fe-mitra-admin` (+ `-staging`)
- `treksistem-fe-user-public` (+ `-staging`)
- `treksistem-fe-driver-view` (+ `-staging`)

#### Branch Protection
Configure these rules for the `main` branch:
- Require pull request reviews
- Require status checks to pass
- Restrict pushes to admins

### 3. Environment Configuration

Set up GitHub Environments with appropriate protection rules:
- **production**: Requires manual approval
- **staging**: Auto-deploy from `develop`
- **development**: Auto-deploy for previews

## 🔄 Development Workflow

### Standard Flow

```bash
# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Make changes and test locally
pnpm dev
pnpm ci:pre-commit  # type-check + lint

# 3. Push and create PR
git push origin feature/new-feature
# PR triggers: PR Checks workflow (fast feedback)

# 4. Merge to develop (staging deployment)
git checkout develop
git merge feature/new-feature
git push origin develop
# Triggers: Full deployment to staging

# 5. Merge to main (production deployment)
git checkout main
git merge develop
git push origin main
# Triggers: Full deployment to production
```

### Emergency Deployment

```bash
# Use GitHub Actions > Manual Deploy workflow
# Options:
# - Target: worker-only, frontends-only, specific-frontend, everything
# - Environment: production, staging, development
# - Skip tests: true (for emergencies)
# - Reason: Required description
```

## 🗄️ Database Migrations

### Safe Migration Process

```bash
# 1. Always test on staging first
# GitHub Actions > Database Migrations
# - Environment: staging
# - Dry run: true (preview changes)

# 2. Apply to staging
# - Environment: staging  
# - Dry run: false

# 3. Test thoroughly on staging

# 4. Apply to production (requires approval)
# - Environment: production
# - Dry run: false
```

### Local Migration Development

```bash
# Generate new migration
cd packages/db-schema
pnpm db:generate

# Test locally
pnpm db:migrate:dev

# Apply via CI/CD pipeline (recommended)
# Or manually: pnpm db:migrate:prod
```

## 🔍 Monitoring & Validation

### Health Checks

```bash
# Full deployment validation
pnpm validate:deployment

# Component-specific checks
pnpm validate:worker
pnpm validate:frontend

# Local health check
pnpm health:check
```

### Log Monitoring

```bash
# Worker logs (real-time)
pnpm logs:worker

# Build logs
# Check GitHub Actions tab

# Frontend logs
# Check Cloudflare Pages dashboard
```

### Performance Monitoring

| Metric | Target | Monitor Via |
|--------|--------|-------------|
| Build Time | <5 min | GitHub Actions |
| Deploy Time | <3 min | Cloudflare Dashboard |
| Worker Response | <200ms | Cloudflare Analytics |
| Frontend Load | <2s | Cloudflare Web Analytics |

## 🚨 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Local debugging
pnpm clean
pnpm install
pnpm ci:build-check

# Check dependency issues
pnpm ci:security-audit
```

#### Deployment Failures
```bash
# Validate configuration
wrangler deploy --dry-run

# Check secrets
gh secret list

# Validate workflows
pnpm workflow:validate
```

#### Database Issues
```bash
# Check database connectivity
wrangler d1 execute TREKSISTEM_DB --command "SELECT 1"

# List databases
wrangler d1 list

# View migration status
wrangler d1 migrations list TREKSISTEM_DB
```

### Emergency Procedures

#### Production Rollback
1. **Via Cloudflare Dashboard**:
   - Workers: Select previous deployment
   - Pages: Rollback to previous build

2. **Via Manual Deploy**:
   - Use previous commit SHA
   - Skip tests if urgent
   - Document incident

#### Pipeline Recovery
```bash
# Reset workflow state
gh run list --limit 5
gh run rerun <run-id>

# Clear cache if needed
# GitHub Settings > Actions > Caches > Delete
```

## 📊 Pipeline Analytics

### Success Metrics
- **Deployment Success Rate**: >95%
- **Build Time**: <5 minutes
- **Time to Production**: <15 minutes
- **Rollback Time**: <3 minutes

### Monitoring Dashboard
- [GitHub Actions](https://github.com/your-org/treksistem/actions)
- [Cloudflare Workers](https://dash.cloudflare.com/workers)
- [Cloudflare Pages](https://dash.cloudflare.com/pages)
- [D1 Dashboard](https://dash.cloudflare.com/d1)

## 🔒 Security

### Secret Management
- API tokens rotated monthly
- Environment-specific access
- IP restrictions where possible
- Audit trail maintained

### Deployment Security
- Production deployments require approval
- All changes are traceable
- Automated security scanning
- Infrastructure as code

### Access Control
- Branch protection enforced
- Required status checks
- Admin-only production access
- Environment-based permissions

## 📚 Additional Resources

### Documentation
- [📖 Full Deployment Guide](docs/deployment.md)
- [🛠️ Setup Script](scripts/setup-cicd.sh)
- [✅ Validation Script](scripts/validate-deployment.sh)

### External Links
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)

### Support
- 📧 DevOps Team: [Contact]
- 🚨 Emergency: [On-call]
- 📖 Runbooks: `docs/runbooks/`

---

## 📋 Quick Reference

### Essential Commands
```bash
# Setup
./scripts/setup-cicd.sh

# Validation
pnpm validate:deployment

# Local development
pnpm dev

# Pre-commit checks
pnpm ci:pre-commit

# Emergency deploy
# Use GitHub Actions > Manual Deploy
```

### Important URLs
- [Actions](https://github.com/your-org/treksistem/actions)
- [Cloudflare](https://dash.cloudflare.com/)
- [Production API](https://treksistem-api.workers.dev)
- [Staging API](https://treksistem-api-staging.workers.dev)

**Last Updated**: $(date)  
**Pipeline Version**: v2.0.0  
**Maintained by**: Treksistem DevOps Team 