# Driver View Frontend (fe-driver-view)

Mobile-first web application for drivers to manage their assigned orders in the Treksistem logistics platform.

## Overview

This application provides drivers with a comprehensive interface to:
- View assigned orders with real-time updates
- Accept or reject orders
- Update order status throughout the delivery process
- Upload proof photos for pickup and delivery
- Add notes to orders (individual and bulk)
- Contact customers via WhatsApp
- Navigate to pickup/dropoff locations

## Architecture

- **Framework**: Vite + React + TypeScript
- **UI Components**: Shadcn/ui + Tailwind CSS
- **State Management**: TanStack Query for server state, React hooks for local state
- **Routing**: React Router v6
- **Authentication**: Driver ID (CUID) from URL path as authentication token
- **API Communication**: RESTful API calls to Worker backend
- **Mobile Optimization**: Responsive design with mobile-first approach

## Key Features

### Order Management
- **Real-time order list** with 30-second polling
- **Order filtering** by status and actionable items
- **Detailed order view** with complete information
- **Status progression** through the delivery workflow

### Photo Upload Flow
- **R2 Integration** with pre-signed URLs
- **Mobile camera capture** with environment camera preference
- **Photo preview** before upload
- **Automatic status update** after successful upload

### Bulk Operations (RFC-TREK-DRIVER-003)
- **Multi-select orders** for bulk note addition
- **Common note templates** for traffic delays, etc.
- **Efficient API calls** (multiple individual calls orchestrated by frontend)

### Communication
- **WhatsApp integration** with deep links to contact customers
- **Maps integration** for navigation to pickup/dropoff locations
- **Note system** for driver comments and updates

## File Structure

```
src/
├── components/
│   ├── ui/              # Shadcn UI components
│   └── driver/
│       └── OrderCard.tsx    # Order display component
├── hooks/
│   └── useDriverAuth.ts     # Driver authentication hook
├── pages/
│   ├── AssignedOrdersPage.tsx    # Main orders list page
│   └── DriverOrderDetailPage.tsx # Detailed order view page
├── services/
│   └── driverApi.ts             # API service functions
└── App.tsx                      # Main routing component
```

## API Integration

### Driver API Functions (`src/services/driverApi.ts`)

- `fetchAssignedOrders(driverId)` - Get all assigned orders
- `acceptOrder(driverId, orderId)` - Accept an assigned order
- `rejectOrder(driverId, orderId, reason?)` - Reject an order with optional reason
- `updateOrderStatus(driverId, orderId, payload)` - Update order status with location and photos
- `addOrderNote(driverId, orderId, note, eventType?)` - Add note to order
- `requestUploadUrl(driverId, orderId, filename, contentType)` - Get R2 pre-signed URL
- `uploadFileToR2(uploadUrl, file, contentType)` - Upload file directly to R2

### Status Workflow

```
DRIVER_ASSIGNED → ACCEPTED_BY_DRIVER → DRIVER_AT_PICKUP → PICKED_UP → DRIVER_AT_DROPOFF → DELIVERED
       ↓                    ↓                 ↓              ↓               ↓
  [Accept/Reject]    [Arrived at Pickup] [Upload Photo] [Arrived at Dropoff] [Upload Photo]
```

## Authentication

- **Driver ID Authentication**: The driver ID (CUID) in the URL path serves as the authentication token
- **URL Format**: `/view/:driverId` or `/view/:driverId/order/:orderId`
- **Security**: Backend validates the driver ID exists and is active

## Mobile Optimizations

- **Responsive design** with mobile-first CSS
- **Touch-friendly** button sizes and spacing
- **Camera integration** with `capture="environment"` for rear camera
- **Offline-aware** error handling for poor mobile connections
- **Reduced polling** when app is in background
- **Optimistic updates** for better perceived performance

## Development

### Setup
```bash
cd apps/fe-driver-view
pnpm install
pnpm dev
```

### Environment
- Development server runs on port 5175
- API calls proxy to worker backend
- Uses Vite's built-in HMR for development

### Testing Driver Access
1. Get a valid driver CUID from the database
2. Navigate to `http://localhost:5175/view/[DRIVER_CUID]`
3. Orders will load automatically if any are assigned

## Deployment

- **Platform**: Cloudflare Pages
- **Build Command**: `pnpm build`
- **Output Directory**: `dist/`
- **Environment**: Production builds are optimized and minified

## Dependencies

### Core
- React 18+ with TypeScript
- Vite for build tooling
- TanStack Query for server state management
- React Router for routing

### UI
- Shadcn/ui component library
- Tailwind CSS for styling
- Lucide React for icons
- Sonner for toast notifications

### Shared
- `@treksistem/shared-types` for TypeScript types
- Zod schemas for API validation

## Error Handling

- **Network errors**: Automatic retry with exponential backoff
- **Authentication errors**: Redirect to invalid access page
- **Photo upload errors**: Clear feedback with retry options
- **API errors**: User-friendly error messages with toast notifications

## Performance

- **Code splitting** by route
- **Image optimization** for photo previews
- **Query caching** with TanStack Query
- **Background refetching** for real-time updates
- **Minimal bundle size** with tree shaking

## Browser Support

- **Modern mobile browsers** (Chrome, Safari, Firefox)
- **Progressive Web App** capabilities
- **Camera API** support for photo capture
- **Geolocation API** for location updates 