# Treksistem Deployment Guide

This guide covers deploying the Treksistem logistics platform to production using Cloudflare Workers, D1, and R2.

## Prerequisites

- Cloudflare account with Workers Paid plan (for D1 and R2)
- Domain configured in Cloudflare (optional, for custom domain)
- `wrangler` CLI authenticated: `npx wrangler login`

## Environment Setup

### 1. Production Database Setup

Create the production D1 database:

```bash
# Create production database
npx wrangler d1 create treksistem-d1-prod

# Note the database_id from the output and update wrangler.jsonc
```

Update the `database_id` in `wrangler.jsonc` with the actual production database ID.

### 2. Production R2 Bucket Setup

Create the production R2 bucket:

```bash
# Create production bucket for proof images
npx wrangler r2 bucket create treksistem-proofs-prod

# Create preview bucket for development
npx wrangler r2 bucket create treksistem-proofs-preview
```

### 3. Staging Environment Setup (Optional)

For staging deployments:

```bash
# Create staging database
npx wrangler d1 create treksistem-d1-staging

# Create staging bucket
npx wrangler r2 bucket create treksistem-proofs-staging
```

Update the staging `database_id` in `wrangler.jsonc` under `env.staging`.

## Database Migration

### Production Migration

```bash
# Apply migrations to production database
pnpm db:migrate:prod

# Verify migrations
npx wrangler d1 execute TREKSISTEM_DB --command "SELECT name FROM sqlite_master WHERE type='table';"
```

### Staging Migration

```bash
# Apply migrations to staging database
pnpm db:migrate:staging
```

## Deployment

### Production Deployment

```bash
# Dry run to verify configuration
pnpm deploy:dry-run

# Deploy to production
pnpm deploy
```

The worker will be available at: `https://treksistem-api.<your-subdomain>.workers.dev`

### Staging Deployment

```bash
# Deploy to staging environment
pnpm deploy:staging
```

### Development Deployment

```bash
# Deploy to development environment
pnpm deploy:dev
```

## Custom Domain Setup (Optional)

### 1. Add DNS Record

In your Cloudflare DNS settings:

- Type: `AAAA`
- Name: `api` (for api.yourdomain.com)
- Content: `100::`
- Proxy status: Proxied

### 2. Update wrangler.jsonc

Uncomment and update the routes configuration:

```jsonc
"routes": [
  {
    "pattern": "api.yourdomain.com/*",
    "zone_name": "yourdomain.com"
  }
]
```

### 3. Deploy with Custom Domain

```bash
pnpm deploy
```

## Environment Variables and Secrets

### Worker Environment Variables

Set via `wrangler.jsonc` `vars` section:

- `WORKER_ENV`: Environment identifier (`production`, `staging`, `development`)

### Secrets (if needed)

For sensitive configuration:

```bash
# Set secrets (example - not currently used in MVP)
npx wrangler secret put JWT_SECRET
npx wrangler secret put API_KEY
```

## Frontend Deployment

### Cloudflare Pages Setup

1. Connect your repository to Cloudflare Pages
2. Configure build settings for each frontend app:

**Mitra Admin (`fe-mitra-admin`)**:

- Build command: `cd apps/fe-mitra-admin && npm run build`
- Build output directory: `apps/fe-mitra-admin/dist`
- Root directory: `/`

**User Public (`fe-user-public`)**:

- Build command: `cd apps/fe-user-public && npm run build`
- Build output directory: `apps/fe-user-public/dist`
- Root directory: `/`

**Driver View (`fe-driver-view`)**:

- Build command: `cd apps/fe-driver-view && npm run build`
- Build output directory: `apps/fe-driver-view/dist`
- Root directory: `/`

### Environment Variables for Frontends

Set in Cloudflare Pages environment variables:

- `VITE_API_BASE_URL`: Your worker API URL
- `VITE_WORKER_ENV`: Environment identifier

## Cloudflare Access Setup (Mitra Admin)

### 1. Create Access Application

1. Go to Cloudflare Zero Trust dashboard
2. Access > Applications > Add an application
3. Select "Self-hosted"
4. Configure:
   - Application name: "Treksistem Mitra Admin"
   - Subdomain: Your mitra admin domain
   - Domain: Your domain
5. Create policies for admin access

### 2. Update CORS Origins

Update the CORS origins in `apps/worker/src/index.ts` to include your production domains:

```typescript
origin: [
  'https://mitra.yourdomain.com',
  'https://app.yourdomain.com',
  'https://driver.yourdomain.com',
  // ... existing localhost origins for development
],
```

## Monitoring and Observability

### Worker Analytics

- View in Cloudflare Dashboard > Workers & Pages > treksistem-api
- Monitor requests, errors, and performance

### D1 Analytics

- View in Cloudflare Dashboard > D1 > treksistem-d1-prod
- Monitor query performance and storage usage

### R2 Analytics

- View in Cloudflare Dashboard > R2 > treksistem-proofs-prod
- Monitor storage usage and requests

## Backup and Recovery

### Database Backup

```bash
# Export database to SQL
npx wrangler d1 export TREKSISTEM_DB --output backup-$(date +%Y%m%d).sql

# Import from backup
npx wrangler d1 execute TREKSISTEM_DB --file backup-20240308.sql
```

### R2 Backup

Use `rclone` or S3-compatible tools to backup R2 buckets.

## Troubleshooting

### Common Issues

1. **Database ID mismatch**: Ensure `database_id` in `wrangler.jsonc` matches actual D1 database
2. **CORS errors**: Update origins in worker CORS configuration
3. **Migration failures**: Check D1 migration logs and syntax
4. **R2 access issues**: Verify bucket names and permissions

### Logs and Debugging

```bash
# View worker logs in real-time
npx wrangler tail

# View specific deployment logs
npx wrangler deployment list
npx wrangler deployment view <deployment-id>
```

## Security Considerations

1. **Database Access**: D1 databases are only accessible via Workers
2. **R2 Bucket Access**: Configure appropriate CORS policies
3. **Cloudflare Access**: Properly configure access policies for admin areas
4. **Driver Authentication**: Ensure driver IDs remain unguessable (CUID2)

## Scaling Considerations

- **D1 Limits**: Monitor storage and request limits on paid plan
- **R2 Limits**: Monitor storage and bandwidth usage
- **Worker Limits**: Monitor CPU time and request limits
- **Free Tier**: Current architecture is designed to operate within free tier limits where possible

## Cost Optimization

- Use `wrangler dev --local` for development to avoid request charges
- Implement efficient database queries to minimize D1 usage
- Optimize image sizes before R2 upload
- Monitor usage via Cloudflare dashboard

## Updates and Maintenance

### Worker Updates

```bash
# Deploy new version
pnpm deploy

# Rollback if needed (redeploy previous version)
# Or use Cloudflare dashboard to switch traffic
```

### Database Schema Updates

```bash
# Generate new migration
cd packages/db-schema
pnpm db:generate

# Apply to production
pnpm db:migrate:prod
```

Always test migrations on staging before production deployment.
