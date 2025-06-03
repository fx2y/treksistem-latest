# Staging Demo Account Setup & Management

This document provides comprehensive instructions for setting up, accessing, and managing the shared demo account in the Treksistem staging environment.

## Overview

The staging demo account provides a pre-configured Mitra account with sample services, drivers, and orders that potential users can interact with as a playground to explore Treksistem's capabilities.

### Demo Account Details

- **Demo Mitra Email**: `demo@treksistem.sandbox`
- **Demo Mitra Name**: "Treksistem Demo Mitra"
- **Environment**: Staging only
- **Access Method**: Cloudflare Access with Email OTP

## Demo Data Structure

### Services (3 pre-configured)

1. **Speedy Bike Courier (Demo)**

   - Type: `MOTOR_P2P_EXPRESS`
   - Features: Talangan enabled (max 50,000 IDR), per-km pricing
   - Coverage: Malang Kota, Kab Malang (max 15km)

2. **Lunchbox Delivery (Demo)**

   - Type: `MOTOR_FOOD_COURIER`
   - Features: Talangan enabled (max 75,000 IDR), food delivery optimized
   - Coverage: Malang Kota (max 10km)

3. **AnJem Anak Sekolah (Demo)**
   - Type: `MOBIL_ANJEM_BASIC`
   - Features: Scheduled service, multi-passenger, per-child pricing
   - Coverage: Malang Kota, Kab Malang (max 20km)

### Drivers (3 pre-configured)

1. **Pak Budi (Demo)** - `driver-budi-demo`

   - Assigned to: Speedy Bike Courier
   - Vehicle: Motorcycle with extra helmet

2. **Ibu Siti (Demo)** - `driver-siti-demo`

   - Assigned to: Lunchbox Delivery
   - Vehicle: Motorcycle with thermal bag and cooler

3. **Mas Eko (Demo)** - `driver-eko-demo`
   - Assigned to: AnJem Anak Sekolah
   - Vehicle: Car with AC, WiFi, child seats (capacity: 6)

### Sample Orders (3 pre-seeded)

- **ASSIGNED**: Ojek ride from Jl. Veteran to Jl. Ijen
- **IN_TRANSIT**: Food delivery with talangan payment
- **PENDING**: Scheduled school pickup for next day

## Initial Setup

### 1. Generate and Apply Demo Data

```bash
# Navigate to the seeding script directory
cd packages/db-schema/scripts

# Generate demo data SQL
npx tsx seed-staging-demo.ts

# Copy the generated SQL to a file
# (Copy the output from the script to seed-demo.sql)

# Apply to staging D1 database
wrangler d1 execute TREKSISTEM_DB --env staging --remote --file=seed-demo.sql
```

### 2. Configure Cloudflare Access

#### Option A: Email OTP (Recommended for Controlled Demo)

1. Navigate to **Cloudflare Zero Trust** → **Access** → **Applications**
2. Find or create application for staging Mitra Admin frontend
3. Create new "Allow" policy:
   - **Name**: "Demo Account Access"
   - **Selector**: "Email"
   - **Value**: `demo@treksistem.sandbox`
   - **Action**: Allow

#### Option B: Open Access (For Public Playground)

1. Create policy with broader access:
   - **Selector**: "Emails ending in"
   - **Value**: `@gmail.com` (or your preferred domain)
   - **Action**: Allow

⚠️ **Security Note**: Option B provides broader access. Ensure you understand the security implications.

### 3. Verify Setup

```bash
# Check demo mitra exists
wrangler d1 execute TREKSISTEM_DB --env staging --remote --command="SELECT * FROM mitras WHERE owner_user_id = 'demo@treksistem.sandbox';"

# Check services count
wrangler d1 execute TREKSISTEM_DB --env staging --remote --command="SELECT COUNT(*) FROM services WHERE mitra_id IN (SELECT id FROM mitras WHERE owner_user_id = 'demo@treksistem.sandbox');"

# Check drivers count
wrangler d1 execute TREKSISTEM_DB --env staging --remote --command="SELECT COUNT(*) FROM drivers WHERE mitra_id IN (SELECT id FROM mitras WHERE owner_user_id = 'demo@treksistem.sandbox');"
```

