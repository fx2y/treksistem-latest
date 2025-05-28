# Treksistem Project Guide for AI Assistants

## 1. Project Overview & Core Philosophy

**Treksistem** is a digital platform designed to facilitate "Ta'awun" (mutual cooperation in goodness) for transportation and logistics. Its primary goals are:

*   Empower UMKM (SMEs) and community members with low-cost, efficient, and fair solutions.
*   Formalize informal help systems (e.g., "antar jemput anak," community deliveries) without losing the spirit of community, addressing "ewuh pakewuh" (social unease).
*   Operate on a **"near-zero cost" IT principle**, heavily leveraging Cloudflare's free tiers and open-source solutions.

This document outlines the tactical specifics of the codebase, development practices, and coding standards to guide AI assistance. **Assume context from the project's RFCs and Implementation Specifications if not explicitly detailed here.**

## 2. Technology Stack

*   **Cloudflare Ecosystem:**
    *   **Backend Runtime:** Cloudflare Workers (using Hono framework).
    *   **Database:** Cloudflare D1 (SQLite-compatible, accessed via Drizzle ORM).
    *   **File Storage:** Cloudflare R2 (for driver-uploaded proof images).
    *   **Frontend Hosting:** Cloudflare Pages (for static SPAs).
    *   **Authentication (Mitra Admin):** Cloudflare Access (Email OTP / Identity Providers).
*   **Frontend:**
    *   **Framework/Library:** React (with Vite for build tooling).
    *   **Language:** TypeScript (strict mode).
    *   **UI Components:** Shadcn/ui (built on Radix UI & Tailwind CSS).
    *   **Server State Management:** TanStack Query.
    *   **Forms:** React Hook Form with Zod resolver.
*   **Monorepo Management:** Turborepo with `pnpm` as the package manager.

## 3. Monorepo Structure (`treksistem-monorepo/`)

```
treksistem-monorepo/
├── apps/
│   ├── worker/             # Cloudflare Worker: Hono API backend. Entry: src/index.ts
│   ├── fe-mitra-admin/     # Vite/React SPA: Mitra Admin Portal. Entry: src/main.tsx
│   ├── fe-driver-view/     # Vite/React SPA: Driver Interface (mobile-first). Entry: src/main.tsx
│   └── fe-user-public/     # Vite/React SPA: End-User Order Placement & Tracking. Entry: src/main.tsx
├── packages/
│   ├── db-schema/          # Drizzle ORM schema, migrations, Drizzle client instance.
│   ├── shared-types/       # Zod schemas & inferred TypeScript types shared across apps.
│   ├── ui-core/            # (Currently minimal) Shared, non-Shadcn React components or hooks.
│   └── eslint-config-custom/ # Shared ESLint configuration.
├── turbo.json
└── package.json
```

## 4. Backend (`apps/worker` - Hono)

*   **Routing:**
    *   Hono `app.route('/api/resource', resourceRoutes)` for modular routing.
    *   API routes generally prefixed with `/api`. Versioning (e.g., `/api/v1`) if needed in future.
    *   Group routes by resource (e.g., `mitra.routes.ts`, `orders.routes.ts`).
*   **Middleware (Hono `app.use`):**
    *   **CORS:** `hono/cors` configured per-route or globally.
    *   **Error Handling:** Global error handler middleware formatting responses as per RFC-TREK-ERROR-001.
    *   **Authentication Checks:** Middleware to verify CF Access identity for `/api/mitra/*` routes. Middleware to validate driver tokens/IDs for `/api/driver/*` routes.
    *   **Logging:** Basic request logging middleware (method, path, status, duration).
*   **Authentication:**
    *   **Mitra Admin:** Read `Cf-Access-Authenticated-User-Email` header injected by Cloudflare Access. Map this to `mitras.ownerUserId`.
    *   **Driver:** Access via unguessable `drivers.id` (CUID) in URL path (e.g., `/api/driver/:driverId/...`). Validate this ID against active drivers. No separate session tokens for MVP.
*   **Authorization:**
    *   Mitra-scoped resources: Queries must always include `WHERE mitraId = :currentMitraId`.
    *   Driver-scoped resources: Queries must validate `driverId` and ensure order assignments.
