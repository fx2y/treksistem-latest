# Treksistem Mitra Admin Frontend

A comprehensive admin dashboard for Mitra (logistics service providers) to manage their services, drivers, and orders.

## 🚀 Features

### Service Management
- **Create/Edit Services**: Comprehensive form with modular sections for service configuration
- **Service Listing**: Table view with filtering, sorting, and action buttons
- **Service Details**: Detailed view of service configuration and status
- **Dynamic Configuration**: Form fields adapt based on service type and pricing model

### Form Architecture
The service form is built with a modular architecture using React Hook Form and Zod validation:

#### Main Components
- `ServiceFormPage.tsx` - Main form container supporting create/edit modes
- `BasicServiceInfoSection.tsx` - Service name, type, and status
- `ServiceConfigSection.tsx` - Tabbed interface for detailed configuration

#### Configuration Sections
1. **Basic Config** (`BasicConfigSection.tsx`)
   - Service type alias, transport type, business model
   - Driver constraints, route model, privacy settings
   - Service timing and responsibility models

2. **Pricing** (`PricingConfigSection.tsx`)
   - Admin fees and distance pricing models
   - Per-kilometer vs zone-based pricing
   - Dynamic zone pricing configuration
   - Per-item pricing options

3. **Cargo & Facilities** (`MuatanFasilitasSection.tsx`)
   - Allowed cargo types with additional fees
   - Available facilities and equipment
   - Dynamic add/remove functionality

4. **Advanced** (`AdvancedConfigSection.tsx`)
   - Talangan (advance payment) configuration
   - Service coverage area and distance limits
   - Allowed order models

### Technical Features
- **Type Safety**: Full TypeScript support with Zod schema validation
- **Form Validation**: Real-time validation with error messages
- **Dynamic Fields**: Conditional rendering based on configuration choices
- **Optimistic Updates**: TanStack Query for efficient data management
- **Responsive Design**: Mobile-friendly interface using Tailwind CSS
- **Accessibility**: Proper ARIA labels and keyboard navigation

## 🛠️ Technology Stack

- **React 18** with TypeScript
- **React Hook Form** with Zod resolver for form management
- **TanStack Query** for server state management
- **React Router** for navigation
- **Shadcn/ui** components with Radix UI primitives
- **Tailwind CSS** for styling
- **Lucide React** for icons

## 📁 Project Structure

```
src/
├── components/
│   ├── service-form/           # Modular service form components
│   │   ├── ServiceFormPage.tsx
│   │   ├── BasicServiceInfoSection.tsx
│   │   ├── ServiceConfigSection.tsx
│   │   ├── BasicConfigSection.tsx
│   │   ├── PricingConfigSection.tsx
│   │   ├── MuatanFasilitasSection.tsx
│   │   └── AdvancedConfigSection.tsx
│   └── ui/                     # Reusable UI components
├── pages/                      # Page components
│   ├── ServicesListPage.tsx
│   ├── ServiceDetailPage.tsx
│   └── ServiceFormPage.tsx
├── services/                   # API service functions
│   └── mitraServiceApi.ts
├── types/                      # Local type definitions
│   └── service.ts
└── hooks/                      # Custom React hooks
```

## 🔧 API Integration

### Service API Functions
- `fetchMitraServices()` - Get all services for the current Mitra
- `fetchMitraServiceById(id)` - Get specific service details
- `createMitraService(payload)` - Create new service
- `updateMitraService(id, payload)` - Update existing service
- `deleteMitraService(id)` - Delete service

### Data Flow
1. **Create Mode**: Form starts with default values, submits to create endpoint
2. **Edit Mode**: Fetches existing service data, pre-fills form, submits to update endpoint
3. **Validation**: Client-side validation with Zod schemas before API calls
4. **Error Handling**: Comprehensive error states and user feedback

## 🎨 UI Components

### Form Components
- **Input Fields**: Text, number, and select inputs with validation
- **Dynamic Arrays**: Add/remove functionality for lists (zones, cargo types, etc.)
- **Conditional Rendering**: Fields appear/hide based on other selections
- **Tabbed Interface**: Organized configuration sections

