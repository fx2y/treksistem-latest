# Treksistem - Low-Cost Logistics Ta'awun Platform

A community-focused logistics platform built on Cloudflare's edge infrastructure for near-zero operational costs.

## Quick Start

### Prerequisites

- Node.js 18+ and pnpm 8+
- Cloudflare account with Workers Paid plan
- Wrangler CLI: `npm install -g wrangler`

### Development Setup

```bash
# Clone and install dependencies
git clone <repository-url>
cd treksistem-latest
pnpm install

# Start development servers
pnpm dev
```

### Production Deployment

1. **Verify deployment readiness:**
   ```bash
   pnpm deploy:verify
   ```

2. **Create production resources:**
   ```bash
   # Create D1 database
   npx wrangler d1 create treksistem-d1-prod
   
   # Create R2 bucket
   npx wrangler r2 bucket create treksistem-proofs-prod
   
   # Update database_id in wrangler.jsonc with the generated ID
   ```

3. **Apply database migrations:**
   ```bash
   pnpm db:migrate:prod
   ```

4. **Deploy to production:**
   ```bash
   pnpm deploy
   ```

## Architecture

- **Backend:** Cloudflare Workers (Hono framework)
- **Database:** Cloudflare D1 (SQLite)
- **Storage:** Cloudflare R2 (S3-compatible)
- **Frontend:** React + Vite + TypeScript
- **Monorepo:** Turborepo + pnpm workspaces

## Apps & Packages

### Apps
- `worker` - Hono API server
- `fe-mitra-admin` - Mitra admin dashboard (protected by CF Access)
- `fe-driver-view` - Mobile-first driver interface
- `fe-user-public` - Public order placement interface

### Packages
- `db-schema` - Drizzle ORM schema and migrations
- `shared-types` - Zod schemas and TypeScript types
- `ui-core` - Shared UI components
- `eslint-config-custom` - ESLint configuration

## Environment Configuration

The project supports three environments:

- **Production:** `pnpm deploy`
- **Staging:** `pnpm deploy:staging`
- **Development:** `pnpm deploy:dev`

Each environment has its own D1 database and R2 bucket configuration.

## Key Features

- 🚚 **Multi-modal logistics** (motorcycle, truck, etc.)
- 💰 **Talangan system** (advance payment handling)
- 📱 **Mobile-first driver interface**
- 🔐 **Cloudflare Access integration** for admin security
- 📍 **Real-time location tracking**
- 💬 **WhatsApp integration** for notifications
- 📷 **Photo proof system** via R2 storage

## Documentation

- [Deployment Guide](docs/DEPLOYMENT.md)
- [API Documentation](docs/API.md) (coming soon)
- [Database Schema](packages/db-schema/README.md) (coming soon)

## Development Scripts

```bash
# Development
pnpm dev              # Start all dev servers
pnpm type-check       # TypeScript validation
pnpm lint             # ESLint validation

# Deployment
pnpm deploy:dry-run   # Test deployment configuration
pnpm deploy:verify    # Verify deployment readiness
pnpm deploy           # Deploy to production
pnpm deploy:staging   # Deploy to staging

# Database
pnpm db:migrate:prod  # Apply migrations to production
pnpm db:migrate:staging # Apply migrations to staging
pnpm db:migrate:dev   # Apply migrations to development
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -m 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## License

[Add your license here]