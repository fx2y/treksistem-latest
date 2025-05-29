# User Public Frontend (fe-user-public)

## Overview

Lightweight SPA for end-user order placement and tracking built with Vite, React, TypeScript, and Tailwind CSS.

## Tech Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS v4 + Shadcn/ui components
- **State Management**: TanStack Query for server state
- **Routing**: React Router v6
- **Form Handling**: React Hook Form + Zod validation
- **Notifications**: Sonner

## Development

```bash
# Start development server (runs on port 5174, auto-adjusts if occupied)
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Lint code
pnpm lint
```

## Project Structure

```
src/
├── components/
│   └── ui/          # Shadcn/ui components
├── lib/             # Utility functions
├── pages/           # Page components (to be implemented)
├── services/        # API service functions
└── App.tsx          # Main app with routing
```

## API Integration

- Development server proxies `/api/*` requests to `http://localhost:8787` (worker)
- Uses TanStack Query for data fetching and caching
- Basic API service functions in `src/services/publicApi.ts`

## Features (To Be Implemented)

- Order placement with dynamic form generation from service config
- Order tracking with real-time status updates
- Service selection and configuration
- Mobile-responsive UI
- Error handling and user feedback

## Shared Dependencies

- `@treksistem/shared-types`: Common type definitions
- `@treksistem/ui-core`: Shared UI components (minimal)
- `@treksistem/eslint-config-custom`: Shared ESLint configuration