*   **Database Interaction:**
    *   Instantiate Drizzle client with D1 binding: `drizzle(env.TREKSISTEM_DB)`.
    *   Use Drizzle's query builder for all DB operations.
    *   Use transactions (`db.transaction()`) for multi-statement operations requiring atomicity.
*   **Input Validation:**
    *   **Zod:** For validating request bodies, query parameters, and path parameters.
    *   Middleware for validation: `zValidator('json', schema, (result, c) => { ... })`.
*   **Error Handling:**
    *   Standardized JSON error response: `{ success: false, error: { code: "ERROR_CODE", message: "...", details?: any } }`.
    *   Throw custom error classes or use a utility to generate these responses.
*   **Configuration Logic:**
    *   `services.configJson` and `drivers.configJson` are fetched as text, parsed (`JSON.parse()`), and then validated against corresponding Zod schemas from `shared-types`.
*   **Environment Bindings (`Env` interface in `src/index.ts`):**
    *   `TREKSISTEM_DB`: D1 database binding.
    *   `TREKSISTEM_R2`: R2 bucket binding.
    *   (Future) KV/Secrets if needed.
*   **Logging:**
    *   Use `console.log()`, `console.warn()`, `console.error()` for logging. These are captured by Cloudflare Workers logging.
    *   Log key events, errors, and D1 query issues. Avoid logging raw PII unless specifically for debugging with redaction plans.

## 5. Database (`packages/db-schema` - D1 & Drizzle)

*   **Schema Definition:** All table schemas defined in `packages/db-schema/src/schema.ts` using Drizzle ORM syntax.
*   **Migrations:** Managed by Drizzle Kit.
    *   Generate: `pnpm --filter db-schema drizzle-kit generate:sqlite`
    *   Apply (local): `wrangler d1 migrations apply <DB_NAME> --local`
    *   Apply (remote): `wrangler d1 migrations apply <DB_NAME>`
*   **Naming Conventions:**
    *   Tables: `snake_case`, plural (e.g., `mitra_services`).
    *   Columns: `snake_case` (e.g., `created_at`, `service_id`).
*   **Primary Keys:**
    *   `id`: Typically `text('id').primaryKey()`. Values are CUIDs or NanoIDs generated at the application layer (worker) upon record creation.
*   **JSON Fields:**
    *   Use `text('config_json', { mode: 'json' })`.
    *   Typed and validated at the application layer using Zod schemas (defined in `shared-types`).