## Access Instructions for Users

### For Demo Account Access

1. **Navigate** to the staging Mitra Admin frontend URL

   - Example: `https://staging-mitra.yourdomain.com`

2. **Authenticate** via Cloudflare Access

   - Enter email: `demo@treksistem.sandbox`
   - Check email for OTP code
   - Enter OTP to complete authentication

3. **Explore** the demo environment
   - View pre-configured services
   - Check driver assignments
   - Review sample orders in various states
   - Test creating new orders (if enabled)

### Demo Capabilities

Users can:

- ✅ View all demo services and their configurations
- ✅ See driver assignments and capabilities
- ✅ Review order history and status tracking
- ✅ Access driver view using demo driver IDs
- ✅ Place test orders via public frontend
- ⚠️ Create new services/drivers (may clutter demo data)

## Data Management

### Automated Reset

Demo data is automatically reset daily at 2 AM UTC (9 AM WIB) via GitHub Actions.

**Workflow**: `.github/workflows/reset-staging-demo.yml`

### Manual Reset

```bash
# Generate fresh reset SQL
cd packages/db-schema/scripts
npx tsx reset-staging-demo.ts

# Apply reset
wrangler d1 execute TREKSISTEM_DB --env staging --remote --file=seed-demo-reset.sql
```

### Manual Trigger via GitHub

1. Go to **Actions** tab in GitHub repository
2. Select "Reset Staging Demo Data" workflow
3. Click "Run workflow"
4. Optionally provide reason for reset

## Monitoring & Maintenance

### Health Checks

```bash
# Verify demo account exists and has expected data
./scripts/verify-demo-health.sh
```

### Common Issues

1. **Demo account not found**

   - Re-run seeding script
   - Check Cloudflare Access configuration

2. **Services missing or corrupted**

   - Run manual reset
   - Verify service configurations are valid

3. **Access denied**
   - Check Cloudflare Access policies
   - Verify email configuration
   - Ensure staging frontend is properly deployed

### Logs and Debugging

- **Cloudflare Access logs**: Zero Trust dashboard
- **Worker logs**: Cloudflare Workers dashboard
- **D1 query logs**: Cloudflare D1 dashboard
- **GitHub Actions logs**: Repository Actions tab

## Security Considerations

### Demo Account Isolation

- Demo account is isolated to staging environment only
- No access to production data or systems
- Limited to pre-configured demo scenarios

### Data Privacy

- All demo data uses fictional information
- No real personal data or phone numbers
- Sample addresses are generic/public locations

### Access Control

- Email OTP provides controlled access
- Consider IP restrictions for additional security
- Monitor access logs for unusual activity

## Troubleshooting

### Reset Not Working

```bash
# Check if demo mitra exists
wrangler d1 execute TREKSISTEM_DB --env staging --remote --command="SELECT COUNT(*) FROM mitras WHERE owner_user_id = 'demo@treksistem.sandbox';"

# Manual cleanup if needed
wrangler d1 execute TREKSISTEM_DB --env staging --remote --command="DELETE FROM mitras WHERE owner_user_id = 'demo@treksistem.sandbox';"

# Re-run seeding
npx tsx seed-staging-demo.ts
```

### Access Issues

1. Verify Cloudflare Access configuration
2. Check email delivery for OTP
3. Ensure staging frontend deployment is active
4. Verify DNS configuration for staging domain

### Performance Issues

- Monitor D1 database usage
- Check worker execution time
- Review R2 bucket access patterns
- Consider demo data size optimization

## Future Enhancements

### Planned Improvements

- [ ] Read-only mode for core demo entities
- [ ] Interactive demo tour/walkthrough
- [ ] Demo data analytics and usage tracking
- [ ] Multi-language demo content
- [ ] Advanced demo scenarios (emergency services, etc.)

### Feedback Collection

- Monitor user interactions with demo
- Collect feedback on demo usefulness
- Track common user paths and pain points
- Iterate on demo content based on usage patterns

---

**Last Updated**: December 2024  
**Maintainer**: Treksistem Development Team  
**Environment**: Staging Only
