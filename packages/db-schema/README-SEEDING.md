# Database Seeding Guide

This guide explains how to seed the Treksistem database with master service templates and other initial data.

## Overview

The seeding system provides master service templates that Mitras can use as starting points when creating new services. These templates contain pre-configured `ServiceConfigBase` objects with sensible defaults for common service types.

## Master Service Templates

The system includes 5 master service templates:

1. **Standard Motorcycle Taxi (Ojek)** - Basic point-to-point motorcycle taxi
2. **Food Delivery Courier** - Motorcycle-based food delivery with talangan support
3. **Package Courier Service** - General package delivery with document handling
4. **Basic Car Shuttle Service** - Multi-passenger car shuttle service
5. **Non-Emergency Ambulance Transport** - Medical transport with specialized equipment

## Database Schema

The master service templates are stored in the `master_service_templates` table:

```sql
CREATE TABLE master_service_templates (
  id TEXT PRIMARY KEY,                    -- Human-readable key (e.g., 'MOTOR_P2P_STD_TPL')
  name TEXT NOT NULL,                     -- Display name (e.g., 'Standard Motorcycle Taxi')
  description TEXT,                       -- Template description
  applies_to_service_type_key TEXT NOT NULL, -- Service type this template applies to
  config_json TEXT NOT NULL,              -- Valid ServiceConfigBase JSON
  sort_order INTEGER DEFAULT 0 NOT NULL, -- Display order
  created_at INTEGER NOT NULL,            -- Creation timestamp
  updated_at INTEGER NOT NULL             -- Last update timestamp
);
```

## Seeding Process

### 1. Generate Migration

The migration for the `master_service_templates` table is already created. If you need to regenerate:

```bash
cd packages/db-schema
pnpm db:generate
```

### 2. Apply Migration

For local development:
```bash
pnpm --filter db-schema db:migrate:local
```

For production:
```bash
pnpm --filter db-schema db:migrate:remote
```

### 3. Generate Seed Data

Run the seeding script to validate templates and generate SQL:

```bash
cd packages/db-schema
pnpm db:seed
```

This will:
- Validate all templates against `ServiceConfigBaseSchema`
- Generate SQL INSERT statements
- Output the SQL to console

### 4. Apply Seed Data

For local development:
```bash
wrangler d1 execute TREKSISTEM_DB --local --file=seed-templates.sql
```

For production:
```bash
wrangler d1 execute TREKSISTEM_DB --file=seed-templates.sql
```

### 5. Worker Database Seeding

The worker maintains its own local database. To seed the worker's database:

```bash
cd apps/worker
wrangler d1 migrations apply TREKSISTEM_DB --local
wrangler d1 execute TREKSISTEM_DB --local --file=../../seed-templates.sql
```

## API Access

Master service templates are accessible via the public API:

```
GET /api/public/services/master-templates
```

Response format:
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "MOTOR_P2P_STD_TPL",
        "name": "Standard Motorcycle Taxi (Ojek)",
        "description": "A template for standard point-to-point motorcycle taxi services...",
        "appliesToServiceTypeKey": "MOTOR_P2P_EXPRESS",
        "configJson": { /* ServiceConfigBase object */ },
        "sortOrder": 1
      }
      // ... more templates
    ],
    "count": 5
  }
}
```

## Adding New Templates

To add new master service templates:

1. Edit `packages/db-schema/scripts/seed.ts`
2. Add new template objects to the `masterTemplates` array
3. Ensure the `configJson` conforms to `ServiceConfigBaseSchema`
4. Run `pnpm db:seed` to validate and generate SQL
5. Apply the generated SQL to your databases

## Template Structure

Each template must include:

- `id`: Unique identifier (use descriptive keys like `MOTOR_P2P_STD_TPL`)
- `name`: Human-readable name for display
- `description`: Brief description of the template's purpose
- `appliesToServiceTypeKey`: Service type this template applies to
- `configJson`: Complete `ServiceConfigBase` object with all required fields
- `sortOrder`: Display order (lower numbers appear first)

## Validation

All templates are validated against the `ServiceConfigBaseSchema` during the seeding process. The script will exit with an error if any template is invalid.

## Production Deployment

For production deployment:

1. Apply migrations: `pnpm --filter db-schema db:migrate:remote`
2. Generate seed SQL: `pnpm --filter db-schema db:seed > seed-templates.sql`
3. Apply seed data: `wrangler d1 execute TREKSISTEM_DB --file=seed-templates.sql`

## Troubleshooting

### Template Validation Errors

If a template fails validation:
1. Check the error message for specific field issues
2. Verify the `configJson` structure matches `ServiceConfigBaseSchema`
3. Ensure all required fields are present
4. Check enum values are valid

### Database Connection Issues

If the API returns database errors:
1. Verify migrations are applied: `wrangler d1 migrations list TREKSISTEM_DB --local`
2. Check if data exists: `wrangler d1 execute TREKSISTEM_DB --local --command "SELECT COUNT(*) FROM master_service_templates;"`
3. Ensure worker database is seeded (worker maintains separate local DB)

### API Endpoint Issues

If the `/master-templates` endpoint fails:
1. Check worker logs for specific errors
2. Verify the `masterServiceTemplates` import in `public.services.ts`
3. Test database connection with a simple query 