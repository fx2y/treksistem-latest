# Demo Account Quick Setup Guide

This guide provides the essential steps to set up and manage the shared demo account in Treksistem staging environment.

## Quick Setup

### 1. Seed Demo Data

```bash
# Navigate to db-schema package
cd packages/db-schema

# Generate and apply demo data
pnpm exec tsx scripts/seed-staging-demo.ts

# Copy the generated SQL output to a file (e.g., seed-demo.sql)
# Then apply to staging D1:
wrangler d1 execute TREKSISTEM_DB --env staging --remote --file=seed-demo.sql
```

### 2. Configure Cloudflare Access

1. Go to **Cloudflare Zero Trust** → **Access** → **Applications**
2. Find your staging Mitra Admin application
3. Add new policy:
   - **Name**: "Demo Account Access"
   - **Selector**: "Email"
   - **Value**: `demo@treksistem.sandbox`
   - **Action**: Allow

### 3. Verify Setup

```bash
# Run health check
./scripts/verify-demo-health.sh

# Or manually check:
wrangler d1 execute TREKSISTEM_DB --env staging --remote --command="SELECT COUNT(*) FROM mitras WHERE owner_user_id = 'demo@treksistem.sandbox';"
```

## Demo Account Details

- **Email**: `demo@treksistem.sandbox`
- **Mitra Name**: "Treksistem Demo Mitra"
- **Services**: 3 pre-configured (Ojek, Food Delivery, School Shuttle)
- **Drivers**: 3 pre-assigned drivers
- **Sample Orders**: 3 orders in different states

## Automated Management

- **Daily Reset**: Automated via GitHub Actions at 2 AM UTC
- **Manual Reset**: Run `packages/db-schema/scripts/reset-staging-demo.ts`
- **Health Monitoring**: Use `scripts/verify-demo-health.sh`

## Access for Users

1. Navigate to staging Mitra Admin URL
2. Authenticate with `demo@treksistem.sandbox`
3. Enter OTP from email
4. Explore demo services, drivers, and orders

## Troubleshooting

- **Demo not found**: Re-run seeding script
- **Access denied**: Check Cloudflare Access policies
- **Data corrupted**: Run manual reset

For detailed documentation, see [STAGING-DEMO-ACCOUNT.md](./STAGING-DEMO-ACCOUNT.md).