### Data Display
- **Tables**: Sortable, filterable service listings
- **Cards**: Clean layout for form sections and details
- **Badges**: Status indicators and labels
- **Loading States**: Skeleton screens and spinners

## 🚦 Getting Started

### Prerequisites
- Node.js 18+
- pnpm (workspace package manager)

### Installation
```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Type checking
pnpm type-check

# Build for production
pnpm build
```

### Environment Setup
Ensure the backend API is running and accessible. The frontend expects:
- Service management endpoints at `/mitra/services`
- Authentication system for Mitra users
- Proper CORS configuration

## 📋 Usage

### Creating a Service
1. Navigate to Services → "Create New Service"
2. Fill in basic information (name, type, status)
3. Configure service details in tabbed sections:
   - **Basic Config**: Core service parameters
   - **Pricing**: Fee structure and pricing models
   - **Cargo & Facilities**: Allowed items and equipment
   - **Advanced**: Coverage area and special features
4. Submit to create the service

### Editing a Service
1. From service list or detail page, click "Edit"
2. Form pre-fills with existing configuration
3. Modify any fields as needed
4. Submit to update the service

### Service Configuration Options

#### Service Types
- P2P Express (Motor/Car)
- Food Delivery
- Package Courier
- Ambulance Services
- Scheduled Transport
- Manual Labor
- Custom Services

#### Pricing Models
- **Per-Kilometer**: Fixed rate per distance
- **Zone-Based**: Different rates for origin-destination pairs
- **Per-Item**: Additional charges per piece/package

#### Advanced Features
- **Talangan**: Advance payment for customer purchases
- **Coverage Areas**: Geographic service boundaries
- **Order Models**: Different ways customers can place orders

## 🔍 Validation Rules

### Service Name
- Minimum 3 characters
- Maximum 100 characters
- Required field

### Service Type
- Must be selected from predefined options
- Required field

### Configuration JSON
- Validates against ServiceConfigBaseSchema
- All nested objects have proper validation
- Conditional validation based on selected options

### Pricing Configuration
- Numeric fields must be non-negative
- Zone pricing requires both origin and destination
- Per-kilometer rate required when selected

## 🎯 Best Practices

### Form Design
- **Progressive Disclosure**: Complex options in tabs
- **Contextual Help**: Descriptions for each field
- **Validation Feedback**: Real-time error messages
- **Save States**: Clear loading and success indicators

### Code Organization
- **Modular Components**: Each section is self-contained
- **Type Safety**: Comprehensive TypeScript coverage
- **Reusable Logic**: Custom hooks for common patterns
- **Clean Architecture**: Separation of concerns

### Performance
- **Lazy Loading**: Components load as needed
- **Optimistic Updates**: UI updates before API confirmation
- **Caching**: TanStack Query handles data caching
- **Bundle Optimization**: Tree-shaking and code splitting

## 🐛 Troubleshooting

### Common Issues

#### Import Errors
If you see TypeScript errors about missing imports:
```typescript
// Use local types instead of workspace imports
import { CreateServicePayload } from '@/types/service';
```

#### Form Validation
For complex nested validation errors:
```typescript
// Check the browser console for detailed Zod error messages
// Ensure all required fields have proper default values
```

#### API Integration
For API connection issues:
```typescript
// Verify backend endpoints are accessible
// Check authentication tokens are valid
// Ensure CORS is properly configured
```

## 🔮 Future Enhancements

### Planned Features
- **Bulk Operations**: Multi-select for batch actions
- **Service Templates**: Pre-configured service types
- **Analytics Dashboard**: Service performance metrics
- **Advanced Filtering**: Complex search and filter options
- **Export/Import**: Service configuration backup/restore

### Technical Improvements
- **Real-time Updates**: WebSocket integration for live data
- **Offline Support**: PWA capabilities for offline editing
- **Advanced Validation**: Cross-field validation rules
- **Internationalization**: Multi-language support

## 📄 License

This project is part of the Treksistem logistics platform.

---

For more information about the overall Treksistem architecture, see the main project README. 