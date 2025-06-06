import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Toaster } from "@/components/ui/sonner";
import ProtectedRoute from './router/ProtectedRoute';
import CreateProfilePage from './pages/CreateProfilePage';
import LoginPage from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import ServicesListPage from './pages/ServicesListPage';
import ServiceDetailPage from './pages/ServiceDetailPage';
import ServiceFormPage from './pages/ServiceFormPage';
import DriversListPage from './pages/DriversListPage';
import DriverDetailPage from './pages/DriverDetailPage';
import DriverFormPage from './pages/DriverFormPage';
import DriverAssignServicesPage from './pages/DriverAssignServicesPage';
import OrdersListPage from './pages/OrdersListPage';
import OrderDetailPage from './pages/OrderDetailPage';
import CostOptimizationPage from './pages/CostOptimizationPage';
import { useAuthStore } from './store/authStore';

function App() {
  const { isLoading: isAuthLoading } = useAuthStore();

  // Show loading screen during initial auth check
  if (isAuthLoading && !useAuthStore.getState().isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg font-medium text-foreground">Loading Treksistem</p>
          <p className="text-sm text-muted-foreground mt-2">Checking authentication status...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/create-profile" element={<CreateProfilePage />} />
          <Route path="/services" element={<ServicesListPage />} />
          <Route path="/services/new" element={<ServiceFormPage mode="create" />} />
          <Route path="/services/:serviceId" element={<ServiceDetailPage />} />
          <Route path="/services/:serviceId/edit" element={<ServiceFormPage mode="edit" />} />
          <Route path="/drivers" element={<DriversListPage />} />
          <Route path="/drivers/new" element={<DriverFormPage mode="create" />} />
          <Route path="/drivers/:driverId" element={<DriverDetailPage />} />
          <Route path="/drivers/:driverId/edit" element={<DriverFormPage mode="edit" />} />
          <Route path="/drivers/:driverId/assign-services" element={<DriverAssignServicesPage />} />
          <Route path="/orders" element={<OrdersListPage />} />
          <Route path="/orders/:orderId" element={<OrderDetailPage />} />
          <Route path="/cost-optimization" element={<CostOptimizationPage />} />
        </Route>
        
        {/* 404 page */}
        <Route path="*" element={
          <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-foreground mb-4">404</h1>
              <p className="text-muted-foreground mb-4">Page not found</p>
              <Link 
                to="/" 
                className="text-primary hover:text-primary/80 underline"
              >
                Go back to Dashboard
              </Link>
            </div>
          </div>
        } />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

export default App; 