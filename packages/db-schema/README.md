# @treksistem/db-schema

D1 Database Schema for the Treksistem logistics platform using Drizzle ORM.

## Overview

This package contains the complete database schema definitions for Cloudflare D1, implemented using Drizzle ORM. The schema supports the core logistics operations including Mitra management, service configuration, driver assignments, order processing, and event tracking.

## Schema Tables

### Core Tables

- **`mitras`** - Logistics providers (organizations)
- **`services`** - Service offerings with dynamic configurations
- **`drivers`** - Driver profiles linked to mitras
- **`driver_services`** - Many-to-many relationship between drivers and services
- **`orders`** - Order records with dynamic details based on service configs
- **`order_events`** - Event log for order lifecycle tracking

### Key Features

- **JSON Configuration Fields**: `services.configJson` and `drivers.configJson` store flexible configurations validated against Zod schemas from `@treksistem/shared-types`
- **Proper Relationships**: Foreign keys with appropriate cascade/restrict behaviors
- **Performance Indexes**: Strategic indexes for common query patterns
- **Timestamps**: Automatic creation/update timestamps using SQLite functions
- **CUID2 IDs**: Application-generated unique identifiers for public-facing entities

## Usage

```typescript
import { getDrizzleClient, mitras, services, orders } from '@treksistem/db-schema';

// In your Cloudflare Worker
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const db = getDrizzleClient(env.TREKSISTEM_DB);
    
    // Query example
    const allMitras = await db.select().from(mitras);
    
    // Insert with relations
    const newOrder = await db.insert(orders).values({
      id: generateCuid(),
      serviceId: 'service_123',
      mitraId: 'mitra_456',
      ordererIdentifier: '+628123456789',
      detailsJson: { /* validated order details */ },
      status: 'PENDING'
    });
  }
};
```

## Development

### Prerequisites

- Node.js with pnpm
- Wrangler CLI configured
- D1 database created (see root `wrangler.jsonc`)

### Commands

```bash
# Type checking
pnpm type-check

# Generate migration from schema changes
pnpm db:generate

# Apply migrations locally
pnpm db:migrate:local

# Apply migrations to remote D1
pnpm db:migrate:remote

# Linting
pnpm lint
```

### Migration Workflow

1. **Modify Schema**: Update `src/schema.ts` with new tables/columns
2. **Generate Migration**: `pnpm db:generate` creates SQL migration files
3. **Review Migration**: Check generated SQL in `migrations/` folder
4. **Test Locally**: `pnpm db:migrate:local` applies to local D1 instance
5. **Deploy**: `pnpm db:migrate:remote` applies to production D1

### Schema Changes

When modifying the schema:

1. Ensure compatibility with existing data
2. Update corresponding Zod schemas in `@treksistem/shared-types` if needed
3. Consider performance implications of new indexes
4. Document breaking changes in migration comments

## Configuration

The schema integrates with:

- **Drizzle Config**: `drizzle.config.ts` defines D1 connection and migration settings
- **Wrangler Config**: Root `wrangler.jsonc` contains D1 binding configuration
- **Shared Types**: `@treksistem/shared-types` provides Zod validation schemas for JSON fields

## Architecture Notes

- **Snake Case**: Database uses `snake_case` for table/column names following SQL conventions
- **JSON Storage**: Complex configurations stored as JSON text fields, validated at application layer
- **Soft Deletes**: Some entities use `isActive` flags instead of hard deletes for audit trails
- **Event Sourcing**: `order_events` table provides complete audit log of order lifecycle
- **Denormalization**: Strategic denormalization (e.g., `orders.mitraId`) for query performance

## Integration

This schema works with:

- **Worker API**: Hono-based API in `apps/worker` uses this schema for all database operations
- **Admin Frontend**: Mitra admin interface for managing services and drivers
- **Driver App**: Mobile interface for drivers to manage orders
- **Public Frontend**: Customer-facing order placement and tracking 