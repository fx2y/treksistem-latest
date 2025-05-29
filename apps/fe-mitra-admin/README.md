# Mitra Admin Frontend

A modern React + TypeScript + Vite application for the Treksistem Mitra Admin Portal.

## Features

- ⚡ **Vite** - Fast build tool and dev server
- ⚛️ **React 18** - Latest React with hooks
- 🎯 **TypeScript** - Type safety and better DX
- 🎨 **Tailwind CSS** - Utility-first CSS framework
- 🧩 **Shadcn/ui** - Beautiful and accessible UI components
- 🔄 **TanStack Query** - Powerful data fetching and caching
- 🗂️ **React Router** - Client-side routing
- 🐻 **Zustand** - Lightweight state management
- 🎭 **Lucide React** - Beautiful icons
- 🔧 **Path Aliases** - Clean imports with `@/` prefix

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Shadcn/ui components
│   └── Layout.tsx      # Main layout component
├── pages/              # Page-level components
│   └── DashboardPage.tsx
├── hooks/              # Custom React hooks
│   └── useApi.ts       # API query hooks
├── services/           # API service layer
│   └── api.ts          # HTTP client and utilities
├── store/              # Zustand stores
│   └── authStore.ts    # Authentication state
├── lib/                # Utility functions
│   └── utils.ts        # Shadcn/ui utilities
├── router/             # Route definitions (future)
├── App.tsx             # Main app component
├── main.tsx            # App entry point
└── index.css           # Global styles and CSS variables
```

## Development

### Prerequisites

- Node.js 18+
- pnpm (package manager)

### Getting Started

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Start the development server:**
   ```bash
   pnpm dev
   ```

3. **Open your browser:**
   The app will be available at `http://localhost:5175` (or the next available port)

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm lint` - Run ESLint
- `pnpm type-check` - Run TypeScript type checking

## API Integration

The app is configured to proxy API requests to the backend worker during development:

- **Development:** `/api/*` → `http://localhost:8787/*`
- **Production:** Direct API calls to the deployed worker

### Using the API

```typescript
import { useApiQuery, useApiMutation } from '@/hooks/useApi';

// GET request
const { data, isLoading, error } = useApiQuery(
  ['services'],
  '/services'
);

// POST request
const createService = useApiMutation('/services', 'POST', {
  onSuccess: () => toast.success('Service created!'),
  showErrorToast: true,
});
```

## Authentication

Authentication is handled through:

1. **Development:** Mock authentication via Zustand store
2. **Production:** Cloudflare Access integration

### Auth Store Usage

```typescript
import { useAuthStore } from '@/store/authStore';

const { user, isAuthenticated, setUser, clearUser } = useAuthStore();
```

## UI Components

The app uses Shadcn/ui components for consistent design:

```typescript
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
```

### Adding New Components

```bash
pnpm dlx shadcn@latest add [component-name]
```

## Styling

- **Tailwind CSS** for utility classes
- **CSS Variables** for theme customization
- **Dark mode** support via class-based toggle

### Theme Customization

Edit `src/index.css` to modify CSS variables:

```css
:root {
  --primary: 221.2 83.2% 53.3%;
  --background: 0 0% 100%;
  /* ... */
}
```

## Type Safety

The app includes TypeScript configuration for:

- Path aliases (`@/*` → `./src/*`)
- Shared types from `@treksistem/shared-types`
- Strict type checking

## Deployment

The app is designed to be deployed to Cloudflare Pages:

1. **Build the app:**
   ```bash
   pnpm build
   ```

2. **Deploy to Cloudflare Pages:**
   - Connect your repository
   - Set build command: `pnpm build`
   - Set output directory: `dist`

## Environment Variables

Create `.env.local` for local development:

```env
VITE_API_BASE_URL=http://localhost:8787
```

## Contributing

1. Follow the existing code structure
2. Use TypeScript for all new files
3. Add proper error handling
4. Include loading states for async operations
5. Use Shadcn/ui components when possible

## Troubleshooting

### Port Conflicts

If port 5173 is in use, Vite will automatically use the next available port (5174, 5175, etc.).

### API Proxy Issues

Ensure the backend worker is running on `http://localhost:8787` for API proxy to work.

### Type Errors

Run `pnpm type-check` to identify TypeScript issues. 