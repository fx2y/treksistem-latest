import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Toaster } from 'sonner';
import OrderPlacementPage from './pages/OrderPlacementPage';
import OrderTrackingPage from './pages/OrderTrackingPage';

// Placeholder pages - will be implemented in next IS
function PublicHomePage() { 
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Welcome to Treksistem</h1>
      <div className="space-y-4">
        <p>
          <Link 
            to="/order/new?serviceId=test-service-id-placeholder" 
            className="text-primary hover:underline"
          >
            Place a Test Order (Example Link)
          </Link>
        </p>
        <p>
          <Link 
            to="/track/test-order-id-placeholder" 
            className="text-primary hover:underline"
          >
            Track an Order (Example Link)
          </Link>
        </p>
      </div>
    </div>
  ); 
}

function NotFoundPage() { 
  return (
    <div className="text-center">
      <h1 className="text-2xl font-bold">404 - Page Not Found</h1>
    </div>
  ) 
}

function App() {
  return (
    <BrowserRouter basename="/"> {/* Adjust basename if served from subpath */}
      {/* Optional: Add a simple global header/nav here if needed */}
      <div className="container mx-auto p-4"> {/* Basic layout container */}
        <Routes>
          <Route path="/" element={<PublicHomePage />} />
          <Route path="/order/new" element={<OrderPlacementPage />} />
          <Route path="/track/:orderId" element={<OrderTrackingPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