*   **Relationships & Foreign Keys:**
    *   Defined using Drizzle's `.references(() => otherTable.column)`.
    *   Ensure `ON DELETE` and `ON UPDATE` referential actions are considered (though D1's support might be basic SQLite level).
*   **Indexes:**
    *   Define indexes on frequently queried columns or foreign keys using `index('idx_name').on(table.column)`.
*   **Drizzle Client:**
    *   A pre-configured Drizzle client instance can be exported from `packages/db-schema/src/client.ts` for use in the worker.

## 6. Frontend (General - Vite, React, TypeScript, Shadcn/ui, TanStack Query)

*   **Component Structure:**
    *   Organize by feature/page: `src/features/feature-name/components/`, `src/pages/PageName.tsx`.
    *   Shared components within an app: `src/components/`.
    *   Use `PascalCase.tsx` for component files.
*   **State Management:**
    *   **Server State:** TanStack Query (`useQuery`, `useMutation`) for all API interactions. Define query keys systematically.
    *   **Local UI State:** React `useState`, `useReducer`.
    *   **Global UI State:** Avoid complex global state managers like Redux for MVP. If simple global state is needed (e.g., authenticated user profile), prefer Zustand, Jotai, or React Context. *Specify if one is chosen.* (Assume React Context with TanStack Query for user profile for now).
*   **Styling:**
    *   **Shadcn/ui:** Primary component library. Components are typically copied into the project (`src/components/ui`) and can be customized there.
    *   **Tailwind CSS:** Used by Shadcn/ui. Custom styles via `tailwind.config.js` and utility classes.
    *   Avoid global CSS files beyond `index.css` for base styles/resets.
*   **Forms:**
    *   React Hook Form: `useForm()`.
    *   Zod Resolver: `@hookform/resolvers/zod` for validation using Zod schemas from `shared-types`.
*   **API Interaction:**
    *   Centralize API call functions in `src/services/api-service-name.ts` or feature-specific service files.
    *   These functions encapsulate `fetch` calls and are used by TanStack Query hooks.
    *   Consistent error handling for API responses.
*   **Routing (SPAs):**
    *   React Router (`react-router-dom` v6+).
    *   Define routes in `src/App.tsx` or a dedicated `src/routes.tsx`.
    *   Route protection for authenticated areas (e.g., custom `<ProtectedRoute />` component).
*   **TypeScript Usage:**
    *   `strict: true` in `tsconfig.json`.
    *   Use utility types (Partial, Pick, Omit, etc.) where appropriate.
    *   Leverage Zod schemas from `shared-types` for runtime validation and type inference for API payloads and form data.
*   **Shadcn/ui Usage:**
    *   Install components via CLI: `npx shadcn-ui@latest add <component-name>`.
    *   Customize components directly in `src/components/ui/`.

## 7. `apps/fe-mitra-admin` Specifics

*   **Authentication:** Checks for CF Access session on load. Redirects/prompts for login via CF Access if unauthenticated. Fetches Mitra profile using `/api/mitra/profile`.
*   **Dynamic Forms:** The service configuration form (`services.configJson`) is a key complex component. It should dynamically render fields based on the selected `serviceType` and the structure defined in `RFC-TREK-CONFIG-001` and `shared-types`.
*   **UI Patterns:**
    *   TanStack Table for data grids (services, drivers, orders).
    *   Shadcn `Dialog` for modals (create/edit forms).
    *   Shadcn `Sheet` for side panels if needed.

## 8. `apps/fe-driver-view` Specifics

*   **Mobile-First:** UI/UX must be optimized for mobile devices.
*   **Access:** Via unique URL containing `driverId` (e.g., `/driver-view/:driverId`). The app extracts `driverId` from the URL to make API calls.
*   **File Upload:** Handles `POST /api/driver/:driverId/orders/:orderId/request-upload-url` to get R2 pre-signed URL, then direct PUT to R2, followed by confirmation to backend.
*   **Offline/Network:** Basic handling for network request failures. Consider optimistic updates with caution for MVP.

## 9. `apps/fe-user-public` Specifics

*   **Order Placement Form:** Dynamically generates fields based on `service.configJson` fetched from `/api/public/services/:serviceId/config`.
*   **Tracking Page:** Fetches data from `/api/orders/:orderId/track`. Displays `orderEvents` timeline. Implements basic polling or manual refresh for updates.

## 10. Shared Code (`packages/`)

*   **`shared-types`:**
    *   Primary location for Zod schemas defining data structures (API payloads, DB configs, form data).
    *   Export inferred TypeScript types: `type MyType = z.infer<typeof myTypeSchema>;`.
    *   These types are imported by backend and frontends.
*   **`ui-core`:** (If used) For any custom React components or hooks truly reusable across *multiple* frontend apps, and not specific enough to be a Shadcn primitive. Default to keeping components within their respective apps unless clear reusability emerges.

## 11. Coding Standards & Conventions

*   **Naming Conventions:**
    *   Variables, functions: `camelCase`.
    *   Components, Types, Interfaces, Enums, Classes: `PascalCase`.
    *   Constants: `UPPER_SNAKE_CASE`.
    *   Database tables/columns: `snake_case`.
*   **File Naming:**
    *   React Components: `MyComponent.tsx`.
    *   General TS files: `my-module.ts` or `myModule.ts`.
    *   CSS/Style files (if any beyond Tailwind): `my-component.module.css`.
*   **Comments:**
    *   JSDoc for exported functions, types, and complex component props.
    *   Inline comments (`//`) for explaining non-obvious logic.
*   **Error Handling (Frontend):**
    *   Use TanStack Query's `onError` for API errors.
    *   Display user-friendly error messages (e.g., Shadcn `Toast` or inline messages).
    *   `try...catch` for other asynchronous operations.
*   **Async/Await:** Preferred for all Promise-based operations.
*   **Imports:**
    *   Use absolute paths configured in `tsconfig.json` (`paths` option).
    *   Order: React imports, external libraries, internal absolute paths, relative paths.
*   **Code Formatting:** Prettier (configuration in `package.json` or `.prettierrc.js`). Enforced via ESLint (`eslint-plugin-prettier`).
*   **Linting:** ESLint with configuration from `packages/eslint-config-custom`. Run `pnpm lint` regularly.

## 12. Development Workflow

*   **Branching Strategy:**
    *   `main`: Production-ready code.
    *   `develop`: Integration branch for features.
    *   `feature/<ticket-id>-short-description`: For new features.
    *   `fix/<ticket-id>-short-description`: For bug fixes.
    *   `chore/<description>`: For non-functional changes.
*   **Commits:** Adhere to Conventional Commits specification (e.g., `feat: ...`, `fix: ...`, `docs: ...`, `style: ...`, `refactor: ...`, `test: ...`, `chore: ...`).
*   **Pull Requests (PRs):**
    *   From `feature/*` or `fix/*` branches into `develop`.
    *   Clear description of changes, link to relevant issue/ticket.
    *   Requires at least one review (if team > 1).
    *   CI checks (lint, build, tests) must pass.
*   **Local Development:**
    *   Root: `pnpm install`, then `turbo dev`.
    *   Worker: `wrangler dev --local --persist` (from `apps/worker`).
    *   Frontends: `pnpm --filter <app-name> dev` (e.g., `pnpm --filter fe-mitra-admin dev`).
    *   Vite proxy configured in frontend `vite.config.ts` to point `/api` to local worker.
*   **Testing Strategy:**
    *   **Unit Tests:** Vitest for utility functions, complex logic in backend/frontend.
    *   **Integration Tests:** Vitest for testing interactions between modules (e.g., API endpoint logic with mock D1).
    *   **E2E Tests (Future):** Playwright.
    *   *For MVP, focus on critical unit/integration tests. Test coverage is aspirational but pragmatic.*

## 13. Deployment

*   **Worker (`apps/worker`):** Deployed via Wrangler CLI. Managed by GitHub Actions workflow.
*   **Frontends (`apps/fe-*`):** Deployed to Cloudflare Pages, connected to the Git repository. Auto-deploys on pushes to `main` (or `develop` for staging).
*   **D1 Migrations (`packages/db-schema`):** Applied manually via Wrangler CLI or integrated into deployment script with caution: `wrangler d1 migrations apply TREKSISTEM_DB`.
*   **CI/CD:** GitHub Actions for linting, building, (testing), and deploying. Secrets (Cloudflare API token) managed via GitHub secrets.

## 14. Key Architectural Decisions & Trade-offs (Recap)

*   **Low Cost:** Drives technology choices (Cloudflare free tiers, no paid APIs like WA Business or Google Maps for routing initially).
*   **User-Initiated Notifications:** Relies on WA deep links and web UI polling instead of automated push/SMS.
*   **Mitra Configurability:** Extensive use of `services.configJson` allows Mitras to define diverse service models. This means robust parsing and validation of this JSON is critical.
*   **OSM/Open Geo Data:** Preferred for mapping and routing to avoid costs. Haversine for MVP distance, OSRM/GraphHopper as future enhancement if cost-effective.

## 15. How to Interact with This AI Assistant

*   **Adherence:** When generating code, strictly adhere to the standards, conventions, and patterns outlined in this document.
*   **Context:** Assume full context from the project's RFCs and Implementation Specifications. Refer to them if specific details are needed beyond this `README.MD`.
*   **Existing Patterns:** Prioritize using existing utilities, components, and architectural patterns within the monorepo before introducing new ones.
*   **New Dependencies:** If suggesting new dependencies, explicitly state why and consider the "low-cost" and "low-maintenance" principles. Justify any deviation.
*   **Clarity:** If a request is ambiguous, ask for clarification, referencing specific sections of this document or related RFCs.
*   **File Paths:** When referring to or generating code for specific parts of the project, use the monorepo paths (e.g., `apps/worker/src/routes/orders.ts`).
*   **Tactical Focus:** Provide specific, actionable code snippets or instructions rather than high-level strategic advice, unless specifically asked.