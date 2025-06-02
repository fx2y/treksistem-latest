# Treksistem - Ta'awun Logistics Platform

> **Empowering communities through mutual cooperation in transportation and logistics**

Treksistem is a low-cost, community-driven logistics platform built on the principle of "Ta'awun" (mutual cooperation). It connects UMKM (SMEs) and community members with affordable, efficient transportation solutions while addressing "ewuh pakewuh" (social unease) in traditional help-seeking.

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher) - [Download here](https://nodejs.org/)
- **pnpm** (v8.0.0 or higher) - Install with `npm install -g pnpm`
- **Wrangler CLI** - Install with `npm install -g wrangler`
- **Cloudflare Account** - [Sign up here](https://cloudflare.com) (free tier sufficient for development)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd treksistem-latest
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up local database**
   ```bash
   # Generate and apply database migrations
   cd packages/db-schema
   pnpm db:migrate:local
   cd ../..
   ```

4. **Verify your setup** (optional but recommended)
   ```bash
   pnpm verify-setup
   ```
   This script will check all prerequisites, dependencies, and configuration to ensure everything is ready for development.

## 🏗️ Project Structure

```
treksistem-latest/
├── apps/
│   ├── worker/             # Cloudflare Worker API (Hono framework)
│   ├── fe-mitra-admin/     # Mitra Admin Portal (React/Vite)
│   ├── fe-driver-view/     # Driver Interface (React/Vite, mobile-first)
│   └── fe-user-public/     # Public Order Interface (React/Vite)
├── packages/
│   ├── db-schema/          # Database schema & migrations (Drizzle ORM)
│   ├── shared-types/       # Shared TypeScript types & Zod schemas
│   ├── ui-core/            # Shared UI components
│   └── eslint-config-custom/ # Shared ESLint configuration
└── migrations/             # Database migration files
```

## 🛠️ Local Development

### Option 1: Run Everything (Recommended)

Start all services simultaneously:

```bash
pnpm turbo dev
```

This will start:
- **Worker API** at `http://localhost:8787`
- **Mitra Admin** at `http://localhost:5173`
- **Driver View** at `http://localhost:5175`
- **User Public** at `http://localhost:5174`

### Option 2: Run Services Individually

#### Backend Worker (API)

```bash
cd apps/worker
pnpm dev
# Starts Wrangler dev server at http://localhost:8787
```

The worker runs with:
- Local D1 database (persisted in `.wrangler/state/`)
- Local R2 storage simulation
- Hot reload on code changes

#### Frontend Applications

**Mitra Admin Portal:**
```bash
cd apps/fe-mitra-admin
pnpm dev
# Starts at http://localhost:5173
```

**Driver View (Mobile Interface):**
```bash
cd apps/fe-driver-view
pnpm dev
# Starts at http://localhost:5175
```

**Public User Interface:**
```bash
cd apps/fe-user-public
pnpm dev
# Starts at http://localhost:5174
```

> **Note:** All frontend apps are configured with Vite proxy to automatically forward `/api/*` requests to the local worker at `http://localhost:8787`.

## 🗄️ Database Management

### Migrations

**Generate new migration after schema changes:**
```bash
cd packages/db-schema
pnpm db:generate
```

**Apply migrations to local database:**
```bash
cd packages/db-schema
pnpm db:migrate:local
```

**Apply migrations to remote database (use with caution):**
```bash
cd packages/db-schema
pnpm db:migrate:remote
```

### Seeding Data

```bash
cd packages/db-schema
pnpm db:seed
```

## 🧪 Development Commands

### Linting & Type Checking

```bash
# Run linting across all packages
pnpm turbo lint

# Run type checking
pnpm turbo type-check

# Pre-commit checks (lint + type-check)
pnpm ci:pre-commit
```

> **Note:** Some linting warnings may appear during development (especially in Shadcn/ui components). These don't prevent the application from running but should be addressed before production deployment.

### Building

```bash
# Build all packages for production
pnpm turbo build

# Build and verify everything works
pnpm ci:build-check
```

### Testing & Validation

```bash
# Security audit
pnpm ci:security-audit

# Validate deployment configuration
pnpm validate:deployment

# Check worker health (when running locally)
pnpm health:check
```

## 🔧 Configuration

### Environment Variables

For local development, you can create a `.dev.vars` file in `apps/worker/` for any local secrets (though the MVP requires minimal configuration):

```bash
cd apps/worker
cp .dev.vars.example .dev.vars  # If example exists
```

### Wrangler Configuration

The project uses `wrangler.jsonc` for Cloudflare Worker configuration with environments:
- **production**: Main deployment
- **staging**: Staging environment
- **development**: Development environment

## 🚀 Deployment

### Automatic Deployment (Recommended)

The project uses GitHub Actions for CI/CD:
- **Worker**: Deployed via Wrangler CLI
- **Frontend Apps**: Deployed to Cloudflare Pages with auto-deployment on git push

### Manual Deployment

**Deploy Worker:**
```bash
# Production
pnpm deploy

# Staging
pnpm deploy:staging

# Development
pnpm deploy:dev

# Dry run (test deployment)
pnpm deploy:dry-run
```

**Deploy Database Migrations:**
```bash
# Production (use with extreme caution)
pnpm db:migrate:prod

# Staging
pnpm db:migrate:staging

# Development
pnpm db:migrate:dev
```

## 🏗️ Architecture Overview

### Technology Stack

- **Backend**: Cloudflare Workers with Hono framework
- **Database**: Cloudflare D1 (SQLite) with Drizzle ORM
- **Storage**: Cloudflare R2 for file uploads
- **Frontend**: React + Vite + TypeScript + Shadcn/ui
- **State Management**: TanStack Query + Zustand (for auth)
- **Validation**: Zod schemas with TypeScript inference
- **Monorepo**: Turborepo with pnpm workspaces

### Key Features

- **Mitra Admin**: Service management, driver assignment, order tracking
- **Driver Interface**: Mobile-first order management with photo proof uploads
- **Public Interface**: Dynamic order forms, real-time tracking
- **Authentication**: Cloudflare Access for admins, CUID-based URLs for drivers
- **Notifications**: WhatsApp deep links for user-initiated communication

## 🐛 Troubleshooting

### Common Issues

**Port conflicts:**
```bash
# Kill processes using default ports
lsof -ti:8787 | xargs kill  # Worker
lsof -ti:5173 | xargs kill  # Mitra Admin
lsof -ti:5174 | xargs kill  # User Public
lsof -ti:5175 | xargs kill  # Driver View
```

**Database issues:**
```bash
# Reset local database
rm -rf apps/worker/.wrangler/state/
cd packages/db-schema && pnpm db:migrate:local
```

**Dependency issues:**
```bash
# Clean and reinstall
pnpm turbo clean
rm -rf node_modules
pnpm install
```

### Logs & Debugging

**View worker logs:**
```bash
pnpm logs:worker
```

**View build logs:**
```bash
pnpm turbo build --verbose
```

## 📚 Additional Resources

- **API Documentation**: See `apps/worker/ORDER_PLACEMENT_API.md`
- **Security Guidelines**: See `apps/worker/SECURITY.md`
- **AI Assistant Guide**: See `AGENT.md` for AI development assistance
- **RFCs & Specifications**: See `.ai/rfcs.md` for detailed technical specifications

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/your-feature-name`
3. **Follow coding standards**: Run `pnpm ci:pre-commit` before committing
4. **Commit with conventional commits**: `feat: add new feature`
5. **Submit a pull request** to the `develop` branch

### Development Workflow

- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/*`: New features
- `fix/*`: Bug fixes
- `chore/*`: Non-functional changes

## 📄 License

This project is part of the Treksistem community initiative. See license details in the repository.

---

**Need help?** Check the troubleshooting section above or refer to the detailed technical documentation in the `.ai/` directory.